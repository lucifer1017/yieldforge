import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CompleteDeploymentModule", (m) => {
  // Deploy all contracts in the correct order
  
  // 1. Use real PYUSD Sepolia address
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  
  // 2. Deploy MockPyth
  const mockPyth = m.contract("MockPyth");
  
  // 3. Deploy YieldVault with real PYUSD as asset
  const yieldVault = m.contract("YieldVault", [PYUSD_ADDRESS]);
  
  // 4. Deploy IntentManager
  const intentManager = m.contract("IntentManager");
  
  // 5. Deploy PythIntegrator with MockPyth as oracle
  const pythIntegrator = m.contract("PythIntegrator", [mockPyth]);
  
  // 6. Deploy BridgeHook
  const bridgeHook = m.contract("BridgeHook");
  
  // Set up roles for YieldVault
  m.call(yieldVault, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  m.call(yieldVault, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000001", m.getAccount(0)]); // AGENT_ROLE
  
  // Set up roles for IntentManager
  m.call(intentManager, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  m.call(intentManager, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000001", m.getAccount(0)]); // AGENT_ROLE
  
  // Set up roles for PythIntegrator
  m.call(pythIntegrator, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  
  // Set up roles for BridgeHook
  m.call(bridgeHook, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000000", m.getAccount(0)]); // DEFAULT_ADMIN_ROLE
  m.call(bridgeHook, "grantRole", ["0x0000000000000000000000000000000000000000000000000000000000000001", m.getAccount(0)]); // AGENT_ROLE
  
  return { 
    mockPyth, 
    yieldVault, 
    intentManager, 
    pythIntegrator, 
    bridgeHook 
  };
});
