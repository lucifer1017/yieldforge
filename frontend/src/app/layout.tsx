"use client";

import { Inter } from "next/font/google";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { metaMask } from "wagmi/connectors";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { NexusProvider } from "@/components/nexus/NexusProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkChecker } from "@/components/wallet/NetworkChecker";
import { ThemeToggle } from "@/components/ThemeToggle";

import "./globals.css";
import { supportedChains } from "@/lib/chains";

const inter = Inter({ subsets: ["latin"] });

// ⚠️ TESTNET ONLY CONFIGURATION
const config = createConfig({
  chains: [sepolia], // ONLY Sepolia testnet
  connectors: [
    metaMask({
      dappMetadata: {
        name: "YieldForge",
        url: "https://yieldforge.app",
      },
    })
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <NexusProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
              <div className="min-h-screen bg-background">
                <NetworkChecker />
                <header className="border-b">
                  <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">
                              YF
                            </span>
                          </div>
                          <h1 className="text-2xl font-bold">YieldForge</h1>
                        </div>
                        <Navigation />
                      </div>
                      <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <ConnectButton />
                      </div>
                    </div>
                  </div>
                </header>
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
              </div>
              <Toaster />
              </ThemeProvider>
            </NexusProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
