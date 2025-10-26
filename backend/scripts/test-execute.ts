import { network } from "hardhat";

async function main() {
  console.log("🧪 Testing intent execution...");

  const USER_ADDRESS = "0x03d386bFD8caf972B39b7d85b9FBfe7ded40847a" as `0x${string}`;
  const INTENT_MANAGER_ADDRESS = "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3" as `0x${string}`;
  const VAULT_ADDRESS = "0x69F4377d6A7B6fd2263f9D26C1B2fb165D4B9735" as `0x${string}`;
  
  const { viem } = await network.connect();
  const [signer] = await viem.getWalletClients();
  
  const IntentManager = await viem.getContractAt("IntentManager", INTENT_MANAGER_ADDRESS);
  const Vault = await viem.getContractAt("USDCVault", VAULT_ADDRESS);

  console.log("\n📊 Checking state:");
  
  // Check intent count
  const intentCount = await IntentManager.read.userIntentCount([USER_ADDRESS]);
  console.log("User intent count:", Number(intentCount));
  
  if (intentCount === 0n) {
    console.log("\n❌ No intents found! You need to CREATE an intent first!");
    console.log("Go to the UI and click 'Save Intent'");
    return;
  }
  
  // Check first intent
  const intentId = 0n;
  console.log("\nChecking intent ID:", Number(intentId));
  
  try {
    const intents = await IntentManager.read.getUserIntents([USER_ADDRESS]);
    const intent = intents[0];
    
    console.log("\n📋 Intent Details:");
    console.log("  minApy:", Number(intent.minApy));
    console.log("  slippageBps:", Number(intent.slippageBps));
    console.log("  targetProtocol:", intent.targetProtocol);
    console.log("  targetChainId:", Number(intent.targetChainId));
    console.log("  maxGasPrice:", Number(intent.maxGasPrice));
    console.log("  isActive:", intent.isActive);
    console.log("  lastExecuted:", Number(intent.lastExecuted));
    
    if (!intent.isActive) {
      console.log("\n❌ Intent is not active!");
      return;
    }
    
    // Check vault balance
    const vaultBalance = await Vault.read.balanceOf([USER_ADDRESS]);
    console.log("\n💰 Vault balance:", vaultBalance.toString());
    
    if (vaultBalance === 0n) {
      console.log("\n❌ No balance in vault! Deposit some USDC first!");
      return;
    }
    
    // Check cooldown
    const currentTime = Math.floor(Date.now() / 1000);
    const lastExecuted = Number(intent.lastExecuted);
    const cooldownRemaining = lastExecuted + 3600 - currentTime;
    
    if (cooldownRemaining > 0) {
      console.log(`\n⏰ Cooldown active! Wait ${Math.ceil(cooldownRemaining / 60)} minutes`);
      return;
    }
    
    console.log("\n✅ All checks passed! Attempting execution...");
    
    // Try to execute
    const hash = await IntentManager.write.executeRebalance([
      USER_ADDRESS,
      intentId,
      '0x'
    ], {
      gas: 300000n
    });
    
    console.log("\n✅ SUCCESS! Transaction hash:", hash);
    console.log("View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/tx/${hash}`);
    
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message || error);
    
    if (error.message?.includes('IntentNotFound')) {
      console.log("\n💡 This means either:");
      console.log("  1. Intent doesn't exist (create it first)");
      console.log("  2. Cooldown period (wait 1 hour between executions)");
    } else if (error.message?.includes('IntentNotActive')) {
      console.log("\n💡 Intent is not active!");
    } else if (error.message?.includes('AccessControl')) {
      console.log("\n💡 Permission denied - need AGENT_ROLE");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


