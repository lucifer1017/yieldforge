"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "viem/chains";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const REQUIRED_CHAIN_ID = sepolia.id; // 11155111
const REQUIRED_CHAIN_NAME = "Sepolia Testnet";

export function NetworkChecker() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain, isPending } = useSwitchChain();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show banner only once when wrong network is detected
  useEffect(() => {
    if (mounted && isConnected && chainId !== REQUIRED_CHAIN_ID && !shownRef.current) {
      // Delay slightly to ensure all hooks are stable
      const timer = setTimeout(() => {
        setVisible(true);
        shownRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    } else if (chainId === REQUIRED_CHAIN_ID) {
      // Reset when switching to correct network
      setVisible(false);
      setDismissed(false);
      shownRef.current = false;
    }
  }, [mounted, isConnected, chainId]);

  if (!mounted || !isConnected || !visible || dismissed) {
    return null;
  }

  const isWrongNetwork = chainId !== REQUIRED_CHAIN_ID;
  
  if (!isWrongNetwork) {
    return null;
  }

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: REQUIRED_CHAIN_ID });
    }
  };

  const getNetworkName = (id: number): string => {
    const networkNames: Record<number, string> = {
      1: "Ethereum Mainnet",
      5: "Goerli Testnet",
      11155111: "Sepolia Testnet",
      137: "Polygon Mainnet",
      80001: "Polygon Mumbai",
      8453: "Base Mainnet",
      84532: "Base Sepolia",
      10: "Optimism Mainnet",
      11155420: "Optimism Sepolia",
      42161: "Arbitrum One",
      421614: "Arbitrum Sepolia",
    };
    return networkNames[id] || `Chain ID ${id}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card className="border-2 border-destructive bg-destructive/10 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-destructive mb-1">
                Wrong Network Detected
              </h3>
              <p className="text-sm text-muted-foreground">
                You're connected to <span className="font-medium">{getNetworkName(chainId)}</span>.
                This app only works on <span className="font-medium">{REQUIRED_CHAIN_NAME}</span>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ All transactions will fail unless you switch to Sepolia testnet.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={handleSwitchNetwork}
              disabled={isPending}
              size="sm"
              variant="destructive"
            >
              {isPending ? "Switching..." : `Switch to ${REQUIRED_CHAIN_NAME}`}
            </Button>
            <Button
              onClick={() => setDismissed(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

