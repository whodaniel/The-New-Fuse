const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('--- 🚀 DEPLOY SIDEPOT + PRIZE HOOK ROUTER ---');
  const signers = await hre.ethers.getSigners();
  if (!signers.length) {
    throw new Error(
      'No deployer signer available. Set DEPLOYER_PRIVATE_KEY and BASE_SEPOLIA_RPC_URL (or ARCADE_RPC_HTTP_URL).'
    );
  }
  const [deployer, treasurySigner] = signers;
  const treasury = treasurySigner || deployer;
  const network = hre.network.name;
  console.log('Deployer:', deployer.address);
  console.log('Treasury:', treasury.address);
  console.log('Network:', network);

  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address, 'pending');
  const deployWithRetry = async (factory, args, label) => {
    let attempt = 0;
    while (true) {
      attempt += 1;
      const feeData = await hre.ethers.provider.getFeeData();
      const baseMaxFee = feeData.maxFeePerGas || hre.ethers.parseUnits('1', 'gwei');
      const basePriority = feeData.maxPriorityFeePerGas || hre.ethers.parseUnits('1', 'gwei');
      const bump = BigInt(3 + attempt);
      try {
        const contract = await factory.deploy(...args, {
          nonce: nonce++,
          maxFeePerGas: baseMaxFee * bump,
          maxPriorityFeePerGas: basePriority * bump,
        });
        const tx = contract.deploymentTransaction();
        if (tx) await tx.wait(2);
        await contract.waitForDeployment();
        return contract;
      } catch (error) {
        const msg = String(error && error.message ? error.message : error).toLowerCase();
        if (
          (msg.includes('replacement transaction underpriced') || msg.includes('nonce too low')) &&
          attempt < 5
        ) {
          console.log(`Retry ${attempt} for ${label} due to nonce/fee conflict...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw error;
      }
    }
  };

  const Token = await hre.ethers.getContractFactory('MockERC20');
  const token = await deployWithRetry(Token, ['Mock Prize', 'MPRZ'], 'Mock Prize Token');
  await token.waitForDeployment();

  const SidepotManager = await hre.ethers.getContractFactory('SidepotManager');
  const sidepot = await deployWithRetry(
    SidepotManager,
    [await token.getAddress()],
    'SidepotManager'
  );
  await sidepot.waitForDeployment();

  const createTx = await sidepot.createPot('hourly-sidepot', 0);
  await createTx.wait();

  // Use deployer as temporary prizeVault in local/dev.
  const prizeVault = deployer.address;
  const sidepotId = 1;
  const sidepotBps = 1000; // 10%
  const treasuryBps = 1500; // 15%

  const Router = await hre.ethers.getContractFactory('PTPrizeHookRouter');
  const router = await Router.deploy(
    await token.getAddress(),
    await sidepot.getAddress(),
    prizeVault,
    treasury.address,
    sidepotId,
    sidepotBps,
    treasuryBps
  );
  await router.waitForDeployment();

  const setRouterTx = await sidepot.setRouter(await router.getAddress());
  await setRouterTx.wait();

  const deployment = {
    token: await token.getAddress(),
    sidepotManager: await sidepot.getAddress(),
    hookRouter: await router.getAddress(),
    prizeVault,
    treasury: treasury.address,
    sidepotId,
    sidepotBps,
    treasuryBps,
    network,
  };

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `sidepot-router.${network}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));

  console.table(deployment);
  console.log(`Wrote deployment artifact: ${outPath}`);
  console.log('\n--- 📋 COPY THESE FOR railway:arcade:chain:sync ---');
  console.log(`export VITE_CONTRACT_SIDEPOT_MANAGER="${deployment.sidepotManager}"`);
  console.log(`export VITE_CONTRACT_PRIZE_HOOK_ROUTER="${deployment.hookRouter}"`);
  console.log(`export ARCADE_SIDEPOT_MANAGER_ADDRESS="${deployment.sidepotManager}"`);
  console.log(`export ARCADE_PT_HOOK_ROUTER_ADDRESS="${deployment.hookRouter}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
