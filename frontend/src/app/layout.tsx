"use client";

import { Inter } from "next/font/google";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { injected } from "wagmi/connectors";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { NexusProvider } from "@/components/nexus/NexusProvider";
import { Navigation } from "@/components/Navigation";

import "./globals.css";
import { supportedChains } from "@/lib/chains";

const inter = Inter({ subsets: ["latin"] });

const config = createConfig({
  chains: supportedChains,
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

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
                      <ConnectButton />
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
