import { writeFileSync } from 'fs';
import { ethers } from 'hardhat';
import { join } from 'path';

async function main() {
  console.log('Starting deployment of NFT Agent contracts...');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // Deploy Smart Account Factory first
  console.log('\n1. Deploying TNFSmartAccountFactory...');
  const SmartAccountFactory = await ethers.getContractFactory('TNFSmartAccountFactory');
  const smartAccountFactory = await SmartAccountFactory.deploy();
  await smartAccountFactory.deployed();
  console.log('TNFSmartAccountFactory deployed to:', smartAccountFactory.address);

  // Deploy Agent NFT Contract
  console.log('\n2. Deploying AgentNFT...');
  const AgentNFT = await ethers.getContractFactory('AgentNFT');
  const agentNFT = await AgentNFT.deploy(
    'The New Fuse Agent NFT',
    'TNFA',
    smartAccountFactory.address
  );
  await agentNFT.deployed();
  console.log('AgentNFT deployed to:', agentNFT.address);

  // Deploy Fractional Marketplace
  console.log('\n3. Deploying AgentFractionalMarketplace...');
  const Marketplace = await ethers.getContractFactory('AgentFractionalMarketplace');
  const marketplace = await Marketplace.deploy(agentNFT.address);
  await marketplace.deployed();
  console.log('AgentFractionalMarketplace deployed to:', marketplace.address);

  // Deploy Revenue Distributor
  console.log('\n4. Deploying AgentRevenueDistributor...');
  const RevenueDistributor = await ethers.getContractFactory('AgentRevenueDistributor');
  const revenueDistributor = await RevenueDistributor.deploy(agentNFT.address);
  await revenueDistributor.deployed();
  console.log('AgentRevenueDistributor deployed to:', revenueDistributor.address);

  // Configure contract permissions
  console.log('\n5. Configuring contract permissions...');

  // Authorize marketplace to transfer fractional shares
  await agentNFT.setMarketplaceAuthorization(marketplace.address, true);
  console.log('✓ Marketplace authorized for fractional share transfers');

  // Authorize revenue distributor to manage revenue streams
  await agentNFT.setRevenueDistributorAuthorization(revenueDistributor.address, true);
  console.log('✓ Revenue distributor authorized for revenue management');

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    blockNumber: await ethers.provider.getBlockNumber(),
    deploymentTime: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      SmartAccountFactory: {
        address: smartAccountFactory.address,
        transactionHash: smartAccountFactory.deployTransaction.hash,
      },
      AgentNFT: {
        address: agentNFT.address,
        transactionHash: agentNFT.deployTransaction.hash,
      },
      AgentFractionalMarketplace: {
        address: marketplace.address,
        transactionHash: marketplace.deployTransaction.hash,
      },
      AgentRevenueDistributor: {
        address: revenueDistributor.address,
        transactionHash: revenueDistributor.deployTransaction.hash,
      },
    },
  };

  // Write deployment info to file
  const deploymentPath = join(__dirname, `../deployments/deployment-${Date.now()}.json`);
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n✓ Deployment info saved to:', deploymentPath);

  // Write environment variables template
  const envTemplate = `
# NFT Agent Smart Contract Addresses
AGENT_NFT_CONTRACT_ADDRESS=${agentNFT.address}
MARKETPLACE_CONTRACT_ADDRESS=${marketplace.address}
REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS=${revenueDistributor.address}
SMART_ACCOUNT_FACTORY_ADDRESS=${smartAccountFactory.address}

# Network Configuration
CHAIN_ID=${(await ethers.provider.getNetwork()).chainId}
RPC_URL=your-rpc-url-here
PRIVATE_KEY=your-private-key-here
`;

  const envPath = join(__dirname, '../.env.contracts');
  writeFileSync(envPath, envTemplate);
  console.log('✓ Environment template saved to:', envPath);

  console.log('\n🎉 Deployment completed successfully!');
  console.log('\nContract Addresses:');
  console.log('==================');
  console.log('SmartAccountFactory:', smartAccountFactory.address);
  console.log('AgentNFT:', agentNFT.address);
  console.log('Marketplace:', marketplace.address);
  console.log('RevenueDistributor:', revenueDistributor.address);

  console.log('\nNext steps:');
  console.log('1. Update your .env file with the contract addresses');
  console.log('2. Verify contracts on block explorer if needed');
  console.log('3. Test the deployment with the provided test scripts');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
