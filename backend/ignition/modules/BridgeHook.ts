import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BridgeHookModule", (m) => {
  // Deploy BridgeHook
  const bridgeHook = m.contract("BridgeHook");
  
  // Set up initial roles
  m.call(bridgeHook, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)], { id: "grantAdminRole" }); // DEFAULT_ADMIN_ROLE
  m.call(bridgeHook, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000001", m.getAccount(0)], { id: "grantAgentRole" }); // AGENT_ROLE
  
  return { bridgeHook };
});
