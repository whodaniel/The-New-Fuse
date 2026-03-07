# Poker Engine Spec (V2)

## Scope

Production-focused multiplayer No-Limit Texas Hold'em server logic for:

- Cash tables
- Sit & Go tournaments
- Multi-table tournaments (MTT)

This V2 lane is additive and does not remove existing V1 APIs.

## Core Modules

- `swarm/holdem-engine/index.mjs`
  - Hand lifecycle orchestration
  - Blinds/antes posting
  - Missed/dead blind handling
  - Action order and legal-action computation
  - All-in + side-pot settlement
  - Idempotent action/settlement semantics
  - Crash recovery snapshots
  - Deterministic replay logs
  - Agent-first state payloads (`legalActions`, `helper` EV/risk fields)
- `swarm/holdem-tournaments/index.mjs`
  - MTT + SNG lifecycle
  - Late registration windows
  - Rebuy/add-on controls
  - Blind schedule + break schedule progression
  - Table balancing and final table merge
  - Payout table resolution

## Hand Lifecycle Rules

### Forced posts

- Antes are posted first by all seated players with chips.
- Small blind / big blind are posted by seat order from button.
- Missed blind states can convert to dead blinds (non-live forced chips).

### Action correctness

- Preflop first action: first active seat after BB.
- Postflop first action: first active seat after button.
- `check` only if `toCall == 0`.
- `call` only if `toCall > 0`.
- `bet` only when no outstanding bet.
- `raise` target must exceed current bet; short all-in raises are accepted.

### All-in + side pots

- Side pots derived from contribution tiers.
- Folded contributors remain pot contributors but are excluded as contenders.
- Tie splitting is deterministic; odd chips resolve by seat order.

### Settlement and idempotency

- Settlement is keyed by `settlementKey`.
- Repeated settlements with same key return cached result.
- Duplicate actions by idempotency key are cached and replay-safe.

## Tournament Systems

### Registration and start

- MTT starts explicitly.
- SNG auto-starts when field is full.

### Late reg / rebuy / add-on

- Late registration closes after configured level.
- Rebuy supports max-per-player and closing level.
- Add-on supports exact configured level and one-time usage per player.

### Blind levels and breaks

- Clock advancement drives level progression.
- Scheduled breaks pause level progression for configured duration.

### Table operations

- Rebalancing compacts active players across tables.
- Final table merge triggers when active players <= table size.

## Reliability

- Deterministic event log for all critical state transitions.
- Recovery snapshot format supports crash restart from in-memory checkpoint.
- Replay function rebuilds state from event stream for audit comparability.
- Treasury payout rail now supports circuit-breaker gating to halt
  risk-sensitive mutations when reserve/liability thresholds are breached.

## Agent-first fields

`agentState()` exposes:

- `legalActions[]`
- `helper.pot`
- `helper.toCall`
- `helper.potOddsBps`
- `helper.minRaiseTo`
- `helper.currentBet`
- `helper.maxRiskPerHand`
- `helper.remainingRiskPerHand`

## Migration Notes

1. Keep existing `/api/*` endpoints unchanged for V1 clients.
2. Integrate V2 by adding versioned API routes (`/api/v2/...`) that proxy to:
   - `holdem-engine`
   - `holdem-tournaments`
3. For each table, persist:
   - latest `recoverySnapshot`
   - append-only replay log cursor
4. Roll out in shadow mode first:
   - Run V1 and V2 side-by-side.
   - Compare pot, legal actions, and settlement outputs.
5. Promote V2 per-table only after replay diff parity remains zero over soak
   runs.

## Treasury Circuit Breaker (Economic Controls)

Endpoints:

- `GET /api/risk/treasury-policy?ledgerId=...`
- `POST /api/risk/treasury-policy`
- `GET /api/cashier/attestation?ledgerId=...`
- `POST /api/cashier/attestation/publish`
- `GET /api/cashier/attestation/history?ledgerId=...`
- `POST /api/cashier/attestation/verify`

Protected mutations:

- `POST /api/cashier/reserve`
- `POST /api/cashier/settle`
- `POST /api/cashier/withdraw-request`
- `POST /api/cashier/withdraw-finalize`

Notes:

- Deposits remain allowed during a breaker-open state so treasury can
  recapitalize.
- Breaker evaluates projected post-action exposure (not only current totals).
- Breaker can auto-trip on threshold violations and be operator-cleared via
  policy update.
- Risk alerts are emitted as `treasury-circuit-breaker` events for audit/ops.
- Attestation digest is deterministic for a fixed ledger snapshot and includes:
  - entries digest
  - derived-vs-wallet totals checks
  - wallet non-negativity and malformed-entry checks
- Published reserve attestation artifacts include:
  - sequence and previous digest for chain continuity
  - signed payload (HMAC-SHA256 when `CASIN8_RESERVE_ATTESTATION_SECRET` is
    configured)
  - auditor metadata (`periodStartIso`, `periodEndIso`, `reportLabel`, `actor`)
