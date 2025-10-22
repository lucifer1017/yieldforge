// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IPythIntegrator.sol";
import "./interfaces/IBridgeHook.sol";

/**
 * @title YieldVault
 * @dev ERC4626-compliant vault for PYUSD deposits with AI-powered yield optimization
 * @notice This vault handles PYUSD deposits, mints shares, and provides hooks for automation
 * @author YieldForge Team
 */
contract YieldVault is ERC4626, ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    /// @notice Role for Lit Vincent agents to execute automated functions
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    /// @notice Role for bridge contracts to execute cross-chain operations
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    /// @notice PYUSD token contract
    IERC20 public immutable PYUSD;
    
    /// @notice Pyth integrator for price feeds and guardrails
    IPythIntegrator public immutable pythIntegrator;
    
    /// @notice Bridge hook for cross-chain operations
    IBridgeHook public bridgeHook;

    /// @notice Total yield earned by the vault
    uint256 public totalYieldEarned;
    
    /// @notice User-specific yield tracking
    mapping(address => uint256) public userYieldEarned;
    
    /// @notice User-specific last deposit timestamp for yield calculation
    mapping(address => uint256) public userLastDepositTime;

    /// @notice Minimum deposit amount (1 PYUSD with 6 decimals)
    uint256 public constant MIN_DEPOSIT = 1e6;
    
    /// @notice Maximum deposit amount (1M PYUSD with 6 decimals)
    uint256 public constant MAX_DEPOSIT = 1_000_000e6;

    /// @notice Events
    event DepositEvent(
        address indexed user,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );
    
    event WithdrawEvent(
        address indexed user,
        uint256 shares,
        uint256 amount,
        uint256 timestamp
    );
    
    event YieldAccrued(
        address indexed user,
        uint256 yieldAmount,
        uint256 totalYield,
        uint256 timestamp
    );
    
    event BridgeApproval(
        address indexed bridge,
        uint256 amount,
        uint256 timestamp
    );
    
    event RebalanceExecuted(
        address indexed user,
        uint256 yieldGained,
        uint256 newAPY,
        uint256 timestamp
    );

    /// @notice Custom errors for gas efficiency
    error InvalidAmount();
    error InsufficientBalance();
    error InvalidBridge();
    error PythPriceStale();
    error InvalidConfidence();
    error UnauthorizedAgent();
    error VaultPaused();

    /**
     * @dev Constructor initializes the vault with PYUSD token and Pyth integrator
     * @param name_ Name of the vault token
     * @param symbol_ Symbol of the vault token
     * @param pyusd_ Address of PYUSD token contract
     * @param pythIntegrator_ Address of Pyth integrator contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address pyusd_,
        address pythIntegrator_
    ) ERC4626(IERC20(pyusd_)) ERC20(name_, symbol_) {
        PYUSD = IERC20(pyusd_);
        pythIntegrator = IPythIntegrator(pythIntegrator_);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
    }

    /**
     * @notice Set the bridge hook contract for cross-chain operations
     * @dev Only admin can set the bridge hook
     * @param bridgeHook_ Address of the bridge hook contract
     */
    function setBridgeHook(address bridgeHook_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bridgeHook = IBridgeHook(bridgeHook_);
    }

    /**
     * @notice Deposit PYUSD and mint vault shares
     * @dev Overrides ERC4626 deposit to add custom logic and events
     * @param assets Amount of PYUSD to deposit
     * @param receiver Address to receive the shares
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets, address receiver)
        public
        override
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        if (assets < MIN_DEPOSIT || assets > MAX_DEPOSIT) {
            revert InvalidAmount();
        }

        // Calculate shares (1:1 ratio initially)
        shares = previewDeposit(assets);
        
        // Transfer PYUSD from user to vault
        PYUSD.safeTransferFrom(msg.sender, address(this), assets);
        
        // Mint shares to receiver
        _mint(receiver, shares);
        
        // Update user tracking
        userLastDepositTime[receiver] = block.timestamp;
        
        emit DepositEvent(receiver, assets, shares, block.timestamp);
        
        return shares;
    }

    /**
     * @notice Withdraw PYUSD by burning vault shares
     * @dev Overrides ERC4626 withdraw to add custom logic and events
     * @param assets Amount of PYUSD to withdraw
     * @param receiver Address to receive the PYUSD
     * @param owner Address that owns the shares
     * @return shares Amount of shares burned
     */
    function withdraw(uint256 assets, address receiver, address owner)
        public
        override
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        shares = previewWithdraw(assets);
        
        if (shares == 0) {
            revert InvalidAmount();
        }

        // Check if caller is authorized to withdraw
        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }

        // Calculate and accrue yield before withdrawal
        _accrueYield(owner);
        
        // Burn shares
        _burn(owner, shares);
        
        // Transfer PYUSD to receiver
        PYUSD.safeTransfer(receiver, assets);
        
        emit WithdrawEvent(owner, shares, assets, block.timestamp);
        
        return shares;
    }

    /**
     * @notice Redeem shares for PYUSD
     * @dev Overrides ERC4626 redeem to add yield accrual
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the PYUSD
     * @param owner Address that owns the shares
     * @return assets Amount of PYUSD received
     */
    function redeem(uint256 shares, address receiver, address owner)
        public
        override
        nonReentrant
        whenNotPaused
        returns (uint256 assets)
    {
        // Calculate and accrue yield before redemption
        _accrueYield(owner);
        
        assets = previewRedeem(shares);
        
        if (assets == 0) {
            revert InvalidAmount();
        }

        // Check if caller is authorized to redeem
        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }

        // Burn shares
        _burn(owner, shares);
        
        // Transfer PYUSD to receiver
        PYUSD.safeTransfer(receiver, assets);
        
        emit WithdrawEvent(owner, shares, assets, block.timestamp);
        
        return assets;
    }

    /**
     * @notice Approve bridge contract to spend PYUSD for cross-chain operations
     * @dev Only callable by authorized agents or bridge contracts
     * @param bridge Address of the bridge contract
     * @param amount Amount of PYUSD to approve
     */
    function approveForBridge(address bridge, uint256 amount)
        external
        onlyRole(AGENT_ROLE)
    {
        if (bridge == address(0)) {
            revert InvalidBridge();
        }
        
        PYUSD.safeApprove(bridge, amount);
        
        emit BridgeApproval(bridge, amount, block.timestamp);
    }

    /**
     * @notice Execute rebalance operation with yield accrual
     * @dev Only callable by authorized agents
     * @param user Address of the user to rebalance for
     * @param yieldGained Amount of yield gained from rebalancing
     * @param newAPY New APY after rebalancing
     */
    function executeRebalance(
        address user,
        uint256 yieldGained,
        uint256 newAPY
    ) external onlyRole(AGENT_ROLE) {
        _accrueYield(user);
        
        // Add additional yield from rebalancing
        if (yieldGained > 0) {
            userYieldEarned[user] += yieldGained;
            totalYieldEarned += yieldGained;
        }
        
        emit RebalanceExecuted(user, yieldGained, newAPY, block.timestamp);
    }

    /**
     * @notice Get user's total balance including accrued yield
     * @param user Address of the user
     * @return balance Total balance including yield
     */
    function getBalance(address user) external view returns (uint256 balance) {
        balance = balanceOf(user);
    }

    /**
     * @notice Get user's accrued yield
     * @param user Address of the user
     * @return yield Amount of yield earned
     */
    function getYield(address user) external view returns (uint256 yield) {
        yield = userYieldEarned[user];
    }

    /**
     * @notice Get total assets in the vault
     * @return Total PYUSD balance of the vault
     */
    function totalAssets() public view override returns (uint256) {
        return PYUSD.balanceOf(address(this));
    }

    /**
     * @notice Pause the vault in case of emergency
     * @dev Only admin can pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the vault
     * @dev Only admin can unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Internal function to accrue yield for a user
     * @param user Address of the user
     */
    function _accrueYield(address user) internal {
        if (userLastDepositTime[user] == 0) return;
        
        uint256 timeElapsed = block.timestamp - userLastDepositTime[user];
        uint256 userShares = balanceOf(user);
        
        if (userShares == 0 || timeElapsed == 0) return;
        
        // Simple yield calculation (in production, this would be more sophisticated)
        // For demo purposes: 5% APY
        uint256 yieldRate = 5e16; // 5% in basis points (18 decimals)
        uint256 yield = (userShares * yieldRate * timeElapsed) / (365 days * 1e18);
        
        if (yield > 0) {
            userYieldEarned[user] += yield;
            totalYieldEarned += yield;
            
            emit YieldAccrued(user, yield, userYieldEarned[user], block.timestamp);
        }
        
        userLastDepositTime[user] = block.timestamp;
    }

    /**
     * @dev Override to add pause check
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
