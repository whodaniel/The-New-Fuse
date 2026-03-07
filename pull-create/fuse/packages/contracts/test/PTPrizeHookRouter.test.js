const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PTPrizeHookRouter + SidepotManager', function () {
  it('routes claimed prize to winner + treasury + sidepot', async function () {
    const [owner, prizeVault, winner, treasury] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MockERC20');
    const token = await Token.deploy('Mock Prize', 'MPRZ');

    const Sidepot = await ethers.getContractFactory('SidepotManager');
    const sidepot = await Sidepot.deploy(await token.getAddress());
    await sidepot.createPot('hourly', 0);

    const Router = await ethers.getContractFactory('PTPrizeHookRouter');
    const router = await Router.deploy(
      await token.getAddress(),
      await sidepot.getAddress(),
      prizeVault.address,
      treasury.address,
      1,
      1000, // 10% sidepot
      1500 // 15% treasury
    );

    await sidepot.setRouter(await router.getAddress());

    // Simulate PrizePool-owned payout flow: prize is transferred to router before afterClaim.
    const prizeAmount = ethers.parseEther('100');
    await token.mint(prizeVault.address, prizeAmount);

    const [recipient, data] = await router
      .connect(prizeVault)
      .beforeClaimPrize.staticCall(winner.address, 0, 0, 0, winner.address);
    expect(recipient).to.equal(await router.getAddress());

    await token.connect(prizeVault).transfer(recipient, prizeAmount);
    await router
      .connect(prizeVault)
      .afterClaimPrize(winner.address, 0, 0, prizeAmount, recipient, data);

    const winnerBalance = await token.balanceOf(winner.address);
    const treasuryBalance = await token.balanceOf(treasury.address);
    const pot = await sidepot.pots(1);

    expect(winnerBalance).to.equal(ethers.parseEther('75')); // 75%
    expect(treasuryBalance).to.equal(ethers.parseEther('15')); // 15%
    expect(pot.balance).to.equal(ethers.parseEther('10')); // 10%
  });

  it('enforces prizeVault-only hook execution', async function () {
    const [owner, prizeVault, attacker, treasury] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MockERC20');
    const token = await Token.deploy('Mock Prize', 'MPRZ');

    const Sidepot = await ethers.getContractFactory('SidepotManager');
    const sidepot = await Sidepot.deploy(await token.getAddress());
    await sidepot.createPot('hourly', 0);

    const Router = await ethers.getContractFactory('PTPrizeHookRouter');
    const router = await Router.deploy(
      await token.getAddress(),
      await sidepot.getAddress(),
      prizeVault.address,
      treasury.address,
      1,
      1000,
      1500
    );

    let reverted = false;
    try {
      await router.connect(attacker).beforeClaimPrize(attacker.address, 0, 0, 0, attacker.address);
    } catch (error) {
      reverted = true;
    }
    expect(reverted).to.equal(true);
  });
});
