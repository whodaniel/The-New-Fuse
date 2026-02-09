import { ethers } from "hardhat";

async function main() {
  console.log("Testing NFT Agent deployment...");
  
  const [deployer, user1, user2] = await ethers.getSigners();
  
  // Get deployed contract addresses (you'll need to update these after deployment)
  const agentNFTAddress = process.env.AGENT_NFT_CONTRACT_ADDRESS;
  const marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;
  const revenueDistributorAddress = process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS;
  const smartAccountFactoryAddress = process.env.SMART_ACCOUNT_FACTORY_ADDRESS;

  if (!agentNFTAddress || !marketplaceAddress || !revenueDistributorAddress || !smartAccountFactoryAddress) {
    console.error("Contract addresses not found in environment variables");
    process.exit(1);
  }

  // Get contract instances
  const agentNFT = await ethers.getContractAt("AgentNFT", agentNFTAddress);
  const marketplace = await ethers.getContractAt("AgentFractionalMarketplace", marketplaceAddress);
  const revenueDistributor = await ethers.getContractAt("AgentRevenueDistributor", revenueDistributorAddress);
  const smartAccountFactory = await ethers.getContractAt("TNFSmartAccountFactory", smartAccountFactoryAddress);

  console.log("\n🧪 Test 1: Mint Agent NFT");
  const mintTx = await agentNFT.mint(
    user1.address,
    "https://metadata.thenewfuse.com/agents/test-agent-1"
  );
  const mintReceipt = await mintTx.wait();
  const tokenId = mintReceipt.events?.find(e => e.event === 'Transfer')?.args?.tokenId;
  console.log("✓ Agent NFT minted with token ID:", tokenId?.toString());

  console.log("\n🧪 Test 2: Create Smart Account for Agent");
  const salt = Math.floor(Math.random() * 1000000);
  const createAccountTx = await smartAccountFactory.createAccount(user1.address, salt);
  const accountReceipt = await createAccountTx.wait();
  const smartAccountAddress = accountReceipt.events?.find(e => e.event === 'AccountCreated')?.args?.account;
  console.log("✓ Smart Account created:", smartAccountAddress);

  console.log("\n🧪 Test 3: Fractionalize Agent NFT");
  const fractionalizeData = {
    name: "Test Agent",
    description: "A test agent for NFT functionality",
    agentType: "GENERIC",
    capabilities: ["test", "demo"],
    shares: 10000, // 100.00% in basis points
    isFractionalized: true
  };
  
  const fractionalizeTx = await agentNFT.fractionalizeAgent(
    tokenId,
    fractionalizeData.name,
    fractionalizeData.description,
    fractionalizeData.agentType,
    fractionalizeData.capabilities,
    fractionalizeData.shares,
    fractionalizeData.isFractionalized
  );
  await fractionalizeTx.wait();
  console.log("✓ Agent NFT fractionalized");

  console.log("\n🧪 Test 4: Create Revenue Stream");
  const createStreamTx = await revenueDistributor.createRevenueStream(
    tokenId,
    "Test Revenue Stream",
    ethers.constants.AddressZero, // ETH
    ethers.utils.parseEther("0.1") // 0.1 ETH threshold
  );
  const streamReceipt = await createStreamTx.wait();
  const streamId = streamReceipt.events?.find(e => e.event === 'RevenueStreamCreated')?.args?.streamId;
  console.log("✓ Revenue stream created with ID:", streamId?.toString());

  console.log("\n🧪 Test 5: List Fractional Shares on Marketplace");
  const listSharesTx = await marketplace.connect(user1).listShares(
    tokenId,
    1000, // 10% of shares
    ethers.utils.parseEther("0.01"), // 0.01 ETH per share
    86400 // 24 hours
  );
  const listReceipt = await listSharesTx.wait();
  const listingId = listReceipt.events?.find(e => e.event === 'SharesListed')?.args?.listingId;
  console.log("✓ Shares listed on marketplace with listing ID:", listingId?.toString());

  console.log("\n🧪 Test 6: Make Offer on Listed Shares");
  const makeOfferTx = await marketplace.connect(user2).makeOffer(
    listingId,
    500, // 5% of shares
    {
      value: ethers.utils.parseEther("0.005") // 0.005 ETH offer
    }
  );
  const offerReceipt = await makeOfferTx.wait();
  const offerId = offerReceipt.events?.find(e => e.event === 'OfferMade')?.args?.offerId;
  console.log("✓ Offer made with offer ID:", offerId?.toString());

  console.log("\n🧪 Test 7: Add Revenue to Stream");
  const addRevenueTx = await revenueDistributor.addRevenue(
    streamId,
    ethers.utils.parseEther("0.2"),
    {
      value: ethers.utils.parseEther("0.2") // 0.2 ETH
    }
  );
  await addRevenueTx.wait();
  console.log("✓ Revenue added to stream");

  console.log("\n🧪 Test 8: Distribute Revenue");
  const distributeTx = await revenueDistributor.distributeRevenue(streamId);
  const distributeReceipt = await distributeTx.wait();
  const distributedAmount = distributeReceipt.events?.find(e => e.event === 'RevenueDistributed')?.args?.totalAmount;
  console.log("✓ Revenue distributed:", ethers.utils.formatEther(distributedAmount || "0"), "ETH");

  console.log("\n✅ All tests completed successfully!");
  console.log("\nContract Status Summary:");
  console.log("=======================");
  console.log("AgentNFT:", agentNFTAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("RevenueDistributor:", revenueDistributorAddress);
  console.log("SmartAccountFactory:", smartAccountFactoryAddress);
  console.log("Test Agent Token ID:", tokenId?.toString());
  console.log("Smart Account Address:", smartAccountAddress);
  console.log("Revenue Stream ID:", streamId?.toString());
  console.log("Marketplace Listing ID:", listingId?.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });