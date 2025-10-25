# Avail Nexus SDK - Quick Start Guide

## 🚀 Getting Started

The Avail Nexus SDK is now fully integrated into YieldForge. Follow these steps to start using it.

## Prerequisites

1. **Wallet with Testnet Funds**
   - MetaMask or compatible wallet
   - Sepolia ETH for gas
   - Testnet USDC (optional, for testing)

2. **Development Environment**
   - Node.js 20+
   - pnpm package manager

## Installation (Already Done ✅)

The following packages are already installed:
```bash
pnpm add @avail-project/nexus-core @avail-project/nexus-widgets
```

## How It Works

### 1. Automatic Initialization

The SDK initializes automatically when you connect your wallet:

```
User Connects Wallet → NexusProvider Detects Connection → SDK Initializes → Ready to Use
```

**Look for these console logs:**
```
✅ Nexus SDK initialized successfully
✅ Nexus hooks configured
✅ Nexus event listeners configured
✅ Nexus SDK fully initialized and ready!
```

### 2. Using the SDK

#### In Any Component:

```typescript
import { useNexusBridge } from '@/hooks/useNexusBridge';

function MyComponent() {
  const { transfer, isReady, isTransferring } = useNexusBridge();

  const handleTransfer = async () => {
    if (!isReady) {
      console.log('Nexus SDK not ready yet');
      return;
    }

    const result = await transfer({
      token: 'USDC',              // Token to transfer
      amount: 100,                // Amount (100 USDC)
      chainId: 42161,             // Destination: Arbitrum Sepolia
      recipient: '0x...',         // Your address or recipient
      sourceChains: [11155111]    // Optional: use only Sepolia
    });

    if (result.success) {
      console.log('Transfer successful!');
      console.log('TX Hash:', result.transactionHash);
      console.log('Explorer:', result.explorerUrl);
    } else {
      console.error('Transfer failed:', result.error);
    }
  };

  return (
    <button 
      onClick={handleTransfer}
      disabled={!isReady || isTransferring}
    >
      {isTransferring ? 'Transferring...' : 'Transfer USDC'}
    </button>
  );
}
```

### 3. Testing the Integration

#### Option A: Use the Intent Builder

1. Start the dev server:
   ```bash
   cd frontend
   pnpm dev
   ```

2. Open http://localhost:3000

3. Connect your wallet

4. Navigate to **Intent Builder** (`/intent`)

5. Create a simple intent:
   - Name: "Test Transfer"
   - Add a deposit step
   - Select any protocol (Aave/Morpho)
   - Select a target chain (Base/Optimism/Arbitrum)
   - Click "Execute Cross-Chain Intent"

6. Watch the console and toast notifications!

#### Option B: Direct Transfer

Create a test component:

```typescript
// components/TestTransfer.tsx
"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useNexusBridge } from '@/hooks/useNexusBridge';
import { toast } from 'sonner';

export function TestTransfer() {
  const { address } = useAccount();
  const { transfer, isReady } = useNexusBridge();
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!address) {
      toast.error('Please connect wallet');
      return;
    }

    setLoading(true);
    try {
      const result = await transfer({
        token: 'USDC',
        amount: 10, // Transfer 10 USDC
        chainId: 8453, // Base Sepolia
        recipient: address
      });

      if (result.success) {
        toast.success('Transfer successful!', {
          description: result.transactionHash,
          action: {
            label: 'View',
            onClick: () => window.open(result.explorerUrl, '_blank')
          }
        });
      }
    } catch (error) {
      toast.error('Transfer failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleTest} disabled={!isReady || loading}>
        {loading ? 'Transferring...' : 'Test Transfer'}
      </button>
      {!isReady && <p>SDK not ready - connect wallet first</p>}
    </div>
  );
}
```

## Configuration

### Supported Chains (Testnet)

| Chain | Chain ID | Use Case |
|-------|----------|----------|
| Ethereum Sepolia | 11155111 | Source/Destination |
| Base Sepolia | 8453 | Destination |
| Optimism Sepolia | 10 | Destination |
| Arbitrum Sepolia | 42161 | Destination |

### Supported Tokens

- USDC ✅
- USDT ✅
- DAI ✅
- WETH ✅
- ETH ✅

## Understanding the Transfer Flow

### Step 1: Intent Creation
```
SDK analyzes your transfer request
Determines optimal route (direct or cross-chain)
Calculates fees
```

### Step 2: Approval (Auto-approved in demo)
```
Hook calls: onIntentApproval
  → You see intent details
  → You approve/deny
Hook calls: onAllowanceApproval
  → You set token spending limits
  → You approve 'min', 'max', or custom amount
```

### Step 3: Execution
```
SDK emits EXPECTED_STEPS event
  → Shows how many steps will execute
SDK processes transfer
  → Emits STEP_COMPLETE for each step
  → Updates progress in UI
Transaction completes
  → Returns transaction hash & explorer URL
```

## Event Tracking

The SDK emits events you can track:

```typescript
// Already set up in NexusProvider
onExpectedSteps: (steps) => {
  console.log(`Transfer will take ${steps.length} steps`);
}

onStepComplete: (step) => {
  console.log(`Step ${step.typeID} completed`);
  if (step.typeID === 'IS') {
    console.log('Transaction hash:', step.data.transactionHash);
  }
}
```

## Troubleshooting

### SDK Not Initializing?

**Check:**
1. Is wallet connected? Look for "⏳ Waiting for wallet connection..."
2. Check console for errors
3. Verify provider is available: `connector.getProvider()`

### Transfer Failing?

**Check:**
1. Do you have testnet funds?
2. Is the destination chain correct?
3. Is the token supported?
4. Check console logs for specific error

### No Progress Updates?

**Check:**
1. Event listeners are set up (should see console logs)
2. Hooks are configured (mandatory)
3. Toast notifications are enabled

## Console Logs Guide

Look for these logs during a transfer:

```
🚀 Starting Nexus transfer: {...}
📊 Expected steps: ['CS', 'TS', 'IS']
🔔 Intent approval requested: {...}
✅ Intent approved by user
🔔 Allowance approval requested: [...]
✅ Allowance approved: max
✅ Step completed: CS {...}
✅ Step completed: TS {...}
✅ Step completed: IS {...}
🔗 Transaction hash: 0x...
🔗 Explorer URL: https://...
✅ Transfer result: { success: true, ... }
```

## Next Steps

1. **Test Basic Transfer**
   - Use the Intent Builder
   - Try different chains
   - Monitor console logs

2. **Simulate Before Transfer**
   ```typescript
   const simulation = await simulateTransfer({
     token: 'USDC',
     amount: 100,
     chainId: 8453,
     recipient: address
   });
   console.log('Estimated fees:', simulation.intent.fees);
   ```

3. **Add Custom UI**
   - Create approval modals
   - Add progress indicators
   - Show transaction history

4. **Explore Advanced Features**
   - Use `sourceChains` to control which chains to use
   - Implement bridge-and-execute for atomic operations
   - Add custom event handlers

## Resources

- 📚 Full Integration Docs: `frontend/NEXUS_INTEGRATION.md`
- 🌐 Avail Nexus Docs: https://docs.availproject.org/
- 💬 Get Help: Check console logs & toast notifications

---

**Ready to go!** 🎉

Start the dev server and connect your wallet to begin testing.

```bash
cd frontend
pnpm dev
```

Then visit http://localhost:3000 and connect your wallet!




