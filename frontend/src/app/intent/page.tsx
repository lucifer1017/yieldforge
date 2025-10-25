"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Brain, Zap, AlertCircle, Play } from "lucide-react";
import Link from "next/link";
import { Intent, IntentStep, Guardrails } from "@/types";
import { toast } from "sonner";
import { INTENT_MANAGER_ADDRESS, VAULT_ADDRESS } from "@/lib/chains";
import INTENT_MANAGER_ABI from "@/lib/abi/IntentManager.json";
import VAULT_ABI from "@/lib/abi/Vault.json";
import { useNexusBridge } from "@/hooks/useNexusBridge";
import { formatUnits, parseUnits } from "viem";

export default function IntentPage() {
  const { isConnected, address } = useAccount();
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
  const [userIntents, setUserIntents] = useState<any[]>([]);
  const [intentAmount, setIntentAmount] = useState<string>("10"); // Amount to allocate for this intent

  // Read VAULT balance (not wallet balance!)
  const { data: vaultBalance, refetch: refetchBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getBalance",
    args: address ? [address] : undefined,
  });

  const vaultBalanceFormatted = vaultBalance 
    ? Number(formatUnits(vaultBalance as bigint, 6)) 
    : 0;

  // Read user's intents from contract
  const { data: contractIntents, refetch: refetchIntents } = useReadContract({
    address: INTENT_MANAGER_ADDRESS,
    abi: INTENT_MANAGER_ABI,
    functionName: "getUserIntents",
    args: address ? [address] : undefined,
  });

  // Contract write hook for submitting intent
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isSubmitting = isPending || isConfirming;

  // Nexus bridge for cross-chain execution
  const { transfer, isReady: isNexusReady, isTransferring } = useNexusBridge();
  const [executingIntentId, setExecutingIntentId] = useState<number | null>(null);

  // Show success toast when transaction confirms
  useEffect(() => {
    if (isSuccess && txHash) {
      toast.success('Intent submitted successfully!', {
        description: 'Your yield optimization intent is now active',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank')
        }
      });
      refetchBalance();
      refetchIntents();
    }
  }, [isSuccess, txHash, refetchBalance, refetchIntents]);

  // Update user intents when contract data changes
  useEffect(() => {
    if (contractIntents) {
      setUserIntents(contractIntents as any[]);
    }
  }, [contractIntents]);

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

  const executeIntent = async (intentIndex: number, contractIntent: any) => {
    if (!address || !isNexusReady) {
      toast.error("Nexus SDK not ready");
      return;
    }

    if (vaultBalanceFormatted === 0) {
      toast.error("No funds in vault to execute intent");
      return;
    }

    // Get stored amount for this intent
    const storedAmount = localStorage.getItem(`intent_amount_${address}_${intentIndex}`);
    const intentAllocatedAmount = storedAmount ? parseFloat(storedAmount) : 10; // Default to 10 if not found

    if (intentAllocatedAmount > vaultBalanceFormatted) {
      toast.error(`Insufficient vault balance. Intent requires ${intentAllocatedAmount} USDC but you only have ${vaultBalanceFormatted.toFixed(2)} USDC`);
      return;
    }

    setExecutingIntentId(intentIndex);

    try {
      const targetChainId = Number(contractIntent.targetChainId);
      const chainName = {
        11155111: 'Ethereum Sepolia',
        84532: 'Base Sepolia',
        11155420: 'Optimism Sepolia',
        421614: 'Arbitrum Sepolia'
      }[targetChainId] || 'Unknown Chain';

      console.log('🚀 Executing intent via Nexus:', {
        intentIndex,
        targetChainId,
        chainName,
        allocatedAmount: intentAllocatedAmount,
        vaultBalance: vaultBalanceFormatted,
        minApy: Number(contractIntent.minApy),
        recipient: address
      });

      // Execute cross-chain transfer with Nexus using the allocated amount
      const result = await transfer({
        token: 'USDC',
        amount: intentAllocatedAmount,
        chainId: targetChainId,
        recipient: address as `0x${string}`,
      });

      if (result.success) {
        toast.success('Intent executed successfully!', {
          description: `Cross-chain transfer completed to ${chainName}`,
          action: {
            label: 'View Transaction',
            onClick: () => window.open(result.explorerUrl, '_blank')
          }
        });
        setTimeout(() => {
          refetchBalance();
          refetchIntents();
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Intent execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Intent execution failed`, {
        description: errorMessage
      });
    } finally {
      setExecutingIntentId(null);
    }
  };

  const saveIntent = async () => {
    if (!intent.name || intent.steps.length === 0) {
      toast.error("Please provide a name and add at least one step");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Check if user has vault balance
    if (vaultBalanceFormatted === 0) {
      toast.error("No funds in vault. Please deposit USDC into the vault first.", {
        description: "Go to homepage to deposit funds"
      });
      return;
    }

    // Validate intent amount
    const amount = parseFloat(intentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount for this intent");
      return;
    }

    if (amount > vaultBalanceFormatted) {
      toast.error(`Insufficient vault balance. You have ${vaultBalanceFormatted.toFixed(2)} USDC but trying to allocate ${amount} USDC`);
      return;
    }

    try {
      // Get the first step for cross-chain execution
      const firstStep = intent.steps[0];
      if (!firstStep) {
        throw new Error("No steps configured");
      }

      // Map chain names to IDs (Sepolia testnets)
      const chainIdMap: Record<string, number> = {
        'ethereum': 11155111,  // Ethereum Sepolia
        'base': 84532,         // Base Sepolia
        'optimism': 11155420,  // Optimism Sepolia
        'arbitrum': 421614     // Arbitrum Sepolia
      };

      const targetChainId = chainIdMap[firstStep.chain];

      if (!targetChainId) {
        throw new Error(`Unsupported chain: ${firstStep.chain}`);
      }

      // Mock protocol addresses (in production, these would be real addresses)
      const protocolAddressMap: Record<string, `0x${string}`> = {
        'aave': '0x1234567890123456789012345678901234567890',
        'morpho': '0x2345678901234567890123456789012345678901',
        'compound': '0x3456789012345678901234567890123456789012',
        'uniswap': '0x4567890123456789012345678901234567890123'
      };

      const targetProtocol = protocolAddressMap[firstStep.protocol] || '0x0000000000000000000000000000000000000000';

      // Convert guardrails to contract format
      const minApyBps = Math.floor(intent.guardrails.minAPY * 100); // Convert % to basis points
      const slippageBps = Math.floor(intent.guardrails.maxSlippage * 10000); // Convert decimal to basis points
      const maxGasPriceGwei = BigInt(Math.floor(intent.guardrails.maxGasPrice * 1e9)); // Convert gwei to wei

      console.log('📝 Submitting intent to IntentManager:', {
        minApyBps,
        slippageBps,
        targetProtocol,
        targetChainId,
        maxGasPrice: maxGasPriceGwei.toString(),
        allocatedAmount: amount,
        vaultBalance: vaultBalanceFormatted
      });

      // Submit intent to IntentManager contract with explicit gas limit
      writeContract({
        address: INTENT_MANAGER_ADDRESS,
        abi: INTENT_MANAGER_ABI,
        functionName: 'submitIntent',
        args: [{
          minApy: BigInt(minApyBps),
          slippageBps: slippageBps,
          targetProtocol: targetProtocol,
          targetChainId: BigInt(targetChainId),
          maxGasPrice: maxGasPriceGwei,
          isActive: true,
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
          lastExecuted: BigInt(0)
        }],
        gas: BigInt(500000), // Explicit gas limit to prevent estimation issues
      });
      
      // Store amount in local storage for this intent (will use index after success)
      const tempIntentIndex = userIntents.length; // Next intent index
      localStorage.setItem(`intent_amount_${address}_${tempIntentIndex}`, intentAmount);
      
    } catch (error) {
      console.error("Intent submission failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Intent submission failed`, {
        description: errorMessage
      });
    }
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
              
              {/* Vault Balance Display */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border-2">
                  <div>
                    <p className="text-sm font-medium">Your Vault Balance</p>
                    <p className="text-xs text-muted-foreground">Total funds available</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{vaultBalanceFormatted.toFixed(2)} USDC</p>
                    {vaultBalanceFormatted === 0 ? (
                      <p className="text-xs text-destructive flex items-center gap-1 justify-end">
                        <AlertCircle className="h-3 w-3" />
                        No balance in vault
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Ready for intent
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Amount to Allocate for This Intent */}
                {vaultBalanceFormatted > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="intentAmount">Amount to Allocate for This Intent (USDC)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="intentAmount"
                        type="number"
                        placeholder="10"
                        value={intentAmount}
                        onChange={(e) => setIntentAmount(e.target.value)}
                        min="0"
                        max={vaultBalanceFormatted}
                        step="0.01"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setIntentAmount(vaultBalanceFormatted.toFixed(2))}
                        disabled={vaultBalanceFormatted === 0}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Specify how much USDC from your vault to use for this intent
                    </p>
                  </div>
                )}
                
                {vaultBalanceFormatted === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Tip: Deposit USDC into the vault from the homepage first
                  </p>
                )}
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

          {/* Submit Intent */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <Button
                onClick={saveIntent}
                className="w-full"
                size="lg"
                disabled={isSubmitting || vaultBalanceFormatted === 0 || intent.steps.length === 0 || !intent.name || !intentAmount || parseFloat(intentAmount) <= 0}
              >
                {isSubmitting ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Intent...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Submit Yield Intent
                  </>
                )}
              </Button>
              
              {/* Status messages */}
              {vaultBalanceFormatted === 0 && (
                <div className="flex items-center gap-2 text-xs text-destructive justify-center">
                  <AlertCircle className="h-3 w-3" />
                  <p>No vault balance. Deposit funds first.</p>
                </div>
              )}
              {vaultBalanceFormatted > 0 && intent.steps.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-orange-500 justify-center">
                  <AlertCircle className="h-3 w-3" />
                  <p>Add at least one strategy step</p>
                </div>
              )}
              {vaultBalanceFormatted > 0 && intent.steps.length > 0 && !intent.name && (
                <div className="flex items-center gap-2 text-xs text-orange-500 justify-center">
                  <AlertCircle className="h-3 w-3" />
                  <p>Provide an intent name</p>
                </div>
              )}
              {vaultBalanceFormatted > 0 && intent.steps.length > 0 && intent.name && intentAmount && parseFloat(intentAmount) > 0 && (
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p className="text-green-600 dark:text-green-400">✅ Ready to submit intent</p>
                  <p className="text-xs">Intent will optimize {intentAmount} USDC</p>
                  <p className="text-xs opacity-70">Target: {intent.steps[0]?.protocol} on {intent.steps[0]?.chain}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submitted Intents Section */}
      {userIntents && userIntents.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Submitted Intents</CardTitle>
            <CardDescription>
              Execute your intents to perform cross-chain yield optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userIntents.map((contractIntent, index) => {
                const targetChainId = Number(contractIntent.targetChainId);
                const chainName = {
                  11155111: 'Ethereum Sepolia',
                  84532: 'Base Sepolia',
                  11155420: 'Optimism Sepolia',
                  421614: 'Arbitrum Sepolia'
                }[targetChainId] || `Chain ${targetChainId}`;

                const minApy = Number(contractIntent.minApy) / 100; // Convert from basis points
                const slippage = Number(contractIntent.slippageBps) / 100;
                const isActive = contractIntent.isActive;
                const isExecuting = executingIntentId === index;
                
                // Get allocated amount for this intent
                const storedAmount = localStorage.getItem(`intent_amount_${address}_${index}`);
                const allocatedAmount = storedAmount ? parseFloat(storedAmount) : 0;

                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "secondary"}>
                          Intent #{index}
                        </Badge>
                        {!isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Allocated Amount:</span>
                          <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
                            {allocatedAmount > 0 ? `${allocatedAmount} USDC` : 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target Chain:</span>
                          <span className="ml-2 font-medium">{chainName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min APY:</span>
                          <span className="ml-2 font-medium">{minApy}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Slippage:</span>
                          <span className="ml-2 font-medium">{slippage}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isActive ? (
                        <Button
                          onClick={() => executeIntent(index, contractIntent)}
                          disabled={isExecuting || isTransferring || !isNexusReady || vaultBalanceFormatted === 0}
                          size="sm"
                        >
                          {isExecuting ? (
                            <>
                              <Zap className="mr-2 h-4 w-4 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Execute Cross-Chain
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Inactive
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!isNexusReady && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p>Nexus SDK initializing... Please wait to execute intents.</p>
              </div>
            )}
            {isNexusReady && vaultBalanceFormatted === 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>No vault balance. Deposit funds to execute intents.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

