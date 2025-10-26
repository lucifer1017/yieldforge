import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDCVaultModule = buildModule("USDCVaultModule", (m) => {
  // USDC address on Sepolia testnet
  // Replace with actual USDC address on Sepolia
  const usdcAddress = m.getParameter("usdcAddress", "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");

  const usdcVault = m.contract("USDCVault", [
    "YieldForge USDC Vault",
    "yfUSDC",
    usdcAddress,
  ]);

  return { usdcVault };
});

export default USDCVaultModule;






