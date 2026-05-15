# CloudRuntime Federation Gate Enforce Rollout Report

Date: 2026-03-18  
Status: Completed

## Scope

Promote production CloudRuntime gate policy from `warn` to `enforce` using phased
canary:

1. relay/broker service first
2. api handoff service second

## Rollout Sequence

1. Relay canary:
   - command:
     `APPLY_API=0 APPLY_RELAY=1 bash scripts/cloud_runtime/set-federation-gate-mode.sh enforce`
   - deployment: `15627f69-c8ef-422c-a826-1db456bd5677`
   - result: `SUCCESS`
2. API promotion:
   - command:
     `APPLY_API=1 APPLY_RELAY=0 bash scripts/cloud_runtime/set-federation-gate-mode.sh enforce`
   - deployment: `82c7a9a5-0a64-43d1-8566-248339055790`
   - result: `SUCCESS`

## Final Production Variables

### API (`api`)

1. `TNF_GATE_POLICY_MODE=enforce`
2. `TNF_GATE_POLICY_ENDPOINT=https://tnf-sharedstate.bizsynth.workers.dev`

### Relay/Broker (`relay-server`)

1. `BROKER_FEDERATION_GATE_MODE=enforce`
2. `BROKER_GATE_POLICY_ENDPOINT=https://tnf-sharedstate.bizsynth.workers.dev`
3. `TNF_GATE_POLICY_MODE=enforce`
4. `TNF_GATE_POLICY_ENDPOINT=https://tnf-sharedstate.bizsynth.workers.dev`

## Post-Rollout Health

1. Service status:
   - `api` -> `SUCCESS`
   - `relay-server` -> `SUCCESS`
2. API health:
   - `https://api-production-48f1.thenewfuse.com/api/health` -> `200`
3. Relay domain:
   - `https://relay-server-production-8c35.thenewfuse.com` -> `200`

## Immediate Observability Notes

1. Relay startup logs after canary show clean service startup lines.
2. API logs during promotion window showed route/subscription boot logs and no
   immediate gate-enforcement failure signals.
