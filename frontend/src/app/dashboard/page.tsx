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
import { VincentAgent } from "@/components/lit/VincentAgent";
import { PythFeed } from "@/components/dashboard/PythFeed";
import { useState } from "react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Read vault data
  const { data: balance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getBalance",
    args: address ? [address] : undefined,
  });

  const { data: yieldEarned } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getYield",
    args: address ? [address] : undefined,
  });

  const { data: totalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalSupply",
  });

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

  const userBalance = balance ? Number(formatUnits(balance, 18)) : 0;
  const userYield = yieldEarned ? Number(formatUnits(yieldEarned, 18)) : 0;
  const totalValue = userBalance + userYield;

  // Mock data for demonstration
  const mockApyData = [
    { date: "2024-01-01", apy: 4.2 },
    { date: "2024-01-02", apy: 4.5 },
    { date: "2024-01-03", apy: 4.8 },
    { date: "2024-01-04", apy: 5.1 },
    { date: "2024-01-05", apy: 5.3 },
    { date: "2024-01-06", apy: 5.0 },
    { date: "2024-01-07", apy: 5.2 },
  ];

  const currentAPY = 5.2;
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
        <Button onClick={() => setShowWithdraw(true)}>
          Withdraw Funds
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6">
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
              +2.5% from last week
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
              {currentAPY}%
            </div>
            <p className="text-xs text-muted-foreground">
              +0.3% from yesterday
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
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* APY Chart */}
        <Card>
          <CardHeader>
            <CardTitle>APY Performance</CardTitle>
            <CardDescription>
              Historical yield performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApyChart data={mockApyData} />
          </CardContent>
        </Card>

        {/* Vincent Agent */}
        <VincentAgent />
      </div>

      {/* Pyth Price Feeds */}
      <div className="grid md:grid-cols-3 gap-6">
        <PythFeed feedId="usdc" symbol="USDC" />
        <PythFeed feedId="eth" symbol="ETH" />
        <PythFeed feedId="pyusd" symbol="PYUSD" />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest transactions and rebalancing events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                type: "rebalance",
                description: "Rebalanced to Aave USDC on Base",
                amount: "+0.3% APY",
                time: "2 hours ago",
                status: "success",
              },
              {
                type: "deposit",
                description: "Deposited 1000 PYUSD",
                amount: "1000 PYUSD",
                time: "1 day ago",
                status: "success",
              },
              {
                type: "yield",
                description: "Yield earned from Morpho",
                amount: "+$12.50",
                time: "3 days ago",
                status: "success",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === "success" ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{activity.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      <WithdrawModal 
        open={showWithdraw} 
        onOpenChange={setShowWithdraw}
        maxAmount={totalValue}
      />
    </div>
  );
}
