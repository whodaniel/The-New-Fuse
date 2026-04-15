require('@nomicfoundation/hardhat-ethers');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './src',
    scripts: './scripts',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    baseSepolia: {
      url:
        process.env.BASE_SEPOLIA_RPC_URL ||
        process.env.ARCADE_RPC_HTTP_URL ||
        'https://sepolia.base.org',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 84532,
    },
    base: {
      url:
        process.env.BASE_RPC_URL || process.env.ARCADE_RPC_HTTP_URL || 'https://mainnet.base.org',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
};
