# Federation Gate Telemetry Hardening Report

Date: 2026-03-19  
Status: Implemented

## Scope

Harden post-`enforce` observability for federation gates across API handoff and
broker dispatch paths.

## Changes Implemented

1. API handoff timeline telemetry:
   - File: `apps/api/src/services/agent-handoff.service.ts`
   - Added `handoff_gate_evaluation` timeline events for:
     - publish validation denials
     - ack validation denials
     - external policy allow/warn/deny outcomes
   - Timeline writes now include tenant-scoped `userId` (`tenant:<tenantId>`) to
     satisfy timeline reference validation.

2. Broker gate telemetry counters and events:
   - File: `packages/relay-core/src/broker-agent.ts`
   - Added Redis hash counter aggregation for gate outcomes:
     - default key: `tnf:broker:federation-gate:metrics`
     - configurable via `BROKER_GATE_METRICS_HASH`
   - Added telemetry events published on `BROKER_DECISION_CHANNEL` with
     `type=federation_gate_telemetry`.

3. Broker fail-closed behavior hardening:
   - In `BROKER_FEDERATION_GATE_MODE=enforce`, broker now fails external gate
     evaluation when endpoint is missing.
   - In warn mode, missing endpoint is explicitly tracked as a telemetry reason
     (`endpoint_missing`), rather than being silent.

4. Synthetic federation gate probe:
   - Added script: `scripts/protocols/synthetic-federation-gate-check.cjs`
   - Added root command:
     - `pnpm validate:federation-gate:synthetic`
   - Verifies:
     - valid gate payload is allowed
     - intentionally malformed gate payload is denied (fail-closed check)

## Validation Targets

1. `apps/api/src/services/agent-handoff.service.spec.ts` covers:
   - publish/ack denial telemetry categories
   - external policy warn-mode telemetry
2. `pnpm validate:federation-gate:synthetic` can be run in CI or post-deploy
   smoke workflows.

## Operational Follow-up

1. Add dashboard cards over:
   - `handoff_gate_evaluation` timeline events by `gateCategory` and `outcome`
   - broker Redis hash counters by `reason:*`, `stage:*`, `outcome:*`
2. Alert on sustained rise in:
   - `reason:missing_*`
   - `reason:tenant_mismatch`
   - `reason:endpoint_missing`
