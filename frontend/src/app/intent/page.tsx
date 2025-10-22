"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Brain, Zap } from "lucide-react";
import Link from "next/link";
import { Intent, IntentStep, Guardrails } from "@/types";
import { toast } from "sonner";

export default function IntentPage() {
  const { isConnected } = useAccount();
  const [intent, setIntent] = useState<Intent>({
    id: "",
    name: "",
    description: "",
    steps: [],
    guardrails: {
      maxSlippage: 0.01,
      maxGasPrice: 50,
      minAPY: 3.0,
      maxRisk: "medium",
      rebalanceThreshold: 0.5,
    },
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Intent Builder</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to build yield intents
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

  const addStep = (type: IntentStep["type"]) => {
    const newStep: IntentStep = {
      id: Date.now().toString(),
      type,
      protocol: "aave",
      chain: "ethereum",
      amount: 0,
    };
    setIntent(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const removeStep = (stepId: string) => {
    setIntent(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId),
    }));
  };

  const updateStep = (stepId: string, updates: Partial<IntentStep>) => {
    setIntent(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ),
    }));
  };

  const updateGuardrails = (updates: Partial<Guardrails>) => {
    setIntent(prev => ({
      ...prev,
      guardrails: { ...prev.guardrails, ...updates },
    }));
  };

  const getAISuggestion = () => {
    const suggestions = [
      "For risk-averse users: Focus on Aave stablecoin pools on Ethereum mainnet with 1% max slippage.",
      "High yield seekers: Consider Morpho Blue on Base with weekly rebalancing when APY difference > 0.3%.",
      "Balanced approach: Split between Aave and Morpho across Ethereum and Base with 0.5% rebalance threshold.",
      "Conservative strategy: Aave USDC lending only, rebalance monthly, max 0.5% slippage.",
    ];
    
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setAiSuggestion(suggestion);
    toast.success("AI suggestion generated!");
  };

  const saveIntent = () => {
    if (!intent.name || intent.steps.length === 0) {
      toast.error("Please provide a name and add at least one step");
      return;
    }

    // In a real app, this would save to local storage or backend
    toast.success("Intent saved successfully!");
    console.log("Saved intent:", intent);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Intent Builder</h1>
          <p className="text-muted-foreground">
            Design your yield optimization strategy
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Intent Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Intent Details</CardTitle>
              <CardDescription>
                Configure your yield optimization strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Intent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Conservative Stablecoin Strategy"
                  value={intent.name}
                  onChange={(e) => setIntent(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe your strategy..."
                  value={intent.description}
                  onChange={(e) => setIntent(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Steps</CardTitle>
              <CardDescription>
                Define the sequence of operations for your yield strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {intent.steps.map((step, index) => (
                <Card key={step.id} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium capitalize">{step.type}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Protocol</Label>
                        <Select
                          value={step.protocol}
                          onValueChange={(value) => updateStep(step.id, { protocol: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aave">Aave</SelectItem>
                            <SelectItem value="morpho">Morpho</SelectItem>
                            <SelectItem value="compound">Compound</SelectItem>
                            <SelectItem value="uniswap">Uniswap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Chain</Label>
                        <Select
                          value={step.chain}
                          onValueChange={(value) => updateStep(step.id, { chain: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ethereum">Ethereum</SelectItem>
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="optimism">Optimism</SelectItem>
                            <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => addStep("deposit")}
                  className="h-20"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Deposit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addStep("stake")}
                  className="h-20"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stake
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addStep("swap")}
                  className="h-20"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Swap
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addStep("rebalance")}
                  className="h-20"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rebalance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guardrails & AI */}
        <div className="space-y-6">
          {/* Guardrails */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Guardrails</CardTitle>
              <CardDescription>
                Set limits to protect your funds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Max Slippage: {intent.guardrails.maxSlippage * 100}%</Label>
                <Slider
                  value={[intent.guardrails.maxSlippage * 100]}
                  onValueChange={([value]) => updateGuardrails({ maxSlippage: value / 100 })}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Max Gas Price: {intent.guardrails.maxGasPrice} gwei</Label>
                <Slider
                  value={[intent.guardrails.maxGasPrice]}
                  onValueChange={([value]) => updateGuardrails({ maxGasPrice: value })}
                  max={200}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Min APY: {intent.guardrails.minAPY}%</Label>
                <Slider
                  value={[intent.guardrails.minAPY]}
                  onValueChange={([value]) => updateGuardrails({ minAPY: value })}
                  max={20}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Risk Level</Label>
                <Select
                  value={intent.guardrails.maxRisk}
                  onValueChange={(value) => updateGuardrails({ maxRisk: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Suggestions</span>
              </CardTitle>
              <CardDescription>
                Get intelligent recommendations for your strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={getAISuggestion}
                variant="outline"
                className="w-full"
              >
                <Zap className="mr-2 h-4 w-4" />
                Generate AI Suggestion
              </Button>
              
              {aiSuggestion && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{aiSuggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Intent */}
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={saveIntent}
                className="w-full"
                size="lg"
              >
                Save Intent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

