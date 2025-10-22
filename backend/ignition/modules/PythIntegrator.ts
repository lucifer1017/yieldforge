import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PythIntegratorModule", (m) => {
  // Deploy MockPyth first (needed for PythIntegrator constructor)
  const mockPyth = m.contract("MockPyth");
  
  // Deploy PythIntegrator with MockPyth as the oracle
  const pythIntegrator = m.contract("PythIntegrator", [mockPyth]);
  
  // Set up initial roles
  m.call(pythIntegrator, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  
  return { mockPyth, pythIntegrator };
});
