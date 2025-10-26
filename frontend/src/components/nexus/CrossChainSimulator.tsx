"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Clock, CheckCircle2 } from "lucide-react";

interface SimulationStep {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

const CHAINS = [
  { id: 'sepolia', name: 'Ethereum Sepolia', color: 'bg-blue-500' },
  { id: 'base', name: 'Base', color: 'bg-indigo-500' },
  { id: 'optimism', name: 'Optimism', color: 'bg-red-500' },
  { id: 'arbitrum', name: 'Arbitrum', color: 'bg-cyan-500' },
];

export function CrossChainSimulator() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState(CHAINS[0]);
  const [selectedTo, setSelectedTo] = useState(CHAINS[1]);
  const [steps, setSteps] = useState<SimulationStep[]>([
    { id: 1, label: 'User submits intent on Ethereum', status: 'pending' },
    { id: 2, label: 'Avail Nexus processes cross-chain request', status: 'pending' },
    { id: 3, label: 'Bridge contract locks USDC', status: 'pending' },
    { id: 4, label: 'Nexus validates on Avail DA layer', status: 'pending' },
    { id: 5, label: 'Target chain receives & executes', status: 'pending' },
    { id: 6, label: 'Yield optimization begins', status: 'pending' },
  ]);

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    // Simulate each step with delay
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx < i ? 'completed' : idx === i ? 'active' : 'pending'
      })));
    }

    // Mark all complete
    await new Promise(resolve => setTimeout(resolve, 500));
    setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
    setIsSimulating(false);
  };

  const swapChains = () => {
    setSelectedFrom(selectedTo);
    setSelectedTo(selectedFrom);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🌉 Cross-Chain Flow Simulator</CardTitle>
        <CardDescription>
          Interactive demo of how Avail Nexus enables seamless cross-chain intents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chain Selection */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Chain</label>
            <select 
              className="w-full p-2 border rounded-lg bg-background"
              value={selectedFrom.id}
              onChange={(e) => setSelectedFrom(CHAINS.find(c => c.id === e.target.value) || CHAINS[0])}
              disabled={isSimulating}
            >
              {CHAINS.map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={swapChains}
              disabled={isSimulating}
              className="rounded-full"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Chain</label>
            <select 
              className="w-full p-2 border rounded-lg bg-background"
              value={selectedTo.id}
              onChange={(e) => setSelectedTo(CHAINS.find(c => c.id === e.target.value) || CHAINS[1])}
              disabled={isSimulating}
            >
              {CHAINS.filter(c => c.id !== selectedFrom.id).map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Flow */}
        <div className="flex items-center justify-center gap-4 p-6 bg-muted/30 rounded-lg">
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 ${selectedFrom.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
              {selectedFrom.name.charAt(0)}
            </div>
            <p className="text-xs font-medium mt-2">{selectedFrom.name}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
              <Zap className="h-5 w-5 text-purple-500" />
              <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded"></div>
            </div>
            <Badge variant="outline" className="text-xs">
              Avail Nexus
            </Badge>
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 ${selectedTo.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
              {selectedTo.name.charAt(0)}
            </div>
            <p className="text-xs font-medium mt-2">{selectedTo.name}</p>
          </div>
        </div>

        {/* Simulation Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                step.status === 'active' 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : step.status === 'completed'
                  ? 'border-green-500/50 bg-green-50 dark:bg-green-950'
                  : 'border-muted bg-muted/20'
              }`}
            >
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : step.status === 'active' ? (
                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  step.status === 'pending' ? 'text-muted-foreground' : ''
                }`}>
                  {step.label}
                </p>
              </div>

              {step.status === 'active' && (
                <Badge variant="outline" className="animate-pulse">
                  Processing...
                </Badge>
              )}
              {step.status === 'completed' && (
                <Badge className="bg-green-500">
                  ✓ Done
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Button 
          onClick={runSimulation}
          disabled={isSimulating}
          className="w-full"
          size="lg"
        >
          {isSimulating ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Simulating Cross-Chain Flow...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Run Simulation
            </>
          )}
        </Button>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          💡 This demonstrates how Avail Nexus enables trustless cross-chain intent execution. 
          In production, this happens seamlessly when you execute cross-chain intents!
        </div>
      </CardContent>
    </Card>
  );
}


