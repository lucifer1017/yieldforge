"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TokenSelector } from "@/components/ui/token-selector";
import { TokenSymbol, getTokenConfig, DEFAULT_TOKEN } from "@/lib/tokens";
import PYUSD_ABI from "@/lib/abi/PYUSD.json";
import VAULT_ABI from "@/lib/abi/Vault.json";
import USDC_VAULT_ABI from "@/lib/abi/USDCVault.json";

interface FlexibleDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialToken?: TokenSymbol;
}

export function FlexibleDepositModal({ open, onOpenChange, initialToken = DEFAULT_TOKEN }: FlexibleDepositModalProps) {
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>(initialToken);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"approve" | "deposit" | "success">("approve");
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);

  // Get token config
  const tokenConfig = getTokenConfig(selectedToken);
  const tokenAddress = tokenConfig.address;
  const vaultAddress = tokenConfig.vaultAddress;
  const decimals = tokenConfig.decimals;

  // Select the appropriate vault ABI based on token
  const vaultAbi = selectedToken === 'USDC' ? USDC_VAULT_ABI : VAULT_ABI;

  // Read token balance and allowance
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: PYUSD_ABI, // Both USDC and PYUSD use standard ERC20 ABI
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: PYUSD_ABI,
    functionName: "allowance",
    args: address ? [address, vaultAddress] : undefined,
  });

  // Write contracts
  const { writeContract: writeApprove, isPending: isApproving, data: approveData, error: approveError } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositing, data: depositData, error: depositError } = useWriteContract();

  // Log errors from writeContract hooks
  useEffect(() => {
    if (approveError) {
      console.error("Approve contract error:", approveError);
      toast.error("Approval failed: " + approveError.message);
    }
  }, [approveError]);

  useEffect(() => {
    if (depositError) {
      console.error("Deposit contract error:", depositError);
      toast.error("Deposit failed: " + depositError.message);
    }
  }, [depositError]);

  // Update tx hashes when write contract succeeds
  useEffect(() => {
    if (approveData) {
      setApprovalTxHash(approveData);
    }
  }, [approveData]);

  useEffect(() => {
    if (depositData) {
      setDepositTxHash(depositData);
    }
  }, [depositData]);

  // Wait for transaction receipts
  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess, isError: isApprovalError } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}`,
  });

  const { isLoading: isDepositPending, isSuccess: isDepositSuccess, isError: isDepositError } = useWaitForTransactionReceipt({
    hash: depositTxHash as `0x${string}`,
  });

  // Handle approval success
  useEffect(() => {
    if (isApprovalSuccess && step === "approve") {
      console.log("Approval transaction confirmed!");
      const handleApprovalSuccess = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchAllowance();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refetchAllowance();
        setStep("deposit");
        toast.success("Approval successful!");
      };
      handleApprovalSuccess();
    }
  }, [isApprovalSuccess, step, refetchAllowance]);

  // Handle approval error
  useEffect(() => {
    if (isApprovalError) {
      console.error("Approval transaction failed");
      toast.error("Approval failed");
    }
  }, [isApprovalError]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositSuccess && step === "deposit" && depositTxHash) {
      console.log("Deposit transaction confirmed!");
      setStep("success");
      
      // Show persistent toast with Etherscan link
      toast.success("Deposit successful!", {
        description: `${amount} ${tokenConfig.symbol} deposited to vault`,
        duration: Infinity, // NEVER auto-dismiss
        action: {
          label: "View on Etherscan",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${depositTxHash}`, '_blank')
        },
      });
      
      // Close modal after 3 seconds (but toast stays)
      setTimeout(() => {
        onOpenChange(false);
        resetModal();
      }, 3000);
    }
  }, [isDepositSuccess, step, onOpenChange, depositTxHash, amount, tokenConfig.symbol]);

  // Handle deposit error
  useEffect(() => {
    if (isDepositError) {
      console.error("Deposit transaction failed");
      toast.error("Deposit failed");
    }
  }, [isDepositError]);

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      setTimeout(resetModal, 300);
    }
  }, [open]);

  const resetModal = () => {
    setAmount("");
    setStep("approve");
    setApprovalTxHash(null);
    setDepositTxHash(null);
  };

  const handleApprove = async () => {
    if (!amount || !address) return;
    
    const amountInWei = parseUnits(amount, decimals);
    
    console.log("Approving:", {
      tokenAddress,
      vaultAddress,
      amount,
      amountInWei: amountInWei.toString()
    });

    try {
      writeApprove({
        address: tokenAddress,
        abi: PYUSD_ABI,
        functionName: "approve",
        args: [vaultAddress, amountInWei],
      });
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve: " + (error as Error).message);
    }
  };

  const handleDeposit = async () => {
    if (!amount || !address) return;
    
    const amountInWei = parseUnits(amount, decimals);
    
    console.log("Depositing:", {
      vaultAddress,
      amount,
      amountInWei: amountInWei.toString(),
      receiver: address
    });

    try {
      writeDeposit({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "deposit",
        args: [amountInWei, address],
      });
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to deposit: " + (error as Error).message);
    }
  };

  const balanceFormatted = balance ? formatUnits(balance as bigint, decimals) : "0";
  const allowanceFormatted = allowance ? formatUnits(allowance as bigint, decimals) : "0";
  const amountInWei = amount ? parseUnits(amount, decimals) : 0n;
  const hasEnoughAllowance = allowance && amountInWei > 0n && (allowance as bigint) >= amountInWei;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deposit to Vault</DialogTitle>
          <DialogDescription>
            Deposit {tokenConfig.name} to start earning yield
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Token Selector */}
          <div className="space-y-2">
            <Label>Select Token</Label>
            <TokenSelector
              value={selectedToken}
              onValueChange={(token) => {
                setSelectedToken(token);
                setAmount("");
                resetModal();
              }}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Balance: {parseFloat(balanceFormatted).toFixed(2)} {tokenConfig.symbol}</span>
              <span>Decimals: {decimals}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setAmount(balanceFormatted)}
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${step === "approve" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "approve" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="text-sm font-medium">Approve</span>
            </div>
            <div className="flex-1 h-px bg-border mx-4" />
            <div className={`flex items-center space-x-2 ${step === "deposit" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "deposit" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="text-sm font-medium">Deposit</span>
            </div>
            <div className="flex-1 h-px bg-border mx-4" />
            <div className={`flex items-center space-x-2 ${step === "success" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "success" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Done</span>
            </div>
          </div>

          {/* Current Step Content */}
          {step === "approve" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 1: Approve {tokenConfig.symbol}</CardTitle>
                <CardDescription>
                  Allow the vault to spend your {tokenConfig.symbol}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasEnoughAllowance ? (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sufficient allowance detected</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Current allowance: {parseFloat(allowanceFormatted).toFixed(2)} {tokenConfig.symbol}
                  </div>
                )}
                <Button
                  onClick={hasEnoughAllowance ? () => setStep("deposit") : handleApprove}
                  disabled={!amount || isApproving || isApprovalPending}
                  className="w-full"
                >
                  {isApproving || isApprovalPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isApproving ? "Approving..." : "Waiting for confirmation..."}
                    </>
                  ) : hasEnoughAllowance ? (
                    "Continue to Deposit"
                  ) : (
                    "Approve"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "deposit" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 2: Deposit {tokenConfig.symbol}</CardTitle>
                <CardDescription>
                  Deposit your {tokenConfig.symbol} into the vault
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{amount} {tokenConfig.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares to receive:</span>
                    <span className="font-medium">~{amount} yfTokens</span>
                  </div>
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || isDepositPending}
                  className="w-full"
                >
                  {isDepositing || isDepositPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isDepositing ? "Depositing..." : "Waiting for confirmation..."}
                    </>
                  ) : (
                    "Deposit"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Deposit Successful!</span>
                </CardTitle>
                <CardDescription>
                  Your {tokenConfig.symbol} has been deposited into the vault
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposited:</span>
                    <span className="font-medium">{amount} {tokenConfig.symbol}</span>
                  </div>
                  {depositTxHash && (
                    <div className="pt-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${depositTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        View on Etherscan →
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

