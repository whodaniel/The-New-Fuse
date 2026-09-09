require('@nomicfoundation/hardhat-ethers');
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: { evmVersion: 'cancun', optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: './contracts-legacy-proof',
    artifacts: '/tmp/proof-artifacts',
    cache: '/tmp/proof-cache',
  },
};
