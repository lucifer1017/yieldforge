// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IBridgeHook.sol";

/**
 * @title BridgeHook
 * @dev Handles cross-chain bridge operations for Avail Nexus integration
 * @notice Provides functions for initiating and executing cross-chain operations
 * @author YieldForge Team
 */
contract BridgeHook is IBridgeHook, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Role for bridge operations
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    
    /// @notice Role for agents to execute bridge operations
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    /// @notice Supported tokens for bridging
    mapping(address => bool) public supportedTokens;
    
    /// @notice Supported destination chains
    mapping(uint256 => bool) public supportedChains;
    
    /// @notice Bridge operation tracking
    mapping(bytes32 => BridgeOperation) public bridgeOperations;
    
    /// @notice User bridge history
    mapping(address => bytes32[]) public userBridgeHistory;

    /// @notice Bridge operation structure
    struct BridgeOperation {
        address user;
        address token;
        uint256 amount;
        uint256 toChainId;
        bytes executeData;
        bool executed;
        uint256 timestamp;
        uint256 executionTimestamp;
    }

    /// @notice Bridge fees (in basis points)
    uint256 public bridgeFeeBps = 10; // 0.1%
    
    /// @notice Maximum bridge amount
    uint256 public maxBridgeAmount = 1000000e6; // 1M tokens

    /// @notice Events
    event TokenSupported(address indexed token, bool supported);
    event ChainSupported(uint256 indexed chainId, bool supported);
    event BridgeFeeUpdated(uint256 newFeeBps);

    /// @notice Custom errors
    error UnsupportedToken();
    error UnsupportedChain();
    error InvalidAmount();
    error OperationNotFound();
    error OperationAlreadyExecuted();
    error UnauthorizedAgent();
    error InsufficientBalance();

    /**
     * @dev Constructor initializes supported tokens and chains
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        
        _initializeSupportedTokens();
        _initializeSupportedChains();
    }

    /**
     * @notice Initiate cross-chain bridge operation
     * @dev Users can initiate bridge operations for supported tokens
     * @param token Address of token to bridge
     * @param amount Amount of tokens to bridge
     * @param toChainId Destination chain ID
     * @param executeData Data for execution on destination chain
     */
    function initiateBridge(
        address token,
        uint256 amount,
        uint256 toChainId,
        bytes calldata executeData
    ) external override nonReentrant {
        if (!supportedTokens[token]) {
            revert UnsupportedToken();
        }
        
        if (!supportedChains[toChainId]) {
            revert UnsupportedChain();
        }
        
        if (amount == 0 || amount > maxBridgeAmount) {
            revert InvalidAmount();
        }
        
        // Check user has sufficient balance
        if (IERC20(token).balanceOf(msg.sender) < amount) {
            revert InsufficientBalance();
        }
        
        // Generate operation ID
        bytes32 operationId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                toChainId,
                executeData,
                block.timestamp
            )
        );
        
        // Store bridge operation
        bridgeOperations[operationId] = BridgeOperation({
            user: msg.sender,
            token: token,
            amount: amount,
            toChainId: toChainId,
            executeData: executeData,
            executed: false,
            timestamp: block.timestamp,
            executionTimestamp: 0
        });
        
        // Add to user history
        userBridgeHistory[msg.sender].push(operationId);
        
        emit BridgeInitiated(msg.sender, token, amount, toChainId, executeData, operationId);
    }

    /**
     * @notice Execute bridge operation
     * @dev Only callable by authorized agents
     * @param user Address of the user
     * @param token Address of token
     * @param amount Amount of tokens
     * @param toChainId Destination chain ID
     */
    function executeBridge(
        address user,
        address token,
        uint256 amount,
        uint256 toChainId
    ) external override onlyRole(AGENT_ROLE) nonReentrant {
        // Find the bridge operation
        bytes32[] memory userOps = userBridgeHistory[user];
        bytes32 operationId = bytes32(0);
        
        for (uint256 i = 0; i < userOps.length; i++) {
            BridgeOperation storage op = bridgeOperations[userOps[i]];
            if (op.token == token && 
                op.amount == amount && 
                op.toChainId == toChainId && 
                !op.executed) {
                operationId = userOps[i];
                break;
            }
        }
        
        if (operationId == bytes32(0)) {
            revert OperationNotFound();
        }
        
        BridgeOperation storage operation = bridgeOperations[operationId];
        
        if (operation.executed) {
            revert OperationAlreadyExecuted();
        }
        
        // Calculate bridge fee
        uint256 fee = (amount * bridgeFeeBps) / 10000;
        uint256 bridgeAmount = amount - fee;
        
        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(user, address(this), amount);
        
        // In a real implementation, you would interact with the actual bridge contract
        // For demo purposes, we'll simulate the bridge operation
        _simulateBridgeExecution(user, token, bridgeAmount, toChainId);
        
        // Mark operation as executed
        operation.executed = true;
        operation.executionTimestamp = block.timestamp;
        
        emit BridgeExecuted(user, token, amount, toChainId, operationId, block.timestamp);
    }

    /**
     * @notice Get user's bridge history
     * @param user Address of the user
     * @return operations Array of operation IDs
     */
    function getUserBridgeHistory(address user) external view returns (bytes32[] memory operations) {
        operations = userBridgeHistory[user];
    }

    /**
     * @notice Get bridge operation details
     * @param operationId ID of the operation
     * @return operation Bridge operation details
     */
    function getBridgeOperation(bytes32 operationId) external view returns (BridgeOperation memory operation) {
        operation = bridgeOperations[operationId];
    }

    /**
     * @notice Set supported token
     * @dev Only admin can set supported tokens
     * @param token Address of token
     * @param supported Whether token is supported
     */
    function setSupportedToken(address token, bool supported) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }

    /**
     * @notice Set supported chain
     * @dev Only admin can set supported chains
     * @param chainId Chain ID
     * @param supported Whether chain is supported
     */
    function setSupportedChain(uint256 chainId, bool supported) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[chainId] = supported;
        emit ChainSupported(chainId, supported);
    }

    /**
     * @notice Set bridge fee
     * @dev Only admin can set bridge fee
     * @param newFeeBps New fee in basis points
     */
    function setBridgeFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bridgeFeeBps = newFeeBps;
        emit BridgeFeeUpdated(newFeeBps);
    }

    /**
     * @dev Simulate bridge execution for demo purposes
     * @param user Address of the user
     * @param token Address of token
     * @param amount Amount of tokens
     */
    function _simulateBridgeExecution(
        address user,
        address token,
        uint256 amount,
        uint256 /* toChainId */
    ) internal {
        // In a real implementation, this would:
        // 1. Call the actual bridge contract (e.g., Avail Nexus)
        // 2. Handle the cross-chain execution
        // 3. Emit events for off-chain monitoring
        
        // For demo purposes, we'll just transfer the tokens back to simulate success
        // In production, the tokens would be locked and bridged to the destination chain
        IERC20(token).safeTransfer(user, amount);
    }

    /**
     * @dev Initialize supported tokens
     */
    function _initializeSupportedTokens() internal {
        // Only PYUSD on Sepolia for now
        supportedTokens[0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9] = true; // PYUSD on Sepolia
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
}
