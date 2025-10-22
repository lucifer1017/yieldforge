// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@pythnetwork/contracts/IPyth.sol";
import "./interfaces/IPythIntegrator.sol";

/**
 * @title PythIntegrator
 * @dev Integrates with Pyth Network for real-time price feeds and APY data
 * @notice Provides price validation and APY calculation for yield optimization
 * @author YieldForge Team
 */
contract PythIntegrator is IPythIntegrator, AccessControl, ReentrancyGuard {
    using Math for uint256;

    /// @notice Role for price feed updates
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");

    /// @notice Pyth contract
    IPyth public immutable pyth;
    
    /// @notice Price feed data storage
    mapping(bytes32 => PriceData) public priceFeeds;
    
    /// @notice Feed symbols for easy lookup
    mapping(string => bytes32) public feedSymbols;
    
    /// @notice APY feeds for yield calculation
    mapping(bytes32 => uint256) public apyFeeds;

    /// @notice Maximum price age (1 hour)
    uint256 public constant MAX_PRICE_AGE = 1 hours;
    
    /// @notice Maximum confidence threshold (5%)
    uint64 public constant MAX_CONFIDENCE = 5e16; // 5% in 18 decimals

    /// @notice Events
    event PriceUpdated(bytes32 indexed feedId, int64 price, uint64 timestamp, uint64 confidence);
    event PriceFeedRegistered(bytes32 indexed feedId, string symbol);
    event APYUpdated(bytes32 indexed feedId, uint256 apy);

    /// @notice Custom errors
    error InvalidPrice();
    error StalePrice();
    error InvalidConfidence();
    error FeedNotFound();
    error UnauthorizedUpdater();

    /**
     * @dev Constructor initializes Pyth integrator
     * @param pyth_ Address of Pyth contract
     */
    constructor(address pyth_) {
        pyth = IPyth(pyth_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
        
        _initializeDefaultFeeds();
    }

    /**
     * @notice Update price feeds with new data from Pyth
     * @dev Only authorized updaters can call this function
     * @param priceUpdates Array of price update data from Pyth
     */
    function updatePriceFeeds(bytes[] calldata priceUpdates)
        external
        payable
        onlyRole(PRICE_UPDATER_ROLE)
        nonReentrant
    {
        // Update prices in Pyth contract
        pyth.updatePriceFeeds{value: msg.value}(priceUpdates);
        
        // Parse and store price data
        for (uint256 i = 0; i < priceUpdates.length; i++) {
            // In a real implementation, you would parse the price update data
            // For demo purposes, we'll simulate price updates
            _simulatePriceUpdate(priceUpdates[i]);
        }
    }

    /**
     * @notice Get latest price for a specific feed
     * @param feedId Price feed identifier
     * @return priceData Price data including price, timestamp, and confidence
     */
    function getLatestPrice(bytes32 feedId) external view returns (PriceData memory priceData) {
        priceData = priceFeeds[feedId];
        
        if (priceData.timestamp == 0) {
            revert FeedNotFound();
        }
    }

    /**
     * @notice Get valid price with age check
     * @param feedId Price feed identifier
     * @param maxAge Maximum age of price in seconds
     * @return priceData Valid price data
     */
    function getValidPrice(bytes32 feedId, uint256 maxAge) external view returns (PriceData memory priceData) {
        priceData = priceFeeds[feedId];
        
        if (priceData.timestamp == 0) {
            revert FeedNotFound();
        }
        
        if (block.timestamp - priceData.timestamp > maxAge) {
            revert StalePrice();
        }
        
        if (priceData.confidence > MAX_CONFIDENCE) {
            revert InvalidConfidence();
        }
        
        priceData.isValid = true;
    }

    /**
     * @notice Check if price is valid and not stale
     * @param feedId Price feed identifier
     * @param maxAge Maximum age of price in seconds
     * @return isValid True if price is valid and not stale
     */
    function isPriceValid(bytes32 feedId, uint256 maxAge) external view returns (bool isValid) {
        PriceData memory priceData = priceFeeds[feedId];
        
        if (priceData.timestamp == 0) {
            return false;
        }
        
        if (block.timestamp - priceData.timestamp > maxAge) {
            return false;
        }
        
        if (priceData.confidence > MAX_CONFIDENCE) {
            return false;
        }
        
        return true;
    }

    /**
     * @notice Get APY for a specific feed
     * @param feedId Price feed identifier
     * @return apy APY value in basis points
     */
    function getAPY(bytes32 feedId) external view returns (uint256 apy) {
        apy = apyFeeds[feedId];
        
        if (apy == 0) {
            // Return default APY if feed not found
            apy = 500; // 5% default APY
        }
    }

    /**
     * @notice Register a new price feed
     * @dev Only admin can register feeds
     * @param feedId Price feed identifier
     * @param symbol Human-readable symbol
     */
    function registerFeed(bytes32 feedId, string calldata symbol)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        feedSymbols[symbol] = feedId;
        
        emit PriceFeedRegistered(feedId, symbol);
    }

    /**
     * @notice Update APY for a specific feed
     * @dev Only admin can update APY
     * @param feedId Price feed identifier
     * @param apy New APY value in basis points
     */
    function updateAPY(bytes32 feedId, uint256 apy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        apyFeeds[feedId] = apy;
        
        emit APYUpdated(feedId, apy);
    }

    /**
     * @notice Get feed ID by symbol
     * @param symbol Feed symbol
     * @return feedId Price feed identifier
     */
    function getFeedId(string calldata symbol) external view returns (bytes32 feedId) {
        feedId = feedSymbols[symbol];
        
        if (feedId == bytes32(0)) {
            revert FeedNotFound();
        }
    }

    /**
     * @notice Simulate price update for demo purposes
     * @dev In production, this would parse actual Pyth price update data
     * @param priceUpdateData Price update data from Pyth
     */
    function _simulatePriceUpdate(bytes calldata priceUpdateData) internal {
        // For demo purposes, we'll generate mock price data
        // In production, you would parse the actual Pyth price update data
        
        // Generate a mock feed ID based on the data
        bytes32 feedId = keccak256(priceUpdateData);
        
        // Generate mock price data
        PriceData memory priceData = PriceData({
            price: int64(uint64(block.timestamp) % 1000000 + 1000000), // Mock price
            timestamp: uint64(block.timestamp),
            confidence: uint64(1e15), // 0.1% confidence
            isValid: true
        });
        
        priceFeeds[feedId] = priceData;
        
        emit PriceUpdated(feedId, priceData.price, priceData.timestamp, priceData.confidence);
    }

    /**
     * @dev Initialize default price feeds for demo
     */
    function _initializeDefaultFeeds() internal {
        // USDC/USD feed
        bytes32 usdcFeedId = keccak256("USDC/USD");
        feedSymbols["USDC"] = usdcFeedId;
        apyFeeds[usdcFeedId] = 450; // 4.5% APY
        
        // ETH/USD feed
        bytes32 ethFeedId = keccak256("ETH/USD");
        feedSymbols["ETH"] = ethFeedId;
        apyFeeds[ethFeedId] = 350; // 3.5% APY
        
        // PYUSD/USD feed
        bytes32 pyusdFeedId = keccak256("PYUSD/USD");
        feedSymbols["PYUSD"] = pyusdFeedId;
        apyFeeds[pyusdFeedId] = 500; // 5% APY
        
        // Initialize with mock current prices
        priceFeeds[usdcFeedId] = PriceData({
            price: 1e8, // $1.00 with 8 decimals
            timestamp: uint64(block.timestamp),
            confidence: uint64(1e15), // 0.1%
            isValid: true
        });
        
        priceFeeds[ethFeedId] = PriceData({
            price: 3000e8, // $3000 with 8 decimals
            timestamp: uint64(block.timestamp),
            confidence: uint64(5e15), // 0.5%
            isValid: true
        });
        
        priceFeeds[pyusdFeedId] = PriceData({
            price: 1e8, // $1.00 with 8 decimals
            timestamp: uint64(block.timestamp),
            confidence: uint64(1e15), // 0.1%
            isValid: true
        });
    }
}
