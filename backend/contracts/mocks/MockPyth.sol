// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@pythnetwork/contracts/IPyth.sol";

/**
 * @title MockPyth
 * @dev Mock Pyth contract for testing purposes
 * @notice Simulates Pyth Network price feed functionality
 * @author YieldForge Team
 */
contract MockPyth is IPyth {
    /// @notice Price data structure
    struct PriceData {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    /// @notice Price feeds storage
    mapping(bytes32 => PriceData) public priceFeeds;
    
    /// @notice Price update fee
    uint256 public updateFee = 0.001 ether;

    /// @notice Events
    event PriceUpdated(bytes32 indexed feedId, int64 price, uint64 conf, int32 expo, uint256 publishTime);

    /**
     * @notice Update price feeds
     * @dev Mock implementation that stores price data
     * @param updateData Array of price update data
     */
    function updatePriceFeeds(bytes[] calldata updateData) external payable override {
        require(msg.value >= updateFee, "Insufficient fee");
        
        // For demo purposes, we'll generate mock price data
        for (uint256 i = 0; i < updateData.length; i++) {
            bytes32 feedId = keccak256(updateData[i]);
            
            // Generate mock price data
            PriceData memory priceData = PriceData({
                price: int64(uint64(block.timestamp) % 1000000 + 1000000),
                conf: uint64(1e15), // 0.1% confidence
                expo: -8, // 8 decimal places
                publishTime: block.timestamp
            });
            
            priceFeeds[feedId] = priceData;
            
            emit PriceUpdated(feedId, priceData.price, priceData.conf, priceData.expo, priceData.publishTime);
        }
    }

    /**
     * @notice Get price with age check
     * @param id Price feed ID
     * @param maxAge Maximum age of price
     * @return price Price data
     */
    function getPriceNoOlderThan(bytes32 id, uint256 maxAge) external view override returns (PythStructs.Price memory price) {
        PriceData memory data = priceFeeds[id];
        
        require(data.publishTime > 0, "Price not found");
        require(block.timestamp - data.publishTime <= maxAge, "Price too old");
        
        price = PythStructs.Price({
            price: data.price,
            conf: data.conf,
            expo: data.expo,
            publishTime: data.publishTime
        });
    }

    /**
     * @notice Get price without age check
     * @param id Price feed ID
     * @return price Price data
     */
    function getPrice(bytes32 id) external view override returns (PythStructs.Price memory price) {
        PriceData memory data = priceFeeds[id];
        
        require(data.publishTime > 0, "Price not found");
        
        price = PythStructs.Price({
            price: data.price,
            conf: data.conf,
            expo: data.expo,
            publishTime: data.publishTime
        });
    }

    /**
     * @notice Get price update fee
     * @return fee Required fee for price updates
     */
    function getUpdateFee(bytes[] calldata updateData) external view override returns (uint256 fee) {
        fee = updateFee * updateData.length;
    }

    /**
     * @notice Get valid time period
     * @return period Valid time period
     */
    function getValidTimePeriod() external pure override returns (uint256 period) {
        period = 60; // 1 minute
    }

    /**
     * @notice Get price feed
     * @param id Price feed ID
     * @return priceFeed Price feed data
     */
    function getPriceFeed(bytes32 id) external view override returns (PythStructs.PriceFeed memory priceFeed) {
        PriceData memory data = priceFeeds[id];
        
        require(data.publishTime > 0, "Price feed not found");
        
        priceFeed = PythStructs.PriceFeed({
            id: id,
            price: PythStructs.Price({
                price: data.price,
                conf: data.conf,
                expo: data.expo,
                publishTime: data.publishTime
            }),
            emaPrice: PythStructs.Price({
                price: data.price,
                conf: data.conf,
                expo: data.expo,
                publishTime: data.publishTime
            })
        });
    }

    /**
     * @notice Get price feeds
     * @param ids Array of price feed IDs
     * @return priceFeeds Array of price feed data
     */
    function getPriceFeeds(bytes32[] calldata ids) external view override returns (PythStructs.PriceFeed[] memory priceFeeds) {
        priceFeeds = new PythStructs.PriceFeed[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            priceFeeds[i] = this.getPriceFeed(ids[i]);
        }
    }

    /**
     * @notice Get price feed update data
     * @param ids Array of price feed IDs
     * @return updateData Price update data
     */
    function getPriceFeedUpdateData(bytes32[] calldata ids) external view override returns (bytes[] memory updateData) {
        updateData = new bytes[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            // For demo purposes, return the feed ID as update data
            updateData[i] = abi.encode(ids[i]);
        }
    }

    /**
     * @notice Parse price feed update data
     * @param updateData Price update data
     * @return priceFeeds Array of price feeds
     */
    function parsePriceFeedUpdates(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64 minPublishTime,
        uint64 maxPublishTime
    ) external view override returns (PythStructs.PriceFeed[] memory priceFeeds) {
        priceFeeds = new PythStructs.PriceFeed[](priceIds.length);
        
        for (uint256 i = 0; i < priceIds.length; i++) {
            priceFeeds[i] = this.getPriceFeed(priceIds[i]);
        }
    }

    /**
     * @notice Set update fee
     * @dev Only for testing
     * @param newFee New update fee
     */
    function setUpdateFee(uint256 newFee) external {
        updateFee = newFee;
    }

    /**
     * @notice Set mock price
     * @dev Only for testing
     * @param id Price feed ID
     * @param price Price value
     * @param conf Confidence
     * @param expo Exponent
     */
    function setMockPrice(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo
    ) external {
        priceFeeds[id] = PriceData({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: block.timestamp
        });
        
        emit PriceUpdated(id, price, conf, expo, block.timestamp);
    }
}
