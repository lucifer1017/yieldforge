import { network } from "hardhat";
import { keccak256, toHex } from "viem";

async function main() {
  console.log("🔍 Verifying roles...");

  const VAULT_ADDRESS = "0x69F4377d6A7B6fd2263f9D26C1B2fb165D4B9735" as `0x${string}`;
  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  
  const { viem } = await network.connect();
  const Vault = await viem.getContractAt("USDCVault", VAULT_ADDRESS);
  
  const AGENT_ROLE = keccak256(toHex("AGENT_ROLE"));
  
  const hasRole = await Vault.read.hasRole([AGENT_ROLE, INTENT_MANAGER_ADDRESS]);
  
  console.log("\n📊 Role Status:");
  console.log("IntentManager has AGENT_ROLE on Vault:", hasRole);
  
  if (hasRole) {
    console.log("\n✅ SUCCESS! Intent execution should now work!");
  } else {
    console.log("\n❌ Role not granted yet. Transaction may still be pending.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



