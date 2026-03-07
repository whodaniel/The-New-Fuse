# Poker Engine Known Risks (V2)

## 1) Rules Completeness Gaps

- Dealer/button fairness around reconnect/reseat edge-cases still depends on
  operator policy.
- Full live-ops missed blind policy variants (live post vs dead+live combos) are
  partially implemented and should be finalized per room rulebook.

Mitigation:

- Encode explicit room-policy profiles and require profile selection at table
  creation.

## 2) Hand Evaluation Inputs

- Settlement currently expects ranking inputs to be provided by higher-level
  evaluator/oracle.
- Incorrect ranking upstream can produce deterministic but wrong payouts.

Mitigation:

- Add cryptographically versioned hand evaluator service and signature checks on
  ranking payloads.

## 3) Replay Log Durability

- Event log in this lane is in-memory by default.
- Process loss before external persistence causes history truncation.

Mitigation:

- Persist append-only events (WAL) with fsync/transaction boundaries.
- Persist recovery snapshots on every accepted action and settlement.

## 4) Idempotency Key Scope

- Idempotency keys are scoped in-process.
- Multi-instance deployments require distributed dedupe state.

Mitigation:

- Back keys with durable distributed store (Redis/DB) using bounded TTL + hand
  scope.

## 5) Break / Level Time Authority

- Tournament clock progression is API-driven, not tied to trusted monotonic
  scheduler.

Mitigation:

- Run a single-authoritative tournament clock worker and emit signed level
  transitions.

## 6) Security and Abuse Controls

- Collusion, bot abuse, and coordinated soft-play detection are out of scope for
  this module.

Mitigation:

- Integrate fairness/collusion risk engine with alerting and automated
  sanctions.

## 7) Financial Controls

- Treasury circuit-breaker controls now gate reserve/settle/withdraw rails with
  projected liability and utilization checks.
- Cashier attestation endpoint now provides deterministic digest + invariant
  proof for balances and entry-derived totals.
- Published reserve attestations can be signed and chain-linked, but external
  third-party notarization is not yet integrated.
- Remaining gap: breaker state is local-file persisted; multi-writer deployments
  require centralized policy state and lease/lock discipline.

Mitigation:

- Keep payout execution behind idempotent cashier settlement + reconciliation
  proofs.
- Move policy state to shared DB/Redis and enforce single-writer semantics per
  ledger shard.

## 8) Horizontal Scaling

- In-memory table state does not provide active-active consistency.

Mitigation:

- Single-writer per table shard + deterministic replication, or consensus-backed
  state machine.

## 9) Test Coverage Boundaries

- Side-pot/all-in matrix provides broad scenario count and invariants, but does
  not prove all floor-rule variants.

Mitigation:

- Add property-based fuzzing and formal invariant checks for action graph
  transitions.
