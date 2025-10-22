import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IntentManagerModule", (m) => {
  // Deploy IntentManager
  const intentManager = m.contract("IntentManager");
  
  // Set up initial roles
  m.call(intentManager, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  m.call(intentManager, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000001", m.getAccount(0)]); // AGENT_ROLE
  
  return { intentManager };
});
