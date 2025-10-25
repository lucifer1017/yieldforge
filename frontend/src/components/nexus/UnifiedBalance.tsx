"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import { useBridgeTransactions } from "@/hooks/useBridgeTransactions";
import { CHAIN_MAPPINGS } from "@/lib/nexus";
import { formatUnits } from "viem";

export function UnifiedBalance() {
  const { address } = useAccount();
  const { data: bridgeTxs, isLoading } = useBridgeTransactions();

  // Calculate unified balance across chains
  const calculateUnifiedBalance = () => {
    if (!bridgeTxs) return { total: 0, byChain: {} };

    const balances: Record<string, number> = {};
    let total = 0;

    for (const tx of bridgeTxs) {
      const chainName = CHAIN_MAPPINGS[Number(tx.toChainId) as keyof typeof CHAIN_MAPPINGS] || 'Unknown';
      
      if (tx.type === 'initiated') {
        // Subtract from source chain (Sepolia)
        balances['ETHEREUM_SEPOLIA'] = (balances['ETHEREUM_SEPOLIA'] || 0) - Number(formatUnits(tx.amount, 6));
      } else if (tx.type === 'executed') {
        // Add to destination chain
        balances[chainName] = (balances[chainName] || 0) + Number(formatUnits(tx.amount, 6));
      }
    }

    // Calculate total
    total = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

    return { total, byChain: balances };
  };

  const { total, byChain } = calculateUnifiedBalance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unified Balance</CardTitle>
          <CardDescription>Loading cross-chain balances...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified Balance</CardTitle>
        <CardDescription>
          Your PYUSD balance across all chains via Avail Nexus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">
            ${total.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            Total across all chains
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">By Chain</h4>
          {Object.entries(byChain).map(([chain, balance]) => (
            <div key={chain} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{chain}</Badge>
                <span className="text-sm">
                  {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {bridgeTxs && bridgeTxs.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Based on {bridgeTxs.length} bridge transaction{bridgeTxs.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}




