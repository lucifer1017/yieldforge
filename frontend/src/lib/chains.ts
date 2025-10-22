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

// Mock vault address (replace with actual deployed contract)
export const VAULT_ADDRESS = "0x1234567890123456789012345678901234567890" as const;

