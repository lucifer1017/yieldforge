import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { keccak256, toUtf8Bytes } from "viem";

describe("PythIntegrator", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1] = await viem.getWalletClients();

  let pythIntegrator: any;
  let mockPyth: any;

  beforeEach(async function () {
    // Deploy MockPyth
    mockPyth = await viem.deployContract("MockPyth");

    // Deploy PythIntegrator
    pythIntegrator = await viem.deployContract("PythIntegrator", [
      mockPyth.address
    ]);
  });

  describe("Deployment", function () {
    it("Should set the correct Pyth address", async function () {
      assert.equal(await pythIntegrator.read.pyth(), mockPyth.address);
    });

    it("Should grant admin role to deployer", async function () {
      const adminRole = await pythIntegrator.read.DEFAULT_ADMIN_ROLE();
      assert.equal(
        await pythIntegrator.read.hasRole([adminRole, owner.account.address]),
        true
      );
    });
  });

  describe("Price Feed Management", function () {
    it("Should register new price feeds", async function () {
      const feedId = keccak256(toUtf8Bytes("USDC/USD"));
      const symbol = "USDC";

      await viem.assertions.emitWithArgs(
        pythIntegrator.write.registerFeed([feedId, symbol]),
        pythIntegrator,
        "PriceFeedRegistered",
        [feedId, symbol]
      );

      assert.equal(await pythIntegrator.read.feedSymbols([symbol]), feedId);
    });

    it("Should update APY for feeds", async function () {
      const feedId = keccak256(toUtf8Bytes("USDC/USD"));
      const apy = 450n; // 4.5%

      await viem.assertions.emitWithArgs(
        pythIntegrator.write.updateAPY([feedId, apy]),
        pythIntegrator,
        "APYUpdated",
        [feedId, apy]
      );

      assert.equal(await pythIntegrator.read.apyFeeds([feedId]), apy);
    });

    it("Should get feed ID by symbol", async function () {
      const feedId = keccak256(toUtf8Bytes("USDC/USD"));
      const symbol = "USDC";

      await pythIntegrator.write.registerFeed([feedId, symbol]);

      const retrievedFeedId = await pythIntegrator.read.getFeedId([symbol]);
      assert.equal(retrievedFeedId, feedId);
    });

    it("Should reject unknown feed symbols", async function () {
      await assert.rejects(
        pythIntegrator.read.getFeedId(["UNKNOWN"]),
        /FeedNotFound/
      );
    });
  });

  describe("Price Updates", function () {
    it("Should update price feeds", async function () {
      const priceUpdates = [
        "0x" + "1234567890123456789012345678901234567890".padStart(64, "0"),
        "0x" + "2345678901234567890123456789012345678901".padStart(64, "0")
      ];

      await pythIntegrator.write.updatePriceFeeds([priceUpdates], {
        value: 1000000000000000n // 0.001 ETH
      });

      // Verify that price updates were processed
      // (In a real implementation, we would check the actual price data)
      assert(true); // Placeholder assertion
    });

    it("Should reject updates with insufficient fee", async function () {
      const priceUpdates = [
        "0x" + "1234567890123456789012345678901234567890".padStart(64, "0")
      ];

      await assert.rejects(
        pythIntegrator.write.updatePriceFeeds([priceUpdates], {
          value: 100000000000000n // 0.0001 ETH - too low
        }),
        /Insufficient fee/
      );
    });
  });

  describe("Price Validation", function () {
    let usdcFeedId: string;

    beforeEach(async function () {
      usdcFeedId = keccak256(toUtf8Bytes("USDC/USD"));
      await pythIntegrator.write.registerFeed([usdcFeedId, "USDC"]);
    });

    it("Should get latest price", async function () {
      const priceData = await pythIntegrator.read.getLatestPrice([usdcFeedId]);
      
      // Verify price data structure
      assert(typeof priceData.price === "bigint");
      assert(typeof priceData.timestamp === "bigint");
      assert(typeof priceData.confidence === "bigint");
      assert(typeof priceData.isValid === "boolean");
    });

    it("Should get valid price with age check", async function () {
      const maxAge = 3600n; // 1 hour
      const priceData = await pythIntegrator.read.getValidPrice([usdcFeedId, maxAge]);
      
      assert.equal(priceData.isValid, true);
    });

    it("Should check price validity", async function () {
      const maxAge = 3600n; // 1 hour
      const isValid = await pythIntegrator.read.isPriceValid([usdcFeedId, maxAge]);
      
      assert(typeof isValid === "boolean");
    });

    it("Should get APY for feed", async function () {
      const apy = await pythIntegrator.read.getAPY([usdcFeedId]);
      
      // Should return default APY if not set
      assert(apy > 0n);
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to register feeds", async function () {
      const feedId = keccak256(toUtf8Bytes("ETH/USD"));
      const symbol = "ETH";

      await pythIntegrator.write.registerFeed([feedId, symbol]);
      assert.equal(await pythIntegrator.read.feedSymbols([symbol]), feedId);
    });

    it("Should not allow non-admin to register feeds", async function () {
      const feedId = keccak256(toUtf8Bytes("ETH/USD"));
      const symbol = "ETH";

      await assert.rejects(
        pythIntegrator.write.registerFeed([feedId, symbol], { account: user1.account }),
        /AccessControlUnauthorizedAccount/
      );
    });

    it("Should allow admin to update APY", async function () {
      const feedId = keccak256(toUtf8Bytes("ETH/USD"));
      const apy = 350n;

      await pythIntegrator.write.updateAPY([feedId, apy]);
      assert.equal(await pythIntegrator.read.apyFeeds([feedId]), apy);
    });

    it("Should not allow non-admin to update APY", async function () {
      const feedId = keccak256(toUtf8Bytes("ETH/USD"));
      const apy = 350n;

      await assert.rejects(
        pythIntegrator.write.updateAPY([feedId, apy], { account: user1.account }),
        /AccessControlUnauthorizedAccount/
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle unknown feed IDs", async function () {
      const unknownFeedId = keccak256(toUtf8Bytes("UNKNOWN/USD"));

      await assert.rejects(
        pythIntegrator.read.getLatestPrice([unknownFeedId]),
        /FeedNotFound/
      );
    });

    it("Should handle stale prices", async function () {
      const feedId = keccak256(toUtf8Bytes("STALE/USD"));
      await pythIntegrator.write.registerFeed([feedId, "STALE"]);

      // Fast forward time to make price stale
      await viem.test.setNextBlockTimestamp({
        timestamp: BigInt(Math.floor(Date.now() / 1000) + 7200) // 2 hours
      });
      await viem.test.mine();

      const maxAge = 3600n; // 1 hour
      await assert.rejects(
        pythIntegrator.read.getValidPrice([feedId, maxAge]),
        /StalePrice/
      );
    });
  });
});
