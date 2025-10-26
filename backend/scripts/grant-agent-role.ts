import { network } from "hardhat";
import { keccak256, toHex } from "viem";

async function main() {
  // Get the target address from environment variable or hardcoded value
  const targetAddress = process.env.TARGET_ADDRESS || "0x03d386bFD8caf972B39b7d85b9FBfe7ded40847a";
  
  if (!targetAddress) {
    console.error("❌ Error: Please set TARGET_ADDRESS environment variable");
    console.log("\nUsage:");
    console.log("$env:TARGET_ADDRESS=\"0xYourAddress\"; npx hardhat run scripts/grant-agent-role.ts --network sepolia");
    process.exit(1);
  }

  console.log("🔑 Granting AGENT_ROLE...");

  // Get the deployed IntentManager address
  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  
  // Connect to network and get viem instance
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  
  console.log("Admin (Deployer):", deployer.account.address);
  console.log("Target (Your MetaMask):", targetAddress);

  // Get IntentManager contract
  const IntentManager = await viem.getContractAt("IntentManager", INTENT_MANAGER_ADDRESS);

  // Get AGENT_ROLE hash
  const AGENT_ROLE = keccak256(toHex("AGENT_ROLE"));
  console.log("AGENT_ROLE hash:", AGENT_ROLE);

  // Check if target already has AGENT_ROLE
  const hasRole = await IntentManager.read.hasRole([AGENT_ROLE, targetAddress as `0x${string}`]);
  
  if (hasRole) {
    console.log("✅ Address already has AGENT_ROLE!");
  } else {
    console.log("⏳ Granting AGENT_ROLE to", targetAddress, "...");
    const hash = await IntentManager.write.grantRole([AGENT_ROLE, targetAddress as `0x${string}`]);
    console.log("Transaction submitted:", hash);
    console.log("⏳ Waiting for confirmation...");
    
    // Wait for transaction receipt
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("✅ AGENT_ROLE granted successfully!");
    console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/tx/" + hash);
  }

  // Verify
  const hasRoleAfter = await IntentManager.read.hasRole([AGENT_ROLE, targetAddress as `0x${string}`]);
  console.log("\n🔍 Verification:");
  console.log("Address has AGENT_ROLE:", hasRoleAfter);
  console.log("\n✅ You can now execute intents with this address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

