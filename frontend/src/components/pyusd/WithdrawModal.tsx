"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { VAULT_ADDRESS } from "@/lib/chains";
import VAULT_ABI from "@/lib/abi/Vault.json";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxAmount: number;
}

export function WithdrawModal({ open, onOpenChange, maxAmount }: WithdrawModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContract } = useWriteContract();

  const { isLoading: isWithdrawPending } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    onSuccess: () => {
      setIsWithdrawing(false);
      toast.success("Withdrawal successful!");
      setAmount("");
      onOpenChange(false);
    },
    onError: () => {
      setIsWithdrawing(false);
      toast.error("Withdrawal failed");
    },
  });

  const handleWithdraw = async () => {
    if (!amount || !address) return;

    try {
      setIsWithdrawing(true);
      const amountWei = parseUnits(amount, 6);
      const hash = await writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [amountWei],
      });
      setTxHash(hash);
    } catch (error) {
      setIsWithdrawing(false);
      toast.error("Withdrawal failed");
      console.error(error);
    }
  };

  const handleClose = () => {
    setAmount("");
    setIsWithdrawing(false);
    setTxHash(null);
    onOpenChange(false);
  };

  const amountWei = amount ? parseUnits(amount, 6) : 0n;
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw PYUSD</DialogTitle>
          <DialogDescription>
            Withdraw your PYUSD and earned yields from the vault
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available to Withdraw</span>
                <span className="text-lg font-bold">{maxAmount.toFixed(2)} PYUSD</span>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isWithdrawing || isWithdrawPending}
            />
            {amount && parseFloat(amount) > maxAmount && (
              <div className="flex items-center space-x-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Amount exceeds available balance</span>
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((maxAmount * 0.25).toFixed(2))}
              disabled={isWithdrawing || isWithdrawPending}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((maxAmount * 0.5).toFixed(2))}
              disabled={isWithdrawing || isWithdrawPending}
            >
              50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount(maxAmount.toFixed(2))}
              disabled={isWithdrawing || isWithdrawPending}
            >
              Max
            </Button>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleWithdraw}
            disabled={!isValidAmount || isWithdrawing || isWithdrawPending}
            className="w-full"
          >
            {isWithdrawing || isWithdrawPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              "Withdraw PYUSD"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

