import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseUnits } from "viem";

describe("IntentManager", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1, user2, agent] = await viem.getWalletClients();

  let intentManager: any;
  let yieldVault: any;
  let mockPYUSD: any;
  let mockPyth: any;
  let pythIntegrator: any;
  let bridgeHook: any;

  const PYUSD_DECIMALS = 6;
  const INITIAL_SUPPLY = parseUnits("1000000", PYUSD_DECIMALS);
  const DEPOSIT_AMOUNT = parseUnits("1000", PYUSD_DECIMALS);

  beforeEach(async function () {
    // Deploy contracts (same setup as YieldVault test)
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

    // Set bridge hook
    await yieldVault.write.setBridgeHook([bridgeHook.address]);
    await intentManager.write.setBridgeHook([bridgeHook.address]);

    // Mint PYUSD to users
    await mockPYUSD.write.mint([user1.account.address, INITIAL_SUPPLY]);
    await mockPYUSD.write.mint([user2.account.address, INITIAL_SUPPLY]);

    // Approve vault to spend PYUSD
    await mockPYUSD.write.approve([yieldVault.address, BigInt(2**256 - 1)], {
      account: user1.account
    });
    await mockPYUSD.write.approve([yieldVault.address, BigInt(2**256 - 1)], {
      account: user2.account
    });
  });

  describe("Deployment", function () {
    it("Should set the correct vault address", async function () {
      assert.equal(await intentManager.read.vault(), yieldVault.address);
    });

    it("Should set the correct Pyth integrator", async function () {
      assert.equal(await intentManager.read.pythIntegrator(), pythIntegrator.address);
    });

    it("Should grant admin role to deployer", async function () {
      const adminRole = await intentManager.read.DEFAULT_ADMIN_ROLE();
      assert.equal(
        await intentManager.read.hasRole([adminRole, owner.account.address]),
        true
      );
    });
  });

  describe("Intent Submission", function () {
    it("Should allow users to submit valid intents", async function () {
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

      await viem.assertions.emitWithArgs(
        intentManager.write.submitIntent([intent], { account: user1.account }),
        intentManager,
        "IntentSubmitted",
        [user1.account.address, 0n, intent, BigInt(await getCurrentTimestamp())]
      );

      assert.equal(await intentManager.read.userIntentCount([user1.account.address]), 1n);
    });

    it("Should reject intents with invalid APY", async function () {
      const intent = {
        minApy: 0n, // Invalid APY
        slippageBps: 100n,
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 8453n,
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await assert.rejects(
        intentManager.write.submitIntent([intent], { account: user1.account }),
        /InvalidIntent/
      );
    });

    it("Should reject intents with excessive slippage", async function () {
      const intent = {
        minApy: 500n,
        slippageBps: 2000n, // 20% - too high
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 8453n,
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await assert.rejects(
        intentManager.write.submitIntent([intent], { account: user1.account }),
        /InvalidSlippage/
      );
    });

    it("Should reject intents with unsupported protocols", async function () {
      const intent = {
        minApy: 500n,
        slippageBps: 100n,
        targetProtocol: "0x0000000000000000000000000000000000000000", // Unsupported
        targetChainId: 8453n,
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await assert.rejects(
        intentManager.write.submitIntent([intent], { account: user1.account }),
        /UnsupportedProtocol/
      );
    });

    it("Should reject intents with unsupported chains", async function () {
      const intent = {
        minApy: 500n,
        slippageBps: 100n,
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 999999n, // Unsupported chain
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await assert.rejects(
        intentManager.write.submitIntent([intent], { account: user1.account }),
        /UnsupportedChain/
      );
    });
  });

  describe("Intent Management", function () {
    let intentId: bigint;

    beforeEach(async function () {
      const intent = {
        minApy: 500n,
        slippageBps: 100n,
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 8453n,
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await intentManager.write.submitIntent([intent], { account: user1.account });
      intentId = 0n;
    });

    it("Should allow users to deactivate intents", async function () {
      await viem.assertions.emitWithArgs(
        intentManager.write.deactivateIntent([intentId], { account: user1.account }),
        intentManager,
        "IntentDeactivated",
        [user1.account.address, intentId, BigInt(await getCurrentTimestamp())]
      );

      const intents = await intentManager.read.getUserIntents([user1.account.address]);
      assert.equal(intents[0].isActive, false);
    });

    it("Should not allow users to deactivate non-existent intents", async function () {
      await assert.rejects(
        intentManager.write.deactivateIntent([999n], { account: user1.account }),
        /IntentNotFound/
      );
    });

    it("Should return user intents", async function () {
      const intents = await intentManager.read.getUserIntents([user1.account.address]);
      assert.equal(intents.length, 1);
      assert.equal(intents[0].minApy, 500n);
    });

    it("Should return only active intents", async function () {
      // Submit another intent
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

      await intentManager.write.submitIntent([intent2], { account: user1.account });

      // Deactivate first intent
      await intentManager.write.deactivateIntent([0n], { account: user1.account });

      const activeIntents = await intentManager.read.getActiveIntents([user1.account.address]);
      assert.equal(activeIntents.length, 1);
      assert.equal(activeIntents[0].minApy, 600n);
    });
  });

  describe("Rebalance Execution", function () {
    let intentId: bigint;

    beforeEach(async function () {
      // Deposit to vault
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });

      // Submit intent
      const intent = {
        minApy: 500n,
        slippageBps: 100n,
        targetProtocol: "0x1234567890123456789012345678901234567890",
        targetChainId: 8453n,
        maxGasPrice: 50n,
        isActive: true,
        createdAt: 0n,
        lastExecuted: 0n
      };

      await intentManager.write.submitIntent([intent], { account: user1.account });
      intentId = 0n;
    });

    it("Should allow agents to execute rebalance", async function () {
      const executionData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0") + 
                           "00000000000000000000000000000000000000000000000000000000000003e8";

      await viem.assertions.emitWithArgs(
        intentManager.write.executeRebalance([user1.account.address, intentId, executionData], {
          account: agent.account
        }),
        intentManager,
        "RebalanceExecuted",
        [user1.account.address, intentId, 0n, 0n, BigInt(await getCurrentTimestamp())]
      );
    });

    it("Should not allow non-agents to execute rebalance", async function () {
      const executionData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0") + 
                           "00000000000000000000000000000000000000000000000000000000000003e8";

      await assert.rejects(
        intentManager.write.executeRebalance([user1.account.address, intentId, executionData], {
          account: user1.account
        }),
        /UnauthorizedAgent/
      );
    });

    it("Should not execute non-existent intents", async function () {
      const executionData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0") + 
                           "00000000000000000000000000000000000000000000000000000000000003e8";

      await assert.rejects(
        intentManager.write.executeRebalance([user1.account.address, 999n, executionData], {
          account: agent.account
        }),
        /IntentNotFound/
      );
    });

    it("Should not execute inactive intents", async function () {
      // Deactivate intent
      await intentManager.write.deactivateIntent([intentId], { account: user1.account });

      const executionData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0") + 
                           "00000000000000000000000000000000000000000000000000000000000003e8";

      await assert.rejects(
        intentManager.write.executeRebalance([user1.account.address, intentId, executionData], {
          account: agent.account
        }),
        /IntentNotActive/
      );
    });

    it("Should not execute intents too frequently", async function () {
      const executionData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0") + 
                           "00000000000000000000000000000000000000000000000000000000000003e8";

      // Execute once
      await intentManager.write.executeRebalance([user1.account.address, intentId, executionData], {
        account: agent.account
      });

      // Try to execute again immediately
      await assert.rejects(
        intentManager.write.executeRebalance([user1.account.address, intentId, executionData], {
          account: agent.account
        }),
        /IntentNotFound/
      );
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to pause and unpause", async function () {
      await intentManager.write.pause();
      assert.equal(await intentManager.read.paused(), true);

      await intentManager.write.unpause();
      assert.equal(await intentManager.read.paused(), false);
    });

    it("Should not allow non-admin to pause", async function () {
      await assert.rejects(
        intentManager.write.pause({ account: user1.account }),
        /AccessControlUnauthorizedAccount/
      );
    });
  });

  // Helper function to get current timestamp
  async function getCurrentTimestamp(): Promise<number> {
    const block = await publicClient.getBlock();
    return Number(block.timestamp);
  }
});