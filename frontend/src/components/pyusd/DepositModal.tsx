"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"approve" | "deposit" | "success">("approve");
  const [txHash, setTxHash] = useState<string | null>(null);

  // Read PYUSD balance and allowance
  const { data: balance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: PYUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: allowance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: PYUSD_ABI,
    functionName: "allowance",
    args: address && amount ? [address, VAULT_ADDRESS] : undefined,
  });

  // Write contracts
  const { writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositing } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApprovalPending } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    onSuccess: () => {
      setStep("deposit");
      toast.success("Approval successful!");
    },
  });

  const { isLoading: isDepositPending } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    onSuccess: () => {
      setStep("success");
      toast.success("Deposit successful!");
    },
  });

  const handleApprove = async () => {
    if (!amount || !address) return;

    try {
      const amountWei = parseUnits(amount, 18);
      const hash = await writeApprove({
        address: PYUSD_ADDRESS,
        abi: PYUSD_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amountWei],
      });
      setTxHash(hash);
    } catch (error) {
      toast.error("Approval failed");
      console.error(error);
    }
  };

  const handleDeposit = async () => {
    if (!amount || !address) return;

    try {
      const amountWei = parseUnits(amount, 18);
      const hash = await writeDeposit({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amountWei],
      });
      setTxHash(hash);
    } catch (error) {
      toast.error("Deposit failed");
      console.error(error);
    }
  };

  const handleClose = () => {
    setAmount("");
    setStep("approve");
    setTxHash(null);
    onOpenChange(false);
  };

  const amountWei = amount ? parseUnits(amount, 18) : 0n;
  const needsApproval = allowance ? allowance < amountWei : true;
  const hasBalance = balance ? balance >= amountWei : false;

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
                {balance ? formatUnits(balance, 18) : "0"} PYUSD
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Deposit</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={step !== "approve"}
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
                disabled={!amount || !hasBalance || isApproving || isApprovalPending}
                className="flex-1"
              >
                {isApproving || isApprovalPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve PYUSD"
                )}
              </Button>
            )}

            {step === "deposit" && (
              <Button
                onClick={handleDeposit}
                disabled={isDepositing || isDepositPending}
                className="flex-1"
              >
                {isDepositing || isDepositPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  "Deposit to Vault"
                )}
              </Button>
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

