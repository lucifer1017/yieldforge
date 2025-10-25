// Token configuration for YieldForge

export type TokenSymbol = 'PYUSD' | 'USDC';

export interface TokenConfig {
  symbol: TokenSymbol;
  name: string;
  address: `0x${string}`;
  vaultAddress: `0x${string}`;
  decimals: number;
  description: string;
  features: string[];
}

// Token addresses on Sepolia
export const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9" as const;
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;

// Vault addresses on Sepolia
export const PYUSD_VAULT_ADDRESS = "0x64314E8BABCBa5040939d4CcD26086E7C1bcC54c" as const;
export const USDC_VAULT_ADDRESS = "0x69F4377d6A7B6fd2263f9D26C1B2fb165D4B9735" as const;

export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  PYUSD: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    address: PYUSD_ADDRESS,
    vaultAddress: PYUSD_VAULT_ADDRESS,
    decimals: 6,
    description: "PayPal's USD stablecoin",
    features: ['Vault Deposits', 'AI Agent', 'Yield Optimization']
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: USDC_ADDRESS,
    vaultAddress: USDC_VAULT_ADDRESS,
    decimals: 6,
    description: 'Circle\'s USD stablecoin',
    features: ['Vault Deposits', 'AI Agent', 'Cross-Chain (Nexus)', 'Yield Optimization']
  }
};

export const DEFAULT_TOKEN: TokenSymbol = 'USDC';

// Helper functions
export function getTokenConfig(symbol: TokenSymbol): TokenConfig {
  return TOKENS[symbol];
}

export function getTokenAddress(symbol: TokenSymbol): `0x${string}` {
  return TOKENS[symbol].address;
}

export function getVaultAddress(symbol: TokenSymbol): `0x${string}` {
  return TOKENS[symbol].vaultAddress;
}

export function getAllTokens(): TokenConfig[] {
  return Object.values(TOKENS);
}


