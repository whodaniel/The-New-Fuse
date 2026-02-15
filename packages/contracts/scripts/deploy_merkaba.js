const hre = require("hardhat");

async function main() {
  console.log("--- 🚀 INITIATING MERKABA DEPLOYMENT SEQUENCE ---");

  // 1. GET ACCOUNTS
  // The 'deployer' is the Admin/DAO.
  // 'treasuryWallet' is the cold storage for the Earth Yield (Multisig).
  const [deployer, treasuryWallet] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 2. DEPLOY PAYMENT TOKEN (MOCK USDC)
  // In production, you would use the real USDC address: "0x..."
  // For dev, we mint our own "Arcade Token"
  const Token = await hre.ethers.getContractFactory("MockERC20"); // You'll need a simple MockERC20 contract
  const arcadeToken = await Token.deploy("Arcade Token", "ARCD");
  await arcadeToken.waitForDeployment();
  console.log("✅ Payment Token Deployed:", await arcadeToken.getAddress());

  // 3. DEPLOY MERKABA CORE (The Treasury/Battery)
  const MerkabaCore = await hre.ethers.getContractFactory("MerkabaCore");
  const merkaba = await MerkabaCore.deploy(await arcadeToken.getAddress());
  await merkaba.waitForDeployment();
  console.log("✅ Merkaba Core (Battery) Deployed:", await merkaba.getAddress());

  // 4. DEPLOY GENESIS NODES (The Equity/NFTs)
  const GenesisNode = await hre.ethers.getContractFactory("GenesisNode");
  const genesis = await GenesisNode.deploy(await arcadeToken.getAddress());
  await genesis.waitForDeployment();
  console.log("✅ Genesis Node (NFTs) Deployed:", await genesis.getAddress());

  // 5. DEPLOY AUCTION ENGINE (The Machine)
  const AuctionEngine = await hre.ethers.getContractFactory("AuctionEngine");
  const engine = await AuctionEngine.deploy(
      await arcadeToken.getAddress(),
      await merkaba.getAddress(),
      await genesis.getAddress()
  );
  await engine.waitForDeployment();
  const engineAddress = await engine.getAddress();
  console.log("✅ Auction Engine (Machine) Deployed:", engineAddress);

  console.log("--- ⚡ WIRING PERMISSIONS ---");

  // 6. WIRE MERKABA -> ENGINE
  // The Engine needs permission to call 'payoutWinner' on the Merkaba.
  // Since MerkabaCore uses 'onlyOwner' for payouts, we transfer ownership to the Engine.
  // CRITICAL: In V2, use AccessControl (Roles) instead of full ownership for safety.
  await merkaba.transferOwnership(engineAddress);
  console.log("🔌 Merkaba Ownership Transferred to Auction Engine");

  // 7. INITIALIZE GENESIS NODES
  // Mint the 8 Nodes to the Deployer so we can sell them on the site.
  await genesis.mintGenesis();
  console.log("💎 8 Genesis Nodes Minted to Admin");

  // Wire Engine to Genesis? Wait, genesis uses pull pattern, but engine needs approval?
  // Engine approves Genesis in code.
  // BUT GenesisNode uses Ownable, maybe we need to transfer ownership or set minter?
  // GenesisNode mints in `mintGenesis` called by Owner. AuctionEngine calls `depositSunRewards`.
  // `depositSunRewards` is public (external). So no special permission needed for Engine to deposit.
  // Wait, does Engine need allowance to transfer TO Genesis? Yes.
  // In `insertCoin`: `arcadeToken.approve(address(genesisNode), toGenesis);`
  // `genesisNode.depositSunRewards(toGenesis)` -> `paymentToken.transferFrom(msg.sender, address(this), _amount)`
  // `msg.sender` here is `AuctionEngine` (because Engine calls `genesisNode.depositSunRewards`).
  // So Engine approves GenesisNode to take tokens FROM Engine. This looks correct.

  console.log("--- 🧪 VERIFICATION & SETUP ---");

  // 8. MINT TEST TOKENS
  // Give the deployer 1,000,000 Tokens to test with
  const mintAmount = hre.ethers.parseEther("1000000");
  await arcadeToken.mint(deployer.address, mintAmount);
  console.log("💰 Minted 1,000,000 ARCD to Admin for testing");

  // 9. APPROVE ENGINE
  // Approve the Engine to spend Admin's tokens (so we can create the first bid)
  await arcadeToken.approve(engineAddress, mintAmount);
  console.log("🔓 Admin Approved Engine to spend ARCD");

  // 10. CREATE FIRST CABINET
  await engine.createCabinet(
      "DeepSeek-R1-Genesis", // agentId
      hre.ethers.parseEther("100"), // Start Price $100
      hre.ethers.parseEther("1"),   // Floor Price $1
      hre.ethers.parseEther("0.2"), // Drop $0.20
      hre.ethers.parseEther("1")    // Fee $1.00
  );
  console.log("🎰 Created First Cabinet: DeepSeek-R1-Genesis");

  console.log("--- 🏁 DEPLOYMENT COMPLETE ---");
  console.table({
      Token: await arcadeToken.getAddress(),
      Merkaba: await merkaba.getAddress(),
      Genesis: await genesis.getAddress(),
      Engine: await engine.getAddress(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
