import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeploySequenceModule", (m) => {
  // Step 1: Deploy BridgeHook (no dependencies)
  const bridgeHook = m.contract("BridgeHook");
  
  // Step 2: Deploy YieldVault (needs PYUSD address only)
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const yieldVault = m.contract("YieldVault", [
    "YieldForge Vault", // name
    "YFV", // symbol  
    PYUSD_ADDRESS // pyusd_
  ]);
  
  // Step 3: Deploy IntentManager (needs YieldVault address)
  const intentManager = m.contract("IntentManager", [
    yieldVault
  ]);
  
  return { 
    bridgeHook, 
    yieldVault, 
    intentManager 
  };
});








