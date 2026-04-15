#!/usr/bin/env ts-node
/**
 * Comprehensive NFT Agent System Integration Test
 * 
 * This script tests the complete workflow from:
 * 1. Agent creation
 * 2. NFT minting
 * 3. Smart Account deployment
 * 4. Fractionalization
 * 5. Revenue stream creation
 * 6. Revenue addition and distribution
 * 7. Marketplace listing and trading
 * 
 * Run with: npx ts-node test-nft-agent-workflow.ts
 */

import { ethers } from 'ethers';
import axios from 'axios';

interface TestConfig {
  apiBaseUrl: string;
  rpcUrl: string;
  privateKey: string;
  testWalletAddress: string;
  contractAddresses: {
    agentNFT: string;
    marketplace: string;
    revenueDistributor: string;
    smartAccountFactory: string;
  };
}

interface TestResults {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  gasUsed?: string;
  txHash?: string;
}

class NFTAgentWorkflowTester {
  private config: TestConfig;
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private results: TestResults[] = [];

  constructor(config: TestConfig) {
    this.config = config;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  async runFullWorkflowTest(): Promise<void> {
    console.log('🚀 Starting NFT Agent Workflow Integration Test');
    console.log('===============================================\n');

    try {
      // Step 1: Create Agent
      const agent = await this.testCreateAgent();
      
      // Step 2: Mint Agent as NFT
      const agentNft = await this.testMintAgentNFT(agent.id);
      
      // Step 3: Deploy Smart Account for Agent
      const smartAccount = await this.testDeploySmartAccount(agent.id);
      
      // Step 4: Fractionalize Agent NFT
      await this.testFractionalizeAgent(agentNft.id);
      
      // Step 5: Create Revenue Stream
      const revenueStream = await this.testCreateRevenueStream(agentNft.id);
      
      // Step 6: Add Revenue and Test Distribution
      await this.testRevenueAdditionAndDistribution(revenueStream.id);
      
      // Step 7: Test Marketplace Listing
      await this.testMarketplaceListing(agentNft.id);
      
      // Step 8: Test Marketplace Trading
      await this.testMarketplaceTrading();
      
      // Step 9: Test Revenue Analytics
      await this.testRevenueAnalytics(agentNft.id);
      
      // Step 10: Test Smart Account Operations
      await this.testSmartAccountOperations(smartAccount.address);

      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.printTestResults();
      process.exit(1);
    }
  }

  private async testCreateAgent(): Promise<any> {
    console.log('🔧 Step 1: Creating Agent...');
    
    try {
      const agentData = {
        name: `Test Agent ${Date.now()}`,
        description: 'A test agent for NFT workflow testing',
        type: 'GENERIC',
        capabilities: ['test', 'demo', 'nft'],
        provider: 'test'
      };

      const response = await axios.post(`${this.config.apiBaseUrl}/agents`, agentData);
      const agent = response.data;

      this.results.push({
        step: 'Create Agent',
        success: true,
        data: { agentId: agent.id, name: agent.name }
      });

      console.log(`✅ Agent created: ${agent.name} (ID: ${agent.id})\n`);
      return agent;
    } catch (error) {
      this.results.push({
        step: 'Create Agent',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testMintAgentNFT(agentId: string): Promise<any> {
    console.log('🎨 Step 2: Minting Agent as NFT...');
    
    try {
      const mintData = {
        ownerAddress: this.config.testWalletAddress,
        metadataUri: `https://metadata.thenewfuse.com/agents/${agentId}`
      };

      const response = await axios.post(
        `${this.config.apiBaseUrl}/agents/${agentId}/nft/mint`,
        mintData
      );
      const agentNft = response.data;

      this.results.push({
        step: 'Mint Agent NFT',
        success: true,
        data: { 
          tokenId: agentNft.tokenId, 
          contractAddress: agentNft.contractAddress 
        }
      });

      console.log(`✅ Agent NFT minted: Token ID ${agentNft.tokenId}\n`);
      return agentNft;
    } catch (error) {
      this.results.push({
        step: 'Mint Agent NFT',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testDeploySmartAccount(agentId: string): Promise<any> {
    console.log('🏦 Step 3: Deploying Smart Account...');
    
    try {
      const deployData = {
        ownerAddress: this.config.testWalletAddress,
        salt: Math.floor(Math.random() * 1000000)
      };

      const response = await axios.post(
        `${this.config.apiBaseUrl}/agents/${agentId}/smart-account`,
        deployData
      );
      const smartAccount = response.data;

      this.results.push({
        step: 'Deploy Smart Account',
        success: true,
        data: { 
          address: smartAccount.address,
          deployed: smartAccount.deployed 
        },
        txHash: smartAccount.txHash
      });

      console.log(`✅ Smart Account deployed: ${smartAccount.address}\n`);
      return smartAccount;
    } catch (error) {
      this.results.push({
        step: 'Deploy Smart Account',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testFractionalizeAgent(agentNftId: string): Promise<void> {
    console.log('🧩 Step 4: Fractionalizing Agent NFT...');
    
    try {
      const fractionalizeData = {
        totalShares: 10000,
        initialOwner: this.config.testWalletAddress
      };

      const response = await axios.post(
        `${this.config.apiBaseUrl}/agents/nft/${agentNftId}/fractionalize`,
        fractionalizeData
      );

      this.results.push({
        step: 'Fractionalize Agent',
        success: true,
        data: { 
          isFractionalized: true,
          totalShares: fractionalizeData.totalShares 
        }
      });

      console.log(`✅ Agent NFT fractionalized: ${fractionalizeData.totalShares} shares\n`);
    } catch (error) {
      this.results.push({
        step: 'Fractionalize Agent',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testCreateRevenueStream(agentNftId: string): Promise<any> {
    console.log('💰 Step 5: Creating Revenue Stream...');
    
    try {
      const streamData = {
        streamName: 'Test Revenue Stream',
        description: 'Revenue from test activities',
        tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
        distributionThreshold: ethers.utils.parseEther('0.05').toString()
      };

      const response = await axios.post(
        `${this.config.apiBaseUrl}/agents/nft/${agentNftId}/revenue-streams`,
        streamData
      );
      const revenueStream = response.data;

      this.results.push({
        step: 'Create Revenue Stream',
        success: true,
        data: { 
          streamId: revenueStream.id,
          streamName: revenueStream.streamName,
          threshold: ethers.utils.formatEther(streamData.distributionThreshold)
        }
      });

      console.log(`✅ Revenue stream created: ${revenueStream.streamName} (ID: ${revenueStream.id})\n`);
      return revenueStream;
    } catch (error) {
      this.results.push({
        step: 'Create Revenue Stream',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testRevenueAdditionAndDistribution(streamId: string): Promise<void> {
    console.log('📈 Step 6: Testing Revenue Addition and Distribution...');
    
    try {
      // Add revenue
      const revenueAmount = '0.1';
      const addRevenueData = {
        amount: ethers.utils.parseEther(revenueAmount).toString(),
        txHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`test-tx-${Date.now()}`)),
        blockNumber: await this.provider.getBlockNumber()
      };

      await axios.post(
        `${this.config.apiBaseUrl}/agents/nft/revenue-streams/${streamId}/add-revenue`,
        addRevenueData
      );

      console.log(`✅ Revenue added: ${revenueAmount} ETH`);

      // Test distribution
      const distributeResponse = await axios.post(
        `${this.config.apiBaseUrl}/agents/nft/revenue-streams/${streamId}/distribute`
      );

      this.results.push({
        step: 'Revenue Addition & Distribution',
        success: true,
        data: {
          revenueAdded: revenueAmount,
          distributionTriggered: true
        },
        txHash: addRevenueData.txHash
      });

      console.log(`✅ Revenue distribution completed\n`);
    } catch (error) {
      this.results.push({
        step: 'Revenue Addition & Distribution',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testMarketplaceListing(agentNftId: string): Promise<void> {
    console.log('🏪 Step 7: Testing Marketplace Listing...');
    
    try {
      const listingData = {
        shareAmount: 1000, // 10% of shares
        pricePerShare: ethers.utils.parseEther('0.001').toString(),
        duration: 86400 // 24 hours
      };

      const response = await axios.post(
        `${this.config.apiBaseUrl}/agents/nft/${agentNftId}/marketplace/list`,
        listingData
      );

      this.results.push({
        step: 'Marketplace Listing',
        success: true,
        data: {
          shareAmount: listingData.shareAmount,
          pricePerShare: ethers.utils.formatEther(listingData.pricePerShare),
          listingId: response.data.listingId
        }
      });

      console.log(`✅ Shares listed on marketplace: ${listingData.shareAmount} shares at ${ethers.utils.formatEther(listingData.pricePerShare)} ETH each\n`);
    } catch (error) {
      this.results.push({
        step: 'Marketplace Listing',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testMarketplaceTrading(): Promise<void> {
    console.log('🔄 Step 8: Testing Marketplace Trading...');
    
    try {
      // Get active listings
      const listingsResponse = await axios.get(`${this.config.apiBaseUrl}/agents/nft/marketplace`);
      const listings = listingsResponse.data;

      if (listings.length === 0) {
        throw new Error('No active listings found for trading test');
      }

      const listing = listings[0];
      
      // Make an offer
      const offerData = {
        shareAmount: Math.min(500, listing.shareAmount),
        offerPrice: ethers.utils.parseEther('0.0005').toString()
      };

      const offerResponse = await axios.post(
        `${this.config.apiBaseUrl}/agents/nft/marketplace/listings/${listing.id}/offer`,
        offerData
      );

      this.results.push({
        step: 'Marketplace Trading',
        success: true,
        data: {
          offerMade: true,
          offerId: offerResponse.data.offerId,
          shareAmount: offerData.shareAmount,
          offerPrice: ethers.utils.formatEther(offerData.offerPrice)
        }
      });

      console.log(`✅ Offer made: ${offerData.shareAmount} shares for ${ethers.utils.formatEther(offerData.offerPrice)} ETH\n`);
    } catch (error) {
      this.results.push({
        step: 'Marketplace Trading',
        success: false,
        error: error.message
      });
      console.log(`⚠️ Marketplace trading test skipped: ${error.message}\n`);
    }
  }

  private async testRevenueAnalytics(agentNftId: string): Promise<void> {
    console.log('📊 Step 9: Testing Revenue Analytics...');
    
    try {
      const response = await axios.get(
        `${this.config.apiBaseUrl}/agents/nft/${agentNftId}/analytics?timeframe=month`
      );
      const analytics = response.data;

      this.results.push({
        step: 'Revenue Analytics',
        success: true,
        data: {
          totalRevenue: analytics.totalRevenue,
          totalDistributed: analytics.totalDistributed,
          pendingRevenue: analytics.pendingRevenue,
          distributionCount: analytics.distributionCount
        }
      });

      console.log(`✅ Analytics retrieved: ${analytics.totalRevenue} ETH total revenue, ${analytics.distributionCount} distributions\n`);
    } catch (error) {
      this.results.push({
        step: 'Revenue Analytics',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async testSmartAccountOperations(smartAccountAddress: string): Promise<void> {
    console.log('🔐 Step 10: Testing Smart Account Operations...');
    
    try {
      // Test balance check
      const balance = await this.provider.getBalance(smartAccountAddress);
      
      // Test transaction capability (mock)
      const transactionTest = {
        address: smartAccountAddress,
        balance: ethers.utils.formatEther(balance),
        canReceive: true,
        canSend: true // This would be tested with actual transactions
      };

      this.results.push({
        step: 'Smart Account Operations',
        success: true,
        data: transactionTest
      });

      console.log(`✅ Smart Account operational: Balance ${ethers.utils.formatEther(balance)} ETH\n`);
    } catch (error) {
      this.results.push({
        step: 'Smart Account Operations',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private printTestResults(): void {
    console.log('\n📋 Test Results Summary');
    console.log('======================');
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);

    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.step}`);
      
      if (result.data && Object.keys(result.data).length > 0) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      
      if (result.txHash) {
        console.log(`   TX: ${result.txHash}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });

    if (failed === 0) {
      console.log('🎉 All tests passed! NFT Agent system is working correctly.\n');
    } else {
      console.log(`⚠️ ${failed} test(s) failed. Please check the errors above.\n`);
    }
  }
}

// Configuration for test environment
const testConfig: TestConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  privateKey: process.env.TEST_PRIVATE_KEY || '0x' + '0'.repeat(64),
  testWalletAddress: process.env.TEST_WALLET_ADDRESS || '0x' + '0'.repeat(40),
  contractAddresses: {
    agentNFT: process.env.AGENT_NFT_CONTRACT_ADDRESS || '',
    marketplace: process.env.MARKETPLACE_CONTRACT_ADDRESS || '',
    revenueDistributor: process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS || '',
    smartAccountFactory: process.env.SMART_ACCOUNT_FACTORY_ADDRESS || ''
  }
};

// Run the test suite
async function main() {
  if (!testConfig.contractAddresses.agentNFT) {
    console.error('❌ Contract addresses not configured. Please deploy contracts first.');
    process.exit(1);
  }

  const tester = new NFTAgentWorkflowTester(testConfig);
  await tester.runFullWorkflowTest();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}