# Arcade Chain Listener

This service bridges on-chain Arcade events into MongoDB telemetry and user
unlocks.

## Scripts

- `pnpm --dir apps/api arcade:listener`
- `pnpm --dir apps/api arcade:sweep`

## Deployment address source

- Run `pnpm --dir packages/contracts deploy:sidepot-router`
- Read addresses from:
  - `packages/contracts/deployments/sidepot-router.localhost.json`

## Required env vars

- `ARCADE_RPC_WSS_URL`
- `ARCADE_RPC_HTTP_URL`
- `ARCADE_AUCTION_ENGINE_ADDRESS`
- `ARCADE_SIDEPOT_MANAGER_ADDRESS`
- `ARCADE_PT_HOOK_ROUTER_ADDRESS`
- `MONGODB_URI` (or `MONGODB_URL`)
- `MONGODB_DB` (optional, default `thenewfuse`)
- `ARCADE_SWEEP_BLOCK_WINDOW` (optional, default `12000`)

## Collections used

- `users`
  - looks up `walletAddress`
  - updates `unlockedAgents`
  - appends `history`
- `arcade_event_telemetry`
  - event log sink keyed by `txHash:logIndex`
- `arcade_live_metrics`
  - aggregate counters for live UI dashboards

## Minimal local bring-up

1. Start chain: `pnpm --dir packages/contracts exec hardhat node`
2. Deploy contracts (new terminal):
   `pnpm --dir packages/contracts deploy:sidepot-router`
3. Export env vars in `apps/api/.env` from deployment artifact.
4. Start listener: `pnpm --dir apps/api arcade:listener`
5. Run backfill once: `pnpm --dir apps/api arcade:sweep`

## CloudRuntime production sync

1. Export required chain vars in your shell:
   - `ARCADE_RPC_WSS_URL`
   - `ARCADE_RPC_HTTP_URL`
   - `ARCADE_AUCTION_ENGINE_ADDRESS`
   - `ARCADE_SIDEPOT_MANAGER_ADDRESS`
   - `ARCADE_PT_HOOK_ROUTER_ADDRESS`
2. Optional Vite vars for `ai-arcade`:
   - `VITE_CHAIN_NETWORK`, `VITE_CHAIN_ID`, `VITE_CHAIN_RPC_URL`
   - `VITE_CONTRACT_TOKEN`, `VITE_CONTRACT_MERKABA`, `VITE_CONTRACT_GENESIS`
3. Sync vars:
   - `pnpm cloud_runtime:arcade:chain:sync`
4. Optional immediate redeploy:
   - `TRIGGER_DEPLOY=true pnpm cloud_runtime:arcade:chain:sync`
