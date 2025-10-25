"use client";

import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useAccount } from 'wagmi';
import { parseAbi, parseEventLogs } from 'viem';
import { BRIDGE_HOOK_ADDRESS } from '@/lib/chains';

// BridgeHook contract ABI for events
const BRIDGE_HOOK_ABI = parseAbi([
  'event BridgeInitiated(address indexed user, address indexed token, uint256 amount, uint256 toChainId, bytes executeData, bytes32 operationId)',
  'event BridgeExecuted(address indexed user, address indexed token, uint256 amount, uint256 toChainId, bytes32 operationId, uint256 timestamp)'
]);

export interface BridgeTransaction {
  hash: `0x${string}`;
  type: 'initiated' | 'executed';
  user: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  toChainId: bigint;
  timestamp: number;
  operationId?: `0x${string}`;
}

export function useBridgeTransactions() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  return useQuery({
    queryKey: ['bridgeTransactions', address],
    queryFn: async (): Promise<BridgeTransaction[]> => {
      if (!publicClient || !address) return [];

      try {
        // Get current block number and query last 10,000 blocks (stays well under 50k limit)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

        // Get BridgeInitiated events
        const initiatedLogs = await publicClient.getLogs({
          address: BRIDGE_HOOK_ADDRESS,
          event: BRIDGE_HOOK_ABI[0],
          fromBlock,
          toBlock: 'latest'
        });

        // Get BridgeExecuted events  
        const executedLogs = await publicClient.getLogs({
          address: BRIDGE_HOOK_ADDRESS,
          event: BRIDGE_HOOK_ABI[1],
          fromBlock,
          toBlock: 'latest'
        });

        const transactions: BridgeTransaction[] = [];

        // Process initiated events
        for (const log of initiatedLogs) {
          const parsed = parseEventLogs({
            abi: BRIDGE_HOOK_ABI,
            logs: [log]
          })[0];

          if (parsed.eventName === 'BridgeInitiated') {
            transactions.push({
              hash: log.transactionHash,
              type: 'initiated',
              user: parsed.args.user,
              token: parsed.args.token,
              amount: parsed.args.amount,
              toChainId: parsed.args.toChainId,
              timestamp: Number(log.blockNumber),
              operationId: parsed.args.operationId
            });
          }
        }

        // Process executed events
        for (const log of executedLogs) {
          const parsed = parseEventLogs({
            abi: BRIDGE_HOOK_ABI,
            logs: [log]
          })[0];

          if (parsed.eventName === 'BridgeExecuted') {
            transactions.push({
              hash: log.transactionHash,
              type: 'executed',
              user: parsed.args.user,
              token: parsed.args.token,
              amount: parsed.args.amount,
              toChainId: parsed.args.toChainId,
              timestamp: Number(parsed.args.timestamp),
              operationId: parsed.args.operationId
            });
          }
        }

        // Sort by timestamp (newest first)
        return transactions.sort((a, b) => b.timestamp - a.timestamp);

      } catch (error) {
        console.error('Failed to fetch bridge transactions:', error);
        return [];
      }
    },
    enabled: !!publicClient && !!address,
    refetchInterval: 10000 // Refetch every 10 seconds
  });
}



