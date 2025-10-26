"use client";

import { useAccount, useReadContract } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, DollarSign, Activity, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatUnits } from "viem";
import { VAULT_ADDRESS } from "@/lib/chains";
import VAULT_ABI from "@/lib/abi/Vault.json";
import { ApyChart } from "@/components/dashboard/ApyChart";
import { WithdrawModal } from "@/components/pyusd/WithdrawModal";
import { PythFeed } from "@/components/dashboard/PythFeed";
import { UnifiedBalance } from "@/components/nexus/UnifiedBalance";
import { CrossChainSimulator } from "@/components/nexus/CrossChainSimulator";
import { usePythPrices } from "@/hooks/usePythPrices";
import { INTENT_MANAGER_ADDRESS } from "@/lib/chains";
import INTENT_MANAGER_ABI from "@/lib/abi/IntentManager.json";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  // Pyth Network real-time APY data
  const { protocolAPYs, isLoading: isPythLoading, refreshPrices } = usePythPrices();

  // Read vault data
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getBalance",
    args: address ? [address] : undefined,
  });

  const { data: yieldEarned, refetch: refetchYield } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getYield",
    args: address ? [address] : undefined,
  });

  const { data: totalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalAssets",
  });

  // Read user's active intents
  const { data: contractIntents, refetch: refetchIntents } = useReadContract({
    address: INTENT_MANAGER_ADDRESS,
    abi: INTENT_MANAGER_ABI,
    functionName: "getUserIntents",
    args: address ? [address] : undefined,
  });

  // Refresh data when component mounts
  useEffect(() => {
    if (address) {
      refetchBalance();
      refetchYield();
      refetchIntents();
    }
  }, [address, refetchBalance, refetchYield, refetchIntents]);

  if (!isConnected) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to view your dashboard
        </p>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const userBalance = balance ? Number(formatUnits(balance as bigint, 6)) : 0;
  const userYield = yieldEarned ? Number(formatUnits(yieldEarned as bigint, 6)) : 0;
  const totalValue = userBalance + userYield;
  
  // Calculate current weighted APY from Pyth data
  const calculateWeightedAPY = () => {
    const apys = Object.values(protocolAPYs).map(p => p.apy);
    if (apys.length === 0) return 0;
    return apys.reduce((sum, apy) => sum + apy, 0) / apys.length;
  };
  
  const currentAPY = calculateWeightedAPY();
  
  // Generate historical APY data from Pyth (simulated trending data for demo)
  const generateApyHistory = () => {
    const history = [];
    const today = new Date();
    const currentValue = currentAPY || 4.5;
    
    // Start from a lower value and trend towards current
    const startAPY = currentValue - 0.8; // Start 0.8% lower
    const step = 0.8 / 7; // Gradual increase over 7 days
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Calculate trending value with slight realistic fluctuation
      const trendValue = startAPY + (step * (6 - i));
      const microFluctuation = (Math.random() - 0.5) * 0.15; // ±0.075%
      const apy = Math.max(2.0, Math.min(8.0, trendValue + microFluctuation));
      
      history.push({
        date: date.toISOString().split('T')[0],
        apy: parseFloat(apy.toFixed(2))
      });
    }
    
    // Ensure last value matches current Pyth APY exactly
    history[history.length - 1].apy = parseFloat(currentValue.toFixed(2));
    
    return history;
  };
  
  const apyData = generateApyHistory();
  
  // Calculate active intents count (defensive)
  const userIntents = Array.isArray(contractIntents) ? (contractIntents as any[]) : [];
  const activeIntentsCount = userIntents.filter((intent: any) => intent?.isActive).length;
  
  // Debug logging
  console.log("📊 Dashboard Debug:", {
    address,
    balance: balance?.toString(),
    yieldEarned: yieldEarned?.toString(),
    userBalance,
    userYield,
    totalValue,
    currentAPY,
    activeIntents: activeIntentsCount,
    pythAPYs: protocolAPYs
  });
  const agentStatus = {
    isActive: true,
    lastRebalance: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    totalRebalances: 12,
    totalYield: userYield,
    currentAPY,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your yield optimization performance
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              refetchBalance();
              refetchYield();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowWithdraw(true)}>
            Withdraw Funds
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              USDC in vault + yield
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current APY</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPythLoading ? "..." : `${currentAPY.toFixed(2)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPythLoading ? "Loading Pyth data..." : "Live from Pyth Oracle"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yield Earned</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userYield.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total yield generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Intents</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeIntentsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeIntentsCount === 0 ? (
                <Link href="/intent" className="text-primary hover:underline">
                  Create your first intent →
                </Link>
              ) : (
                `${userIntents.length} total created`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* APY Chart */}
        <Card>
          <CardHeader>
            <CardTitle>APY Performance</CardTitle>
            <CardDescription>
              7-day trend ending at current Pyth APY ({currentAPY.toFixed(2)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPythLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading Pyth data...</div>
              </div>
            ) : (
              <>
                <ApyChart data={apyData} />
                <div className="text-xs text-muted-foreground text-center mt-2">
                  📈 Simulated historical trend based on live Pyth Network data
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cross-Chain Activity (Avail Nexus) */}
        <UnifiedBalance />

        {/* Automation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Intent Automation</span>
              <Badge variant={activeIntentsCount > 0 ? "default" : "secondary"}>
                {activeIntentsCount > 0 ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
            <CardDescription>
              User-defined intent-based yield optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeIntentsCount > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Active Intents</p>
                    <p className="text-2xl font-bold text-primary">
                      {activeIntentsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Created</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {userIntents.length}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Your intents are monitoring market conditions via <strong>Pyth Network</strong> oracles 
                    and can execute cross-chain via <strong>Avail Nexus</strong> when conditions are met.
                  </p>
                </div>

                <Link href="/intent">
                  <Button variant="outline" className="w-full" size="sm">
                    Manage Intents
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create an intent to automate your yield optimization strategy across multiple chains.
                </p>
                <Link href="/intent">
                  <Button className="w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    Create Your First Intent
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pyth Price Feeds */}
      <div className="grid md:grid-cols-3 gap-6">
        <PythFeed feedId="usdc" symbol="USDC" />
        <PythFeed feedId="eth" symbol="ETH" />
        <PythFeed feedId="pyusd" symbol="PYUSD" />
      </div>

      {/* Cross-Chain Simulator */}
      <CrossChainSimulator />

      {/* Withdraw Modal */}
      <WithdrawModal 
        open={showWithdraw} 
        onOpenChange={setShowWithdraw}
        maxAmount={totalValue}
        onWithdrawSuccess={() => {
          console.log('🔄 Refreshing dashboard data after withdrawal...');
          refetchBalance();
          refetchYield();
          refetchIntents();
        }}
      />
    </div>
  );
}
