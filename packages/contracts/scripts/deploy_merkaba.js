const hre = require('hardhat');

/**
 * Deploy with explicit nonce + gas management to avoid mempool conflicts.
 */
async function deployAndConfirm(factory, args, label, signer, nonce) {
  console.log(`  [nonce ${nonce}] Deploying ${label}...`);

  // Get current fee data and bump it 2x to replace any stuck txs
  const feeData = await hre.ethers.provider.getFeeData();
  const overrides = {
    nonce,
    maxFeePerGas: feeData.maxFeePerGas * 3n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 3n,
  };

  const contract = await factory.deploy(...args, overrides);
  const tx = contract.deploymentTransaction();
  if (tx) {
    console.log(`  Waiting for confirmation (${tx.hash})...`);
    await tx.wait(2); // Wait for 2 confirmations
  }
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log(`✅ ${label}: ${addr}\n`);
  return contract;
}

async function sendAndConfirm(txPromise, label) {
  console.log(`  ${label}...`);
  const tx = await txPromise;
  await tx.wait(2);
  console.log(`  ✅ ${label} confirmed\n`);
}

async function main() {
  console.log('--- 🚀 MERKABA DEPLOYMENT (NONCE-SAFE MODE) ---\n');

  const signers = await hre.ethers.getSigners();
  if (!signers.length) {
    throw new Error('No deployer signer. Set DEPLOYER_PRIVATE_KEY.');
  }
  const [deployer] = signers;
  console.log('Deployer:', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH');
  if (balance === 0n) {
    throw new Error('Balance is 0. Get testnet ETH first.');
  }

  // Get the CONFIRMED nonce (ignoring any pending mempool txs)
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address, 'latest');
  console.log('Starting nonce:', nonce);
  console.log('');

  // 1. Token
  const Token = await hre.ethers.getContractFactory('MockERC20');
  const arcadeToken = await deployAndConfirm(
    Token,
    ['Arcade Token', 'ARCD'],
    'Payment Token',
    deployer,
    nonce++
  );

  // 2. MerkabaCore
  const MerkabaCore = await hre.ethers.getContractFactory('MerkabaCore');
  const merkaba = await deployAndConfirm(
    MerkabaCore,
    [await arcadeToken.getAddress()],
    'MerkabaCore',
    deployer,
    nonce++
  );

  // 3. GenesisNode
  const GenesisNode = await hre.ethers.getContractFactory('GenesisNode');
  const genesis = await deployAndConfirm(
    GenesisNode,
    [await arcadeToken.getAddress()],
    'GenesisNode',
    deployer,
    nonce++
  );

  // 4. AuctionEngine
  const AuctionEngine = await hre.ethers.getContractFactory('AuctionEngine');
  const engine = await deployAndConfirm(
    AuctionEngine,
    [await arcadeToken.getAddress(), await merkaba.getAddress(), await genesis.getAddress()],
    'AuctionEngine',
    deployer,
    nonce++
  );
  const engineAddress = await engine.getAddress();

  console.log('--- ⚡ WIRING PERMISSIONS ---\n');

  // 5. Transfer Merkaba ownership to Engine
  await sendAndConfirm(merkaba.transferOwnership(engineAddress), 'Transfer Merkaba → Engine');

  // 6. Mint Genesis Nodes
  await sendAndConfirm(genesis.mintGenesis(), 'Mint 8 Genesis Nodes');

  console.log('--- 🧪 SETUP ---\n');

  // 7. Mint test tokens
  const mintAmount = hre.ethers.parseEther('1000000');
  await sendAndConfirm(arcadeToken.mint(deployer.address, mintAmount), 'Mint 1M ARCD');

  // 8. Approve Engine
  await sendAndConfirm(arcadeToken.approve(engineAddress, mintAmount), 'Approve Engine');

  // 9. Create first cabinet
  await sendAndConfirm(
    engine.createCabinet(
      'DeepSeek-R1-Genesis',
      hre.ethers.parseEther('100'),
      hre.ethers.parseEther('1'),
      hre.ethers.parseEther('0.2'),
      hre.ethers.parseEther('1')
    ),
    'Create cabinet: DeepSeek-R1-Genesis'
  );

  // --- OUTPUT ---
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

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `merkaba.${hre.network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`📄 Saved: ${outPath}`);

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
