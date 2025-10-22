# YieldForge - AI-Powered Cross-Chain Yield Automator

![YieldForge Logo](https://img.shields.io/badge/YieldForge-AI%20Powered%20DeFi-blue?style=for-the-badge&logo=ethereum)

> **Deposit PYUSD once, let AI hunt yields cross-chain.** Non-custodial DeFi automation with intelligent rebalancing across multiple protocols and chains.

## 🚀 Track Qualifications

### 🏆 PayPal USD - Grand Prize for Transformative PYUSD Use
- **PYUSD Integration**: Native PYUSD deposits and withdrawals on Sepolia testnet
- **Vault Architecture**: Smart contract vault for PYUSD deposits with yield optimization
- **User Experience**: Seamless PYUSD deposit flow with real-time balance tracking
- **Demo Flow**: Connect → Deposit PYUSD → Set Intent → AI Optimizes → Withdraw PYUSD

### 🔗 Avail - Best DeFi/Payments with Nexus SDK
- **Cross-Chain Operations**: Bridge PYUSD across Ethereum, Base, Optimism using Avail Nexus
- **Unified Balance**: Cross-chain balance aggregation and management
- **Intent Execution**: Automated cross-chain yield optimization via Nexus bridgeAndExecute
- **Demo Location**: See `/app/intent/page.tsx` for Nexus integration and `/components/nexus/` for implementation

### ⚡ Lit Protocol - Best DeFi Automation Vincent Apps
- **Vincent App Registration**: AI agent registration with Lit Protocol Vincent SDK
- **Automated Rebalancing**: Off-chain triggers for yield optimization
- **Non-Custodial**: User maintains control while AI automates strategies
- **Demo Location**: See `/components/lit/VincentAgent.tsx` for Vincent integration

### 📊 Pyth Network - Real-Time Price Feeds (Bonus)
- **Price Feeds**: Real-time APY and price data from Pyth Network
- **Yield Optimization**: AI decisions based on live market data
- **Demo Location**: See `/components/dashboard/PythFeed.tsx` for Pyth integration

## 🏗️ Architecture

### Frontend Stack
- **Next.js 14** with App Router and TypeScript
- **Wagmi + Viem** for Ethereum wallet integration
- **Shadcn UI** for modern, responsive design
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** for styling with dark/light theme support

### Key Integrations
- **Avail Nexus**: Cross-chain bridge and execute operations
- **Lit Protocol Vincent**: AI agent automation and off-chain triggers
- **PYUSD**: PayPal USD stablecoin on Sepolia testnet
- **Pyth Network**: Real-time price feeds for yield optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- MetaMask wallet with Sepolia testnet
- Sepolia ETH for gas fees
- PYUSD testnet tokens

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd yieldforge/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Setup
1. **Connect MetaMask** to Sepolia testnet
2. **Get Sepolia ETH** from [Sepolia Faucet](https://sepoliafaucet.com/)
3. **Get PYUSD testnet tokens** from PayPal testnet
4. **Visit** `http://localhost:3000`

## 📱 User Flow

### 1. Home Page (`/`)
- **Hero Section**: YieldForge introduction and value proposition
- **Connect Wallet**: MetaMask integration with wallet connection
- **Deposit PYUSD**: Direct deposit to vault with approval flow
- **Features**: AI-powered, non-custodial, cross-chain benefits

### 2. Intent Builder (`/intent`)
- **Strategy Configuration**: Drag-drop interface for yield strategies
- **Protocol Selection**: Aave, Morpho, Compound, Uniswap
- **Chain Selection**: Ethereum, Base, Optimism, Arbitrum
- **Risk Guardrails**: Slippage, gas limits, APY thresholds
- **AI Suggestions**: Intelligent strategy recommendations

### 3. Dashboard (`/dashboard`)
- **Real-Time Metrics**: Total value, current APY, yield earned
- **APY Chart**: Historical performance visualization
- **Vincent Agent**: AI automation status and controls
- **Pyth Feeds**: Real-time price data from Pyth Network
- **Activity Feed**: Recent transactions and rebalancing events

## 🔧 Technical Implementation

### Smart Contracts
```solidity
// Vault Contract (Mock)
contract YieldVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getBalance(address user) external view returns (uint256);
    function getYield(address user) external view returns (uint256);
}
```

### Key Components
- **`/components/wallet/`**: Wallet connection and account management
- **`/components/pyusd/`**: PYUSD deposit and withdrawal flows
- **`/components/nexus/`**: Avail Nexus cross-chain operations
- **`/components/lit/`**: Lit Protocol Vincent automation
- **`/components/dashboard/`**: Dashboard charts and metrics

### Hooks
- **`useDeposit`**: PYUSD deposit with approval flow
- **`useNexusIntent`**: Cross-chain intent execution
- **`usePythFeed`**: Real-time price feed data
- **`useVincentExecute`**: AI agent automation

## 🎯 Demo Scenarios

### Scenario 1: Basic Deposit Flow
1. Connect MetaMask wallet
2. Deposit 1000 PYUSD to vault
3. View balance and yield metrics
4. Withdraw funds

### Scenario 2: Intent Creation
1. Navigate to Intent Builder
2. Create "Conservative Stablecoin Strategy"
3. Set Aave USDC lending on Ethereum
4. Configure 1% max slippage, 3% min APY
5. Save intent

### Scenario 3: AI Automation
1. Register Vincent Agent
2. Enable automated rebalancing
3. Monitor AI agent status
4. View rebalancing history

### Scenario 4: Cross-Chain Operations
1. Create intent for Base chain
2. Use Nexus to bridge PYUSD to Base
3. Execute Aave deposit on Base
4. Monitor cross-chain balance

## 📊 Track-Specific Features

### PayPal USD Integration
- **Contract**: `0x6f7C932e7684666C9fd1d44527765433e01C5b51` (Sepolia)
- **Features**: Native PYUSD support, vault deposits, yield tracking
- **Demo**: Complete deposit → optimize → withdraw flow

### Avail Nexus Integration
- **Cross-Chain**: Bridge PYUSD between Ethereum, Base, Optimism
- **Unified Balance**: Aggregate balances across chains
- **Intent Execution**: Automated cross-chain yield optimization
- **Demo**: Intent creation with cross-chain execution

### Lit Protocol Vincent
- **Agent Registration**: Non-custodial AI agent setup
- **Automation**: Off-chain triggers for yield optimization
- **Abilities**: Rebalancing, monitoring, execution
- **Demo**: Vincent agent registration and automation

### Pyth Network Feeds
- **Price Data**: Real-time USDC, ETH, PYUSD prices
- **Yield Optimization**: AI decisions based on live data
- **Confidence**: Price confidence intervals
- **Demo**: Live price feeds in dashboard

## 🚀 Deployment

### Vercel Deployment
```bash
# Build the application
pnpm build

# Deploy to Vercel
vercel --prod
```

### Environment Variables
```env
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
NEXT_PUBLIC_PYUSD_ADDRESS=0x6f7C932e7684666C9fd1d44527765433e01C5b51
NEXT_PUBLIC_VAULT_ADDRESS=0x1234567890123456789012345678901234567890
```

## 🎥 Demo Video Script

### 2-Minute Demo Flow
1. **0:00-0:15**: Home page, connect wallet, show PYUSD balance
2. **0:15-0:45**: Deposit PYUSD, show approval and deposit flow
3. **0:45-1:15**: Intent Builder, create strategy, show AI suggestions
4. **1:15-1:45**: Dashboard, show metrics, Vincent agent, Pyth feeds
5. **1:45-2:00**: Cross-chain demo, withdraw funds

### Screenshots for Documentation
- **Home Page**: Hero section with connect wallet
- **Deposit Flow**: PYUSD deposit modal with steps
- **Intent Builder**: Strategy configuration interface
- **Dashboard**: Real-time metrics and charts
- **Vincent Agent**: AI automation status
- **Pyth Feeds**: Live price data display

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Avail** for cross-chain infrastructure
- **Lit Protocol** for AI automation capabilities
- **PayPal** for PYUSD stablecoin
- **Pyth Network** for real-time price feeds
- **EthGlobal** for the hackathon platform

---

**Built with ❤️ for EthOnline 2024**

*Transform your DeFi experience with AI-powered yield optimization*

