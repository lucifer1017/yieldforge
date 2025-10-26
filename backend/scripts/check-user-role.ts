import { network } from "hardhat";
import { keccak256, toHex } from "viem";

async function main() {
  console.log("🔍 Checking user's AGENT_ROLE...");

  const USER_ADDRESS = "0x03d386bFD8caf972B39b7d85b9FBfe7ded40847a" as `0x${string}`;
  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  
  const { viem } = await network.connect();
  const IntentManager = await viem.getContractAt("IntentManager", INTENT_MANAGER_ADDRESS);
  
  const AGENT_ROLE = keccak256(toHex("AGENT_ROLE"));
  
  const hasRole = await IntentManager.read.hasRole([AGENT_ROLE, USER_ADDRESS]);
  
  console.log("\n📊 Role Status:");
  console.log("User address:", USER_ADDRESS);
  console.log("Has AGENT_ROLE on IntentManager:", hasRole);
  
  if (hasRole) {
    console.log("\n✅ User has permission to execute intents!");
  } else {
    console.log("\n❌ User DOES NOT have AGENT_ROLE!");
    console.log("Run: npx hardhat run scripts/grant-agent-role.ts --network sepolia");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


