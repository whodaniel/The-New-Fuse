# AGENT_WORKPACKS: Superpowers Execution Mode

## Mission

Build the best-in-class **agent-first** poker platform by combining:

- top real-money product patterns,
- strongest AI poker research,
- strict financial/security correctness,
- modern UX and live-ops reliability.

No flimsy prototype output is accepted.

## External Benchmarks We Are Targeting

### Product/UX Benchmarks

- PokerStars fast-play mechanics and SNG speed ladders:
  - Zoom: https://www.pokerstars.com/poker/zoom/
  - Spin & Go: https://www.pokerstars.com/poker/spin-and-go/
- GGPoker analytics + staking UX:
  - Smart HUD: https://ggpoker.com/poker-games/smart-hud/
  - Staking platform: https://ggpoker.com/poker-games/staking-platform/
  - House rules examples: https://ggpoker.net/house-rules/
- ACR staking policy references:
  - https://www.acrpoker.eu/tournaments/staking/
  - https://faq.acrpoker.eu/gameplay/tables-features/how-does-staking-work/

### AI/Engine Benchmarks

- Pluribus baseline target (multi-player no-limit competence):
  - https://pubmed.ncbi.nlm.nih.gov/31296650/
- Evaluation methodology (variance reduction / significance):
  - https://aaai.org/papers/11481-aivat-a-new-variance-reduction-technique-for-agent-evaluation-in-imperfect-information-games/
- Engineering-grade sim/runtime references:
  - PokerKit docs (MIT): https://pokerkit.readthedocs.io/
  - PyPokerEngine (AI callback model): https://github.com/ishikota/PyPokerEngine

## Default Decisions (Applied Now)

No pending business questions. Defaults are set so swarm can execute.

1. Sponsorship economics

- Allow selling up to 90% action.
- Markup range: 0.90x to 3.00x (risk-tier dependent).
- Platform fee: 2.5% of seller markup revenue + 0.5% settlement fee on net prize
  flow.
- Canceled event handling: pro-rata automatic refunds or ICM policy based on
  interruption phase.

2. Agent policy

- Three autonomy tiers:
  - Tier A: advisory only (human confirms action)
  - Tier B: semi-auto (preapproved action bands)
  - Tier C: full-auto (hard risk caps, kill-switch enabled)
- Mandatory guardrails: max buy-in/session, max loss/day, mandatory cooldown,
  anomaly throttles.

3. Tournament defaults

- SNG standard: 6-max and 9-max, turbo/hyper variants.
- MTT standard: late reg 20-25% of total runtime, optional re-entry windows, PKO
  optional.
- Blind progression templates by speed profile and buy-in tier.

4. Tokenomics defaults

- Table buy-in caps by stake ladder and account risk class.
- Sponsorship funds isolated from operator treasury ledger.
- Jurisdiction flags enforce feature availability and staking eligibility.

## Swarm Topology (12 Subagents)

All streams run in parallel with strict interfaces.

1. `engine-core`

- Deliver: deterministic NLHE engine, action legality, side-pot correctness,
  showdown resolution.
- KPI: 100% pass on deterministic replay vectors.

2. `engine-sim`

- Deliver: monte-carlo/equity service and bot simulation harness.
- KPI: p95 simulation latency within target per stake tier.

3. `agent-runtime`

- Deliver: register/configure/join/act APIs, rate controls, auth scopes.
- KPI: no duplicate actions; strict idempotency.

4. `agent-strategy`

- Deliver: temperament/style packs + policy adapter for historical bot
  heuristics.
- KPI: stable behavior profiles under stress tests.

5. `sponsorship-ledger`

- Deliver: backing positions, markup, waterfall payouts, claim flow.
- KPI: zero ledger drift in reconciliation tests.

6. `tournaments-sng`

- Deliver: SNG lifecycle, seat fill/start thresholds, payout rules.
- KPI: no stuck tournaments over 10k-run simulation.

7. `tournaments-mtt`

- Deliver: registration, late reg, table balancing, breaks, final table handoff.
- KPI: fair seat balancing and blind schedule adherence.

8. `cashier-token`

- Deliver: token buy-in/out, fiat bridge metadata, reconciliation jobs.
- KPI: exactly-once settlement semantics.

9. `fairness-security`

- Deliver: commit-reveal, receipt verify API, anomaly scoring, collusion
  heuristics.
- KPI: verified receipt for every settled hand.

10. `realtime-platform`

- Deliver: websocket/sse event contracts, reconnect snapshots, sequencing.
- KPI: recover from disconnect without state divergence.

11. `ux-poker-room`

- Deliver: poker-only shell, lobby, table, tournament pages; agent-centric
  controls.
- KPI: end-to-end usability with agent and human flows.

12. `graphics-assets`

- Deliver: non-card art system (chips, table props, timer rings, badges, HUD
  states).
- KPI: complete asset pack coverage for all poker states.

## Global Engineering Contract

- Event-sourced state transitions only.
- Every financial transition = immutable ledger entry.
- Every hand = replayable transcript + fairness receipt.
- Every API mutation = idempotency key required.

## Quality Gates (Hard)

1. Financial integrity

- Zero unreconciled ledger discrepancies.

2. Rules correctness

- Engine conformance suite at 100% pass.

3. Reliability

- Reconnect chaos tests pass at target concurrency.

4. Agent safety

- Guardrail enforcement with auditable override logs.

5. UX quality

- No dead-end states in bankroll, registration, action, or claim flows.

## 7-Day Blitz Plan (Until March 2 Free Compute Window)

### Day 1

- Lock interface contracts and shared schemas.
- Start engine-core + sponsorship-ledger + realtime-platform in parallel.

### Day 2

- Agent runtime APIs + temperament registry.
- SNG lifecycle implementation.

### Day 3

- MTT scheduler and table balancer.
- Cashier/token and reconciliation foundation.

### Day 4

- Fairness verifier + anti-collusion baseline.
- Tournament payout and interruption policies.

### Day 5

- Full e2e integration across cash + SNG.
- Begin MTT scale tests.

### Day 6

- UX hardening + graphics integration pass.
- Agent tournament play soak testing.

### Day 7

- Stability sweep, replay audits, release candidate for poker-only v1.

## What This Means Right Now

- We proceed without additional policy questions.
- Defaults above are active and can be revised later via migration flags.
- Work begins immediately with parallel execution and strict quality gates.
