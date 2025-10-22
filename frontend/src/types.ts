export interface Intent {
  id: string;
  name: string;
  description: string;
  steps: IntentStep[];
  guardrails: Guardrails;
  status: "draft" | "active" | "paused" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface IntentStep {
  id: string;
  type: "deposit" | "swap" | "stake" | "rebalance" | "withdraw";
  protocol: "aave" | "morpho" | "compound" | "uniswap";
  chain: "ethereum" | "base" | "optimism" | "arbitrum";
  amount?: number;
  token?: string;
  params?: Record<string, any>;
}

export interface Guardrails {
  maxSlippage: number; // 0.01 = 1%
  maxGasPrice: number; // in gwei
  minAPY: number; // minimum APY to trigger rebalance
  maxRisk: "low" | "medium" | "high";
  rebalanceThreshold: number; // APY difference to trigger rebalance
}

export interface YieldData {
  protocol: string;
  chain: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  lastUpdated: Date;
}

export interface Balance {
  token: string;
  amount: number;
  value: number;
  chain: string;
}

export interface AgentStatus {
  isActive: boolean;
  lastRebalance: Date | null;
  totalRebalances: number;
  totalYield: number;
  currentAPY: number;
}

export interface PythPrice {
  id: string;
  price: number;
  confidence: number;
  exponent: number;
  lastUpdated: Date;
}

