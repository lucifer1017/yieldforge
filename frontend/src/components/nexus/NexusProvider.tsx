"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useConnectorClient, useAccount } from 'wagmi';
import { NexusSDK } from '@avail-project/nexus-core';
import { 
  initializeNexusSDK, 
  setupNexusHooks, 
  setupNexusEvents,
  ProgressStep 
} from '@/lib/nexus';
import { toast } from 'sonner';

interface NexusContextType {
  sdk: NexusSDK | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  progressSteps: ProgressStep[];
  completedSteps: ProgressStep[];
}

export const NexusContext = createContext<NexusContextType>({
  sdk: null,
  isInitialized: false,
  isInitializing: false,
  error: null,
  progressSteps: [],
  completedSteps: []
});

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const connectorClient = useConnectorClient();
  const { address, isConnected, connector } = useAccount();
  const [sdk, setSdk] = useState<NexusSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<ProgressStep[]>([]);

  // Initialize SDK when connector is available
  useEffect(() => {
    let cleanupEvents: (() => void) | undefined;

    const initSDK = async () => {
      if (!connector || !isConnected || !address) {
        console.log('⏳ Waiting for wallet connection...');
        return;
      }

      if (isInitialized || isInitializing) {
        console.log('⏩ Nexus SDK already initialized or initializing');
        return;
      }

      setIsInitializing(true);
      setError(null);

      try {
        console.log('🚀 Initializing Nexus SDK...');
        
        // Get provider from connector or use window.ethereum
        const provider = connector.getProvider ? await connector.getProvider() : (window as any).ethereum;
        
        // ⚠️ CRITICAL: Verify provider is on Sepolia BEFORE initializing SDK
        if (provider && provider.request) {
          try {
            const chainIdHex = await provider.request({ method: 'eth_chainId' });
            const providerChainId = parseInt(chainIdHex, 16);
            console.log('🔍 Provider chainId:', providerChainId);
            
            // If provider is NOT on Sepolia (11155111), BLOCK initialization completely
            if (providerChainId !== 11155111) {
              const error = new Error(`⚠️ WRONG NETWORK DETECTED!\n\nYou are on Chain ID ${providerChainId}.\nNexus SDK requires Sepolia Testnet (Chain ID 11155111).\n\nPlease switch your MetaMask to Sepolia Testnet before connecting.`);
              setError(error);
              setIsInitializing(false);
              
              // Show persistent error toast
              toast.error('Cannot Initialize Nexus', {
                description: 'You must be on Sepolia Testnet. Switch in MetaMask and reconnect.',
                duration: 10000,
              });
              
              console.error('❌ BLOCKED: Cannot initialize Nexus SDK on wrong network');
              console.error(`❌ Current network: Chain ID ${providerChainId}`);
              console.error('❌ Required network: Sepolia Testnet (Chain ID 11155111)');
              return; // STOP HERE - do not proceed to sdk.initialize()
            }
            console.log('✅ Provider confirmed on Sepolia (11155111)');
          } catch (err) {
            console.error('Failed to check provider network:', err);
            setIsInitializing(false);
            return; // STOP on error
          }
        } else {
          console.error('❌ Provider not available or does not support eth_chainId');
          setIsInitializing(false);
          return; // STOP if no provider
        }
        
        // ✅ ONLY reach here if on Sepolia (11155111)
        console.log('✅ Network check passed - initializing Nexus SDK on Sepolia');
        
        // Initialize SDK with testnet
        const nexusSdk = await initializeNexusSDK(provider, 'testnet');
        
        // Set up mandatory hooks
        setupNexusHooks(nexusSdk, {
          onIntentApproval: async (intent) => {
            // Auto-approve for now, but you can add a UI modal here
            console.log('Intent approval:', intent);
            toast.info('Cross-chain intent approved');
            return true;
          },
          onAllowanceApproval: async (sources) => {
            // Auto-approve with max for now
            console.log('Allowance approval:', sources);
            toast.info('Token allowance approved');
            return 'max';
          }
        });

        // Set up event listeners
        cleanupEvents = setupNexusEvents(nexusSdk, {
          onExpectedSteps: (steps) => {
            setProgressSteps(steps);
            toast.info(`Starting ${steps.length} step operation`);
          },
          onStepComplete: (step) => {
            setCompletedSteps(prev => [...prev, step]);
            
            if (step.typeID === 'IS' && step.data && 'explorerURL' in step.data) {
              const explorerURL = step.data.explorerURL as string;
              if (explorerURL) {
                toast.success('Transaction submitted!', {
                  description: 'View in explorer',
                  action: {
                    label: 'View',
                    onClick: () => window.open(explorerURL, '_blank')
                  }
                });
              }
            }
          },
          onBridgeExecuteExpectedSteps: (steps) => {
            setProgressSteps(steps);
            toast.info(`Bridge & Execute: ${steps.length} steps`);
          },
          onBridgeExecuteCompletedSteps: (step) => {
            setCompletedSteps(prev => [...prev, step]);
          }
        });

        setSdk(nexusSdk);
        setIsInitialized(true);
        console.log('✅ Nexus SDK fully initialized and ready!');
        toast.success('Nexus SDK connected');

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('❌ Failed to initialize Nexus SDK:', error);
        setError(error);
        toast.error('Failed to initialize Nexus SDK');
      } finally {
        setIsInitializing(false);
      }
    };

    initSDK();

    // Cleanup on unmount or when connector changes
    return () => {
      if (cleanupEvents) {
        cleanupEvents();
      }
    };
  }, [connector, isConnected, address, isInitialized, isInitializing]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setSdk(null);
      setIsInitialized(false);
      setError(null);
      setProgressSteps([]);
      setCompletedSteps([]);
      console.log('🔌 Wallet disconnected, Nexus SDK reset');
    }
  }, [isConnected]);

  const contextValue: NexusContextType = {
    sdk,
    isInitialized,
    isInitializing,
    error,
    progressSteps,
    completedSteps
  };

  return (
    <NexusContext.Provider value={contextValue}>
      {children}
    </NexusContext.Provider>
  );
}

export function useNexus() {
  const context = useContext(NexusContext);
  return context;
}