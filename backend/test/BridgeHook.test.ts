import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseUnits } from "viem";

describe("BridgeHook", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1, user2, agent] = await viem.getWalletClients();

  let bridgeHook: any;
  let mockToken: any;

  const TOKEN_DECIMALS = 6;
  const INITIAL_SUPPLY = parseUnits("1000000", TOKEN_DECIMALS);
  const BRIDGE_AMOUNT = parseUnits("1000", TOKEN_DECIMALS);

  beforeEach(async function () {
    // Deploy BridgeHook
    bridgeHook = await viem.deployContract("BridgeHook");

    // Deploy mock token
    mockToken = await viem.deployContract("MockPYUSD");

    // Set up roles
    await bridgeHook.write.grantRole([
      await bridgeHook.read.BRIDGE_ROLE(),
      agent.account.address
    ]);

    await bridgeHook.write.grantRole([
      await bridgeHook.read.AGENT_ROLE(),
      agent.account.address
    ]);

    // Set supported token
    await bridgeHook.write.setSupportedToken([mockToken.address, true]);

    // Mint tokens to user
    await mockToken.write.mint([user1.account.address, INITIAL_SUPPLY]);

    // Approve bridge hook to spend tokens
    await mockToken.write.approve([bridgeHook.address, BigInt(2**256 - 1)], {
      account: user1.account
    });
  });

  describe("Deployment", function () {
    it("Should grant admin role to deployer", async function () {
      const adminRole = await bridgeHook.read.DEFAULT_ADMIN_ROLE();
      assert.equal(
        await bridgeHook.read.hasRole([adminRole, owner.account.address]),
        true
      );
    });

    it("Should initialize supported tokens and chains", async function () {
      // Check that some default tokens are supported
      const isSupported = await bridgeHook.read.supportedTokens([mockToken.address]);
      assert.equal(isSupported, true);
    });
  });

  describe("Bridge Operations", function () {
    it("Should allow users to initiate bridge operations", async function () {
      const toChainId = 8453n; // Base
      const executeData = "0x" + "1234567890123456789012345678901234567890".padStart(64, "0");

      await viem.assertions.emitWithArgs(
        bridgeHook.write.initiateBridge([mockToken.address, BRIDGE_AMOUNT, toChainId, executeData], {
          account: user1.account
        }),
        bridgeHook,
        "BridgeInitiated",
        [user1.account.address, mockToken.address, BRIDGE_AMOUNT, toChainId, executeData, "0x0"]
      );
    });

    it("Should reject bridge operations with unsupported tokens", async function () {
      const unsupportedToken = "0x0000000000000000000000000000000000000000";
      const toChainId = 8453n;
      const executeData = "0x";

      await assert.rejects(
        bridgeHook.write.initiateBridge([unsupportedToken, BRIDGE_AMOUNT, toChainId, executeData], {
          account: user1.account
        }),
        /UnsupportedToken/
      );
    });

    it("Should reject bridge operations to unsupported chains", async function () {
      const toChainId = 999999n; // Unsupported chain
      const executeData = "0x";

      await assert.rejects(
        bridgeHook.write.initiateBridge([mockToken.address, BRIDGE_AMOUNT, toChainId, executeData], {
          account: user1.account
        }),
        /UnsupportedChain/
      );
    });

    it("Should reject bridge operations with zero amount", async function () {
      const toChainId = 8453n;
      const executeData = "0x";

      await assert.rejects(
        bridgeHook.write.initiateBridge([mockToken.address, 0n, toChainId, executeData], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });

    it("Should reject bridge operations exceeding maximum amount", async function () {
      const maxAmount = await bridgeHook.read.maxBridgeAmount();
      const excessAmount = maxAmount + 1n;
      const toChainId = 8453n;
      const executeData = "0x";

      await assert.rejects(
        bridgeHook.write.initiateBridge([mockToken.address, excessAmount, toChainId, executeData], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });

    it("Should reject bridge operations with insufficient balance", async function () {
      const excessAmount = INITIAL_SUPPLY + 1n;
      const toChainId = 8453n;
      const executeData = "0x";

      await assert.rejects(
        bridgeHook.write.initiateBridge([mockToken.address, excessAmount, toChainId, executeData], {
          account: user1.account
        }),
        /InsufficientBalance/
      );
    });
  });

  describe("Bridge Execution", function () {
    beforeEach(async function () {
      // Initiate a bridge operation first
      const toChainId = 8453n;
      const executeData = "0x";
      
      await bridgeHook.write.initiateBridge([mockToken.address, BRIDGE_AMOUNT, toChainId, executeData], {
        account: user1.account
      });
    });

    it("Should allow agents to execute bridge operations", async function () {
      const toChainId = 8453n;

      await viem.assertions.emitWithArgs(
        bridgeHook.write.executeBridge([user1.account.address, mockToken.address, BRIDGE_AMOUNT, toChainId], {
          account: agent.account
        }),
        bridgeHook,
        "BridgeExecuted",
        [user1.account.address, mockToken.address, BRIDGE_AMOUNT, toChainId, "0x0", BigInt(await getCurrentTimestamp())]
      );
    });

    it("Should not allow non-agents to execute bridge operations", async function () {
      const toChainId = 8453n;

      await assert.rejects(
        bridgeHook.write.executeBridge([user1.account.address, mockToken.address, BRIDGE_AMOUNT, toChainId], {
          account: user1.account
        }),
        /UnauthorizedAgent/
      );
    });

    it("Should not execute non-existent operations", async function () {
      const toChainId = 10n; // Different chain
      const differentAmount = BRIDGE_AMOUNT + 1n;

      await assert.rejects(
        bridgeHook.write.executeBridge([user1.account.address, mockToken.address, differentAmount, toChainId], {
          account: agent.account
        }),
        /OperationNotFound/
      );
    });
  });

  describe("Configuration Management", function () {
    it("Should allow admin to set supported tokens", async function () {
      const newToken = "0x1234567890123456789012345678901234567890";

      await viem.assertions.emitWithArgs(
        bridgeHook.write.setSupportedToken([newToken, true]),
        bridgeHook,
        "TokenSupported",
        [newToken, true]
      );

      assert.equal(await bridgeHook.read.supportedTokens([newToken]), true);
    });

    it("Should allow admin to set supported chains", async function () {
      const newChainId = 100n;

      await viem.assertions.emitWithArgs(
        bridgeHook.write.setSupportedChain([newChainId, true]),
        bridgeHook,
        "ChainSupported",
        [newChainId, true]
      );

      assert.equal(await bridgeHook.read.supportedChains([newChainId]), true);
    });

    it("Should allow admin to set bridge fee", async function () {
      const newFeeBps = 20n; // 0.2%

      await viem.assertions.emitWithArgs(
        bridgeHook.write.setBridgeFee([newFeeBps]),
        bridgeHook,
        "BridgeFeeUpdated",
        [newFeeBps]
      );

      assert.equal(await bridgeHook.read.bridgeFeeBps(), newFeeBps);
    });

    it("Should not allow non-admin to configure", async function () {
      const newToken = "0x1234567890123456789012345678901234567890";

      await assert.rejects(
        bridgeHook.write.setSupportedToken([newToken, true], { account: user1.account }),
        /AccessControlUnauthorizedAccount/
      );
    });
  });

  describe("User Bridge History", function () {
    beforeEach(async function () {
      // Initiate multiple bridge operations
      const toChainId1 = 8453n;
      const toChainId2 = 10n;
      const executeData = "0x";

      await bridgeHook.write.initiateBridge([mockToken.address, BRIDGE_AMOUNT, toChainId1, executeData], {
        account: user1.account
      });

      await bridgeHook.write.initiateBridge([mockToken.address, BRIDGE_AMOUNT, toChainId2, executeData], {
        account: user1.account
      });
    });

    it("Should return user bridge history", async function () {
      const history = await bridgeHook.read.getUserBridgeHistory([user1.account.address]);
      
      assert.equal(history.length, 2);
      assert(typeof history[0] === "string"); // Should be operation ID
    });

    it("Should return bridge operation details", async function () {
      const history = await bridgeHook.read.getUserBridgeHistory([user1.account.address]);
      const operationId = history[0];
      
      const operation = await bridgeHook.read.getBridgeOperation([operationId]);
      
      assert.equal(operation.user, user1.account.address);
      assert.equal(operation.token, mockToken.address);
      assert.equal(operation.amount, BRIDGE_AMOUNT);
      assert.equal(operation.executed, false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty bridge history", async function () {
      const history = await bridgeHook.read.getUserBridgeHistory([user2.account.address]);
      assert.equal(history.length, 0);
    });

    it("Should handle non-existent operation IDs", async function () {
      const nonExistentId = "0x" + "0".repeat(64);
      
      const operation = await bridgeHook.read.getBridgeOperation([nonExistentId]);
      
      // Should return default values for non-existent operations
      assert.equal(operation.user, "0x0000000000000000000000000000000000000000");
      assert.equal(operation.token, "0x0000000000000000000000000000000000000000");
      assert.equal(operation.amount, 0n);
    });
  });

  // Helper function to get current timestamp
  async function getCurrentTimestamp(): Promise<number> {
    const block = await publicClient.getBlock();
    return Number(block.timestamp);
  }
});
