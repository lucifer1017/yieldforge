"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Copy, Check, AlertCircle } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { sepolia } from "viem/chains";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCorrectNetwork = chainId === sepolia.id;
  
  const getNetworkBadge = () => {
    if (!isConnected) return null;
    
    if (isCorrectNetwork) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          Sepolia
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
        <AlertCircle className="h-3 w-3 mr-1" />
        Wrong Network
      </Badge>
    );
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {getNetworkBadge()}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {formatAddress(address)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-6 w-6"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => disconnect()}
                className="h-6 w-6 text-destructive hover:text-destructive"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          ⚠️ IMPORTANT: Switch to Sepolia Testnet in MetaMask BEFORE connecting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Before connecting:</strong> Open MetaMask and switch to <strong>Sepolia Testnet</strong>. This app only works on Sepolia!
          </p>
        </div>
        <div className="space-y-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => connect({ connector, chainId: sepolia.id })}
              disabled={isPending}
              className="w-full justify-start"
              variant="outline"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {connector.name}
              {isPending && " (Connecting...)"}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
