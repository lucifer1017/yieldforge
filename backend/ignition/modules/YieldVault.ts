import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("YieldVaultModule", (m) => {
  // Use real PYUSD Sepolia address
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  
  // Deploy YieldVault with PYUSD address only
  const yieldVault = m.contract("YieldVault", [
    "YieldForge Vault", // name
    "YFV", // symbol  
    PYUSD_ADDRESS // pyusd_
  ]);
  
  return { yieldVault };
});
