import { network } from "hardhat";
import { keccak256, toHex } from "viem";

async function main() {
  console.log("🔑 Granting AGENT_ROLE to IntentManager on Vault...");

  // Deployed contract addresses
  const VAULT_ADDRESS = "0x69F4377d6A7B6fd2263f9D26C1B2fb165D4B9735" as `0x${string}`;
  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  
  // Connect to network and get viem instance
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  
  console.log("Admin (Deployer):", deployer.account.address);
  console.log("Vault Address:", VAULT_ADDRESS);
  console.log("IntentManager Address:", INTENT_MANAGER_ADDRESS);

  // Get Vault contract
  const Vault = await viem.getContractAt("USDCVault", VAULT_ADDRESS);

  // Get AGENT_ROLE hash
  const AGENT_ROLE = keccak256(toHex("AGENT_ROLE"));
  console.log("AGENT_ROLE hash:", AGENT_ROLE);

  // Check if IntentManager already has AGENT_ROLE on Vault
  const hasRole = await Vault.read.hasRole([AGENT_ROLE, INTENT_MANAGER_ADDRESS]);
  
  if (hasRole) {
    console.log("✅ IntentManager already has AGENT_ROLE on Vault!");
  } else {
    console.log("⏳ Granting AGENT_ROLE to IntentManager on Vault...");
    const hash = await Vault.write.grantRole([AGENT_ROLE, INTENT_MANAGER_ADDRESS]);
    console.log("Transaction submitted:", hash);
    console.log("⏳ Waiting for confirmation...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("✅ AGENT_ROLE granted successfully!");
    console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/tx/" + hash);
  }

  // Verify
  const hasRoleAfter = await Vault.read.hasRole([AGENT_ROLE, INTENT_MANAGER_ADDRESS]);
  console.log("\n🔍 Verification:");
  console.log("IntentManager has AGENT_ROLE on Vault:", hasRoleAfter);
  console.log("\n✅ Intent execution should now work!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



