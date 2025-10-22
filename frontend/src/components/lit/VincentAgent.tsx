"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, Settings } from "lucide-react";
import { AgentStatus } from "@/types";

interface VincentAgentProps {
  intentId?: string;
}

export function VincentAgent({ intentId }: VincentAgentProps) {
  const { address } = useAccount();
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isActive: false,
    lastRebalance: null,
    totalRebalances: 0,
    totalYield: 0,
    currentAPY: 0,
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Mock Vincent App registration
  const registerVincentApp = async () => {
    if (!address) return;
    
    setIsRegistering(true);
    
    try {
      // In a real implementation, this would register with Lit Protocol Vincent
      // For demo purposes, we'll simulate the registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAgentStatus(prev => ({
        ...prev,
        isActive: true,
        lastRebalance: new Date(),
        totalRebalances: 1,
        currentAPY: 5.2,
      }));
      
      console.log("Vincent App registered successfully");
    } catch (error) {
      console.error("Failed to register Vincent App:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Mock ability execution
  const executeAbility = async (ability: string, params: any) => {
    try {
      // In a real implementation, this would execute the Lit Vincent ability
      console.log(`Executing ability: ${ability}`, params);
      
      // Simulate ability execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAgentStatus(prev => ({
        ...prev,
        lastRebalance: new Date(),
        totalRebalances: prev.totalRebalances + 1,
        currentAPY: prev.currentAPY + 0.1,
      }));
      
      return { success: true, txHash: "0x123..." };
    } catch (error) {
      console.error("Ability execution failed:", error);
      return { success: false, error: error.message };
    }
  };

  // Mock periodic rebalancing
  useEffect(() => {
    if (!agentStatus.isActive) return;

    const interval = setInterval(() => {
      // Simulate periodic checks and rebalancing
      const shouldRebalance = Math.random() > 0.7; // 30% chance
      
      if (shouldRebalance) {
        executeAbility("rebalance", {
          slippage: 0.01,
          maxGasPrice: 50,
        });
      }
    }, 30000); // Check every 30 seconds for demo

    return () => clearInterval(interval);
  }, [agentStatus.isActive]);

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Vincent Agent</span>
          </CardTitle>
          <CardDescription>
            Connect your wallet to enable AI automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Vincent Agent will monitor your yield strategies and automatically rebalance when better opportunities are found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Vincent Agent</span>
          <Badge variant={agentStatus.isActive ? "default" : "secondary"}>
            {agentStatus.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered yield optimization automation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!agentStatus.isActive ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Register your Vincent App to enable automated yield optimization across multiple protocols and chains.
            </p>
            <Button 
              onClick={registerVincentApp}
              disabled={isRegistering}
              className="w-full"
            >
              {isRegistering ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Register Vincent App
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Last Rebalance</p>
                <p className="text-sm text-muted-foreground">
                  {agentStatus.lastRebalance?.toLocaleTimeString() || "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Rebalances</p>
                <p className="text-sm text-muted-foreground">
                  {agentStatus.totalRebalances}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Current APY</p>
                <p className="text-sm font-bold text-green-600">
                  {agentStatus.currentAPY.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Yield</p>
                <p className="text-sm text-muted-foreground">
                  ${agentStatus.totalYield.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeAbility("rebalance", { slippage: 0.01 })}
              >
                <Activity className="mr-2 h-4 w-4" />
                Force Rebalance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAgentStatus(prev => ({ ...prev, isActive: false }))}
              >
                <Settings className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

