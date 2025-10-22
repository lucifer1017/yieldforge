import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseUnits } from "viem";

describe("YieldForge Integration", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1, agent] = await viem.getWalletClients();

  let yieldVault: any;
  let intentManager: any;
  let pythIntegrator: any;
  let bridgeHook: any;
  let mockPYUSD: any;
  let mockPyth: any;

  const PYUSD_DECIMALS = 6;
  const INITIAL_SUPPLY = parseUnits("1000000", PYUSD_DECIMALS);
  const DEPOSIT_AMOUNT = parseUnits("1000", PYUSD_DECIMALS);

  beforeEach(async function () {
    // Deploy all contracts
    mockPYUSD = await viem.deployContract("MockPYUSD");
    mockPyth = await viem.deployContract("MockPyth");
    pythIntegrator = await viem.deployContract("PythIntegrator", [mockPyth.address]);
    bridgeHook = await viem.deployContract("BridgeHook");

    yieldVault = await viem.deployContract("YieldVault", [
      "YieldForge Vault",
      "YFV",
      mockPYUSD.address,
      pythIntegrator.address
    ]);

    intentManager = await viem.deployContract("IntentManager", [
      yieldVault.address,
      pythIntegrator.address
    ]);

    // Set up roles
    await yieldVault.write.grantRole([
      await yieldVault.read.AGENT_ROLE(),
      agent.account.address
    ]);

    await intentManager.write.grantRole([
      await intentManager.read.AGENT_ROLE(),
      agent.account.address
    ]);

    await bridgeHook.write.grantRole([
      await bridgeHook.read.AGENT_ROLE(),
      agent.account.address
    ]);

    // Set bridge hooks
    await yieldVault.write.setBridgeHook([bridgeHook.address]);
    await intentManager.write.setBridgeHook([bridgeHook.address]);

    // Set up supported tokens and chains
    await bridgeHook.write.setSupportedToken([mockPYUSD.address, true]);
    await bridgeHook.write.setSupportedChain([8453n, true]); // Base

    // Initialize price feeds
    const usdcFeedId = "0x" + "USDC/USD".padStart(64, "0");
    await pythIntegrator.write.registerFeed([usdcFeedId, "USDC"]);
    await pythIntegrator.write.updateAPY([usdcFeedId, 450n]); // 4.5%

    // Mint PYUSD to user
    await mockPYUSD.write.mint([user1.account.address, INITIAL_SUPPLY]);

    // Approve vault to spend PYUSD
    await mockPYUSD.write.approve([yieldVault.address, BigInt(2**256 - 1)], {
      account: user1.account
    });
  });

  describe("Complete User Flow", function () {
    it("Should complete full yield optimization flow", async function () {
      // Step 1: User deposits PYUSD
      console.log("Step 1: User deposits PYUSD");
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });

      const userBalance = await yieldVault.read.balanceOf([user1.account.address]);
      assert.equal(userBalance, DEPOSIT_AMOUNT);
      console.log("✅ Deposit successful, user balance:", formatUnits(userBalance, PYUSD_DECIMALS), "PYUSD");

      // Step 2: User submits yield optimization intent
      console.log("Step 2: User submits yield optimization intent");
      const intent = {
        minApy: 500n, // 5%
        slippageBps: 100n, // 1%
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 8453n, // Base
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await intentManager.write.submitIntent([intent], { account: user1.account });
      const intentCount = await intentManager.read.userIntentCount([user1.account.address]);
      assert.equal(intentCount, 1n);
      console.log("✅ Intent submitted successfully");

      // Step 3: Agent executes rebalance
      console.log("Step 3: Agent executes rebalance");
      const executionData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0") + 
                           "00000000000000000000000000000000000000000000000000000000000003e8";

      await intentManager.write.executeRebalance([user1.account.address, 0n, executionData], {
        account: agent.account
      });
      console.log("✅ Rebalance executed successfully");

      // Step 4: Check yield accrual
      console.log("Step 4: Check yield accrual");
      const userYield = await yieldVault.read.getYield([user1.account.address]);
      console.log("✅ User yield earned:", formatUnits(userYield, PYUSD_DECIMALS), "PYUSD");

      // Step 5: User initiates cross-chain bridge
      console.log("Step 5: User initiates cross-chain bridge");
      const bridgeAmount = parseUnits("500", PYUSD_DECIMALS);
      const toChainId = 8453n; // Base
      const bridgeExecuteData = "0x";

      await bridgeHook.write.initiateBridge([mockPYUSD.address, bridgeAmount, toChainId, bridgeExecuteData], {
        account: user1.account
      });
      console.log("✅ Bridge initiated successfully");

      // Step 6: Agent executes bridge
      console.log("Step 6: Agent executes bridge");
      await bridgeHook.write.executeBridge([user1.account.address, mockPYUSD.address, bridgeAmount, toChainId], {
        account: agent.account
      });
      console.log("✅ Bridge executed successfully");

      // Step 7: User withdraws remaining funds
      console.log("Step 7: User withdraws remaining funds");
      const remainingAmount = DEPOSIT_AMOUNT - bridgeAmount;
      await yieldVault.write.withdraw([remainingAmount, user1.account.address, user1.account.address], {
        account: user1.account
      });

      const finalBalance = await yieldVault.read.balanceOf([user1.account.address]);
      assert.equal(finalBalance, 0n);
      console.log("✅ Withdrawal successful, final balance:", formatUnits(finalBalance, PYUSD_DECIMALS), "PYUSD");

      console.log("🎉 Complete yield optimization flow successful!");
    });

    it("Should handle multiple intents per user", async function () {
      // User deposits
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });

      // Submit multiple intents
      const intent1 = {
        minApy: 500n,
        slippageBps: 100n,
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 8453n,
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      const intent2 = {
        minApy: 600n,
        slippageBps: 150n,
        targetProtocol: "0x2345678901234567890123456789012345678901",
        targetChainId: 10n,
        maxGasPrice: 60n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await intentManager.write.submitIntent([intent1], { account: user1.account });
      await intentManager.write.submitIntent([intent2], { account: user1.account });

      const intentCount = await intentManager.read.userIntentCount([user1.account.address]);
      assert.equal(intentCount, 2n);

      const intents = await intentManager.read.getUserIntents([user1.account.address]);
      assert.equal(intents.length, 2);
      assert.equal(intents[0].minApy, 500n);
      assert.equal(intents[1].minApy, 600n);

      // Deactivate first intent
      await intentManager.write.deactivateIntent([0n], { account: user1.account });

      const activeIntents = await intentManager.read.getActiveIntents([user1.account.address]);
      assert.equal(activeIntents.length, 1);
      assert.equal(activeIntents[0].minApy, 600n);
    });

    it("Should handle price feed updates", async function () {
      const usdcFeedId = "0x" + "USDC/USD".padStart(64, "0");
      
      // Update price feeds
      const priceUpdates = [
        "0x" + "1234567890123456789012345678901234567890".padStart(64, "0")
      ];

      await pythIntegrator.write.updatePriceFeeds([priceUpdates], {
        value: 1000000000000000n // 0.001 ETH
      });

      // Get latest price
      const priceData = await pythIntegrator.read.getLatestPrice([usdcFeedId]);
      assert(typeof priceData.price === "bigint");
      assert(typeof priceData.timestamp === "bigint");

      // Get APY
      const apy = await pythIntegrator.read.getAPY([usdcFeedId]);
      assert.equal(apy, 450n); // 4.5%
    });
  });

  describe("Error Handling", function () {
    it("Should handle insufficient balance scenarios", async function () {
      const excessAmount = INITIAL_SUPPLY + 1n;

      await assert.rejects(
        yieldVault.write.deposit([excessAmount, user1.account.address], {
          account: user1.account
        }),
        /ERC20InsufficientBalance/
      );
    });

    it("Should handle paused contract scenarios", async function () {
      await yieldVault.write.pause();

      await assert.rejects(
        yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
          account: user1.account
        }),
        /VaultPaused/
      );
    });

    it("Should handle unauthorized access scenarios", async function () {
      await assert.rejects(
        yieldVault.write.executeRebalance([user1.account.address, 1000n, 500n], {
          account: user1.account
        }),
        /UnauthorizedAgent/
      );
    });
  });

  // Helper function to format units
  function formatUnits(value: bigint, decimals: number): string {
    return (Number(value) / Math.pow(10, decimals)).toFixed(6);
  }
});
