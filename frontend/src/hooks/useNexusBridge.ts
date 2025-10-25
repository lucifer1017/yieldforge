"use client";

import { useState } from 'react';
import { encodeFunctionData, parseAbi } from 'viem';
import { useNexus } from '@/components/nexus/NexusProvider';
import { CHAIN_MAPPINGS, PROTOCOL_ADDRESSES } from '@/lib/nexus';
import type { TransferParams, TransferResult } from '@/lib/nexus';

// ABI for Aave supply function
const AAVE_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external'
]);

// ABI for Morpho supply function  
const MORPHO_ABI = parseAbi([
  'function supply(address market, uint256 assets, address onBehalfOf, bytes calldata data) external'
]);

// Supported tokens in Nexus SDK
type SupportedToken = 'USDC' | 'USDT' | 'DAI' | 'WETH' | 'ETH';

export function useNexusBridge() {
  const { sdk, isInitialized, isInitializing } = useNexus();
  const [isTransferring, setIsTransferring] = useState(false);

  /**
   * Transfer tokens across chains using Nexus SDK
   * Uses the transfer() method which automatically optimizes the route
   */
  const transfer = async (params: {
    token: SupportedToken;
    amount: number | string;
    chainId: number;
    recipient: `0x${string}`;
    sourceChains?: number[];
  }): Promise<TransferResult> => {
    if (!sdk || !isInitialized) {
      throw new Error('Nexus SDK not initialized');
    }

    // ⚠️ CRITICAL: Double-check we're on Sepolia before transferring
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        console.log('🔍 Current wallet chainId:', currentChainId);
        
        if (currentChainId !== 11155111) {
          throw new Error(`Wrong network! You are on Chain ID ${currentChainId}. Please switch to Sepolia Testnet (Chain ID 11155111) in your wallet before transferring.`);
        }
        console.log('✅ Confirmed on Sepolia before transfer');
      } catch (error: any) {
        if (error.message.includes('Wrong network')) {
          throw error;
        }
        console.warn('Could not verify network:', error);
      }
    }

    setIsTransferring(true);

    try {
      console.log('🚀 Starting Nexus transfer:', params);

      const result = await sdk.transfer({
        token: params.token,
        amount: params.amount,
        chainId: params.chainId,
        recipient: params.recipient,
        sourceChains: params.sourceChains
      } as TransferParams);

      console.log('✅ Transfer result:', result);
      setIsTransferring(false);
      return result;

    } catch (error) {
      console.error('❌ Transfer failed:', error);
      setIsTransferring(false);
      throw error;
    }
  };

  /**
   * Simulate a transfer to preview costs and optimization path
   */
  const simulateTransfer = async (params: {
    token: SupportedToken;
    amount: number | string;
    chainId: number;
    recipient: `0x${string}`;
    sourceChains?: number[];
  }) => {
    if (!sdk || !isInitialized) {
      throw new Error('Nexus SDK not initialized');
    }

    try {
      console.log('🔍 Simulating Nexus transfer:', params);

      const simulation = await sdk.simulateTransfer({
        token: params.token,
        amount: params.amount,
        chainId: params.chainId,
        recipient: params.recipient,
        sourceChains: params.sourceChains
      } as TransferParams);

      console.log('📊 Simulation result:', simulation);
      return simulation;

    } catch (error) {
      console.error('❌ Simulation failed:', error);
      throw error;
    }
  };

  /**
   * Generate execute calldata for cross-chain protocol interactions
   * This can be used with bridgeAndExecute flows
   */
  const generateExecuteCalldata = (
    protocol: 'aave' | 'morpho' | 'compound',
    targetChainId: number,
    amount: bigint,
    userAddress: `0x${string}`
  ): `0x${string}` => {
    const chainName = CHAIN_MAPPINGS[targetChainId as keyof typeof CHAIN_MAPPINGS];
    
    if (protocol === 'aave') {
      // Generate Aave supply calldata
      return encodeFunctionData({
        abi: AAVE_ABI,
        functionName: 'supply',
        args: [
          PROTOCOL_ADDRESSES.AAVE, // asset (USDC)
          amount,
          userAddress, // onBehalfOf
          0 // referralCode
        ]
      });
    } else if (protocol === 'morpho') {
      // Generate Morpho supply calldata
      return encodeFunctionData({
        abi: MORPHO_ABI,
        functionName: 'supply',
        args: [
          PROTOCOL_ADDRESSES.MORPHO, // market
          amount,
          userAddress, // onBehalfOf
          '0x' // data
        ]
      });
    }
    
    // Default fallback
    return '0x' as `0x${string}`;
  };

  return {
    transfer,
    simulateTransfer,
    generateExecuteCalldata,
    isReady: isInitialized,
    isInitializing,
    isTransferring
  };
}

