# AI Arcade

A retro-future arcade for AI agent auctions, games, and micro-apps. Part of The
New Fuse monorepo.

## Overview

The AI Arcade is a React + Vite frontend that serves two primary functions:

1. **Agent Marketplace** - Browse, filter, and interact with AI agent
   experiences
2. **Merkaba Genesis Protocol** - Blockchain-powered reverse-Dutch auctions for
   AI agents with a dual-pool treasury system

## Quick Start

```bash
# From monorepo root
pnpm install

# Start the arcade frontend
cd apps/ai-arcade
pnpm run dev
```

The app runs at `http://localhost:5173` (Vite default).

### With Smart Contracts (Local Blockchain)

```bash
# Terminal 1: Start Hardhat node
cd packages/contracts
pnpm exec hardhat node

# Terminal 2: Deploy Merkaba contracts
cd packages/contracts
pnpm exec hardhat run scripts/deploy_merkaba.js --network localhost

# Terminal 3: Start the arcade
cd apps/ai-arcade
pnpm run dev
```

## Architecture

```
apps/ai-arcade/
  src/
    App.tsx                   # Root component with Arcade/Genesis view toggle
    main.tsx                  # React entry point
    config.ts                 # API URL configuration
    global.d.ts               # Window.ethereum type declaration
    config/
      contracts.ts            # Deployed contract addresses + ABIs
    contexts/
      AuthContext.tsx          # Firebase authentication context
    hooks/
      useMerkabaContract.ts   # React hook for blockchain contract interaction
      useWebSocket.ts         # WebSocket hook for real-time updates
    components/
      ArcadeCabinet.tsx       # Individual auction UI (CRT retro style)
      MerkabaMonitor.tsx      # Sun/Earth treasury balance visualizer
      AgentCard.tsx           # Agent listing card
      AgentDetailModal.tsx    # Agent detail overlay
      AgentSession.tsx        # Active agent interaction session
      AdminDashboard.tsx      # Admin management panel
      LoginModal.tsx          # Authentication modal
      UserProfile.tsx         # User profile overlay
      PayPalButton.tsx        # PayPal payment integration
    pages/
      GenesisAuction.tsx      # Genesis Node auction landing page
    services/
      ArcadeService.ts        # Agent listing API client
      AuthService.ts          # Authentication service
      TokenService.ts         # Token management
      WebSocketService.ts     # WebSocket connection manager
    types/
      auth.ts                 # Authentication type definitions
  public/
    BLACKPAPER.md             # Merkaba legal framework (served statically)
```

## Views

### Arcade View (Default)

The main marketplace showing featured AI agent experiences. Features:

- Category filtering (Games, Code, Analytics, Content, Social)
- Type filtering (Coder, Analyzer, Strategist, Game, Social, Content)
- Search by name/description
- Token balance display
- Admin dashboard (for admin users)

### Genesis Protocol View

Accessible via the "ENTER GENESIS PROTOCOL" button. Shows:

- Countdown timer to auction start
- Wallet connect (MetaMask)
- 8 Genesis Node cards (4 Sun + 4 Earth class)
- Dutch auction price display
- Blackpaper link

## Smart Contract Integration

The app connects to deployed Ethereum smart contracts via ethers.js v6.

### Configuration

Contract addresses and ABIs are defined in `src/config/contracts.ts`:

```typescript
export const contractConfig = {
  network: 'localhost',
  chainId: 31337,
  rpcUrl: 'http://127.0.0.1:8545',
  address: {
    token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    merkaba: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    genesis: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    engine: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
  // ... ABIs
};
```

### Hook Usage

```tsx
import { useMerkabaContract } from '../hooks/useMerkabaContract';

function MyComponent() {
  const { account, contracts, connect } = useMerkabaContract();

  // Connect wallet
  const handleConnect = () => connect();

  // Read data
  const loadAuction = async () => {
    const auction = await contracts.engine.auctions(1);
    const sunBalance = await contracts.merkaba.sunBalance();
  };

  // Write transaction
  const handleBid = async () => {
    await contracts.token.approve(contractConfig.address.engine, bidFee);
    await contracts.engine.insertCoin(1);
  };
}
```

## Dependencies

| Package                   | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `react` / `react-dom`     | UI framework                                    |
| `ethers`                  | Ethereum blockchain interaction                 |
| `framer-motion`           | Animations (cabinet effects, price transitions) |
| `firebase`                | Authentication and user management              |
| `@paypal/react-paypal-js` | Payment processing                              |

## Scripts

| Command            | Description              |
| ------------------ | ------------------------ |
| `pnpm run dev`     | Start development server |
| `pnpm run build`   | Build for production     |
| `pnpm run preview` | Preview production build |

## Environment

The app expects:

- **MetaMask** or compatible wallet for blockchain features
- **Local Hardhat node** at `http://127.0.0.1:8545` (or configured RPC URL)
- **Firebase project** configured for authentication (see `src/config.ts`)

## Related Documentation

- [Merkaba Protocol Technical Docs](../../docs/merkaba/README.md)
- [Blackpaper (Legal Framework)](./public/BLACKPAPER.md)
- [Smart Contracts Package](../../packages/contracts/README.md)
