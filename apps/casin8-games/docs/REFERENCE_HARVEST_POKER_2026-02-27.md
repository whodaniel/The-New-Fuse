# Reference Harvest: Poker Platform Baseline (2026-02-27)

## Purpose

Build a practical baseline for a full-scale poker platform (cash, multi-table
tournaments, sit-and-go, progressive structures) by reviewing reusable external
codebases and separating:

- what we can safely adopt,
- what we should only study,
- what we should discard as production inputs.

## Evaluated Repositories

### 1) nyublockchainfintech/poker_contracts

- URL: https://github.com/nyublockchainfintech/poker_contracts
- Default branch: `main`
- Latest commit date: 2023-12-07
- Surface area: small Foundry project (`src/Poker.sol`, scripts, one test suite)
- Strengths:
  - Clean on-chain table lifecycle primitives (start/join/leave).
  - Signature-based state verification pattern for withdrawals.
  - Minimal codebase; straightforward to audit conceptually.
- Gaps vs target platform:
  - Not a complete gameplay engine for holdem rounds at scale.
  - No tournament scheduler, lobby service, matchmaking, or realtime
    infrastructure.
  - No explicit license file detected in repo root.
- Decision: **Study and selectively reimplement patterns; do not fork as main
  base.**

### 2) yayashuxue/poker-fhe-base

- URL: https://github.com/yayashuxue/poker-fhe-base
- Default branch: `main`
- Latest commit date: 2024-03-02
- Surface area: very small Solidity-only set, no test harness found.
- Strengths:
  - Useful conceptual reference for FHE poker direction.
- Gaps vs target platform:
  - Early-stage/prototype maturity.
  - Missing full app stack (backend, realtime, tournament ops).
  - No explicit license file detected.
- Decision: **R&D reference only (privacy v2/v3 track), not production
  baseline.**

### 3) rafa-canseco/PokerWithFhe

- URL: https://github.com/rafa-canseco/PokerWithFhe
- Default branch: `main`
- Latest commit date: 2024-03-02
- Surface area: larger contract set, Hardhat config, no test suite found.
- Strengths:
  - More complete FHE table/round concepts than smaller FHE repos.
- Gaps vs target platform:
  - Still hackathon/prototype maturity.
  - FHE stack constraints and operational complexity for production launch.
  - No explicit license file detected.
- Decision: **R&D reference only; mine ideas, reimplement cleanly under our
  architecture.**

### 4) pok3rNetwork/pok3r

- URL: https://github.com/pok3rNetwork/pok3r
- Default branch: `staging`
- Latest commit date: 2022-09-22
- Surface area: largest of the set (API, client, blockchain contracts, holdem
  modules).
- Strengths:
  - Closest to full product architecture (lobby/game services + client +
    contracts).
  - Explicit MIT license present.
- Gaps vs target platform:
  - Stale stack and aging dependencies.
  - Significant modernization needed for current security, infra, and UX
    standards.
- Decision: **Primary architecture reference, not direct fork.**

## SourceForge Scan (poker directory)

Search URL: https://sourceforge.net/directory/?q=poker

### High-value references from SourceForge

1. PokerTH

- URL: https://sourceforge.net/projects/pokerth/
- Downloads/week: 176
- Last update: 2026-02-27
- License: AGPL
- Value: mature multiplayer poker UX/game flow reference.
- Use mode: **study behavior and UX/state handling patterns only**.

2. JS_CSS_Poker

- URL: https://sourceforge.net/projects/js-css-poker/
- Downloads/week: 19
- Last update: 2024-01-15
- License: LGPLv3
- Value: browser poker UI patterns.
- Constraint: mainly solitaire vs bots, not full multiplayer platform.
- Use mode: **UI interaction reference only**.

3. openpoker

- URL: https://sourceforge.net/projects/openpoker/
- Downloads/week: 1
- Last update: 2017-08-04
- License: GPLv2
- Use mode: **historical architecture reference only**.

4. pokerapp

- URL: https://sourceforge.net/projects/pokerapp/
- Downloads/week: 1
- Last update: 2013-04-23
- Status: Beta
- License: GPLv2
- Use mode: **historical reference only**.

5. pokerhost

- URL: https://sourceforge.net/projects/pokerhost/
- Downloads/week: 1
- Last update: 2015-08-06
- License: GPLv2
- Use mode: **historical reference only**.

6. holdingnuts

- URL: https://sourceforge.net/projects/holdingnuts/
- Downloads/week: 0
- Last update: 2013-04-27
- Status: Abandoned
- License: GPLv3
- Use mode: **discard for baseline purposes**.

## Legal/Licensing Guardrails

- MIT code (e.g., `pok3r`) can be incorporated with attribution and license
  compliance.
- GPL/AGPL projects should be treated as **behavioral references** unless we
  explicitly choose reciprocal licensing obligations.
- Repos without explicit license files should be treated as **all rights
  reserved by default**; only use as inspiration unless permissions are
  clarified.

## Adopt / Rewrite / Discard Matrix

### Adopt (conceptual architecture)

- Lobby + table state separation from `pok3r`.
- Service split: API/game orchestration vs chain settlement adapter.
- Event-driven round progression and reconnect-aware state snapshots.

### Rewrite (from scratch under our stack)

- Full Texas Hold'em engine (cash + MTT + SNG + satellite structures).
- Tournament scheduler, blind progression, payout computation,
  late-reg/re-entry.
- Deterministic hand replay + anti-collusion telemetry pipeline.
- Wallet/token accounting and payment rails integration.

### Discard as base

- Any stale/hackathon code as-is for production deploy.
- Any non-licensed or reciprocal-license-tight code in direct copy path.

## Target Baseline Recommendation

- Primary build approach: **greenfield implementation** with selected
  architecture patterns from `pok3r` and contract safety ideas from
  `nyu poker_contracts`.
- Privacy roadmap: hold FHE references for v2/v3 track; do not block v1 shipping
  on FHE maturity.

## Parallel Execution Plan (Subagent-Friendly)

1. Engine Team

- Deliverables:
  - Pure deterministic holdem engine.
  - Side-pot correctness tests and hand-rank test vectors.

2. Realtime Table Team

- Deliverables:
  - Seat management, action timers, reconnect recovery, anti-duplicate action
    guards.

3. Tournament Team

- Deliverables:
  - MTT/SNG lifecycle manager, blind scheduler, payout/ITM calculator.

4. Economy/Token Team

- Deliverables:
  - Token ledger, cashier state machine, buy-in/out accounting, rake
    distribution.

5. Security/Fairness Team

- Deliverables:
  - Threat model, abuse controls, deterministic replay verification, provably
    fair APIs.

6. UX/Graphics Team

- Deliverables:
  - Poker-only screen system, non-card assets (chips, dealer button, table
    props, tournament badges, HUD states).

7. QA/Simulation Team

- Deliverables:
  - Multi-table soak tests, bot swarm scenarios, chaos/reconnect suites.

## Immediate Next Step

Create `POKER_V1_ARCHITECTURE.md` and split implementation tickets per
workstream above, with clear interfaces and acceptance tests before coding
further feature depth.
