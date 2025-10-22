# YieldForge Smart Contracts

> **AI-Powered Cross-Chain Yield Automator - Secure, Non-Custodial DeFi Vault**

[![Hardhat](https://img.shields.io/badge/Hardhat-v3-blue)](https://hardhat.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-green)](https://soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-v5.0.2-orange)](https://openzeppelin.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🎯 Overview

YieldForge is a non-custodial DeFi vault that enables AI-powered yield optimization across multiple protocols and chains. Users deposit PYUSD (PayPal USD stablecoin) and set intents for automated yield optimization, while maintaining full control of their funds.

### 🏆 Track Qualifications

- **🏆 PayPal USD (Grand Prize)**: Native PYUSD integration with secure vault deposits/withdrawals
- **🔗 Avail Nexus**: Cross-chain bridge operations for multi-chain yield optimization  
- **⚡ Lit Protocol Vincent**: AI agent automation with role-based access control
- **📊 Pyth Network**: Real-time price feeds for yield optimization guardrails

## 🏗️ Architecture

### Core Contracts

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| **YieldVault** | ERC4626-compliant vault | PYUSD deposits, yield accrual, bridge approvals |
| **IntentManager** | Intent management | User intents, agent execution, cross-chain operations |
| **PythIntegrator** | Price feed integration | Real-time prices, APY calculation, guardrails |
| **BridgeHook** | Cross-chain operations | Avail Nexus integration, bridge execution |

### Security Features

- ✅ **OpenZeppelin v5**: Battle-tested security primitives
- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Pausable**: Emergency pause functionality
- ✅ **AccessControl**: Role-based permissions
- ✅ **SafeERC20**: Safe token transfers
- ✅ **Custom Errors**: Gas-efficient error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Hardhat v3
- Sepolia testnet access

### Installation

```bash
# Clone repository
git clone <repository-url>
cd yieldforge/backend

# Install dependencies
pnpm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Environment Setup

Create `.env` file:

```env
# Sepolia RPC
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com

# Private key for deployment
PRIVATE_KEY=your_private_key_here

# Etherscan API key (optional)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas reporting (optional)
REPORT_GAS=true
```

## 📋 Contract Details

### YieldVault.sol

**Purpose**: Core vault for PYUSD deposits and yield optimization

**Key Functions**:
- `deposit(uint256 assets, address receiver)`: Deposit PYUSD and mint shares
- `withdraw(uint256 assets, address receiver, address owner)`: Withdraw PYUSD by burning shares
- `executeRebalance(address user, uint256 yieldGained, uint256 newAPY)`: Execute rebalance (agent only)
- `approveForBridge(address bridge, uint256 amount)`: Approve bridge for cross-chain ops

**Events**:
- `DepositEvent`: User deposits PYUSD
- `WithdrawEvent`: User withdraws PYUSD
- `YieldAccrued`: Yield earned by user
- `RebalanceExecuted`: Rebalance operation completed

### IntentManager.sol

**Purpose**: Manages yield optimization intents and automation

**Key Functions**:
- `submitIntent(Intent calldata intent)`: Submit yield optimization intent
- `executeRebalance(address user, uint256 intentId, bytes calldata executionData)`: Execute rebalance (agent only)
- `deactivateIntent(uint256 intentId)`: Deactivate user intent
- `getUserIntents(address user)`: Get user's intents

**Intent Structure**:
```solidity
struct Intent {
    uint256 minApy;           // Minimum APY threshold
    uint16 slippageBps;       // Maximum slippage
    address targetProtocol;   // Target protocol
    uint256 targetChainId;    // Target chain ID
    uint256 maxGasPrice;      // Maximum gas price
    bool isActive;            // Active status
    uint256 createdAt;        // Creation time
    uint256 lastExecuted;     // Last execution time
}
```

### PythIntegrator.sol

**Purpose**: Integrates with Pyth Network for real-time price feeds

**Key Functions**:
- `updatePriceFeeds(bytes[] calldata priceUpdates)`: Update price feeds
- `getValidPrice(bytes32 feedId, uint256 maxAge)`: Get valid price with age check
- `getAPY(bytes32 feedId)`: Get APY for yield calculation
- `isPriceValid(bytes32 feedId, uint256 maxAge)`: Check price validity

### BridgeHook.sol

**Purpose**: Handles cross-chain bridge operations for Avail Nexus

**Key Functions**:
- `initiateBridge(address token, uint256 amount, uint256 toChainId, bytes calldata executeData)`: Initiate bridge
- `executeBridge(address user, address token, uint256 amount, uint256 toChainId)`: Execute bridge (agent only)
- `setSupportedToken(address token, bool supported)`: Set supported tokens
- `setSupportedChain(uint256 chainId, bool supported)`: Set supported chains

## 🧪 Testing

### Run All Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/YieldVault.test.ts

# Run with coverage
npx hardhat coverage
```

### Test Coverage

- ✅ **YieldVault**: Deposit/withdraw, yield accrual, rebalancing, access control
- ✅ **IntentManager**: Intent submission, execution, validation, edge cases
- ✅ **PythIntegrator**: Price updates, validation, APY calculation
- ✅ **BridgeHook**: Bridge operations, token support, chain support

### Test Scenarios

1. **Basic Operations**: Deposit, withdraw, redeem
2. **Yield Accrual**: Time-based yield calculation
3. **Intent Management**: Submit, execute, deactivate intents
4. **Access Control**: Role-based permissions
5. **Edge Cases**: Zero amounts, insufficient balance, paused contracts
6. **Integration**: Cross-contract interactions

## 🚀 Deployment

### Local Deployment

```bash
# Start local node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

### Sepolia Deployment

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Verify contracts
npx hardhat verify --network sepolia
```

### Production Deployment

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet

# Verify contracts
npx hardhat verify --network mainnet
```

## 📊 Gas Optimization

### Gas Usage (Estimated)

| Function | Gas Used | Optimization |
|----------|----------|--------------|
| `deposit` | ~180,000 | ERC4626 standard |
| `withdraw` | ~120,000 | Efficient transfers |
| `submitIntent` | ~80,000 | Minimal storage |
| `executeRebalance` | ~200,000 | Batch operations |

### Optimization Techniques

- ✅ **Custom Errors**: Gas-efficient error handling
- ✅ **Immutable Variables**: Reduced storage reads
- ✅ **Unchecked Math**: Safe arithmetic optimizations
- ✅ **Event Indexing**: Efficient event filtering
- ✅ **Batch Operations**: Reduced transaction costs

## 🔒 Security Considerations

### Audit Checklist

- ✅ **Reentrancy Protection**: All external calls protected
- ✅ **Access Control**: Role-based permissions enforced
- ✅ **Input Validation**: All inputs validated
- ✅ **Overflow Protection**: Safe math operations
- ✅ **Pause Functionality**: Emergency stop capability
- ✅ **Upgrade Safety**: No proxy vulnerabilities

### Known Limitations

- **Oracle Dependency**: Relies on Pyth for price feeds
- **Bridge Risk**: Cross-chain operations carry bridge risk
- **Agent Trust**: Requires trusted Lit Vincent agents
- **Gas Costs**: High gas costs on Ethereum mainnet

## 🔧 Configuration

### Network Configuration

```typescript
// hardhat.config.ts
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 11155111,
  },
  // ... other networks
}
```

### Contract Parameters

```typescript
// Deployment parameters
const PYUSD_ADDRESS = "0x6f7C932e7684666C9fd1d44527765433e01C5b51";
const PYTH_HERMES_ADDRESS = "0x4D147dCb984e6affEec47e44293DA442580A3Ec0";
const MIN_DEPOSIT = 1e6; // 1 PYUSD
const MAX_DEPOSIT = 1_000_000e6; // 1M PYUSD
```

## 📈 Monitoring & Analytics

### Events to Monitor

- `DepositEvent`: Track user deposits
- `WithdrawEvent`: Track user withdrawals
- `RebalanceExecuted`: Track rebalancing operations
- `BridgeExecuted`: Track cross-chain operations

### Key Metrics

- **Total Value Locked (TVL)**: `yieldVault.totalAssets()`
- **Total Yield Earned**: `yieldVault.totalYieldEarned()`
- **User Yield**: `yieldVault.getYield(user)`
- **Active Intents**: `intentManager.getActiveIntents(user)`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin**: Security primitives and best practices
- **Pyth Network**: Real-time price feeds
- **Avail**: Cross-chain infrastructure
- **Lit Protocol**: AI automation capabilities
- **PayPal**: PYUSD stablecoin
- **EthGlobal**: Hackathon platform

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/yieldforge/docs)
- **Issues**: [GitHub Issues](https://github.com/yieldforge/issues)
- **Discord**: [YieldForge Community](https://discord.gg/yieldforge)
- **Twitter**: [@YieldForge](https://twitter.com/yieldforge)

---

**Built with ❤️ for EthOnline 2024**

*Transform your DeFi experience with AI-powered yield optimization*