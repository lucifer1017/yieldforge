import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("YieldVaultModule", (m) => {
  // Deploy MockPYUSD first (needed for YieldVault constructor)
  const mockPYUSD = m.contract("MockPYUSD", ["PYUSD", "PYUSD", 18]);
  
  // Deploy YieldVault with MockPYUSD as the asset
  const yieldVault = m.contract("YieldVault", [mockPYUSD]);
  
  // Set up initial roles and configurations
  m.call(yieldVault, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  m.call(yieldVault, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000001", m.getAccount(0)]); // AGENT_ROLE
  
  return { mockPYUSD, yieldVault };
});
