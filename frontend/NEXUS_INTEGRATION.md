# Avail Nexus SDK Integration

This document explains how the Avail Nexus SDK has been integrated into the YieldForge frontend application.

## Overview

The application now uses the official **@avail-project/nexus-core** package for cross-chain token transfers and operations. The mock implementation has been replaced with the real SDK.

## Packages Installed

- `@avail-project/nexus-core` v0.0.2 - Headless SDK for cross-chain operations
- `@avail-project/nexus-widgets` v0.0.6 - React components (available for future use)

## Architecture

### 1. Core SDK Utilities (`frontend/src/lib/nexus.ts`)

This file contains the core initialization and setup functions for the Nexus SDK:

#### `initializeNexusSDK(provider, network)`
- Initializes the NexusSDK instance
- Accepts an Ethereum provider (from wallet connector)
- Network can be 'testnet' or 'mainnet'

#### `setupNexusHooks(sdk, callbacks)`
- **MANDATORY** - Sets up required hooks for the SDK to function
- `setOnIntentHook` - Approves/denies transaction intents
- `setOnAllowanceHook` - Manages token allowances
- Currently auto-approves for demo purposes
- In production, these should show UI modals for user confirmation

#### `setupNexusEvents(sdk, callbacks)`
- **OPTIONAL** but recommended for better UX
- Listens to progress events during transfers
- Events include:
  - `EXPECTED_STEPS` - When operation starts
  - `STEP_COMPLETE` - When each step completes
  - `BRIDGE_EXECUTE_EXPECTED_STEPS` - Bridge & execute operations
  - `BRIDGE_EXECUTE_COMPLETED_STEPS` - Bridge & execute completion

### 2. React Context Provider (`frontend/src/components/nexus/NexusProvider.tsx`)

The `NexusProvider` wraps the entire application and manages SDK initialization:

**Features:**
- Automatically initializes SDK when wallet connects
- Sets up hooks and event listeners
- Provides SDK instance and state through React Context
- Tracks progress steps and completed steps
- Shows toast notifications for key events
- Cleans up event listeners on unmount

**Context State:**
```typescript
{
  sdk: NexusSDK | null,
  isInitialized: boolean,
  isInitializing: boolean,
  error: Error | null,
  progressSteps: ProgressStep[],
  completedSteps: ProgressStep[]
}
```

### 3. Custom Hook (`frontend/src/hooks/useNexusBridge.ts`)

The `useNexusBridge` hook provides methods to interact with the Nexus SDK:

#### `transfer(params)`
Main method for cross-chain token transfers:
```typescript
const result = await transfer({
  token: 'USDC',        // Supported: USDC, USDT, DAI, WETH, ETH
  amount: 100,          // Amount to transfer
  chainId: 42161,       // Destination chain ID
  recipient: '0x...',   // Recipient address
  sourceChains: []      // Optional: specify source chains
});
```

**Key Features:**
- Automatically optimizes the route
- Handles both direct transfers and chain abstraction
- Returns transaction hash and explorer URL on success

#### `simulateTransfer(params)`
Simulates a transfer to preview costs and optimization path:
```typescript
const simulation = await simulateTransfer({
  token: 'USDC',
  amount: 100,
  chainId: 42161,
  recipient: '0x...'
});
// Returns: { intent: { fees, ... }, ... }
```

#### `generateExecuteCalldata(protocol, chainId, amount, userAddress)`
Generates calldata for protocol interactions (Aave, Morpho, Compound).
Useful for future bridge-and-execute operations.

### 4. Integration in Pages

#### Intent Builder (`frontend/src/app/intent/page.tsx`)

Updated to use the real Nexus SDK:
```typescript
const { transfer, isReady, isTransferring } = useNexusBridge();

const result = await transfer({
  token: 'USDC',
  amount: 100,
  chainId: targetChainId,
  recipient: address as `0x${string}`
});

if (result.success) {
  // Handle success with transaction hash and explorer URL
}
```

## Supported Chains

Currently configured for testnet:

| Network | Chain ID | Nexus Name |
|---------|----------|------------|
| Ethereum Sepolia | 11155111 | ETHEREUM_SEPOLIA |
| Base Sepolia | 8453 | BASE_SEPOLIA |
| Optimism Sepolia | 10 | OPTIMISM_SEPOLIA |
| Arbitrum Sepolia | 42161 | ARBITRUM_SEPOLIA |

## Supported Tokens

The Nexus SDK supports:
- USDC
- USDT
- DAI
- WETH
- ETH

## Event Flow

1. **Wallet Connection**
   - User connects wallet via wagmi
   - Provider is extracted from connector

2. **SDK Initialization**
   - `NexusProvider` detects connection
   - Calls `initializeNexusSDK(provider, 'testnet')`
   - Sets up mandatory hooks
   - Configures event listeners

