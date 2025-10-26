// Avail Nexus SDK integration
import { 
  NexusSDK, 
  NEXUS_EVENTS, 
  ProgressStep,
  TransferParams,
  TransferResult
} from '@avail-project/nexus-core';
import type { NexusNetwork } from '@avail-project/nexus-core';

// Type exports for use throughout the app
export type { TransferParams, TransferResult, ProgressStep };
export { NEXUS_EVENTS };

// Chain ID mappings (CORRECTED for Sepolia testnets)
export const CHAIN_MAPPINGS = {
  84532: 'BASE_SEPOLIA',        // Base Sepolia ✓
  11155420: 'OPTIMISM_SEPOLIA', // Optimism Sepolia ✓
  421614: 'ARBITRUM_SEPOLIA',   // Arbitrum Sepolia ✓
  11155111: 'ETHEREUM_SEPOLIA'  // Ethereum Sepolia ✓
} as const;

// Protocol addresses for demo
export const PROTOCOL_ADDRESSES = {
  AAVE: '0x1234567890123456789012345678901234567890',
  MORPHO: '0x2345678901234567890123456789012345678901',
  COMPOUND: '0x3456789012345678901234567890123456789012'
} as const;

/**
 * Initialize and configure the Nexus SDK
 * @param provider - The Ethereum provider (window.ethereum or from wallet connector)
 * @param network - 'testnet' or 'mainnet'
 */
export async function initializeNexusSDK(
  provider: any,
  network: NexusNetwork = 'testnet'
): Promise<NexusSDK> {
  try {
    console.log('🌉 Creating Nexus SDK instance for cross-chain bridging...');
    // Initialize SDK
    const sdk = new NexusSDK({ network });
    
    console.log('🔗 Connecting Nexus SDK to wallet provider...');
    
    // Initialize with provider (required)
    await sdk.initialize(provider);
    
    console.log('✅ Nexus SDK initialized successfully!');
    console.log('🌉 Cross-chain bridging is now ready!');
    console.log('📊 Supported chains: Base, Optimism, Arbitrum');
    return sdk;
  } catch (error) {
    console.error('❌ Failed to initialize Nexus SDK:', error);
    throw error;
  }
}

/**
 * Set up mandatory hooks for the Nexus SDK
 * These hooks are REQUIRED for the SDK to function properly
 */
export function setupNexusHooks(
  sdk: NexusSDK,
  callbacks?: {
    onIntentApproval?: (intent: any) => Promise<boolean>;
    onAllowanceApproval?: (sources: any[]) => Promise<'min' | 'max' | string[]>;
  }
) {
  // Intent approval hook - MANDATORY
  // This hook is called when the SDK needs approval for a transaction intent
  sdk.setOnIntentHook(({ intent, allow, deny, refresh }) => {
    console.log('🔔 Intent approval requested:', intent);
    
    // If custom approval callback is provided, use it
    if (callbacks?.onIntentApproval) {
      callbacks.onIntentApproval(intent)
        .then(approved => {
          if (approved) {
            console.log('✅ Intent approved by user');
            allow();
          } else {
            console.log('❌ Intent denied by user');
            deny();
          }
        })
        .catch(error => {
          console.error('Intent approval error:', error);
          deny();
        });
    } else {
      // Auto-approve for demo purposes
      // In production, you should show a UI for user confirmation
      console.log('✅ Intent auto-approved (demo mode)');
      allow();
      
      // Optionally refresh quotes periodically
      // setInterval(() => refresh(), 5000);
    }
  });

  // Allowance approval hook - MANDATORY
  // This hook is called when the SDK needs token allowance approval
  sdk.setOnAllowanceHook(({ allow, deny, sources }) => {
    console.log('🔔 Allowance approval requested:', sources);
    
    // If custom approval callback is provided, use it
    if (callbacks?.onAllowanceApproval) {
      callbacks.onAllowanceApproval(sources)
        .then(allowanceType => {
          console.log('✅ Allowance approved:', allowanceType);
          allow(Array.isArray(allowanceType) ? allowanceType : [allowanceType]);
        })
        .catch(error => {
          console.error('Allowance approval error:', error);
          deny();
        });
    } else {
      // Auto-approve with 'max' for demo purposes
      // In production, you should show a UI for user confirmation
      console.log('✅ Allowance auto-approved (demo mode)');
      allow(['max']);
    }
  });
  
  console.log('✅ Nexus hooks configured');
}

/**
 * Set up event listeners for progress tracking
 * Events are optional but recommended for better UX
 */
export function setupNexusEvents(
  sdk: NexusSDK,
  callbacks?: {
    onExpectedSteps?: (steps: ProgressStep[]) => void;
    onStepComplete?: (step: ProgressStep) => void;
    onBridgeExecuteExpectedSteps?: (steps: ProgressStep[]) => void;
    onBridgeExecuteCompletedSteps?: (step: ProgressStep) => void;
  }
) {
  try {
    // Transfer & Bridge Progress (optimized operations)
    sdk.nexusEvents.on(
      NEXUS_EVENTS.EXPECTED_STEPS,
      (steps: ProgressStep[]) => {
        console.log('📊 Expected steps:', steps.map((s) => s.typeID));
        callbacks?.onExpectedSteps?.(steps);
      }
    );

    sdk.nexusEvents.on(
      NEXUS_EVENTS.STEP_COMPLETE,
      (step: ProgressStep) => {
        console.log('✅ Step completed:', step.typeID, step.data);
        
        // Log transaction hash if available
        if (step.typeID === 'IS' && step.data && typeof step.data === 'object' && 'explorerURL' in step.data) {
          console.log('🔗 Transaction hash:', (step.data as any).transactionHash);
          console.log('🔗 Explorer URL:', (step.data as any).explorerURL);
        }
        
        callbacks?.onStepComplete?.(step);
      }
    );

    // Bridge & Execute Progress
    sdk.nexusEvents.on(
      NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS,
      (steps: ProgressStep[]) => {
        console.log('📊 Bridge & Execute expected steps:', steps.map((s) => s.typeID));
        callbacks?.onBridgeExecuteExpectedSteps?.(steps);
      }
    );

    sdk.nexusEvents.on(
      NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS,
      (step: ProgressStep) => {
        console.log('✅ Bridge & Execute step completed:', step.typeID, step.data);
        
        if (step.typeID === 'IS' && step.data && typeof step.data === 'object' && 'explorerURL' in step.data) {
          console.log('🔗 View transaction:', (step.data as any).explorerURL);
        }
        
        callbacks?.onBridgeExecuteCompletedSteps?.(step);
      }
    );

    console.log('✅ Nexus event listeners configured');
  } catch (error) {
    console.warn('⚠️ Nexus event listeners setup had issues:', error);
  }

  // Return cleanup function (no-op for now since SDK doesn't provide proper cleanup)
  return () => {
    console.log('🧹 Nexus event listeners cleanup called');
  };
}

