import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IntentManagerModule", (m) => {
  // NOTE: This module requires YieldVault to be deployed first
  // Using the actual deployed YieldVault address from previous deployment
  const VAULT_ADDRESS = "0x64314E8BABCBa5040939d4CcD26086E7C1bcC54c";
  
  // Deploy IntentManager with vault address only
  const intentManager = m.contract("IntentManager", [
    VAULT_ADDRESS
  ]);
  
  // Grant IntentManager the AGENT_ROLE on the YieldVault so it can call executeRebalance
  const vault = m.contractAt("YieldVault", VAULT_ADDRESS);
  m.call(vault, "grantRole", [
    "0x0000000000000000000000000000000000000000000000000000000000000001", // AGENT_ROLE
    intentManager
  ], { id: "grantIntentManagerAgentRole" });
  
  // Grant IntentManager the AGENT_ROLE on the BridgeHook so it can call executeBridge
  const BRIDGE_HOOK_ADDRESS = "0xf1EDe8B290ce69BbD16B3a3661242B856C581ffA";
  const bridgeHook = m.contractAt("BridgeHook", BRIDGE_HOOK_ADDRESS);
  m.call(bridgeHook, "grantRole", [
    "0x0000000000000000000000000000000000000000000000000000000000000001", // AGENT_ROLE
    intentManager
  ], { id: "grantIntentManagerBridgeAgentRole" });
  
  // Set the bridge hook in IntentManager
  m.call(intentManager, "setBridgeHook", [BRIDGE_HOOK_ADDRESS], { id: "setBridgeHook" });
  
  return { intentManager };
});