3. **Transfer Execution**
   - User triggers a transfer from the UI
   - `transfer()` method is called with parameters
   - SDK emits `EXPECTED_STEPS` event
   - User approves intent via hook (auto-approved in demo)
   - User approves allowances via hook (auto-approved in demo)
   - SDK processes the transfer
   - SDK emits `STEP_COMPLETE` events for each step
   - Transaction hash and explorer URL are returned

4. **Progress Tracking**
   - Event listeners update UI with progress
   - Toast notifications inform the user
   - Transaction can be viewed in block explorer

## Configuration

### Network Selection

To switch between testnet and mainnet, update the initialization in `NexusProvider.tsx`:

```typescript
const nexusSdk = await initializeNexusSDK(provider, 'mainnet'); // or 'testnet'
```

### Hook Customization

To add user approval UI instead of auto-approval, update the callbacks in `NexusProvider.tsx`:

```typescript
setupNexusHooks(nexusSdk, {
  onIntentApproval: async (intent) => {
    // Show modal with intent details
    // Return true to approve, false to deny
    const approved = await showIntentModal(intent);
    return approved;
  },
  onAllowanceApproval: async (sources) => {
    // Show modal with allowance details
    // Return 'min', 'max', or array of custom amounts
    const allowanceType = await showAllowanceModal(sources);
    return allowanceType;
  }
});
```

### Event Callbacks

Customize event handlers for your UI needs:

```typescript
setupNexusEvents(nexusSdk, {
  onExpectedSteps: (steps) => {
    // Update UI with expected steps
    console.log(`Transfer will take ${steps.length} steps`);
  },
  onStepComplete: (step) => {
    // Update progress bar, show notifications, etc.
    if (step.typeID === 'IS' && step.data.explorerURL) {
      // Transaction submitted
      showNotification('Transaction submitted!', step.data.explorerURL);
    }
  }
});
```

## Testing

To test the integration:

1. **Start the development server:**
   ```bash
   cd frontend
   pnpm dev
   ```

2. **Connect a wallet** with testnet funds

3. **Navigate to the Intent Builder** (`/intent`)

4. **Create a simple intent:**
   - Add a deposit step
   - Select a protocol (Aave/Morpho/Compound)
   - Select a target chain
   - Click "Execute Cross-Chain Intent"

5. **Monitor the console** for detailed logs:
   - `🚀 Initializing Nexus SDK...`
   - `✅ Nexus SDK initialized successfully`
   - `✅ Nexus hooks configured`
   - `✅ Nexus event listeners configured`
   - `🚀 Starting Nexus transfer:...`
   - `📊 Expected steps:...`
   - `✅ Step completed:...`
   - `🔗 Transaction hash:...`

6. **Check toast notifications** for real-time updates

## Important Notes

### Mandatory Hooks

The hooks setup is **MANDATORY**. Without them, the SDK will not progress through the transfer flow. The current implementation auto-approves everything for demo purposes.

### Browser Environment Only

The Nexus SDK requires:
- An injected wallet provider (MetaMask, WalletConnect, etc.)
- Client-side browser environment (won't work in SSR or Node.js)

### Network Support

The SDK is configured for testnet by default. Ensure you have:
- Testnet tokens (USDC on Sepolia, Base Sepolia, etc.)
- Testnet ETH for gas fees

### Error Handling

All transfer operations include comprehensive error handling:
- SDK initialization failures are caught and displayed
- Transfer errors are logged and shown to users
- Toast notifications provide feedback

## Future Enhancements

Potential improvements for production:

1. **User Approval Modals**
   - Create UI modals for intent approval
   - Create UI modals for allowance approval
   - Show detailed fee breakdowns

2. **Progress UI Component**
   - Visual progress bar showing steps
   - Step-by-step status indicators
   - Estimated time remaining

3. **Transaction History**
   - Store completed transfers
   - Link to block explorers
   - Filter by chain/token

4. **Advanced Features**
   - Use `bridgeAndExecute` for atomic operations
   - Implement custom token support
   - Add mainnet configuration

5. **Optimization**
   - Cache SDK instance
   - Implement retry logic
   - Add transaction queue

## Resources

- [Avail Nexus Documentation](https://docs.availproject.org/)
- [Nexus SDK GitHub](https://github.com/availproject/nexus)
- [Nexus Core API Reference](https://docs.availproject.org/nexus/avail-nexus-sdk/nexus-core/api-reference/)

## Support

For issues or questions:
- Check browser console for detailed logs
- Review the event flow in DevTools
- Consult the official Avail documentation
- Check the Nexus SDK GitHub issues

---

**Integration Status:** ✅ Complete

**Last Updated:** October 2025

**Version:** 1.0.0




