// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPYUSD
 * @dev Mock PYUSD token for testing purposes
 * @notice Simulates PYUSD token behavior on Sepolia testnet
 * @author YieldForge Team
 */
contract MockPYUSD is ERC20, Ownable {
    /// @notice Decimals for PYUSD (6 decimals like USDC)
    uint8 public constant DECIMALS = 6;
    
    /// @notice Maximum supply
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**DECIMALS; // 1B PYUSD

    /// @notice Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    /**
     * @dev Constructor mints initial supply to deployer
     */
    constructor() ERC20("PayPal USD", "PYUSD") Ownable(msg.sender) {
        // Mint 10M PYUSD to deployer for testing
        _mint(msg.sender, 10000000 * 10**DECIMALS);
    }

    /**
     * @notice Mint tokens to a specific address
     * @dev Only owner can mint
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @notice Burn tokens from a specific address
     * @dev Only owner can burn
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit Burn(from, amount);
    }

    /**
     * @notice Get decimals
     * @return Number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Faucet function for testing
     * @dev Anyone can call this to get test tokens
     * @param amount Amount of tokens to request
     */
    function faucet(uint256 amount) external {
        require(amount <= 1000 * 10**DECIMALS, "Max faucet amount exceeded");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(msg.sender, amount);
        emit Mint(msg.sender, amount);
    }
}
