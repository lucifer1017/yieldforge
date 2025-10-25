import { sepolia } from "viem/chains";
import type { Chain } from "viem";

export const supportedChains = [sepolia] as const;

export const sepoliaConfig = {
  chainId: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://ethereum-sepolia.publicnode.com"],
    },
    public: {
      http: ["https://ethereum-sepolia.publicnode.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
  testnet: true,
};

// Token addresses on Sepolia
export const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9" as const;
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;

// Deployed contract addresses
export const PYUSD_VAULT_ADDRESS = "0x64314E8BABCBa5040939d4CcD26086E7C1bcC54c" as const;
export const USDC_VAULT_ADDRESS = "0x69F4377d6A7B6fd2263f9D26C1B2fb165D4B9735" as const;
export const VAULT_ADDRESS = USDC_VAULT_ADDRESS; // Default to USDC vault
export const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as const;
export const BRIDGE_HOOK_ADDRESS = "0xf1EDe8B290ce69BbD16B3a3661242B856C581ffA" as const;

