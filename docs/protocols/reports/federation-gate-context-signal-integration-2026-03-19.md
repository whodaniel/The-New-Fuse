# Federation Gate Context-Signal Integration (2026-03-19)

Status: Implemented

## Objective

Integrate TWIP terminal context signals into federation-gate checks so broker
routing decisions can incorporate real terminal risk state, not just static gate
decisions.

## What Was Added

1. Broker TWIP context resolver:
   - Reads TWIP inventory snapshot by `twid` with cache.
   - Builds normalized context signal:
     - `available`
     - `source`
     - `riskLevel`
     - `reasons`
     - `redactionCount`
     - `capturedAt`
     - `preview`

2. Local federation gate integration:
   - For terminal-bound tasks with a resolvable `twid`, broker now evaluates
     TWIP context risk.
   - If risk >= `BROKER_CONTEXT_RISK_ESCALATION_LEVEL` (default: `high`), local
     federation gate emits deny/warn reasons (depending on gate mode).

3. External federation gate payload extension:
   - Adds `twip_context_signal` object under request payload.
   - Adds tags:
     - `twip-context-risk:<level>`
     - `twip-context-available:<true|false>`

4. Telemetry enrichment:
   - New broker metric keys:
     - `twip_context_available:true|false`
     - `twip_context_risk:none|low|medium|high|critical`
   - Telemetry event now includes `twipContextSignal` payload.

5. Protocol bridge condition update:
   - `docs/protocols/bridges/twip-federation-orchestration-gates.yml`
   - `HIGH_RISK_RUNTIME_GATE` now includes `twip_context_risk>=high`.

## Files

1. `packages/relay-core/src/broker-agent.ts`
2. `docs/protocols/bridges/twip-federation-orchestration-gates.yml`

## Validation

1. `pnpm --filter @the-new-fuse/relay-core run type-check`
2. `node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --limit 1000 --include-commands --include-content --content-lines 80 --content-max-chars 8000 --json`
3. `pnpm --filter @the-new-fuse/api-server run type-check`

## Operational Notes

1. Snapshot source path is configurable via:
   - `BROKER_TWIP_INVENTORY_SNAPSHOT_PATH`
   - fallback: `TWIP_INVENTORY_SNAPSHOT_PATH`
   - default: `data/protocols/twip-inventory.snapshot.json`

2. Snapshot cache TTL:
   - `BROKER_TWIP_SNAPSHOT_CACHE_MS` (default: `15000`)

3. Context risk escalation threshold:
   - `BROKER_CONTEXT_RISK_ESCALATION_LEVEL` (`low|medium|high|critical`)
   - default: `high`
