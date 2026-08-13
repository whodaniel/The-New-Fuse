require('@nomicfoundation/hardhat-ethers');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    // 0.8.24+ required by @openzeppelin/contracts@^5.4.0 (pragma ^0.8.24),
    // and OZ Bytes.sol uses the Cancun-only `mcopy` opcode, so pin an solc
    // with Cancun support and set evmVersion explicitly. Local contracts use
    // caret pragmas (^0.8.19/^0.8.20) so they accept the newer compiler.
    version: '0.8.28',
    settings: {
      evmVersion: 'cancun',
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
