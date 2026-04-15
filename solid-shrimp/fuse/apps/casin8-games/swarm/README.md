# Swarm Modules

This folder contains parallel workstream scaffolding for:

- `engine-core`
- `sponsorship-ledger`
- `realtime-platform`
- `agent-runtime`
- `tournaments-sng`
- `tournaments-mtt`
- `cashier-token`
- `fairness-security`
- `orchestrator`
- `graphics-assets`
- `engine-sim`
- `agent-strategy`

Legacy reinforcement modules may also exist (`tournament`, `gap-reinforcement`)
and are still checked by the run script when present.

## Files

- `shared/contracts.mjs`: interface constants and validation helpers.
- `engine-core/index.mjs`: table snapshot, action validation, and action
  application.
- `sponsorship-ledger/index.mjs`: backing position funding and settlement
  waterfall math.
- `realtime-platform/index.mjs`: sequenced event bus, idempotency protection,
  snapshot recovery.
- `agent-runtime/index.mjs`: agent registry, temperament presets, autonomy
  tiers, risk guardrails.
- `agent-nurture/index.mjs`: PokerRL-inspired coaching loop (training profile,
  episode metrics, stage promotion, curriculum recommendations).
- `tournaments-sng/index.mjs`: SNG registration/start/blind
  progression/elimination/payouts.
- `tournaments-mtt/index.mjs`: MTT registration, table seeding, rebalancing,
  completion lifecycle.
- `holdem-engine/index.mjs`: V2 No-Limit Hold'em cash-table lifecycle, side
  pots, idempotent replayable settlement.
- `holdem-tournaments/index.mjs`: V2 tournament director for MTT/SNG late reg,
  rebuys/add-ons, breaks, balancing, payouts.
- `cashier-token/index.mjs`: token ledger with idempotent cashier actions and
  reconciliation.
- `fairness-security/index.mjs`: commit/reveal helpers, receipt verification,
  collusion scoring.
- `orchestrator/index.mjs`: swarm lane assignment, collision checks, and
  execution board generation.
- `graphics-assets/index.mjs`: poker-only visual backlog, reference ranking, and
  prompt pack generation.
- `engine-sim/index.mjs`: deterministic simulation and lightweight equity
  estimation APIs.
- `agent-strategy/index.mjs`: temperament-based action policy and risk-cap
  enforcement.

## Tests

- `day1.test.mjs`: engine/sponsorship/realtime.
- `day2.test.mjs`: agent-runtime + SNG.
- `day3.test.mjs`: MTT + cashier-token.
- `day4.test.mjs`: fairness-security.
- `day5.test.mjs`: orchestrator + graphics-assets.
- `day6-sim.test.mjs`: engine-sim.
- `day6-strategy.test.mjs`: agent-strategy.
- Optional legacy: `gap-reinforcement.test.mjs`.

## Run

```bash
./scripts/day1-swarm-check.sh
```

## Integration Contract (Current)

1. Engine output should be published into realtime bus with `eventType` values
   from `shared/contracts.mjs`.
2. Sponsorship settlement should consume engine payout directives and emit
   claim-ready rows.
3. Realtime cursor values (`tableId:seq`) are the recovery boundary for
   reconnect/resume.
4. Fairness receipts should be attached to every settled hand.
5. Cashier mutations must use idempotency keys.
6. Orchestrator lane assignment should avoid overlap with existing ownership
   maps.
7. Graphics pipeline should stay poker-only and exclude video poker motifs.
