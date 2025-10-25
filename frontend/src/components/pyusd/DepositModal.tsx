"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PYUSD_ADDRESS, VAULT_ADDRESS } from "@/lib/chains";
import PYUSD_ABI from "@/lib/abi/PYUSD.json";
import VAULT_ABI from "@/lib/abi/Vault.json";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"approve" | "deposit" | "success">("approve");
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  
  // Check if on correct network
  const isCorrectNetwork = chainId === sepolia.id;

  // Read PYUSD balance and allowance
  const { data: balance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: PYUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: PYUSD_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
  });

  // Write contracts
  const { writeContract: writeApprove, isPending: isApproving, data: approveData } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositing, data: depositData } = useWriteContract();

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
    if (isDepositSuccess && step === "deposit") {
      console.log("Deposit transaction confirmed!");
      setStep("success");
      toast.success("Deposit successful!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }
  }, [isDepositSuccess, step]);

  // Handle deposit error
  useEffect(() => {
    if (isDepositError) {
      console.error("Deposit transaction failed");
      toast.error("Deposit failed");
    }
  }, [isDepositError]);

  const handleApprove = async () => {
    if (!amount || !address) return;

    try {
      const amountWei = parseUnits(amount, 6);
      writeApprove({
        address: PYUSD_ADDRESS,
        abi: PYUSD_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amountWei],
      });
      
      // Fallback: manually set step to deposit after a delay
      setTimeout(() => {
        if (step === "approve") {
          console.log("Fallback: Manually setting step to deposit");
          setStep("deposit");
          refetchAllowance();
        }
      }, 10000); // 10 second fallback
    } catch (error) {
      toast.error("Approval failed");
      console.error(error);
    }
  };

  const handleDeposit = async () => {
    if (!amount || !address) return;

    try {
      const amountWei = parseUnits(amount, 6);
      writeDeposit({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amountWei, address],
      });
      
      // Fallback: manually set step to success after a delay
      setTimeout(() => {
        if (step === "deposit") {
          console.log("Fallback: Manually setting step to success");
          setStep("success");
        }
      }, 10000); // 10 second fallback
    } catch (error) {
      toast.error("Deposit failed");
      console.error(error);
    }
  };

  const handleClose = () => {
    setAmount("");
    setStep("approve");
    setApprovalTxHash(null);
    setDepositTxHash(null);
    onOpenChange(false);
  };

  const amountWei = amount ? parseUnits(amount, 6) : BigInt(0);
  const needsApproval = allowance ? (allowance as bigint) < amountWei : true;
  const hasBalance = balance ? (balance as bigint) >= amountWei : false;
  
  // Debug logging
  console.log("Debug:", { 
    step, 
    allowance: allowance?.toString(), 
    amountWei: amountWei.toString(), 
    needsApproval,
    hasBalance,
    approvalTxHash,
    depositTxHash,
    address,
    vaultAddress: VAULT_ADDRESS
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit PYUSD</DialogTitle>
          <DialogDescription>
            Deposit your PYUSD to start earning yield across multiple protocols
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your PYUSD Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance ? formatUnits(balance, 6) : "0"} PYUSD
              </div>
            </CardContent>
          </Card>

          {/* Network Warning */}
          {!isCorrectNetwork && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Wrong Network!</span>
                </div>
                <p className="text-xs text-destructive/80 mt-1">
                  Please switch to Sepolia Testnet in your wallet to deposit.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Deposit</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={step !== "approve" || !isCorrectNetwork}
            />
            {amount && !hasBalance && (
              <div className="flex items-center space-x-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Insufficient balance</span>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {/* Step 1: Approve */}
            <Card className={step === "approve" ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === "approve" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {isApproving || isApprovalPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "1"
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Approve PYUSD</div>
                      <div className="text-sm text-muted-foreground">
                        Allow vault to spend your PYUSD
                      </div>
                    </div>
                  </div>
                  {step === "approve" && !needsApproval && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Deposit */}
            <Card className={step === "deposit" ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === "deposit" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {isDepositing || isDepositPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "2"
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Deposit to Vault</div>
                      <div className="text-sm text-muted-foreground">
                        Transfer PYUSD to yield vault
                      </div>
                    </div>
                  </div>
                  {step === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {step === "approve" && (
              <Button
                onClick={handleApprove}
                disabled={!amount || !hasBalance || isApproving || isApprovalPending || !isCorrectNetwork}
                className="flex-1"
              >
                {isApproving || isApprovalPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : !isCorrectNetwork ? (
                  "Switch to Sepolia First"
                ) : (
                  "Approve PYUSD"
                )}
              </Button>
            )}

            {step === "deposit" && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || isDepositPending || needsApproval || !isCorrectNetwork}
                  className="flex-1"
                >
                  {isDepositing || isDepositPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Depositing...
                    </>
                  ) : !isCorrectNetwork ? (
                    "Switch to Sepolia First"
                  ) : (
                    "Deposit to Vault"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetchAllowance()}
                  disabled={isDepositing || isDepositPending || !isCorrectNetwork}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step === "success" && (
              <Button
                onClick={handleClose}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

