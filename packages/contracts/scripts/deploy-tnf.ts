import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting TNF Ecosystem Deployment...");

  // CONSTANTS
  const UD_REGISTRY = "0xa9a6A14A3645144487de29A04f8461b35430001"; // Polygon Mainnet UNS
  const TREASURY = process.env.PLATFORM_TREASURY_ADDRESS || "0x0000000000000000000000000000000000000000"; // Fallback to burn

  // 1. Deploy Agency Registry (B2B Licensing)
  console.log("Deploying FuseAgencyRegistry...");
  const AgencyReg = await ethers.deployContract("FuseAgencyRegistry");
  await AgencyReg.waitForDeployment();
  console.log(`✅ FuseAgencyRegistry deployed to: ${await AgencyReg.getAddress()}`);
  
  // 2. Deploy SFT (Fractional Ownership)
  console.log("Deploying AgentSponsorshipSFT...");
  const SFT = await ethers.deployContract("AgentSponsorshipSFT", [UD_REGISTRY]);
  await SFT.waitForDeployment();
  console.log(`✅ AgentSponsorshipSFT deployed to: ${await SFT.getAddress()}`);

  // 3. Deploy Revenue Router (Financial Brain)
  console.log("Deploying FuseRevenueRouter...");
  const Router = await ethers.deployContract("FuseRevenueRouter", [
      await SFT.getAddress(), 
      await AgencyReg.getAddress(),
      TREASURY
  ]);
  await Router.waitForDeployment();
  console.log(`✅ FuseRevenueRouter deployed to: ${await Router.getAddress()}`);

  // 4. Deploy Auction Manager (Rentals/Sales)
  console.log("Deploying FuseAuctionManager...");
  const Auction = await ethers.deployContract("FuseAuctionManager");
  await Auction.waitForDeployment();
  console.log(`✅ FuseAuctionManager deployed to: ${await Auction.getAddress()}`);

  // 5. Deploy Badges (Soulbound Reputation)
  console.log("Deploying FuseBadges...");
  const Badges = await ethers.deployContract("FuseBadges");
  await Badges.waitForDeployment();
  console.log(`✅ FuseBadges deployed to: ${await Badges.getAddress()}`);

  console.log("\n✨ Deployment Complete! Copy these addresses to your .env file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
