# Master Execution Program (Poker Room)

This is the live implementation tracker for the 12-point production task list.

## Status Legend

- `done`: implemented and validated in code/tests
- `in_progress`: partially implemented, active lane
- `next`: scheduled for next sprint lane

## Workstreams

1. External identity and wallet auth: `in_progress`

- `done`: server-wide role auth gating for sensitive poker routes.
- `done`: fail-closed auth mode when tokens are missing (optional explicit
  insecure bypass).
- `done`: mandatory resume token for v2 hold'em actions.
- `next`: wallet nonce + signed challenge flow (SIWE-compatible).
- `next`: bind player identity from auth claims instead of request body.

2. RNG + shuffle verifiability: `next`

- `next`: per-hand deck commit and shuffle transcript export.
- `next`: verifier endpoint for full hand transcript.

3. Multiplayer transport: `next`

- `next`: authenticated websocket stream with ack/resume.
- `next`: sequence reconciliation and backpressure controls.

4. Data durability model: `in_progress`

- `done`: persisted v2 recovery snapshots.
- `next`: split hot state into managed DB/redis.
- `next`: append-only immutable hand/audit stream storage.

5. Fraud and abuse controls: `in_progress`

- `done`: risk alerts, velocity controls, compliance profile checks.
- `done`: collusion scan endpoint on replay events
  (`GET /api/risk/collusion-scan`).
- `next`: graph-based multi-table collusion scoring and sanctions actions.

6. Economic controls: `in_progress`

- `done`: reserve/liability circuit breaker with projected exposure checks for
  reserve/settle/withdraw paths.
- `done`: operator policy endpoints for treasury breaker state
  (`GET/POST /api/risk/treasury-policy`).
- `done`: treasury accounting attestation digest endpoint
  (`GET /api/cashier/attestation`) with invariant proofs.
- `done`: external reserve attestation publication (signed snapshot artifacts +
  history + verification endpoints).

7. Security posture: `in_progress`

- `done`: sensitive route auth policy.
- `done`: bounded idempotency/event retention to reduce memory DoS risk.
- `next`: secrets manager + key rotation runbook + CI SAST/DAST.

8. Tournament correctness depth: `in_progress`

- `done`: strict finish-position validation and duplicate-position rejection.
- `done`: paused-state registration closure.
- `next`: deeper ICM and tie-edge tests for payouts.

9. Performance and SLOs: `in_progress`

- `done`: route latency tracking and `/api/slo` reporting with p95 breach
  detection.
- `next`: load profile suite and automated SLO gates in CI.

10. Product scope lock: `next`

- `next`: explicit v1 scope gates in feature flags and route exposure.

11. Agent ecosystem safety: `next`

- `next`: stronger policy constraints by stake tier and explainable traces in
  action responses.

12. Compliance and legal posture: `next`

- `next`: jurisdiction matrix, geofencing policy hooks, retention schedule.

## Immediate Next Sprint (Execution Order)

1. Wallet nonce + signed challenge auth flow.
2. Deck transcript commit-reveal + verifier.
3. Circuit breaker controls for treasury and payout risk.
