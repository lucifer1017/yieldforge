"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { DepositModal } from "@/components/pyusd/DepositModal";
import { useState } from "react";

export default function HomePage() {
  const { isConnected } = useAccount();
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            YieldForge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deposit PYUSD once, let AI hunt yields cross-chain. 
            Non-custodial DeFi automation with intelligent rebalancing.
          </p>
        </div>
        
        {isConnected ? (
          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={() => setShowDeposit(true)}
              className="text-lg px-8 py-6"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Deposit PYUSD & Start Earning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex justify-center gap-4">
              <Link href="/intent">
                <Button variant="outline" size="lg">
                  Build Intent
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Connect your wallet to get started
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card className="yield-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI-Powered</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Intelligent yield optimization across multiple protocols and chains. 
              AI agent automatically rebalances based on real-time APY data.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="yield-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Non-Custodial</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Your funds stay in your control. Smart contracts handle deposits 
              and withdrawals while maintaining full transparency.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="yield-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Cross-Chain</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Seamlessly bridge and optimize yields across Ethereum, Base, 
              Optimism, and more using Avail Nexus technology.
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto text-primary-foreground font-bold">
              1
            </div>
            <h3 className="font-semibold">Deposit PYUSD</h3>
            <p className="text-sm text-muted-foreground">
              Deposit your PYUSD stablecoin into our secure vault
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto text-primary-foreground font-bold">
              2
            </div>
            <h3 className="font-semibold">Set Intent</h3>
            <p className="text-sm text-muted-foreground">
              Define your yield strategy and risk preferences
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto text-primary-foreground font-bold">
              3
            </div>
            <h3 className="font-semibold">AI Optimizes</h3>
            <p className="text-sm text-muted-foreground">
              Our AI agent monitors and rebalances automatically
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto text-primary-foreground font-bold">
              4
            </div>
            <h3 className="font-semibold">Earn Yield</h3>
            <p className="text-sm text-muted-foreground">
              Withdraw your PYUSD plus accumulated yields anytime
            </p>
          </div>
        </div>
      </section>

      {/* Deposit Modal */}
      <DepositModal 
        open={showDeposit} 
        onOpenChange={setShowDeposit} 
      />
    </div>
  );
}

