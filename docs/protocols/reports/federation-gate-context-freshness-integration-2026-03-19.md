# Federation Gate Context Freshness Integration

Date: 2026-03-19  
Status: Implemented

## Scope

Extend broker federation gate logic so terminal-bound routing can enforce
freshness, not only risk score.

## Runtime Changes

File: `packages/relay-core/src/broker-agent.ts`

1. Added TWIP context freshness signal fields:
   - `stale`
   - `ageMs`
2. Added broker env controls:
   - `BROKER_MAX_TWIP_CONTEXT_AGE_MS` (default `900000`)
   - `BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND` (default `false`)
3. Local gate now optionally denies/escalates terminal-bound tasks when:
   - TWIP context is required but unavailable
   - TWIP context is stale (age above threshold)
4. External policy payload now includes:
   - `twip_context_signal.stale`
   - `twip_context_signal.age_ms`
5. Broker telemetry counters now include:
   - `twip_context_stale:true|false`
6. Reason mapping now includes:
   - `twip_context_stale`

## Operator Surface

1. Dashboard updates:
   - `apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx`
   - shows stale/fresh counters and stale-context alert banner.
2. CloudRuntime rollout script updates:
   - `scripts/cloud_runtime/set-federation-gate-mode.sh`
   - sets and verifies new freshness env vars.
3. Runbook and bridge updates:
   - `docs/protocols/twip-operator-runbook.md`
   - `docs/protocols/bridges/twip-federation-orchestration-gates.yml`

## Validation

1. `pnpm --filter @the-new-fuse/relay-core run type-check` ✅
2. `pnpm -C apps/frontend exec eslint src/pages/Admin/ComprehensiveAdminDashboard.tsx`
   ✅
3. `node scripts/validate-protocol-schemas.cjs` ✅
4. `pnpm validate:federation-gate:synthetic` ✅
