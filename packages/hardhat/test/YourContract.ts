import { expect } from "chai";
import { ethers } from "hardhat";
import { IdentityVerification } from "../typechain-types";

describe("IdentityVerification", function () {
  // We define a fixture to reuse the same setup in every test.

  let identityVerification: IdentityVerification;
  let user1: any;
  let user2: any;

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const identityVerificationFactory = await ethers.getContractFactory("IdentityVerification");
    identityVerification = (await identityVerificationFactory.deploy()) as IdentityVerification;
    await identityVerification.waitForDeployment();
  });

  describe("IdentityVerification", function () {
    it("Should allow a user to add their own identity", async function () {
      await identityVerification.connect(user1).addIdentity("Alice", "alice@example.com");
      const identity = await identityVerification.connect(user1).getIdentity(user1.address);
      expect(identity.name).to.equal("Alice");
      expect(identity.email).to.equal("alice@example.com");
      expect(identity.isVerified).to.equal(false);
      expect(identity.exists).to.equal(true);
    });

    it("Should allow a user to update their own identity", async function () {
      await identityVerification.connect(user1).updateIdentity("Alice Updated", "aliceupdated@example.com");
      const identity = await identityVerification.connect(user1).getIdentity(user1.address);
      expect(identity.name).to.equal("Alice Updated");
      expect(identity.email).to.equal("aliceupdated@example.com");
    });

    it("Should allow a user to verify their own identity", async function () {
      await identityVerification.connect(user1).verifyIdentity();
      const identity = await identityVerification.connect(user1).getIdentity(user1.address);
      expect(identity.isVerified).to.equal(true);
    });

    it("Should allow a user to revoke their own identity", async function () {
      await identityVerification.connect(user1).revokeIdentity();
      const identity = await identityVerification.connect(user1).getIdentity(user1.address);
      expect(identity.isVerified).to.equal(false);
    });

    it("Should not allow a user to add an identity that already exists", async function () {
      await expect(identityVerification.connect(user1).addIdentity("Alice", "alice@example.com")).to.be.revertedWith(
        "Identity already exists",
      );
    });

    it("Should not allow a user to update an identity that does not exist", async function () {
      await expect(identityVerification.connect(user2).updateIdentity("Alice", "alice@example.com")).to.be.revertedWith(
        "Identity does not exist",
      );
    });

    it("Should not allow a user to delete an identity that does not exist", async function () {
      await expect(identityVerification.connect(user2).deleteIdentity()).to.be.revertedWith("Identity does not exist");
    });

    it("Should not allow a user to verify an identity that does not exist", async function () {
      await expect(identityVerification.connect(user2).verifyIdentity()).to.be.revertedWith("Identity does not exist");
    });

    it("Should not allow a user to revoke an identity that does not exist", async function () {
      await expect(identityVerification.connect(user2).revokeIdentity()).to.be.revertedWith("Identity does not exist");
    });

    it("Should allow a user to delete their own identity", async function () {
      await identityVerification.connect(user1).deleteIdentity();
      await expect(identityVerification.connect(user1).getIdentity(user1.address)).to.be.revertedWith(
        "Identity does not exist",
      );
    });
  });
});
