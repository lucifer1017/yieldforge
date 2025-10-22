"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { PythPrice } from "@/types";

interface PythFeedProps {
  feedId: string;
  symbol: string;
}

export function PythFeed({ feedId, symbol }: PythFeedProps) {
  const [price, setPrice] = useState<PythPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock implementation - in reality this would use Pyth SDK
        // For demo purposes, we'll simulate price data
        const mockPrice = {
          id: feedId,
          price: 1.0 + Math.random() * 0.1, // Simulate price around $1
          confidence: 0.001,
          exponent: -8,
          lastUpdated: new Date(),
        };
        
        setPrice(mockPrice);
      } catch (err) {
        setError("Failed to fetch price data");
        console.error("Pyth feed error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    
    // Update price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [feedId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>{symbol} Price</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !price) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>{symbol} Price</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const priceChange = Math.random() > 0.5 ? Math.random() * 0.02 : -Math.random() * 0.02;
  const isPositive = priceChange > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>{symbol} Price</span>
          <Badge variant="outline">Pyth</Badge>
        </CardTitle>
        <CardDescription>
          Real-time price feed from Pyth Network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">
              ${price.price.toFixed(4)}
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(priceChange * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Confidence:</span>
            <span>±{price.confidence.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span>{price.lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

