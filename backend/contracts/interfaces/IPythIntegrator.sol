// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPythIntegrator
 * @dev Interface for Pyth price feed integration
 * @notice Provides functions for price feed updates and validation
 */
interface IPythIntegrator {
    /// @notice Price data structure
    struct PriceData {
        int64 price;
        uint64 timestamp;
        uint64 confidence;
        bool isValid;
    }

    /// @notice Update price feeds with new data
    /// @param priceUpdates Array of price update data
    function updatePriceFeeds(bytes[] calldata priceUpdates) external payable;

    /// @notice Get latest price for a specific feed
    /// @param feedId Price feed identifier
    /// @return priceData Price data including price, timestamp, and confidence
    function getLatestPrice(bytes32 feedId) external view returns (PriceData memory priceData);

    /// @notice Get valid price with age check
    /// @param feedId Price feed identifier
    /// @param maxAge Maximum age of price in seconds
    /// @return priceData Valid price data
    function getValidPrice(bytes32 feedId, uint256 maxAge) external view returns (PriceData memory priceData);

    /// @notice Check if price is valid and not stale
    /// @param feedId Price feed identifier
    /// @param maxAge Maximum age of price in seconds
    /// @return isValid True if price is valid and not stale
    function isPriceValid(bytes32 feedId, uint256 maxAge) external view returns (bool isValid);

    /// @notice Get price for APY calculation
    /// @param feedId Price feed identifier
    /// @return apy APY value in basis points
    function getAPY(bytes32 feedId) external view returns (uint256 apy);

    /// @notice Events
    event PriceUpdated(bytes32 indexed feedId, int64 price, uint64 timestamp, uint64 confidence);
    event PriceFeedRegistered(bytes32 indexed feedId, string symbol);
}
