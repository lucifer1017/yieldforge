"use client";

import { useState, useEffect } from 'react';

interface ProtocolAPY {
  protocol: string;
  apy: number;
  lastUpdate: number;
  isLive: boolean;
  priceInfo?: {
    price: string;
    conf: string;
  };
}

interface PythLiveAPYBannerProps {
  protocolAPYs: Record<string, ProtocolAPY>;
  isLoading: boolean;
  refreshPrices: () => void;
  selectedProtocol?: string;
}

export function PythLiveAPYBanner({ 
  protocolAPYs, 
  isLoading, 
  refreshPrices,
  selectedProtocol = ''
}: PythLiveAPYBannerProps) {
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const latestUpdate = Math.max(
        ...Object.values(protocolAPYs).map(p => p.lastUpdate)
      );
      if (latestUpdate > 0) {
        setSecondsSinceUpdate(Math.floor((Date.now() - latestUpdate) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [protocolAPYs]);

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 rounded-xl shadow-2xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            LIVE Market Data
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Real-time DeFi protocol rates powered by <span className="font-semibold">Pyth Network Oracle</span>
          </p>
        </div>
        <button
          onClick={refreshPrices}
          disabled={isLoading}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
          Refresh
        </button>
      </div>

      {/* Live APY Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(protocolAPYs).map(([key, data]) => {
          const isSelected = selectedProtocol.toLowerCase() === key;
          
          return (
            <div
              key={key}
              className={`
                relative overflow-hidden
                bg-white/10 backdrop-blur-lg 
                p-5 rounded-lg 
                border-2 transition-all duration-300
                ${isSelected 
                  ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/50' 
                  : 'border-white/20 hover:border-white/40'
                }
              `}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                    SELECTED
                  </span>
                </div>
              )}

              {/* Protocol Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-lg">{data.protocol}</h3>
                {data.isLive && (
                  <span className="flex items-center gap-1 text-xs text-green-300 font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>

              {/* APY Display */}
              {isLoading && data.apy === 0 ? (
                <div className="space-y-2">
                  <div className="h-10 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded animate-pulse w-2/3"></div>
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <div className="text-4xl font-bold text-white">
                      {data.apy.toFixed(2)}%
                    </div>
                    <div className="text-sm text-white/70 mt-1">
                      Annual Percentage Yield
                    </div>
                  </div>

                  {/* Price Info (from Pyth) */}
                  {data.priceInfo && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-xs text-white/60 space-y-1">
                        <div>Oracle Price: ${data.priceInfo.price}</div>
                        <div>Confidence: ±${data.priceInfo.conf}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer with update info */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span>⏱️ Updated {secondsSinceUpdate}s ago</span>
          <span>•</span>
          <span>🔄 Auto-refreshing every 5s</span>
        </div>
        <div>
          <a 
            href="https://pyth.network" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white/80 transition-colors underline"
          >
            Powered by Pyth Network
          </a>
        </div>
      </div>

      {/* Pyth Pull Oracle Info */}
      <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="text-xs text-white/70">
          <span className="font-semibold text-white">🔗 Pull Oracle Architecture:</span> 
          {' '}Fetching real-time prices from Pyth Hermes, using confidence intervals to calculate 
          dynamic APY estimates. Higher market volatility = higher yield potential.
        </div>
      </div>
    </div>
  );
}


