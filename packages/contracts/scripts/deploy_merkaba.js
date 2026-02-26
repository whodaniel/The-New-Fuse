const hre = require('hardhat');

/**
 * Helper: deploy a contract and wait for the tx to be mined + 1 confirmation.
 * This prevents "nonce too low" and "replacement transaction underpriced" errors
 * on public RPCs that have slow block propagation.
 */
async function deployAndConfirm(factory, args, label) {
  console.log(`  Deploying ${label}...`);
  const contract = await factory.deploy(...args);
  const tx = contract.deploymentTransaction();
  if (tx) {
    console.log(`  Waiting for ${label} tx confirmation (${tx.hash})...`);
    await tx.wait(1); // Wait for 1 block confirmation
  }
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log(`✅ ${label} Deployed: ${addr}`);
  return contract;
}

/**
 * Helper: send a tx and wait for 1 confirmation.
 */
async function sendAndConfirm(txPromise, label) {
  console.log(`  ${label}...`);
  const tx = await txPromise;
  await tx.wait(1);
  console.log(`  ✅ ${label} confirmed`);
}

async function main() {
  console.log('--- 🚀 INITIATING MERKABA DEPLOYMENT SEQUENCE ---');
  console.log('(Each step waits for block confirmation to avoid nonce conflicts)\n');

  // 1. GET ACCOUNTS
  const signers = await hre.ethers.getSigners();
  if (!signers.length) {
    throw new Error(
      'No deployer signer available. Set DEPLOYER_PRIVATE_KEY and BASE_SEPOLIA_RPC_URL (or ARCADE_RPC_HTTP_URL) before running this script.'
    );
  }
  const [deployer] = signers;
  console.log('Deployer:', deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH');
  if (balance === 0n) {
    throw new Error(
      'Deployer has 0 ETH. Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia'
    );
  }
  console.log('');

  // 2. DEPLOY PAYMENT TOKEN (MOCK USDC)
  const Token = await hre.ethers.getContractFactory('MockERC20');
  const arcadeToken = await deployAndConfirm(
    Token,
    ['Arcade Token', 'ARCD'],
    'Payment Token (ARCD)'
  );

  // 3. DEPLOY MERKABA CORE (The Treasury/Battery)
  const MerkabaCore = await hre.ethers.getContractFactory('MerkabaCore');
  const merkaba = await deployAndConfirm(
    MerkabaCore,
    [await arcadeToken.getAddress()],
    'MerkabaCore (Battery)'
  );

  // 4. DEPLOY GENESIS NODES (The Equity/NFTs)
  const GenesisNode = await hre.ethers.getContractFactory('GenesisNode');
  const genesis = await deployAndConfirm(
    GenesisNode,
    [await arcadeToken.getAddress()],
    'GenesisNode (NFTs)'
  );

  // 5. DEPLOY AUCTION ENGINE (The Machine)
  const AuctionEngine = await hre.ethers.getContractFactory('AuctionEngine');
  const engine = await deployAndConfirm(
    AuctionEngine,
    [await arcadeToken.getAddress(), await merkaba.getAddress(), await genesis.getAddress()],
    'AuctionEngine (Machine)'
  );
  const engineAddress = await engine.getAddress();

  console.log('\n--- ⚡ WIRING PERMISSIONS ---');

  // 6. WIRE MERKABA -> ENGINE
  await sendAndConfirm(
    merkaba.transferOwnership(engineAddress),
    'Transfer Merkaba ownership to Engine'
  );

  // 7. MINT GENESIS NODES
  await sendAndConfirm(genesis.mintGenesis(), 'Mint 8 Genesis Nodes');

  console.log('\n--- 🧪 VERIFICATION & SETUP ---');

  // 8. MINT TEST TOKENS
  const mintAmount = hre.ethers.parseEther('1000000');
  await sendAndConfirm(
    arcadeToken.mint(deployer.address, mintAmount),
    'Mint 1,000,000 ARCD to Admin'
  );

  // 9. APPROVE ENGINE
  await sendAndConfirm(
    arcadeToken.approve(engineAddress, mintAmount),
    'Approve Engine to spend ARCD'
  );

  // 10. CREATE FIRST CABINET
  await sendAndConfirm(
    engine.createCabinet(
      'DeepSeek-R1-Genesis',
      hre.ethers.parseEther('100'),
      hre.ethers.parseEther('1'),
      hre.ethers.parseEther('0.2'),
      hre.ethers.parseEther('1')
    ),
    'Create first cabinet: DeepSeek-R1-Genesis'
  );

  console.log('\n--- 🏁 DEPLOYMENT COMPLETE ---');
  const deployment = {
    network: hre.network.name,
    deployer: deployer.address,
    token: await arcadeToken.getAddress(),
    merkaba: await merkaba.getAddress(),
    genesis: await genesis.getAddress(),
    engine: await engine.getAddress(),
  };
  console.table(deployment);

  // Save deployment artifact
  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `merkaba.${hre.network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`📄 Deployment artifact saved: ${outPath}`);

  // Print export-ready env vars
  console.log('\n--- 📋 COPY THESE FOR railway:arcade:chain:sync ---');
  console.log(`export VITE_CONTRACT_TOKEN="${deployment.token}"`);
  console.log(`export VITE_CONTRACT_MERKABA="${deployment.merkaba}"`);
  console.log(`export VITE_CONTRACT_GENESIS="${deployment.genesis}"`);
  console.log(`export VITE_CONTRACT_ENGINE="${deployment.engine}"`);
  console.log(`export ARCADE_AUCTION_ENGINE_ADDRESS="${deployment.engine}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
