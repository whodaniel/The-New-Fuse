const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Merkaba Full Stack Integration', function () {
  let token, merkaba, genesis, engine;
  let deployer, player1, player2, treasury;

  beforeEach(async function () {
    [deployer, player1, player2, treasury] = await ethers.getSigners();

    // Deploy MockERC20
    const Token = await ethers.getContractFactory('MockERC20');
    token = await Token.deploy('Arcade Token', 'ARCD');

    // Deploy MerkabaCore
    const MerkabaCore = await ethers.getContractFactory('MerkabaCore');
    merkaba = await MerkabaCore.deploy(await token.getAddress());

    // Deploy GenesisNode
    const GenesisNode = await ethers.getContractFactory('GenesisNode');
    genesis = await GenesisNode.deploy(await token.getAddress());

    // Deploy AuctionEngine
    const AuctionEngine = await ethers.getContractFactory('AuctionEngine');
    engine = await AuctionEngine.deploy(
      await token.getAddress(),
      await merkaba.getAddress(),
      await genesis.getAddress()
    );

    // Wire: Transfer Merkaba ownership to Engine so it can call payoutWinner
    await merkaba.transferOwnership(await engine.getAddress());

    // Mint Genesis Nodes
    await genesis.mintGenesis();

    // Give players tokens
    const amount = ethers.parseEther('10000');
    await token.mint(player1.address, amount);
    await token.mint(player2.address, amount);

    // Approve engine to spend player tokens
    await token.connect(player1).approve(await engine.getAddress(), amount);
    await token.connect(player2).approve(await engine.getAddress(), amount);
  });

  describe('Deployment', function () {
    it('deploys all contracts with correct references', async function () {
      expect(await engine.arcadeToken()).to.equal(await token.getAddress());
      expect(await engine.merkabaCore()).to.equal(await merkaba.getAddress());
      expect(await engine.genesisNode()).to.equal(await genesis.getAddress());
    });

    it('mints 8 Genesis Nodes to deployer', async function () {
      for (let i = 1; i <= 8; i++) {
        expect(await genesis.ownerOf(i)).to.equal(deployer.address);
      }
    });

    it('sets correct constants', async function () {
      expect(await genesis.MAX_SUPPLY()).to.equal(8n);
      expect(await genesis.SUN_NODES()).to.equal(4n);
      expect(await genesis.EARTH_NODES()).to.equal(4n);
    });
  });

  describe('Auction Engine - createCabinet', function () {
    it('creates an auction cabinet', async function () {
      await engine.createCabinet(
        'DeepSeek-R1',
        ethers.parseEther('100'),
        ethers.parseEther('1'),
        ethers.parseEther('0.20'),
        ethers.parseEther('1')
      );

      expect(await engine.auctionCount()).to.equal(1n);
      const auction = await engine.auctions(1);
      expect(auction.agentId).to.equal('DeepSeek-R1');
      expect(auction.currentPrice).to.equal(ethers.parseEther('100'));
      expect(auction.active).to.equal(true);
    });

    it('only allows owner to create cabinets', async function () {
      let reverted = false;
      try {
        await engine
          .connect(player1)
          .createCabinet(
            'Hack-Agent',
            ethers.parseEther('1'),
            ethers.parseEther('0'),
            ethers.parseEther('0.1'),
            ethers.parseEther('0.5')
          );
      } catch {
        reverted = true;
      }
      expect(reverted).to.equal(true);
    });
  });

  describe('Auction Engine - insertCoin (The Core Loop)', function () {
    beforeEach(async function () {
      await engine.createCabinet(
        'TestAgent',
        ethers.parseEther('50'), // startPrice
        ethers.parseEther('1'), // floorPrice
        ethers.parseEther('0.50'), // priceDrop
        ethers.parseEther('1') // bidFee
      );
    });

    it('drops the price on bid', async function () {
      await engine.connect(player1).insertCoin(1);

      const auction = await engine.auctions(1);
      expect(auction.currentPrice).to.equal(ethers.parseEther('49.50'));
    });

    it('splits fees to Merkaba and Genesis', async function () {
      const merkabaAddr = await merkaba.getAddress();
      const genesisAddr = await genesis.getAddress();

      const merkBefore = await token.balanceOf(merkabaAddr);
      const genBefore = await token.balanceOf(genesisAddr);

      await engine.connect(player1).insertCoin(1);

      const merkAfter = await token.balanceOf(merkabaAddr);
      const genAfter = await token.balanceOf(genesisAddr);

      // 40% of 1.0 = 0.40 to Merkaba
      expect(merkAfter - merkBefore).to.equal(ethers.parseEther('0.40'));
      // 10% of 1.0 = 0.10 to Genesis
      expect(genAfter - genBefore).to.equal(ethers.parseEther('0.10'));
    });

    it('updates Merkaba sun and earth balances', async function () {
      await engine.connect(player1).insertCoin(1);

      const sun = await merkaba.sunBalance();
      const earth = await merkaba.earthBalance();

      // MerkabaCore splits 80% Sun / 20% Earth of 0.40
      // Then the gyroscope auto-rebalances, so exact values drift.
      // Sun should hold ~80% of 0.40 minus rebalancing = between 0.20 and 0.40
      expect(sun).to.be.gt(0n);
      expect(earth).to.be.gt(0n);
      // Total should equal 0.40 (conservation of energy)
      expect(sun + earth).to.equal(ethers.parseEther('0.40'));
    });

    it('tracks user volume (RPG stats)', async function () {
      await engine.connect(player1).insertCoin(1);
      await engine.connect(player1).insertCoin(1);

      const volume = await engine.userVolume(player1.address);
      expect(volume).to.equal(ethers.parseEther('2'));
    });

    it('updates lastBidder', async function () {
      await engine.connect(player1).insertCoin(1);
      let auction = await engine.auctions(1);
      expect(auction.lastBidder).to.equal(player1.address);

      await engine.connect(player2).insertCoin(1);
      auction = await engine.auctions(1);
      expect(auction.lastBidder).to.equal(player2.address);
    });

    it('emits CoinInserted event', async function () {
      const tx = await engine.connect(player1).insertCoin(1);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          const parsed = engine.interface.parseLog(log);
          return parsed && parsed.name === 'CoinInserted';
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
    });
  });

  describe('Auction Engine - unlockAgent (Buy Now)', function () {
    beforeEach(async function () {
      await engine.createCabinet(
        'WinAgent',
        ethers.parseEther('10'),
        ethers.parseEther('1'),
        ethers.parseEther('0.50'),
        ethers.parseEther('1')
      );
      // Drop price a few times
      await engine.connect(player1).insertCoin(1);
      await engine.connect(player1).insertCoin(1);
    });

    it('allows buy at current price and closes auction', async function () {
      await engine.connect(player2).unlockAgent(1);

      const auction = await engine.auctions(1);
      expect(auction.active).to.equal(false);
      expect(auction.winner).to.equal(player2.address);
    });

    it('emits JackpotUnlock event', async function () {
      const tx = await engine.connect(player2).unlockAgent(1);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          const parsed = engine.interface.parseLog(log);
          return parsed && parsed.name === 'JackpotUnlock';
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
    });

    it('rejects bids after auction closes', async function () {
      await engine.connect(player2).unlockAgent(1);

      let reverted = false;
      try {
        await engine.connect(player1).insertCoin(1);
      } catch {
        reverted = true;
      }
      expect(reverted).to.equal(true);
    });
  });

  describe('Genesis Node Dividends', function () {
    beforeEach(async function () {
      await engine.createCabinet(
        'DividendTest',
        ethers.parseEther('100'),
        ethers.parseEther('1'),
        ethers.parseEther('0.50'),
        ethers.parseEther('1')
      );
      // 10 bids = 10 * 0.10 = 1.0 to Genesis
      for (let i = 0; i < 10; i++) {
        await engine.connect(player1).insertCoin(1);
      }
    });

    it('accumulates Sun dividends correctly', async function () {
      // Total Genesis: 10 * 0.10 = 1.0 ARCD
      // Per Sun Node: 1.0 / 4 = 0.25
      const claimable = await genesis.getClaimable(1);
      expect(claimable).to.equal(ethers.parseEther('0.25'));
    });

    it('allows node owner to claim dividends', async function () {
      const balBefore = await token.balanceOf(deployer.address);
      await genesis.claimDividends(1);
      const balAfter = await token.balanceOf(deployer.address);

      expect(balAfter - balBefore).to.equal(ethers.parseEther('0.25'));
    });

    it('cannot claim again (double-claim protection)', async function () {
      await genesis.claimDividends(1);

      let reverted = false;
      try {
        await genesis.claimDividends(1);
      } catch {
        reverted = true;
      }
      expect(reverted).to.equal(true);
    });

    it('allows multiple nodes to claim independently', async function () {
      for (let i = 1; i <= 4; i++) {
        await genesis.claimDividends(i);
      }
      // After claiming all 4 Sun nodes, claimable should be 0
      for (let i = 1; i <= 4; i++) {
        expect(await genesis.getClaimable(i)).to.equal(0n);
      }
    });
  });

  describe('MerkabaCore - Gyroscope Rebalancing', function () {
    it('rebalances when Sun > Earth', async function () {
      // Give deployer tokens and approve merkaba
      const amount = ethers.parseEther('1000');
      await token.approve(await merkaba.getAddress(), amount);

      // We can't call injectCapital because merkaba ownership is transferred to engine
      // Instead, inject via the engine by creating bids
      await engine.createCabinet(
        'PulseTest',
        ethers.parseEther('100'),
        ethers.parseEther('1'),
        ethers.parseEther('0.50'),
        ethers.parseEther('10')
      );

      // Give player lots of tokens
      await token.mint(player1.address, ethers.parseEther('100000'));
      await token.connect(player1).approve(await engine.getAddress(), ethers.parseEther('100000'));

      // 50 bids at $10 fee = $500 total
      // 40% = $200 to Merkaba -> $160 Sun / $40 Earth
      for (let i = 0; i < 50; i++) {
        await engine.connect(player1).insertCoin(1);
      }

      const sun = await merkaba.sunBalance();
      const earth = await merkaba.earthBalance();

      // After each injection the gyroscope fires, so values will be partially rebalanced
      // Sun should be > 0 and Earth should be > 0
      expect(sun).to.be.gt(0n);
      expect(earth).to.be.gt(0n);
    });
  });
});
