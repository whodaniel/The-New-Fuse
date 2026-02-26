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
- Includes **Open Audio Deck** (Audius/OAP music experience) that launches an
  external app URL from the Arcade card

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

Contract addresses and ABIs are defined in `src/config/contracts.ts` and should
be injected via Vite env vars in production.

```typescript
VITE_CHAIN_NETWORK=base
VITE_CHAIN_ID=8453
VITE_CHAIN_RPC_URL=https://mainnet.base.org
VITE_CONTRACT_TOKEN=0x...
VITE_CONTRACT_ENGINE=0x...
VITE_CONTRACT_SIDEPOT_MANAGER=0x...
VITE_CONTRACT_PRIZE_HOOK_ROUTER=0x...
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
- **Configured chain RPC + contract env vars** (see
  `apps/ai-arcade/.env.example`)
- **Firebase project** configured for authentication (see `src/config.ts`)

Optional:

- `VITE_MUSIC_APP_URL` - URL launched by the Open Audio Deck card (recommended:
  Railway production URL)

## Related Documentation

- [Merkaba Protocol Technical Docs](../../docs/merkaba/README.md)
- [Blackpaper (Legal Framework)](./public/BLACKPAPER.md)
- [Smart Contracts Package](../../packages/contracts/README.md)
