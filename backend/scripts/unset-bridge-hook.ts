import { network } from "hardhat";

async function main() {
  console.log("🔧 Unsetting BridgeHook on IntentManager...");

  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  
  console.log("Admin (Deployer):", deployer.account.address);
  console.log("IntentManager Address:", INTENT_MANAGER_ADDRESS);

  const IntentManager = await viem.getContractAt("IntentManager", INTENT_MANAGER_ADDRESS);

  // Get current bridgeHook
  const currentBridgeHook = await IntentManager.read.bridgeHook();
  console.log("\nCurrent BridgeHook:", currentBridgeHook);

  if (currentBridgeHook === "0x0000000000000000000000000000000000000000") {
    console.log("✅ BridgeHook already unset!");
  } else {
    console.log("⏳ Setting BridgeHook to address(0)...");
    const hash = await IntentManager.write.setBridgeHook(["0x0000000000000000000000000000000000000000"]);
    console.log("Transaction submitted:", hash);
    console.log("⏳ Waiting for confirmation...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    console.log("✅ BridgeHook unset successfully!");
    console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/tx/" + hash);
  }

  // Verify
  const newBridgeHook = await IntentManager.read.bridgeHook();
  console.log("\n🔍 Verification:");
  console.log("New BridgeHook:", newBridgeHook);
  console.log("Is unset:", newBridgeHook === "0x0000000000000000000000000000000000000000");
  
  if (newBridgeHook === "0x0000000000000000000000000000000000000000") {
    console.log("\n✅ Cross-chain logic will be skipped!");
    console.log("✅ Intent execution should now work!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



