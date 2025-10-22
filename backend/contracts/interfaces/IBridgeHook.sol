// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IBridgeHook
 * @dev Interface for cross-chain bridge operations
 * @notice Provides functions for Avail Nexus integration
 */
interface IBridgeHook {
    /// @notice Initiate cross-chain bridge operation
    /// @param token Address of token to bridge
    /// @param amount Amount of tokens to bridge
    /// @param toChainId Destination chain ID
    /// @param executeData Data for execution on destination chain
    function initiateBridge(
        address token,
        uint256 amount,
        uint256 toChainId,
        bytes calldata executeData
    ) external;

    /// @notice Execute bridge operation
    /// @param user Address of the user
    /// @param token Address of token
    /// @param amount Amount of tokens
    /// @param toChainId Destination chain ID
    function executeBridge(
        address user,
        address token,
        uint256 amount,
        uint256 toChainId
    ) external;

    /// @notice Events
    event BridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 toChainId,
        bytes executeData
    );
    
    event BridgeExecuted(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 toChainId,
        uint256 timestamp
    );
}
