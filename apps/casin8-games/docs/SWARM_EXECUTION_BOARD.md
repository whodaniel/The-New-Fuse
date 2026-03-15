# Swarm Execution Board

## Active Mode

- Mode: SUPERPOWERS
- Strategy: Parallel by domain, sequential only at integration boundaries.
- Goal: Poker-only v1 release candidate with agent-first architecture.

## Day 1 Status

- Completed:
  - Shared contracts: `shared/contracts.mjs`
  - Engine-core stub: `core-logic/engine-core/index.mjs`
  - Sponsorship-ledger stub: `swarm/sponsorship-ledger/index.mjs`
  - Realtime-platform stub: `core-logic/realtime-platform/index.mjs`
  - Validation suite: `swarm/day1.test.mjs`
  - Run script: `scripts/day1-swarm-check.sh`
  - Agent runtime scaffold: `swarm/agent-runtime/index.mjs`
  - SNG scaffold: `core-logic/tournaments-sng/index.mjs`
  - Day 2 tests: `swarm/day2.test.mjs`
  - MTT scaffold: `core-logic/tournaments-mtt/index.mjs`
  - Cashier/token scaffold: `core-logic/cashier-token/index.mjs`
  - Day 3 tests: `swarm/day3.test.mjs`
  - Fairness/security scaffold: `core-logic/fairness-security/index.mjs`
  - Day 4 tests: `swarm/day4.test.mjs`
  - Swarm orchestrator lane: `swarm/orchestrator/index.mjs`
  - Graphics/assets lane: `swarm/graphics-assets/index.mjs`
  - Engine simulation lane: `core-logic/engine-sim/index.mjs`
  - Agent strategy lane: `swarm/agent-strategy/index.mjs`
  - Day 5 tests: `swarm/day5.test.mjs`
  - Day 6 tests: `swarm/day6-sim.test.mjs`, `swarm/day6-strategy.test.mjs`
  - Gap report artifact: `docs/SWARM_GAP_REPORT.json`
  - Swarm task packet artifacts: `docs/SWARM_TASK_PACKET.json`,
    `docs/SWARM_TASK_PACKET.md`
- Verification:
  - `./scripts/day1-swarm-check.sh` passes.

## Reinforcement Pass (Non-overlap)

- Added ownership-aware orchestration to avoid assigning domains already held by
  other agents.
- Added poker-only graphics lane for non-card assets and prompt-pack generation.
- Gap scan now tracks `swarm-orchestrator` and `graphics-assets` as first-class
  domains.
- Reinforcement task packet now auto-generates assignments for missing streams
  and clears once implemented.

## Workstream Interfaces (Lock)

1. Engine emits: `HandEvent[]`, `PayoutDirective[]`, `FairnessMaterial`.
2. Realtime emits: `TableSnapshot`, `ActionAck`, `ReplayCursor`.
3. Sponsorship emits: `AllocationState`, `WaterfallResult`, `ClaimRecord`.
4. Tournament emits: `TournamentState`, `SeatAssignment`, `PayoutLadder`.
5. Agent runtime emits: `AgentActionIntent`, `PolicyDecision`, `RiskSignal`.

## Daily Standup Artifact Contract

Each subagent must submit:

- Completed tasks
- Blocking dependency
- Failing test IDs
- Risk notes
- Next 24h commit plan

## Integration Cadence

- T+0: interface lock
- T+24h: first integrated cash-table path
- T+48h: SNG integrated
- T+72h: MTT skeleton integrated
- T+96h: sponsorship payout integrated
- T+120h: full chaos + replay audit
- T+144h: release candidate cut

## Escalation Rules

- Any ledger mismatch > 0: immediate freeze + rollback to last green commit.
- Any fairness receipt mismatch: block release.
- Any non-idempotent mutation: block release.

## Definition of Release Candidate

- Cash + SNG + MTT playable
- Agent autoplay complete
- Sponsorship settlement complete
- Replay + fairness verifications complete
- QA soak thresholds passed
