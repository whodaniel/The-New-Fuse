# Merkaba Protocol - Technical Documentation

> The Economic Engine of the AI Arcade

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Frontend Components](#frontend-components)
- [Deployment Guide](#deployment-guide)
- [Economic Model](#economic-model)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)

---

## Overview

The Merkaba Protocol is a decentralized auction system that bootstraps liquidity
for AI Agents through a Gamified Public Offering (GPO). It replaces traditional
VC funding with a reverse-Dutch pay-to-bid auction model backed by a dual-pool
treasury system.

### Key Principles

1. **Dual-Pool Treasury (Sun/Earth):** Active liquidity for prizes vs. passive
   yield for stability
2. **Gyroscopic Rebalancing:** Automated fund flow between pools to maintain
   equilibrium
3. **Genesis Node Equity:** 8 founding NFTs that capture protocol revenue
4. **Gamified Commerce:** Users pay fees to reduce prices, creating a
   deflationary auction

### System Diagram

```
                    +-----------------+
                    |  User (Player)  |
                    +--------+--------+
                             |
                     insertCoin($1.00)
                             |
                    +--------v--------+
                    | AuctionEngine   |
                    | (The Machine)   |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
         $0.40 (40%)    $0.10 (10%)    $0.50 (50%)
              |              |              |
    +---------v------+ +----v--------+ +---v---------+
    | MerkabaCore    | | GenesisNode | | House Rev.  |
    | (The Battery)  | | (The Keys)  | | (Contract)  |
    +-------+--------+ +-------------+ +-------------+
            |
      +-----+-----+
      |           |
   80% Sun    20% Earth
   (Prizes)   (Treasury)
```

---

## Architecture

### Package Structure

```
packages/contracts/
  src/
    MerkabaCore.sol       # Treasury + rebalancing logic
    GenesisNode.sol       # ERC-721 equity NFTs (8 total)
    AuctionEngine.sol     # Reverse-Dutch auction machine
    MockERC20.sol         # Test payment token (ARCD)
  scripts/
    deploy_merkaba.js     # Hardhat deployment script
    simulate_merkaba.py   # 3-year economic simulation
  BLACKPAPER.md           # Legal + economic framework

apps/ai-arcade/
  src/
    config/
      contracts.ts        # Deployed addresses + ABIs
    hooks/
      useMerkabaContract.ts  # React hook for contract interaction
    components/
      ArcadeCabinet.tsx   # Individual auction UI component
      MerkabaMonitor.tsx  # Sun/Earth balance visualizer
    pages/
      GenesisAuction.tsx  # Genesis Node auction landing page
```

### Technology Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Blockchain | Ethereum (Hardhat local / Sepolia / Base) |
| Contracts  | Solidity 0.8.20, OpenZeppelin v5          |
| Frontend   | React 18, Vite, Framer Motion             |
| Web3       | ethers.js v6                              |
| Token      | ERC-20 (MockERC20 / USDC)                 |
| NFT        | ERC-721 (GenesisNode)                     |

### Contract Relationships

```
MockERC20 (Payment Token)
    |
    +-- MerkabaCore.paymentToken (receives 40% of fees)
    |       |
    |       +-- sunBalance  (80% of injection)
    |       +-- earthBalance (20% of injection)
    |
    +-- GenesisNode.paymentToken (receives 10% of fees)
    |       |
    |       +-- totalSunRewardsPerNode  (IDs 1-4)
    |       +-- totalEarthRewardsPerNode (IDs 5-8)
    |
    +-- AuctionEngine.arcadeToken (collects fees, distributes)
            |
            +-- owns MerkabaCore (via transferOwnership)
            +-- calls GenesisNode.depositSunRewards()
            +-- calls MerkabaCore.injectCapital()
```

---

## Smart Contracts

### MerkabaCore.sol

**Purpose:** The treasury contract that manages the Sun (Active) and Earth
(Passive) pools with gyroscopic rebalancing.

**Inherits:** `Ownable`, `ReentrancyGuard`

**State Variables:**

| Variable            | Type                 | Description                                                |
| ------------------- | -------------------- | ---------------------------------------------------------- |
| `paymentToken`      | `IERC20` (immutable) | The ERC-20 token used for all payments                     |
| `sunBalance`        | `uint256`            | Active prize pool liquidity                                |
| `earthBalance`      | `uint256`            | Passive treasury / yield pool                              |
| `targetRatio`       | `uint256`            | Target Sun:Earth ratio (scaled by 100; default: 100 = 1:1) |
| `rebalanceStrength` | `uint256`            | Percentage of excess moved per pulse (default: 5)          |
| `PRECISION`         | `uint256` (constant) | Scaling factor for ratio math (100)                        |

**Functions:**

| Function                                               | Access    | Description                                                                |
| ------------------------------------------------------ | --------- | -------------------------------------------------------------------------- |
| `injectCapital(uint256 _amount)`                       | External  | AuctionEngine sends fees here. Splits 80/20 Sun/Earth. Triggers rebalance. |
| `pulse()`                                              | External  | Public heartbeat. Rebalances Sun/Earth toward target ratio.                |
| `payoutWinner(address _winner, uint256 _amount)`       | onlyOwner | Pays a jackpot winner from the Sun pool.                                   |
| `investEarth(address _yieldStrategy, uint256 _amount)` | onlyOwner | Deploys Earth funds to yield strategies (Aave/Compound).                   |

**Events:**

| Event            | Parameters                              | Emitted When                                           |
| ---------------- | --------------------------------------- | ------------------------------------------------------ |
| `Deposit`        | `source, amount, splitSun, splitEarth`  | Capital injected                                       |
| `Pulse`          | `action, amountMoved, newSun, newEarth` | Rebalance occurs                                       |
| `EmergencyDrain` | `target, amount`                        | Emergency withdrawal (declared, not implemented in v1) |

**Rebalancing Logic:**

```
if Sun/Earth ratio > target:
    excess = sunBalance - earthBalance
    move = excess * rebalanceStrength / 100
    Sun -= move, Earth += move   (COOLING)

if Sun/Earth ratio < target:
    shortage = earthBalance - sunBalance
    move = shortage * rebalanceStrength / 100
    Earth -= move, Sun += move   (HEATING)
```

---

### GenesisNode.sol

**Purpose:** ERC-721 NFT contract for the 8 founding nodes. IDs 1-4 are Sun
Class (volume dividends), IDs 5-8 are Earth Class (yield dividends).

**Inherits:** `ERC721`, `Ownable`, `ReentrancyGuard`

**State Variables:**

| Variable                   | Type                          | Description                             |
| -------------------------- | ----------------------------- | --------------------------------------- |
| `paymentToken`             | `IERC20`                      | The ERC-20 token for dividend payments  |
| `MAX_SUPPLY`               | `uint256` (constant)          | 8                                       |
| `SUN_NODES`                | `uint256` (constant)          | 4                                       |
| `EARTH_NODES`              | `uint256` (constant)          | 4                                       |
| `totalSunRewardsPerNode`   | `uint256`                     | Cumulative volume rewards per Sun node  |
| `totalEarthRewardsPerNode` | `uint256`                     | Cumulative yield rewards per Earth node |
| `claimedAmount`            | `mapping(uint256 => uint256)` | Amount already claimed per token ID     |

**Functions:**

| Function                               | Access    | Description                                                              |
| -------------------------------------- | --------- | ------------------------------------------------------------------------ |
| `mintGenesis()`                        | onlyOwner | Mints all 8 nodes to the deployer. One-time call.                        |
| `depositSunRewards(uint256 _amount)`   | External  | Called by AuctionEngine. Adds volume dividends split across 4 Sun nodes. |
| `depositEarthRewards(uint256 _amount)` | External  | Called by MerkabaCore. Adds yield dividends split across 4 Earth nodes.  |
| `claimDividends(uint256 _tokenId)`     | External  | NFT holder pulls accumulated, unclaimed dividends.                       |
| `getClaimable(uint256 _tokenId)`       | View      | Returns unclaimed dividend amount for a specific node.                   |

**Dividend Model:**

- Dividends accrue to the **token ID**, not the wallet address
- If an NFT is sold/transferred, the new owner inherits unclaimed rewards
- Uses a "pull" pattern: holders must call `claimDividends()` to withdraw
- Sun nodes earn from bid volume; Earth nodes earn from treasury yield

---

### AuctionEngine.sol

**Purpose:** The core arcade machine. Manages reverse-Dutch auctions where users
pay fees to drop prices.

**Inherits:** `Ownable`, `ReentrancyGuard`

**Auction Struct:**

```solidity
struct Auction {
    uint256 id;
    string agentId;       // e.g., "DeepSeek-R1-Lifetime"
    uint256 currentPrice; // Decreases with each bid
    uint256 floorPrice;   // Absolute minimum (reserve)
    uint256 priceDrop;    // Amount price drops per bid
    uint256 bidFee;       // Cost to bid ("insert coin")
    bool active;
    address winner;
    address lastBidder;
    uint256 endTime;      // Auction expiry timestamp
}
```

**Functions:**

| Function                                                                                                        | Access    | Description                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `createCabinet(string _agentId, uint256 _startPrice, uint256 _floorPrice, uint256 _priceDrop, uint256 _bidFee)` | onlyOwner | Creates a new auction.                                                                        |
| `insertCoin(uint256 _auctionId)`                                                                                | External  | User pays `bidFee` to drop the price. Fee is split across treasury, genesis nodes, and house. |
| `unlockAgent(uint256 _auctionId)`                                                                               | External  | User pays `currentPrice` to win the item. Closes the auction.                                 |

**Fee Distribution (per `insertCoin`):**

| Destination                   | Percentage | Mechanism                         |
| ----------------------------- | ---------- | --------------------------------- |
| Genesis Nodes (Sun dividends) | 10%        | `genesisNode.depositSunRewards()` |
| Merkaba Treasury              | 40%        | `merkabaCore.injectCapital()`     |
| House Revenue                 | 50%        | Stays in AuctionEngine contract   |

**Events:**

| Event            | Parameters                                | Emitted When               |
| ---------------- | ----------------------------------------- | -------------------------- |
| `CabinetCreated` | `id, agentId, startPrice`                 | New auction created        |
| `CoinInserted`   | `id, player, newPrice, treasuryInjection` | User places a bid          |
| `JackpotUnlock`  | `id, winner, finalCost`                   | User buys at current price |

---

### MockERC20.sol

**Purpose:** A simple ERC-20 token for local development and testing. Replaces
USDC/USDT in production.

- Name: "Arcade Token"
- Symbol: "ARCD"
- Decimals: 18
- Minting: Open `mint(address to, uint256 amount)` function (no access control -
  dev only)
- Initial supply: 1,000,000 ARCD minted to deployer in constructor

---

## Frontend Components

### Contract Configuration

**File:** `apps/ai-arcade/src/config/contracts.ts`

Contains deployed contract addresses and human-readable ABIs for all 4
contracts. Update addresses here after each deployment.

### useMerkabaContract Hook

**File:** `apps/ai-arcade/src/hooks/useMerkabaContract.ts`

React hook that:

1. Detects `window.ethereum` (MetaMask or other wallet)
2. Creates `ethers.BrowserProvider` and `Signer`
3. Instantiates all 4 contract objects with ABIs
4. Exposes `{ provider, contracts, account, connect }`

**Usage:**

```tsx
const { account, contracts, connect } = useMerkabaContract();

// Connect wallet
await connect();

// Read auction data
const auction = await contracts.engine.auctions(1);

// Insert coin (bid)
await contracts.token.approve(contracts.engine.target, bidFee);
await contracts.engine.insertCoin(1);

// Read Merkaba state
const sunBalance = await contracts.merkaba.sunBalance();
```

### ArcadeCabinet Component

**File:** `apps/ai-arcade/src/components/ArcadeCabinet.tsx`

A visual arcade cabinet UI for individual auctions. Features:

- CRT scanline effect overlay
- Animated price ticker with glitch effect on price changes
- Hydraulic pipe visualizer showing treasury injection flow
- BID and BUY buttons with press animations
- Framer Motion for all animations

**Props:**

```typescript
interface AuctionProps {
  id: number;
  agentName: string;
  agentRole: 'CODER' | 'STRATEGIST' | 'GAME';
  currentPrice: number;
  nextDrop: number;
  bidFee: number;
  endTime: Date;
  onBid: () => void;
  onBuy: () => void;
}
```

### MerkabaMonitor Component

**File:** `apps/ai-arcade/src/components/MerkabaMonitor.tsx`

Real-time dashboard showing the Sun/Earth balance with:

- Earth Gravity (left) and Sun Velocity (right) displays
- Animated progress bars for pool ratios
- Spinning gyroscope in center that pulses during rebalancing
- Color-coded system state (orange = too hot, cyan = too cold, purple =
  balanced)

**Props:**

```typescript
interface MerkabaProps {
  sunBalance: number;
  earthBalance: number;
  rebalanceActive: boolean;
}
```

### GenesisAuction Page

**File:** `apps/ai-arcade/src/pages/GenesisAuction.tsx`

Full-page landing for the Genesis Node auction:

- Hero section with animated title and countdown timer
- Wallet connect button
- "READ BLACKPAPER" link to legal framework
- 4x2 grid of Genesis Node cards (Sun class + Earth class)
- Dutch auction price display
- Sacred Geometry explainer section

**Navigation:** Accessible via "ENTER GENESIS PROTOCOL" button in the main
Arcade app header.

---

## Deployment Guide

### Prerequisites

```bash
# From monorepo root
pnpm install

# Node.js 22+ recommended (Node 24 requires Hardhat undici patch)
nvm use 22
```

### Step 1: Compile Contracts

```bash
cd packages/contracts
pnpm exec hardhat compile
```

**Note:** The Hardhat config expects Solidity sources in `src/`, not
`contracts/`. This is configured in `hardhat.config.js` via `paths.sources`.

### Step 2: Start Local Node

```bash
pnpm exec hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded
accounts.

### Step 3: Deploy Contracts

```bash
# In a separate terminal
pnpm exec hardhat run scripts/deploy_merkaba.js --network localhost
```

The deployment script:

1. Deploys MockERC20 (Arcade Token / ARCD)
2. Deploys MerkabaCore with token address
3. Deploys GenesisNode with token address
4. Deploys AuctionEngine with all three addresses
5. Transfers MerkabaCore ownership to AuctionEngine
6. Mints 8 Genesis Nodes to deployer
7. Mints 1,000,000 ARCD test tokens to deployer
8. Approves AuctionEngine to spend deployer's tokens
9. Creates the first auction cabinet ("DeepSeek-R1-Genesis")

**Output addresses** (local Hardhat - deterministic):

| Contract      | Address                                      |
| ------------- | -------------------------------------------- |
| Token (ARCD)  | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| MerkabaCore   | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| GenesisNode   | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| AuctionEngine | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |

### Step 4: Update Frontend Config

Copy the deployed addresses into `apps/ai-arcade/src/config/contracts.ts`. For
local Hardhat, the addresses are deterministic and already populated.

### Step 5: Run the Arcade Frontend

```bash
cd apps/ai-arcade
pnpm run dev
```

Navigate to the app and click "ENTER GENESIS PROTOCOL" to view the Merkaba
interface.

### Testnet Deployment

To deploy to a testnet (e.g., Sepolia), add the network to `hardhat.config.js`:

```javascript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
}
```

Then run:

```bash
pnpm exec hardhat run scripts/deploy_merkaba.js --network sepolia
```

Update the frontend config with the new addresses and set `chainId` to
`11155111`.

### Known Issues

**Node.js 22+ / Hardhat undici Incompatibility:** Hardhat v2.28.x bundles
`undici` v7.x which uses a `maxRedirections` parameter incompatible with Node.js
22+'s built-in undici. Two files need patching:

- `node_modules/hardhat/internal/util/download.js` (line ~57)
- `node_modules/hardhat/internal/core/providers/http.js` (line ~156)

Remove `maxRedirections: 10,` from both files. This is a known upstream issue.

---

## Economic Model

### Fee Flow Per Bid

For a $1.00 `bidFee`:

```
$1.00 collected from user
  |
  +-- $0.10 (10%) --> GenesisNode.depositSunRewards()
  |                      Split across 4 Sun nodes ($0.025 each)
  |
  +-- $0.40 (40%) --> MerkabaCore.injectCapital()
  |                      $0.32 (80%) --> sunBalance
  |                      $0.08 (20%) --> earthBalance
  |
  +-- $0.50 (50%) --> Stays in AuctionEngine (house revenue)
```

### Rebalancing Dynamics

The `pulse()` function (callable by anyone) checks the Sun:Earth ratio:

- **Ratio > 1.0 (Sun too hot):** 5% of excess flows Sun -> Earth
- **Ratio < 1.0 (Earth too heavy):** 5% of shortage flows Earth -> Sun
- **Ratio = 1.0:** No action needed

This creates a stable oscillation around the target ratio.

### 3-Year Simulation Results

Run via `python3 scripts/simulate_merkaba.py`:

**Parameters:**

- 1,000 initial users, 0.5% net daily growth
- $1/user/day bid volume
- 90% daily Sun payout rate
- 5% APY on Earth pool
- 5% rebalance strength

**Verified Output:** Sun/Earth ratio stabilizes around 1.0 over 1,095 days,
confirming economic sustainability.

### Genesis Node Economics

| Metric         | Sun Nodes (1-4)              | Earth Nodes (5-8)           |
| -------------- | ---------------------------- | --------------------------- |
| Revenue Source | 10% of all bid fees          | 1% of treasury APY          |
| Volatility     | High (tracks volume)         | Low (tracks yield)          |
| Best In        | Bull markets (high activity) | Bear markets (stable yield) |
| Claim Method   | Pull (`claimDividends`)      | Pull (`claimDividends`)     |

---

## API Reference

### Reading Contract State (View Functions)

```typescript
// Merkaba balances
const sun = await contracts.merkaba.sunBalance(); // BigInt (wei)
const earth = await contracts.merkaba.earthBalance(); // BigInt (wei)

// Auction data
const count = await contracts.engine.auctionCount();
const auction = await contracts.engine.auctions(1);
// Returns: { id, agentId, currentPrice, floorPrice, priceDrop, bidFee, active, winner, lastBidder, endTime }

// Genesis node claimable
const claimable = await contracts.genesis.getClaimable(1); // Token ID 1

// User stats
const volume = await contracts.engine.userVolume(address);
const balance = await contracts.token.balanceOf(address);
```

### Writing Transactions

```typescript
// Approve token spending (required before insertCoin/unlockAgent)
await contracts.token.approve(engineAddress, amount);

// Insert coin (bid on auction)
await contracts.engine.insertCoin(auctionId);

// Buy now (win the auction)
await contracts.engine.unlockAgent(auctionId);

// Claim genesis node dividends
await contracts.genesis.claimDividends(tokenId);

// Trigger merkaba rebalance
await contracts.merkaba.pulse();
```

### Listening to Events

```typescript
// Listen for bids
contracts.engine.on(
  'CoinInserted',
  (id, player, newPrice, treasuryInjection) => {
    console.log(`Auction ${id}: price now ${ethers.formatEther(newPrice)}`);
  }
);

// Listen for winners
contracts.engine.on('JackpotUnlock', (id, winner, finalCost) => {
  console.log(
    `${winner} won auction ${id} for ${ethers.formatEther(finalCost)}`
  );
});

// Listen for rebalancing
contracts.merkaba.on('Pulse', (action, amountMoved, newSun, newEarth) => {
  console.log(`Rebalance: ${action}, moved ${ethers.formatEther(amountMoved)}`);
});
```

---

## Security Considerations

### Access Control

| Contract      | Owner                       | Critical Functions            |
| ------------- | --------------------------- | ----------------------------- |
| MerkabaCore   | AuctionEngine (transferred) | `payoutWinner`, `investEarth` |
| GenesisNode   | Deployer                    | `mintGenesis` (one-time)      |
| AuctionEngine | Deployer                    | `createCabinet`               |

### Reentrancy Protection

All state-changing functions in MerkabaCore, GenesisNode, and AuctionEngine use
OpenZeppelin's `ReentrancyGuard`.

### Known Risks

1. **Ownership Model (v1):** MerkabaCore ownership is transferred entirely to
   AuctionEngine. In production, use `AccessControl` with granular roles
   instead.
2. **MockERC20 has open minting:** The test token has no access control on
   `mint()`. Replace with real USDC address in production.
3. **No upgrade path:** Contracts are not upgradeable. Deploy new versions and
   migrate state if needed.
4. **Price manipulation:** The `insertCoin` function has no rate limiting. A
   well-funded attacker could rapidly drop prices. Consider adding cooldown
   periods.
5. **Time-based expiry:** Auctions use `block.timestamp` which can be slightly
   manipulated by miners (within ~15 seconds). Acceptable for this use case.

### Audit Status

These contracts have NOT been audited. Do not deploy to mainnet with real funds
without a professional security audit.

---

## File Index

| File                    | Location                         | Purpose                    |
| ----------------------- | -------------------------------- | -------------------------- |
| `MerkabaCore.sol`       | `packages/contracts/src/`        | Treasury + rebalancing     |
| `GenesisNode.sol`       | `packages/contracts/src/`        | ERC-721 equity NFTs        |
| `AuctionEngine.sol`     | `packages/contracts/src/`        | Auction logic              |
| `MockERC20.sol`         | `packages/contracts/src/`        | Test payment token         |
| `deploy_merkaba.js`     | `packages/contracts/scripts/`    | Deployment script          |
| `simulate_merkaba.py`   | `packages/contracts/scripts/`    | Economic simulation        |
| `hardhat.config.js`     | `packages/contracts/`            | Hardhat configuration      |
| `BLACKPAPER.md`         | `packages/contracts/`            | Legal + economic framework |
| `contracts.ts`          | `apps/ai-arcade/src/config/`     | Deployed addresses + ABIs  |
| `useMerkabaContract.ts` | `apps/ai-arcade/src/hooks/`      | React contract hook        |
| `ArcadeCabinet.tsx`     | `apps/ai-arcade/src/components/` | Auction UI component       |
| `MerkabaMonitor.tsx`    | `apps/ai-arcade/src/components/` | Treasury visualizer        |
| `GenesisAuction.tsx`    | `apps/ai-arcade/src/pages/`      | Genesis sale page          |
| `global.d.ts`           | `apps/ai-arcade/src/`            | Window.ethereum type       |
