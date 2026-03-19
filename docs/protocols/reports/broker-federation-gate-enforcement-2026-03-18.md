# Broker Federation Gate Enforcement Report

Date: 2026-03-18  
Status: Implemented in relay-core code (runtime enablement pending)

## Scope

Added broker-side gate checks so task dispatch can be policy-gated before
execution.

## File Updated

- `packages/relay-core/src/broker-agent.ts`

## New Broker Controls

1. `BROKER_FEDERATION_GATE_MODE=off|warn|enforce`
   - `off`: no federation gate checks
   - `warn`: evaluate gates and log failures, continue dispatch
   - `enforce`: evaluate gates and escalate instead of dispatch on failure
2. `BROKER_GATE_POLICY_ENDPOINT` / `TNF_GATE_POLICY_ENDPOINT`
   - optional external serverless gate API endpoint
3. `BROKER_GATE_POLICY_TOKEN` / `TNF_GATE_POLICY_TOKEN`
   - optional auth token for external gate API calls

## Checks Added

1. Local gate completeness:
   - required federation gate chain present and `allow`
   - tenant continuity across scope and cumulative lineage
   - terminal-bound tasks require `twid`
2. Optional external gate API check:
   - `POST /gates/federation/evaluate`

## Validation Executed

1. `pnpm --filter @the-new-fuse/relay-core run type-check` ✅
2. `pnpm --filter @the-new-fuse/api-server run type-check` ✅

## Recommended Rollout

1. Start with `BROKER_FEDERATION_GATE_MODE=warn`.
2. Observe policy warnings and denial reasons.
3. Promote to `enforce` after gate payload quality is stable.
