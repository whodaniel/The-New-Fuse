# Merkaba Protocol Deployment Guide

## Overview

This document covers deploying the Merkaba Protocol smart contracts and wiring
them to the AI Arcade frontend. For full protocol documentation, see
[docs/merkaba/README.md](../merkaba/README.md).

## Deployment Environments

| Environment | Network | Chain ID | RPC URL                 |
| ----------- | ------- | -------- | ----------------------- |
| Local Dev   | Hardhat | 31337    | `http://127.0.0.1:8545` |
| Testnet     | Sepolia | 11155111 | Via Alchemy/Infura      |
| Production  | Base    | 8453     | Via Alchemy/Infura      |

## Local Development Deployment

### Prerequisites

- Node.js 22+ (use `nvm use 22`)
- pnpm installed
- Dependencies installed (`pnpm install` from monorepo root)

### Step-by-Step

```bash
# 1. Compile contracts
cd packages/contracts
pnpm exec hardhat compile

# 2. Start local node (keep running in background)
pnpm exec hardhat node &

# 3. Deploy all contracts
pnpm exec hardhat run scripts/deploy_merkaba.js --network localhost

# 4. Start the frontend
cd ../../apps/ai-arcade
pnpm run dev
```

### What the Deploy Script Does

The `scripts/deploy_merkaba.js` script performs these steps in order:

1. **Deploy MockERC20** ("Arcade Token" / ARCD)
   - Initial supply: 1M ARCD minted to deployer in constructor
2. **Deploy MerkabaCore** with token address
3. **Deploy GenesisNode** with token address
4. **Deploy AuctionEngine** with token, merkaba, and genesis addresses
5. **Wire permissions:**
   - Transfer MerkabaCore ownership to AuctionEngine
   - (AuctionEngine approves GenesisNode internally per transaction)
6. **Bootstrap state:**
   - Mint 8 Genesis Nodes to deployer
   - Mint additional 1M ARCD test tokens
   - Approve AuctionEngine to spend deployer's tokens
   - Create first auction cabinet ("DeepSeek-R1-Genesis")

### Local Addresses (Deterministic)

When deploying to a fresh Hardhat node, addresses are always:

```
Token:   0x5FbDB2315678afecb367f032d93F642f64180aa3
Merkaba: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Genesis: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Engine:  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

These are pre-populated in `apps/ai-arcade/src/config/contracts.ts`.

### Test Accounts

Hardhat provides 20 pre-funded accounts (10,000 ETH each). The first account
(`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) is the deployer and admin.

Private key:
`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

> **WARNING:** This is a well-known test key. NEVER use it on mainnet or
> testnet.

## Testnet Deployment (Sepolia)

### 1. Configure Network

Add to `packages/contracts/hardhat.config.js`:

```javascript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,         // e.g., Alchemy endpoint
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
}
```

### 2. Fund Deployer

Ensure the deployer wallet has Sepolia ETH for gas. Use a faucet:

- https://sepoliafaucet.com
- https://faucets.chain.link/sepolia

### 3. Deploy

```bash
cd packages/contracts
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
DEPLOYER_PRIVATE_KEY=0xYOUR_KEY \
pnpm exec hardhat run scripts/deploy_merkaba.js --network sepolia
```

### 4. Update Frontend

Copy the output addresses to `apps/ai-arcade/src/config/contracts.ts`:

```typescript
export const contractConfig = {
  network: 'sepolia',
  chainId: 11155111,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
  address: {
    token: '0x...', // From deploy output
    merkaba: '0x...',
    genesis: '0x...',
    engine: '0x...',
  },
  // ABIs remain the same
};
```

### 5. Verify Contracts (Optional)

```bash
pnpm exec hardhat verify --network sepolia CONTRACT_ADDRESS CONSTRUCTOR_ARG1 CONSTRUCTOR_ARG2
```

## Production Deployment (Base Mainnet)

### Pre-Deployment Checklist

- [ ] Smart contracts audited by professional security firm
- [ ] Replace MockERC20 with real USDC address
      (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` on Base)
- [ ] Deploy through multisig (Gnosis Safe) instead of EOA
- [ ] Use AccessControl roles instead of Ownable for MerkabaCore
- [ ] Set up monitoring (events -> webhook -> alerting)
- [ ] Configure keeper bot for periodic `pulse()` calls
- [ ] Legal review of BLACKPAPER.md for jurisdiction compliance
- [ ] Test full flow on testnet first

### Network Configuration

```javascript
networks: {
  base: {
    url: process.env.BASE_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    gasPrice: 'auto',
  },
}
```

### Production Token Setup

In `deploy_merkaba.js`, replace the MockERC20 deployment with the real USDC
address:

```javascript
// PRODUCTION: Use real USDC instead of MockERC20
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const arcadeToken = await hre.ethers.getContractAt('IERC20', USDC_BASE);
```

## Post-Deployment Verification

After any deployment, verify the contracts are wired correctly:

```bash
# Run from packages/contracts
node -e "
const { ethers } = require('ethers');

async function verify() {
  const provider = new ethers.JsonRpcProvider('RPC_URL_HERE');

  const engine = new ethers.Contract('ENGINE_ADDRESS', [
    'function auctionCount() view returns (uint256)',
    'function auctions(uint256) view returns (uint256, string, uint256, uint256, uint256, uint256, bool, address, address, uint256)',
  ], provider);

  const merkaba = new ethers.Contract('MERKABA_ADDRESS', [
    'function sunBalance() view returns (uint256)',
    'function earthBalance() view returns (uint256)',
  ], provider);

  const genesis = new ethers.Contract('GENESIS_ADDRESS', [
    'function ownerOf(uint256) view returns (address)',
  ], provider);

  console.log('Auction count:', (await engine.auctionCount()).toString());
  console.log('Sun balance:', ethers.formatEther(await merkaba.sunBalance()));
  console.log('Earth balance:', ethers.formatEther(await merkaba.earthBalance()));
  console.log('Genesis #1 owner:', await genesis.ownerOf(1));
}
verify();
"
```

## Troubleshooting

### Hardhat Compiler Download Fails (HH502)

**Symptom:** `Error HH502: Couldn't download compiler version list`

**Cause:** Node.js 22+ ships with undici v7 which removed the `maxRedirections`
parameter that Hardhat v2.28.x uses.

**Fix:** Remove `maxRedirections: 10,` from:

- `node_modules/hardhat/internal/util/download.js` (line ~57)
- `node_modules/hardhat/internal/core/providers/http.js` (line ~156)

Or downgrade to Node.js 20 LTS.

### Deployment Fails with "Nonce Too High"

Reset the Hardhat node and redeploy. Hardhat node state is ephemeral.

```bash
# Kill existing node
pkill -f "hardhat node"

# Restart
pnpm exec hardhat node
pnpm exec hardhat run scripts/deploy_merkaba.js --network localhost
```

### Frontend Shows Empty Contract Data

1. Ensure the Hardhat node is running
2. Verify addresses in `apps/ai-arcade/src/config/contracts.ts`
3. Check MetaMask is connected to `localhost:8545` with chain ID `31337`
4. Import a Hardhat test account into MetaMask using the private key above

### Legacy Contracts Won't Compile

The original agent contracts (AgentNFTFactory, etc.) use OpenZeppelin v4 import
paths which are incompatible with the v5 installed for Merkaba. They have been
moved to `packages/contracts-legacy/` and are excluded from compilation.
