const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SidepotManager', function () {
  it('tracks weighted losses and allows solvency-safe draws', async function () {
    const [owner, reporter, funder, winner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MockERC20');
    const token = await Token.deploy('Mock Prize', 'MPRZ');

    const Sidepot = await ethers.getContractFactory('SidepotManager');
    const sidepot = await Sidepot.deploy(await token.getAddress());
    await sidepot.createPot('deep-ocean', ethers.parseEther('5'));
    await sidepot.setLossReporter(reporter.address, true);

    const amount = ethers.parseEther('40');
    await token.mint(funder.address, amount);
    await token.connect(funder).approve(await sidepot.getAddress(), amount);
    await sidepot.connect(funder).fundPot(1, amount);

    await sidepot.connect(reporter).reportLoss(1, winner.address, 125);
    expect(await sidepot.weightedLossUnits(1, winner.address)).to.equal(125n);

    // draw 25% of the pot
    await sidepot.drawPotToWinner(1, winner.address, 2500);
    expect(await token.balanceOf(winner.address)).to.equal(ethers.parseEther('10'));

    const pot = await sidepot.pots(1);
    expect(pot.balance).to.equal(ethers.parseEther('30'));
  });
});
