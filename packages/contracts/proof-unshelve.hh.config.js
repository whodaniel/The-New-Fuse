require('@nomicfoundation/hardhat-ethers');
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: { evmVersion: 'cancun', optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: './contracts-legacy-proof',
    artifacts: './proof-artifacts',
    cache: './proof-cache',
  },
};
