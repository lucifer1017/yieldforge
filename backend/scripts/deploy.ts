import { network } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Starting YieldForge contracts deployment...\n");

  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  
  console.log("Deploying contracts with account:", deployer.account.address);
  
  const balance = await viem.getBalance(deployer.account.address);
  console.log("Account balance:", (Number(balance) / 1e18).toFixed(4), "ETH\n");

  // Contract addresses
  const PYUSD_ADDRESS = "0x6f7C932e7684666C9fd1d44527765433e01C5b51"; // PYUSD on Sepolia
  const PYTH_HERMES_ADDRESS = "0x4D147dCb984e6affEec47e44293DA442580A3Ec0"; // Pyth Hermes on Sepolia

  // Deploy MockPYUSD (for testing)
  console.log("📦 Deploying MockPYUSD...");
  const mockPYUSD = await viem.deployContract("MockPYUSD");
  console.log("✅ MockPYUSD deployed to:", mockPYUSD.address);

  // Deploy MockPyth (for testing)
  console.log("📦 Deploying MockPyth...");
  const mockPyth = await viem.deployContract("MockPyth");
  console.log("✅ MockPyth deployed to:", mockPyth.address);

  // Deploy PythIntegrator
  console.log("📦 Deploying PythIntegrator...");
  const pythIntegrator = await viem.deployContract("PythIntegrator", [
    mockPyth.address
  ]);
  console.log("✅ PythIntegrator deployed to:", pythIntegrator.address);

  // Deploy BridgeHook
  console.log("📦 Deploying BridgeHook...");
  const bridgeHook = await viem.deployContract("BridgeHook");
  console.log("✅ BridgeHook deployed to:", bridgeHook.address);

  // Deploy YieldVault
  console.log("📦 Deploying YieldVault...");
  const yieldVault = await viem.deployContract("YieldVault", [
    "YieldForge Vault",
    "YFV",
    mockPYUSD.address, // Use mock for testing
    pythIntegrator.address
  ]);
  console.log("✅ YieldVault deployed to:", yieldVault.address);

  // Deploy IntentManager
  console.log("📦 Deploying IntentManager...");
  const intentManager = await viem.deployContract("IntentManager", [
    yieldVault.address,
    pythIntegrator.address
  ]);
  console.log("✅ IntentManager deployed to:", intentManager.address);

  // Set up roles and permissions
  console.log("\n🔐 Setting up roles and permissions...");

  // Grant AGENT_ROLE to deployer for testing
  await yieldVault.write.grantRole([
    await yieldVault.read.AGENT_ROLE(),
    deployer.account.address
  ]);

  await intentManager.write.grantRole([
    await intentManager.read.AGENT_ROLE(),
    deployer.account.address
  ]);

  await bridgeHook.write.grantRole([
    await bridgeHook.read.AGENT_ROLE(),
    deployer.account.address
  ]);

  // Set bridge hooks
  await yieldVault.write.setBridgeHook([bridgeHook.address]);
  await intentManager.write.setBridgeHook([bridgeHook.address]);

  console.log("✅ Roles and permissions configured");

  // Initialize price feeds
  console.log("\n📊 Initializing price feeds...");
  
  // Register price feeds
  const usdcFeedId = "0x" + "USDC/USD".padStart(64, "0");
  const ethFeedId = "0x" + "ETH/USD".padStart(64, "0");
  const pyusdFeedId = "0x" + "PYUSD/USD".padStart(64, "0");

  await pythIntegrator.write.registerFeed([usdcFeedId, "USDC"]);
  await pythIntegrator.write.registerFeed([ethFeedId, "ETH"]);
  await pythIntegrator.write.registerFeed([pyusdFeedId, "PYUSD"]);

  // Set APY values
  await pythIntegrator.write.updateAPY([usdcFeedId, 450n]); // 4.5%
  await pythIntegrator.write.updateAPY([ethFeedId, 350n]);  // 3.5%
  await pythIntegrator.write.updateAPY([pyusdFeedId, 500n]); // 5%

  console.log("✅ Price feeds initialized");

  // Mint test tokens
  console.log("\n💰 Minting test tokens...");
  const testAmount = BigInt(1000000 * 10**6); // 1M PYUSD
  await mockPYUSD.write.mint([deployer.account.address, testAmount]);
  console.log("✅ Test tokens minted");

  // Verify contracts
  console.log("\n🔍 Verifying contracts...");
  try {
    // Note: In production, you would verify on Etherscan
    console.log("ℹ️  Contract verification skipped (use hardhat verify for production)");
  } catch (error) {
    console.log("⚠️  Contract verification failed:", error);
  }

  // Generate deployment info
  const deploymentInfo = {
    network: await viem.getChainId(),
    deployer: deployer.account.address,
    contracts: {
      MockPYUSD: mockPYUSD.address,
      MockPyth: mockPyth.address,
      PythIntegrator: pythIntegrator.address,
      BridgeHook: bridgeHook.address,
      YieldVault: yieldVault.address,
      IntentManager: intentManager.address
    },
    roles: {
      AGENT_ROLE: await yieldVault.read.AGENT_ROLE(),
      BRIDGE_ROLE: await yieldVault.read.BRIDGE_ROLE(),
      ADMIN_ROLE: await yieldVault.read.DEFAULT_ADMIN_ROLE()
    },
    priceFeeds: {
      USDC: usdcFeedId,
      ETH: ethFeedId,
      PYUSD: pyusdFeedId
    },
    deploymentTime: new Date().toISOString()
  };

  // Save deployment info
  const deploymentPath = join(__dirname, "../deployments.json");
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);

  // Generate ABI export info
  const abiInfo = {
    contracts: {
      YieldVault: {
        address: yieldVault.address,
        abi: yieldVault.abi
      },
      IntentManager: {
        address: intentManager.address,
        abi: intentManager.abi
      },
      PythIntegrator: {
        address: pythIntegrator.address,
        abi: pythIntegrator.abi
      },
      BridgeHook: {
        address: bridgeHook.address,
        abi: bridgeHook.abi
      }
    }
  };

  const abiPath = join(__dirname, "../frontend-abi.json");
  writeFileSync(abiPath, JSON.stringify(abiInfo, null, 2));
  console.log("✅ ABI info saved to:", abiPath);

  // Display summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Summary:");
  console.log("===================");
  console.log(`MockPYUSD:     ${mockPYUSD.address}`);
  console.log(`MockPyth:      ${mockPyth.address}`);
  console.log(`PythIntegrator: ${pythIntegrator.address}`);
  console.log(`BridgeHook:    ${bridgeHook.address}`);
  console.log(`YieldVault:    ${yieldVault.address}`);
  console.log(`IntentManager: ${intentManager.address}`);

  console.log("\n🔗 Track Qualifications:");
  console.log("========================");
  console.log("✅ PayPal USD: PYUSD integration with vault deposits/withdrawals");
  console.log("✅ Avail Nexus: BridgeHook for cross-chain operations");
  console.log("✅ Lit Protocol: IntentManager with AGENT_ROLE for automation");
  console.log("✅ Pyth Network: PythIntegrator for real-time price feeds");

  console.log("\n🚀 Next Steps:");
  console.log("==============");
  console.log("1. Run tests: npx hardhat test");
  console.log("2. Verify contracts: npx hardhat verify --network sepolia");
  console.log("3. Update frontend with new contract addresses");
  console.log("4. Deploy to production network");

  console.log("\n💡 Demo Flow:");
  console.log("=============");
  console.log("1. User deposits PYUSD to YieldVault");
  console.log("2. User submits intent via IntentManager");
  console.log("3. Lit Vincent agent executes rebalance");
  console.log("4. Cross-chain operations via BridgeHook");
  console.log("5. Real-time price validation via PythIntegrator");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });