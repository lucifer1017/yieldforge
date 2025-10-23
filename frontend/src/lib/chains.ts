import { sepolia } from "viem/chains";

export const supportedChains = [sepolia];

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

// PYUSD contract address on Sepolia
export const PYUSD_ADDRESS = "0x6f7C932e7684666C9fd1d44527765433e01C5b51" as const;

// Deployed contract addresses
export const VAULT_ADDRESS = "0x64314E8BABCBa5040939d4CcD26086E7C1bcC54c" as const;
export const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as const;
export const BRIDGE_HOOK_ADDRESS = "0xf1EDe8B290ce69BbD16B3a3661242B856C581ffA" as const;

