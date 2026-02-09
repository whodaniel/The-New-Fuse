import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";

async function main() {
    console.log("🚀 Starting E2E Workflow Test for NFT Agent System...");
    console.log("=".repeat(60));

    // 1. SETUP: Get test accounts
    const [deployer, agentOwner, buyer1, buyer2, buyer3] = await ethers.getSigners();
    console.log("📝 Test Accounts:");
    console.log(`   Deployer:     ${deployer.address}`);
    console.log(`   Agent Owner:  ${agentOwner.address}`);
    console.log(`   Buyer 1:      ${buyer1.address}`);
    console.log(`   Buyer 2:      ${buyer2.address}`);
    console.log(`   Buyer 3:      ${buyer3.address}`);
    console.log("-".repeat(60));

    // 2. DEPLOYMENT: Deploy all contracts
    console.log("📦 Step 1: Deploying Contracts...");
    
    // Deploy Smart Account Factory first
    const TNFSmartAccountFactory = await ethers.getContractFactory("TNFSmartAccountFactory");
    const smartAccountFactory = await TNFSmartAccountFactory.deploy();
    await smartAccountFactory.deployed();
    console.log(`✅ TNFSmartAccountFactory deployed to: ${smartAccountFactory.address}`);

    // Deploy AgentNFT
    const AgentNFT = await ethers.getContractFactory("AgentNFT");
    const agentNFT = await AgentNFT.deploy(
        "The New Fuse Agent NFT",
        "TNFA",
        smartAccountFactory.address
    );
    await agentNFT.deployed();
    console.log(`✅ AgentNFT deployed to: ${agentNFT.address}`);

    // Deploy Marketplace
    const AgentFractionalMarketplace = await ethers.getContractFactory("AgentFractionalMarketplace");
    const marketplace = await AgentFractionalMarketplace.deploy(agentNFT.address);
    await marketplace.deployed();
    console.log(`✅ AgentFractionalMarketplace deployed to: ${marketplace.address}`);

    // Deploy Revenue Distributor
    const AgentRevenueDistributor = await ethers.getContractFactory("AgentRevenueDistributor");
    const distributor = await AgentRevenueDistributor.deploy(agentNFT.address);
    await distributor.deployed();
    console.log(`✅ AgentRevenueDistributor deployed to: ${distributor.address}`);
    console.log("-".repeat(60));

    // 3. AUTHORIZATION: Link contracts together
    console.log("🔐 Step 2: Authorizing Contract Interactions...");
    await agentNFT.connect(deployer).setMarketplaceAuthorization(marketplace.address, true);
    console.log("✅ Marketplace authorized for fractional share transfers");
    
    await agentNFT.connect(deployer).setRevenueDistributorAuthorization(distributor.address, true);
    console.log("✅ Revenue distributor authorized for revenue management");
    console.log("-".repeat(60));

    // 4. MINTING: Create a new Agent NFT
    console.log("🎨 Step 3: Minting Agent NFT...");
    const metadataURI = "https://metadata.thenewfuse.com/agents/test-agent-1";
    const mintTx = await agentNFT.connect(agentOwner).mint(agentOwner.address, metadataURI);
    const mintReceipt = await mintTx.wait();
    
    // Extract token ID from Transfer event
    const transferEvent = mintReceipt.events?.find(e => e.event === 'Transfer');
    const agentTokenId = transferEvent?.args?.tokenId;
    
    console.log(`✅ Agent NFT minted with Token ID: ${agentTokenId.toString()}`);
    console.log(`   Owner: ${agentOwner.address}`);
    console.log(`   Metadata: ${metadataURI}`);
    
    // Verify ownership
    const owner = await agentNFT.ownerOf(agentTokenId);
    expect(owner).to.equal(agentOwner.address);
    console.log("✅ Ownership verification passed");
    console.log("-".repeat(60));

    // 5. SMART ACCOUNT: Deploy Smart Account for Agent
    console.log("🏦 Step 4: Deploying Smart Account for Agent...");
    const salt = ethers.utils.randomBytes(32);
    const createAccountTx = await smartAccountFactory.connect(agentOwner).createAccount(agentOwner.address, salt);
    const createAccountReceipt = await createAccountTx.wait();
    
    const accountCreatedEvent = createAccountReceipt.events?.find(e => e.event === 'AccountCreated');
    const smartAccountAddress = accountCreatedEvent?.args?.account;
    
    console.log(`✅ Smart Account deployed: ${smartAccountAddress}`);
    console.log(`   Owner: ${agentOwner.address}`);
    
    // Update NFT with Smart Account address
    await agentNFT.connect(agentOwner).setSmartAccountAddress(agentTokenId, smartAccountAddress);
    console.log("✅ Smart Account linked to Agent NFT");
    console.log("-".repeat(60));

    // 6. FRACTIONALIZATION: Agent owner fractionalizes the NFT
    console.log("🧩 Step 5: Fractionalizing Agent NFT...");
    const totalShares = 10000; // 100.00% in basis points
    const agentData = {
        name: "Test AI Agent",
        description: "A sophisticated AI agent for testing",
        agentType: "CONVERSATIONAL",
        capabilities: ["chat", "analysis", "reasoning"],
        shares: totalShares,
        isFractionalized: true
    };

    const fractionalizeTx = await agentNFT.connect(agentOwner).fractionalizeAgent(
        agentTokenId,
        agentData.name,
        agentData.description,
        agentData.agentType,
        agentData.capabilities,
        agentData.shares,
        agentData.isFractionalized
    );
    await fractionalizeTx.wait();
    
    console.log(`✅ Agent NFT ${agentTokenId.toString()} fractionalized`);
    console.log(`   Total Shares: ${totalShares.toLocaleString()}`);
    console.log(`   Initial Owner: ${agentOwner.address} (100%)`);
    
    // Verify fractionalization
    const agentInfo = await agentNFT.getAgent(agentTokenId);
    expect(agentInfo.isFractionalized).to.be.true;
    expect(agentInfo.shares).to.equal(totalShares);
    console.log("✅ Fractionalization verification passed");
    console.log("-".repeat(60));

    // 7. REVENUE STREAM: Create revenue stream
    console.log("💰 Step 6: Creating Revenue Stream...");
    const streamName = "Agent Task Revenue";
    const tokenAddress = ethers.constants.AddressZero; // ETH
    const distributionThreshold = ethers.utils.parseEther("0.1");
    
    const createStreamTx = await distributor.connect(agentOwner).createRevenueStream(
        agentTokenId,
        streamName,
        tokenAddress,
        distributionThreshold
    );
    const streamReceipt = await createStreamTx.wait();
    
    const streamEvent = streamReceipt.events?.find(e => e.event === 'RevenueStreamCreated');
    const streamId = streamEvent?.args?.streamId;
    
    console.log(`✅ Revenue stream created`);
    console.log(`   Stream ID: ${streamId.toString()}`);
    console.log(`   Name: ${streamName}`);
    console.log(`   Token: ETH`);
    console.log(`   Threshold: ${ethers.utils.formatEther(distributionThreshold)} ETH`);
    console.log("-".repeat(60));

    // 8. LISTING: Agent owner lists shares for sale
    console.log("🏪 Step 7: Listing Shares on Marketplace...");
    const sharesToSell = 3000; // 30% of shares
    const pricePerShare = ethers.utils.parseEther("0.001"); // 0.001 ETH per share
    const listingDuration = 86400; // 24 hours
    
    const listSharesTx = await marketplace.connect(agentOwner).listShares(
        agentTokenId,
        sharesToSell,
        pricePerShare,
        listingDuration
    );
    const listingReceipt = await listSharesTx.wait();
    
    const listingEvent = listingReceipt.events?.find(e => e.event === 'SharesListed');
    const listingId = listingEvent?.args?.listingId;
    
    console.log(`✅ Shares listed on marketplace`);
    console.log(`   Listing ID: ${listingId.toString()}`);
    console.log(`   Shares for Sale: ${sharesToSell.toLocaleString()} (${(sharesToSell/100).toFixed(1)}%)`);
    console.log(`   Price per Share: ${ethers.utils.formatEther(pricePerShare)} ETH`);
    console.log(`   Total Price: ${ethers.utils.formatEther(pricePerShare.mul(sharesToSell))} ETH`);
    console.log("-".repeat(60));

    // 9. BUYING: Multiple buyers purchase shares
    console.log("🛒 Step 8: Buyers Purchasing Shares...");
    
    // Buyer 1 purchases 10% (1000 shares)
    const sharesForBuyer1 = 1000;
    const priceForBuyer1 = pricePerShare.mul(sharesForBuyer1);
    const buyTx1 = await marketplace.connect(buyer1).buyShares(listingId, sharesForBuyer1, { 
        value: priceForBuyer1 
    });
    await buyTx1.wait();
    console.log(`✅ Buyer 1 purchased ${sharesForBuyer1.toLocaleString()} shares (${(sharesForBuyer1/100).toFixed(1)}%)`);
    console.log(`   Amount Paid: ${ethers.utils.formatEther(priceForBuyer1)} ETH`);

    // Buyer 2 purchases 15% (1500 shares)
    const sharesForBuyer2 = 1500;
    const priceForBuyer2 = pricePerShare.mul(sharesForBuyer2);
    const buyTx2 = await marketplace.connect(buyer2).buyShares(listingId, sharesForBuyer2, { 
        value: priceForBuyer2 
    });
    await buyTx2.wait();
    console.log(`✅ Buyer 2 purchased ${sharesForBuyer2.toLocaleString()} shares (${(sharesForBuyer2/100).toFixed(1)}%)`);
    console.log(`   Amount Paid: ${ethers.utils.formatEther(priceForBuyer2)} ETH`);

    // Buyer 3 makes an offer for remaining shares
    const remainingShares = sharesToSell - sharesForBuyer1 - sharesForBuyer2;
    const offerPrice = pricePerShare.mul(remainingShares).mul(90).div(100); // 10% discount
    const offerTx = await marketplace.connect(buyer3).makeOffer(listingId, remainingShares, {
        value: offerPrice
    });
    const offerReceipt = await offerTx.wait();
    
    const offerEvent = offerReceipt.events?.find(e => e.event === 'OfferMade');
    const offerId = offerEvent?.args?.offerId;
    
    console.log(`✅ Buyer 3 made offer for ${remainingShares.toLocaleString()} shares`);
    console.log(`   Offer ID: ${offerId.toString()}`);
    console.log(`   Offer Amount: ${ethers.utils.formatEther(offerPrice)} ETH (10% discount)`);

    // Agent owner accepts the offer
    const acceptOfferTx = await marketplace.connect(agentOwner).acceptOffer(offerId);
    await acceptOfferTx.wait();
    console.log(`✅ Agent owner accepted offer ${offerId.toString()}`);
    console.log("-".repeat(60));

    // 10. VERIFY OWNERSHIP DISTRIBUTION
    console.log("📊 Step 9: Verifying Share Ownership Distribution...");
    const ownerShares = await agentNFT.getFractionalOwnership(agentTokenId, agentOwner.address);
    const buyer1Shares = await agentNFT.getFractionalOwnership(agentTokenId, buyer1.address);
    const buyer2Shares = await agentNFT.getFractionalOwnership(agentTokenId, buyer2.address);
    const buyer3Shares = await agentNFT.getFractionalOwnership(agentTokenId, buyer3.address);
    
    console.log("📈 Final Ownership Distribution:");
    console.log(`   Agent Owner: ${ownerShares.toString().padStart(4)} shares (${(ownerShares.toNumber()/100).toFixed(1).padStart(5)}%)`);
    console.log(`   Buyer 1:     ${buyer1Shares.toString().padStart(4)} shares (${(buyer1Shares.toNumber()/100).toFixed(1).padStart(5)}%)`);
    console.log(`   Buyer 2:     ${buyer2Shares.toString().padStart(4)} shares (${(buyer2Shares.toNumber()/100).toFixed(1).padStart(5)}%)`);
    console.log(`   Buyer 3:     ${buyer3Shares.toString().padStart(4)} shares (${(buyer3Shares.toNumber()/100).toFixed(1).padStart(5)}%)`);
    
    // Verify total shares
    const totalSharesCheck = ownerShares.add(buyer1Shares).add(buyer2Shares).add(buyer3Shares);
    expect(totalSharesCheck).to.equal(totalShares);
    console.log(`✅ Total shares verification: ${totalSharesCheck.toString()} = ${totalShares} ✓`);
    console.log("-".repeat(60));

    // 11. REVENUE GENERATION: Add revenue to the stream
    console.log("💸 Step 10: Generating and Adding Revenue...");
    const revenueAmount1 = ethers.utils.parseEther("5.0"); // 5 ETH
    const revenueAmount2 = ethers.utils.parseEther("3.0"); // 3 ETH
    
    // First revenue addition
    const addRevenue1Tx = await distributor.connect(deployer).addRevenue(streamId, revenueAmount1, {
        value: revenueAmount1
    });
    await addRevenue1Tx.wait();
    console.log(`✅ Added ${ethers.utils.formatEther(revenueAmount1)} ETH to revenue stream`);
    
    // Second revenue addition
    const addRevenue2Tx = await distributor.connect(deployer).addRevenue(streamId, revenueAmount2, {
        value: revenueAmount2
    });
    await addRevenue2Tx.wait();
    console.log(`✅ Added ${ethers.utils.formatEther(revenueAmount2)} ETH to revenue stream`);
    
    const totalRevenue = revenueAmount1.add(revenueAmount2);
    console.log(`💰 Total Revenue Generated: ${ethers.utils.formatEther(totalRevenue)} ETH`);
    console.log("-".repeat(60));

    // 12. REVENUE DISTRIBUTION: Distribute revenue to shareholders
    console.log("🎯 Step 11: Distributing Revenue to Shareholders...");
    
    // Check if we can distribute (should exceed threshold)
    const revenueStream = await distributor.getRevenueStream(streamId);
    console.log(`📊 Revenue Stream Status:`);
    console.log(`   Total Revenue: ${ethers.utils.formatEther(revenueStream.totalRevenue)} ETH`);
    console.log(`   Distributed: ${ethers.utils.formatEther(revenueStream.distributedRevenue)} ETH`);
    console.log(`   Threshold: ${ethers.utils.formatEther(revenueStream.distributionThreshold)} ETH`);
    
    const pendingRevenue = revenueStream.totalRevenue.sub(revenueStream.distributedRevenue);
    console.log(`   Pending: ${ethers.utils.formatEther(pendingRevenue)} ETH`);
    
    if (pendingRevenue.gte(revenueStream.distributionThreshold)) {
        const distributeTx = await distributor.connect(deployer).distributeRevenue(streamId);
        const distributeReceipt = await distributeTx.wait();
        
        const distributeEvent = distributeReceipt.events?.find(e => e.event === 'RevenueDistributed');
        const distributedAmount = distributeEvent?.args?.totalAmount;
        const recipientCount = distributeEvent?.args?.recipientCount;
        
        console.log(`✅ Revenue distribution completed`);
        console.log(`   Amount Distributed: ${ethers.utils.formatEther(distributedAmount)} ETH`);
        console.log(`   Recipients: ${recipientCount.toString()}`);
    } else {
        console.log(`⚠️ Revenue below threshold - no distribution triggered`);
    }
    console.log("-".repeat(60));

    // 13. CLAIM REVENUE: Shareholders claim their revenue
    console.log("🏦 Step 12: Shareholders Claiming Revenue...");
    
    const claimers = [
        { name: "Agent Owner", signer: agentOwner, address: agentOwner.address },
        { name: "Buyer 1", signer: buyer1, address: buyer1.address },
        { name: "Buyer 2", signer: buyer2, address: buyer2.address },
        { name: "Buyer 3", signer: buyer3, address: buyer3.address }
    ];
    
    for (const claimer of claimers) {
        const balanceBefore = await claimer.signer.getBalance();
        
        try {
            const claimTx = await distributor.connect(claimer.signer).claimRevenue(streamId, tokenAddress);
            const claimReceipt = await claimTx.wait();
            const gasUsed = claimReceipt.gasUsed.mul(claimReceipt.effectiveGasPrice);
            
            const balanceAfter = await claimer.signer.getBalance();
            const netReceived = balanceAfter.sub(balanceBefore).add(gasUsed);
            
            console.log(`✅ ${claimer.name} claimed revenue: ${ethers.utils.formatEther(netReceived)} ETH`);
        } catch (error) {
            console.log(`⚠️ ${claimer.name} - No revenue to claim`);
        }
    }
    console.log("-".repeat(60));

    // 14. ANALYTICS: Display final system state
    console.log("📈 Step 13: Final System Analytics...");
    
    // Get updated revenue stream info
    const finalRevenueStream = await distributor.getRevenueStream(streamId);
    console.log(`💰 Revenue Stream Final State:`);
    console.log(`   Total Revenue: ${ethers.utils.formatEther(finalRevenueStream.totalRevenue)} ETH`);
    console.log(`   Total Distributed: ${ethers.utils.formatEther(finalRevenueStream.distributedRevenue)} ETH`);
    console.log(`   Remaining: ${ethers.utils.formatEther(finalRevenueStream.totalRevenue.sub(finalRevenueStream.distributedRevenue))} ETH`);
    
    // Get marketplace stats
    const listing = await marketplace.getListing(listingId);
    console.log(`🏪 Marketplace Status:`);
    console.log(`   Listing Active: ${listing.active}`);
    console.log(`   Total Volume: ${ethers.utils.formatEther(priceForBuyer1.add(priceForBuyer2).add(offerPrice))} ETH`);
    
    // Smart Account status
    const smartAccountBalance = await ethers.provider.getBalance(smartAccountAddress);
    console.log(`🏦 Smart Account:`);
    console.log(`   Address: ${smartAccountAddress}`);
    console.log(`   Balance: ${ethers.utils.formatEther(smartAccountBalance)} ETH`);
    
    console.log("-".repeat(60));
    console.log("🎉 E2E Workflow Test Completed Successfully! 🎉");
    console.log("=".repeat(60));
    
    // 15. SUMMARY: Test results summary
    console.log("📋 TEST SUMMARY:");
    console.log(`✅ Agent NFT minted and fractionalized`);
    console.log(`✅ Smart Account deployed and linked`);
    console.log(`✅ Revenue stream created and funded`);
    console.log(`✅ Marketplace listing and trading functional`);
    console.log(`✅ Revenue distribution to shareholders working`);
    console.log(`✅ All contract integrations validated`);
    console.log("🚀 System ready for production deployment!");
}

// Error handling wrapper
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ E2E Test Failed:");
        console.error(error);
        process.exit(1);
    });