import { network } from "hardhat";

async function main() {
  console.log("🔍 Checking BridgeHook configuration...");

  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  
  const { viem } = await network.connect();
  const IntentManager = await viem.getContractAt("IntentManager", INTENT_MANAGER_ADDRESS);
  
  const bridgeHookAddress = await IntentManager.read.bridgeHook();
  
  console.log("\n📊 BridgeHook Status:");
  console.log("BridgeHook address:", bridgeHookAddress);
  console.log("Is set:", bridgeHookAddress !== "0x0000000000000000000000000000000000000000");
  
  if (bridgeHookAddress === "0x0000000000000000000000000000000000000000") {
    console.log("\n✅ BridgeHook is NOT set - cross-chain logic will be SKIPPED");
    console.log("This means vault.PYUSD() won't be called!");
  } else {
    console.log("\n⚠️ BridgeHook IS set - cross-chain logic will execute");
    console.log("This will try to call vault.PYUSD() which doesn't exist!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



