# Railway Federation Gate Warn Rollout Report

Date: 2026-03-18  
Status: Completed (superseded by enforce rollout later same day)

## Scope

Promote production Railway runtime to external federation gate `warn` mode for:

1. `api` service (handoff publish policy checks)
2. `relay-server` service (broker dispatch policy checks)

Endpoint target:

- `https://tnf-sharedstate.bizsynth.workers.dev`

## Variables Applied

### API (`api`)

1. `TNF_GATE_POLICY_MODE=warn`
2. `TNF_GATE_POLICY_ENDPOINT=https://tnf-sharedstate.bizsynth.workers.dev`

### Relay/Broker (`relay-server`)

1. `BROKER_FEDERATION_GATE_MODE=warn`
2. `BROKER_GATE_POLICY_ENDPOINT=https://tnf-sharedstate.bizsynth.workers.dev`
3. `TNF_GATE_POLICY_MODE=warn`
4. `TNF_GATE_POLICY_ENDPOINT=https://tnf-sharedstate.bizsynth.workers.dev`

## Deployment Outcomes

1. API deployment: `59a1d3a8-aa93-46be-a1a9-e876a03230b0` -> `SUCCESS`
2. Relay deployment: `fedbb0f1-773b-48fd-8310-69deb3faa10e` -> `SUCCESS`

## Post-Rollout Checks

1. Railway variable verification for both services confirmed expected values.
2. API health endpoint:
   - `https://api-production-48f1.up.railway.app/api/health` -> `200`
3. Relay domain response:
   - `https://relay-server-production-8c35.up.railway.app` -> `200`
4. TWIP macro board refresh after rollout:
   - `24` terminals, `6` active, `18` idle (`2026-03-18T23:14:53.022Z`)

## Operational Note

`warn` mode is now live, so policy denies/failures are observed without blocking
execution. Promote to `enforce` after deny telemetry and false-positive rates
stabilize.

Follow-up completed:

- `docs/protocols/reports/railway-federation-gate-enforce-rollout-2026-03-18.md`
