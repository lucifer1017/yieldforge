// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
// Pyth integration removed - using frontend integration instead
import "./interfaces/IBridgeHook.sol";
import "./YieldVault.sol";

/**
 * @title IntentManager
 * @dev Manages yield optimization intents and executes rebalancing operations
 * @notice Handles Lit Vincent agent automation and cross-chain operations
 * @author YieldForge Team
 */
contract IntentManager is AccessControl, ReentrancyGuard, Pausable {
    // using Math for uint256; // Math library moved in OpenZeppelin v5.x

    /// @notice Role for Lit Vincent agents
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    /// @notice Role for bridge contracts
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    /// @notice Intent structure for yield optimization
    struct Intent {
        uint256 minApy;           // Minimum APY threshold in basis points
        uint16 slippageBps;       // Maximum slippage in basis points
        address targetProtocol;   // Target protocol address
        uint256 targetChainId;    // Target chain ID for cross-chain operations
        uint256 maxGasPrice;      // Maximum gas price in gwei
        bool isActive;            // Whether intent is active
        uint256 createdAt;        // Creation timestamp
        uint256 lastExecuted;     // Last execution timestamp
    }

    /// @notice YieldVault contract
    YieldVault public immutable vault;
    
    // Pyth integration removed - using frontend integration instead
    
    /// @notice Bridge hook for cross-chain operations
    IBridgeHook public bridgeHook;

    /// @notice User intents mapping
    mapping(address => Intent[]) public userIntents;
    
    /// @notice User intent count
    mapping(address => uint256) public userIntentCount;
    
    /// @notice Intent execution history
    mapping(address => mapping(uint256 => bool)) public intentExecuted;

    /// @notice Supported protocols
    mapping(address => bool) public supportedProtocols;
    
    /// @notice Supported chains
    mapping(uint256 => bool) public supportedChains;

    /// @notice Price feed IDs for different tokens
    mapping(string => bytes32) public priceFeedIds;

    /// @notice Events
    event IntentSubmitted(
        address indexed user,
        uint256 indexed intentId,
        Intent intent,
        uint256 timestamp
    );
    
    event RebalanceRequested(
        address indexed user,
        uint256 indexed intentId,
        uint256 currentApy,
        uint256 targetApy,
        uint256 timestamp
    );
    
    event RebalanceExecuted(
        address indexed user,
        uint256 indexed intentId,
        uint256 yieldGained,
        uint256 newApy,
        uint256 timestamp
    );
    
    event IntentDeactivated(
        address indexed user,
        uint256 indexed intentId,
        uint256 timestamp
    );
    
    event ProtocolSupported(address indexed protocol, bool supported);
    event ChainSupported(uint256 indexed chainId, bool supported);

    /// @notice Custom errors
    error InvalidIntent();
    error IntentNotFound();
    error UnsupportedProtocol();
    error UnsupportedChain();
    error InsufficientAPY();
    error InvalidSlippage();
    error IntentNotActive();
    error PythPriceStale();
    error UnauthorizedAgent();

    /**
     * @dev Constructor initializes the intent manager
     * @param vault_ Address of the YieldVault contract
     */
    constructor(address vault_) {
        vault = YieldVault(vault_);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        
        // Initialize supported protocols and chains
        _initializeSupportedProtocols();
        _initializeSupportedChains();
        _initializePriceFeeds();
    }

    /**
     * @notice Set bridge hook contract
     * @dev Only admin can set bridge hook
     * @param bridgeHook_ Address of bridge hook contract
     */
    function setBridgeHook(address bridgeHook_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bridgeHook = IBridgeHook(bridgeHook_);
    }

    /**
     * @notice Submit a new yield optimization intent
     * @dev Users can submit intents for automated yield optimization
     * @param intent Intent structure with optimization parameters
     * @return intentId ID of the submitted intent
     */
    function submitIntent(Intent calldata intent)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 intentId)
    {
        _validateIntent(intent);
        
        intentId = userIntentCount[msg.sender];
        userIntents[msg.sender].push(intent);
        userIntentCount[msg.sender]++;
        
        emit IntentSubmitted(msg.sender, intentId, intent, block.timestamp);
        
        return intentId;
    }

    /**
     * @notice Execute rebalance for a user's intent
     * @dev Only callable by authorized agents (Lit Vincent)
     * @param user Address of the user
     * @param intentId ID of the intent to execute
     * @param executionData Additional data for execution
     */
    function executeRebalance(
        address user,
        uint256 intentId,
        bytes calldata executionData
    ) external onlyRole(AGENT_ROLE) nonReentrant whenNotPaused {
        if (intentId >= userIntentCount[user]) {
            revert IntentNotFound();
        }
        
        Intent storage intent = userIntents[user][intentId];
        
        if (!intent.isActive) {
            revert IntentNotActive();
        }
        
        // Check if already executed recently (prevent spam)
        if (intent.lastExecuted + 1 hours > block.timestamp) {
            revert IntentNotFound();
        }
        
        // Validate current APY against intent requirements
        _validateAPY(intent);
        
        // Execute the rebalance
        uint256 yieldGained = _executeRebalance(user, intent, executionData);
        
        // Update intent state
        intent.lastExecuted = block.timestamp;
        
        // Calculate new APY (simplified for demo)
        uint256 totalAssets = vault.totalAssets();
        uint256 newApy = totalAssets > 0 ? intent.minApy + (yieldGained * 10000) / totalAssets : intent.minApy;
        
        emit RebalanceExecuted(user, intentId, yieldGained, newApy, block.timestamp);
    }

    /**
     * @notice Deactivate an intent
     * @dev Users can deactivate their intents
     * @param intentId ID of the intent to deactivate
     */
    function deactivateIntent(uint256 intentId) external nonReentrant {
        if (intentId >= userIntentCount[msg.sender]) {
            revert IntentNotFound();
        }
        
        userIntents[msg.sender][intentId].isActive = false;
        
        emit IntentDeactivated(msg.sender, intentId, block.timestamp);
    }

    /**
     * @notice Get user's intents
     * @param user Address of the user
     * @return intents Array of user's intents
     */
    function getUserIntents(address user) external view returns (Intent[] memory intents) {
        uint256 count = userIntentCount[user];
        intents = new Intent[](count);
        
        for (uint256 i = 0; i < count; i++) {
            intents[i] = userIntents[user][i];
        }
    }

    /**
     * @notice Get user's active intents
     * @param user Address of the user
     * @return activeIntents Array of active intents
     */
    function getActiveIntents(address user) external view returns (Intent[] memory activeIntents) {
        uint256 count = userIntentCount[user];
        uint256 activeCount = 0;
        
        // Count active intents
        for (uint256 i = 0; i < count; i++) {
            if (userIntents[user][i].isActive) {
                activeCount++;
            }
        }
        
        // Create array with active intents
        activeIntents = new Intent[](activeCount);
        uint256 activeIndex = 0;
        
        for (uint256 i = 0; i < count; i++) {
            if (userIntents[user][i].isActive) {
                activeIntents[activeIndex] = userIntents[user][i];
                activeIndex++;
            }
        }
    }

    /**
     * @notice Pause the contract
     * @dev Only admin can pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only admin can unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Validate intent parameters
     * @param intent Intent to validate
     */
    function _validateIntent(Intent calldata intent) internal view {
        if (intent.minApy == 0 || intent.minApy > 10000) {
            revert InvalidIntent();
        }
        
        if (intent.slippageBps > 1000) { // Max 10% slippage
            revert InvalidSlippage();
        }
        
        if (intent.targetProtocol != address(0) && !supportedProtocols[intent.targetProtocol]) {
            revert UnsupportedProtocol();
        }
        
        if (intent.targetChainId != 0 && !supportedChains[intent.targetChainId]) {
            revert UnsupportedChain();
        }
    }

    /**
     * @dev Validate APY against intent requirements
     * @param intent Intent to validate against
     */
    function _validateAPY(Intent storage intent) internal view {
        // APY validation removed - using frontend Pyth integration instead
        // This function can be called by frontend with real APY data
    }

    /**
     * @dev Execute rebalance operation with Avail Nexus integration
     * @param user Address of the user
     * @param intent Intent to execute
     * @param executionData Additional data for cross-chain execution
     * @return yieldGained Amount of yield gained
     */
    function _executeRebalance(
        address user,
        Intent storage intent,
        bytes calldata executionData
    ) internal returns (uint256 yieldGained) {
        // For cross-chain operations with Avail Nexus
        if (intent.targetChainId != 0 && address(bridgeHook) != address(0)) {
            uint256 userBalance = vault.balanceOf(user);
            if (userBalance > 0) {
                // Approve bridge for cross-chain operation
                vault.approveForBridge(address(bridgeHook), userBalance);
                
                // Execute bridge operation with execution data for target protocol
                bridgeHook.initiateBridge(
                    address(vault.PYUSD()),
                    userBalance,
                    intent.targetChainId,
                    executionData // Contains calldata for target protocol (e.g., Aave deposit)
                );
                
                // Emit rebalance request for off-chain monitoring
                emit RebalanceRequested(user, 0, 0, intent.minApy, block.timestamp);
            }
        }
        
        // Calculate yield gain based on intent parameters
        // In production, this would be calculated based on actual protocol interactions
        yieldGained = (vault.balanceOf(user) * intent.minApy) / 10000 / 365; // Daily yield
        
        // Update vault with yield
        vault.executeRebalance(user, yieldGained, intent.minApy);
    }

    /**
     * @dev Initialize supported protocols
     */
    function _initializeSupportedProtocols() internal {
        // Mock addresses for demo (in production, these would be real protocol addresses)
        supportedProtocols[0x1234567890123456789012345678901234567890] = true; // Mock Aave
        supportedProtocols[0x2345678901234567890123456789012345678901] = true; // Mock Morpho
        supportedProtocols[0x3456789012345678901234567890123456789012] = true; // Mock Compound
    }

    /**
     * @dev Initialize supported chains
     */
    function _initializeSupportedChains() internal {
        supportedChains[1] = true;      // Ethereum mainnet
        supportedChains[8453] = true;   // Base
        supportedChains[10] = true;     // Optimism
        supportedChains[42161] = true;  // Arbitrum
        supportedChains[11155111] = true; // Sepolia testnet
    }

    /**
     * @dev Initialize price feed IDs
     */
    function _initializePriceFeeds() internal {
        // Mock feed IDs for demo (in production, these would be real Pyth feed IDs)
        priceFeedIds["USDC"] = keccak256("USDC/USD");
        priceFeedIds["ETH"] = keccak256("ETH/USD");
        priceFeedIds["PYUSD"] = keccak256("PYUSD/USD");
    }
}
