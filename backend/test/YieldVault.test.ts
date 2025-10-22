import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseUnits, formatUnits } from "viem";

describe("YieldVault", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1, user2, agent] = await viem.getWalletClients();

  let yieldVault: any;
  let mockPYUSD: any;
  let mockPyth: any;
  let pythIntegrator: any;
  let intentManager: any;
  let bridgeHook: any;

  const PYUSD_DECIMALS = 6;
  const INITIAL_SUPPLY = parseUnits("1000000", PYUSD_DECIMALS);
  const DEPOSIT_AMOUNT = parseUnits("1000", PYUSD_DECIMALS);

  beforeEach(async function () {
    // Deploy MockPYUSD
    mockPYUSD = await viem.deployContract("MockPYUSD");

    // Deploy MockPyth
    mockPyth = await viem.deployContract("MockPyth");

    // Deploy PythIntegrator
    pythIntegrator = await viem.deployContract("PythIntegrator", [
      mockPyth.address
    ]);

    // Deploy BridgeHook
    bridgeHook = await viem.deployContract("BridgeHook");

    // Deploy YieldVault
    yieldVault = await viem.deployContract("YieldVault", [
      "YieldForge Vault",
      "YFV",
      mockPYUSD.address,
      pythIntegrator.address
    ]);

    // Deploy IntentManager
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
    it("Should set the correct name and symbol", async function () {
      assert.equal(await yieldVault.read.name(), "YieldForge Vault");
      assert.equal(await yieldVault.read.symbol(), "YFV");
    });

    it("Should set the correct PYUSD address", async function () {
      assert.equal(await yieldVault.read.PYUSD(), mockPYUSD.address);
    });

    it("Should set the correct Pyth integrator", async function () {
      assert.equal(await yieldVault.read.pythIntegrator(), pythIntegrator.address);
    });

    it("Should grant admin role to deployer", async function () {
      const adminRole = await yieldVault.read.DEFAULT_ADMIN_ROLE();
      assert.equal(
        await yieldVault.read.hasRole([adminRole, owner.account.address]),
        true
      );
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit PYUSD", async function () {
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await viem.assertions.emitWithArgs(
        yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
          account: user1.account
        }),
        yieldVault,
        "DepositEvent",
        [user1.account.address, DEPOSIT_AMOUNT, DEPOSIT_AMOUNT, BigInt(await getCurrentTimestamp())]
      );

      assert.equal(await yieldVault.read.balanceOf([user1.account.address]), DEPOSIT_AMOUNT);
      assert.equal(await yieldVault.read.totalAssets(), DEPOSIT_AMOUNT);
    });

    it("Should reject deposits below minimum amount", async function () {
      const minAmount = parseUnits("0.5", PYUSD_DECIMALS);
      
      await assert.rejects(
        yieldVault.write.deposit([minAmount, user1.account.address], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });

    it("Should reject deposits above maximum amount", async function () {
      const maxAmount = parseUnits("2000000", PYUSD_DECIMALS);
      
      await assert.rejects(
        yieldVault.write.deposit([maxAmount, user1.account.address], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });

    it("Should not allow deposits when paused", async function () {
      await yieldVault.write.pause();
      
      await assert.rejects(
        yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
          account: user1.account
        }),
        /VaultPaused/
      );
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });
    });

    it("Should allow users to withdraw PYUSD", async function () {
      await viem.assertions.emitWithArgs(
        yieldVault.write.withdraw([DEPOSIT_AMOUNT, user1.account.address, user1.account.address], {
          account: user1.account
        }),
        yieldVault,
        "WithdrawEvent",
        [user1.account.address, DEPOSIT_AMOUNT, DEPOSIT_AMOUNT, BigInt(await getCurrentTimestamp())]
      );

      assert.equal(await yieldVault.read.balanceOf([user1.account.address]), 0n);
      assert.equal(await yieldVault.read.totalAssets(), 0n);
    });

    it("Should allow users to redeem shares", async function () {
      const shares = await yieldVault.read.balanceOf([user1.account.address]);
      
      await viem.assertions.emitWithArgs(
        yieldVault.write.redeem([shares, user1.account.address, user1.account.address], {
          account: user1.account
        }),
        yieldVault,
        "WithdrawEvent",
        [user1.account.address, shares, DEPOSIT_AMOUNT, BigInt(await getCurrentTimestamp())]
      );

      assert.equal(await yieldVault.read.balanceOf([user1.account.address]), 0n);
    });

    it("Should not allow withdrawals when paused", async function () {
      await yieldVault.write.pause();
      
      await assert.rejects(
        yieldVault.write.withdraw([DEPOSIT_AMOUNT, user1.account.address, user1.account.address], {
          account: user1.account
        }),
        /VaultPaused/
      );
    });
  });

  describe("Yield Accrual", function () {
    beforeEach(async function () {
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });
    });

    it("Should accrue yield over time", async function () {
      // Fast forward time by 1 day
      await viem.test.setNextBlockTimestamp({
        timestamp: BigInt(Math.floor(Date.now() / 1000) + 86400)
      });
      await viem.test.mine();

      // Withdraw to trigger yield accrual
      await yieldVault.write.withdraw([DEPOSIT_AMOUNT, user1.account.address, user1.account.address], {
        account: user1.account
      });

      const yieldEarned = await yieldVault.read.getYield([user1.account.address]);
      assert(yieldEarned > 0n);
    });

    it("Should allow agents to execute rebalance", async function () {
      const yieldGained = parseUnits("10", PYUSD_DECIMALS);
      const newAPY = 600n; // 6%

      await viem.assertions.emitWithArgs(
        yieldVault.write.executeRebalance([user1.account.address, yieldGained, newAPY], {
          account: agent.account
        }),
        yieldVault,
        "RebalanceExecuted",
        [user1.account.address, yieldGained, newAPY, BigInt(await getCurrentTimestamp())]
      );

      assert.equal(await yieldVault.read.getYield([user1.account.address]), yieldGained);
      assert.equal(await yieldVault.read.totalYieldEarned(), yieldGained);
    });

    it("Should not allow non-agents to execute rebalance", async function () {
      const yieldGained = parseUnits("10", PYUSD_DECIMALS);
      const newAPY = 600n;

      await assert.rejects(
        yieldVault.write.executeRebalance([user1.account.address, yieldGained, newAPY], {
          account: user1.account
        }),
        /UnauthorizedAgent/
      );
    });
  });

  describe("Bridge Operations", function () {
    beforeEach(async function () {
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });
    });

    it("Should allow agents to approve bridge", async function () {
      const bridgeAmount = parseUnits("500", PYUSD_DECIMALS);

      await viem.assertions.emitWithArgs(
        yieldVault.write.approveForBridge([bridgeHook.address, bridgeAmount], {
          account: agent.account
        }),
        yieldVault,
        "BridgeApproval",
        [bridgeHook.address, bridgeAmount, BigInt(await getCurrentTimestamp())]
      );

      const allowance = await mockPYUSD.read.allowance([yieldVault.address, bridgeHook.address]);
      assert.equal(allowance, bridgeAmount);
    });

    it("Should not allow non-agents to approve bridge", async function () {
      const bridgeAmount = parseUnits("500", PYUSD_DECIMALS);

      await assert.rejects(
        yieldVault.write.approveForBridge([bridgeHook.address, bridgeAmount], {
          account: user1.account
        }),
        /UnauthorizedAgent/
      );
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to pause and unpause", async function () {
      await yieldVault.write.pause();
      assert.equal(await yieldVault.read.paused(), true);

      await yieldVault.write.unpause();
      assert.equal(await yieldVault.read.paused(), false);
    });

    it("Should not allow non-admin to pause", async function () {
      await assert.rejects(
        yieldVault.write.pause({ account: user1.account }),
        /AccessControlUnauthorizedAccount/
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount deposits", async function () {
      await assert.rejects(
        yieldVault.write.deposit([0n, user1.account.address], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });

    it("Should handle zero amount withdrawals", async function () {
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });
      
      await assert.rejects(
        yieldVault.write.withdraw([0n, user1.account.address, user1.account.address], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });

    it("Should handle insufficient balance withdrawals", async function () {
      await yieldVault.write.deposit([DEPOSIT_AMOUNT, user1.account.address], {
        account: user1.account
      });
      
      const excessAmount = parseUnits("2000", PYUSD_DECIMALS);
      
      await assert.rejects(
        yieldVault.write.withdraw([excessAmount, user1.account.address, user1.account.address], {
          account: user1.account
        }),
        /InvalidAmount/
      );
    });
  });

  // Helper function to get current timestamp
  async function getCurrentTimestamp(): Promise<number> {
    const block = await publicClient.getBlock();
    return Number(block.timestamp);
  }
});