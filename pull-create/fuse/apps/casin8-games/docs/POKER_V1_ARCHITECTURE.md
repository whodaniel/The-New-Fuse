# Poker V1 Architecture (Agent-First)

## Scope

Casin8 Poker V1 is a **real-time, multiplayer, agent-first** Texas Hold'em
platform supporting:

- Cash tables
- Sit & Go tournaments
- Multi-table tournaments (MTT)
- Agent sponsorship/backing with fractional profit sharing

This is not video poker. Agents are first-class participants.

## Product Principles

1. Agent-first by default

- Every feature must work for autonomous agents via API without UI dependence.

2. Deterministic and auditable

- Every hand, action, and payout must be replayable from immutable event logs.

3. Strong financial correctness

- Ledger correctness (chips, rake, payouts, sponsorship splits) is
  non-negotiable.

4. Human + agent coexistence

- Humans can play, sponsor agents, and observe agent behavior with full
  transparency.

## Top-Level System

### A) Poker Engine Service

Responsibilities:

- Enforce game rules and table state transitions.
- Validate actions (turn order, stack constraints, legal move set).
- Resolve hand outcomes and side pots.

Core modules:

- `hand-evaluator`
- `betting-state-machine`
- `side-pot-resolver`
- `showdown-resolver`

Output:

- Deterministic `HandResult` events + payout directives.

### B) Realtime Table Orchestrator

Responsibilities:

- Seat management, table lifecycle, action timers.
- Reconnect/resume and anti-duplicate action handling.
- Stream state to UI and agents.

Core modules:

- `table-registry`
- `seat-lock-manager`
- `turn-clock`
- `recovery-snapshot-store`

### C) Tournament Service

Responsibilities:

- Create and manage SNG/MTT structures.
- Blind progression, late registration, rebuy/re-entry rules.
- Break tables and rebalance seating.

Core modules:

- `tournament-lobby`
- `blind-scheduler`
- `table-balancer`
- `prize-distributor`

### D) Agent Runtime API

Responsibilities:

- Register and operate autonomous agents as players.
- Accept action intents and enforce rate/latency constraints.
- Support temperament/style configuration.

Core modules:

- `agent-registry`
- `strategy-profile`
- `action-gateway`
- `agent-risk-guardrails`

Temperament examples:

- Tight-Aggressive
- Loose-Aggressive
- Tight-Passive
- Exploitative-Profiled
- Tournament ICM-aware

### E) Sponsorship/Backing Ledger

Responsibilities:

- Allow backers to allocate bankroll to an agent across scopes:
  - global, tournament-only, table-only, campaign-based.
- Track capital at risk and realized PnL per staking position.
- Execute payout waterfall at settlement.

Core modules:

- `sponsorship-contracts-or-ledger`
- `allocation-engine`
- `waterfall-calculator`
- `claim-service`

Canonical payout order:

1. Return principal per backing terms
2. Apply platform rake/fees
3. Split net profit by sponsor percentages
4. Credit agent owner share

### F) Wallet/Token Cashier

Responsibilities:

- Buy-in/out with platform token.
- Fiat onramp integration metadata (Stripe/PayPal flows) mapped to token
  balance.
- Enforce anti-double-spend settlement and idempotent credits.

Core modules:

- `wallet-balance-service`
- `cashier-transactions`
- `onchain-adapter`
- `reconciliation-jobs`

### G) Fairness + Security Layer

Responsibilities:

- Provably fair seed commitments and receipt verification.
- Suspicious behavior detection (collusion, chip-dumping, soft play signals).
- Incident audit trail.

Core modules:

- `commit-reveal-service`
- `fair-receipt-verifier`
- `anti-collusion-scorer`
- `security-audit-log`

## Data Model (Minimal V1)

- `Player`: human or agent identity
- `AgentProfile`: temperament/style, risk config, API auth scopes
- `SponsorshipPosition`: sponsor -> agent allocation + terms
- `Table`: current hand state + seats + blinds + timer
- `Tournament`: registration, structure, status, payouts
- `LedgerEntry`: immutable money movement
- `HandEvent`: immutable action event stream
- `FairnessReceipt`: seed hash chain + digest

## APIs (V1 Contract)

### Agent Runtime

- `POST /api/agents/register`
- `POST /api/agents/:id/configure-style`
- `POST /api/agents/:id/join`
- `POST /api/agents/:id/action`
- `POST /api/agents/:id/leave`
- `POST /api/agents/configure-style`
- `POST /api/agents/configure-risk`
- `POST /api/agents/policy-check`

### Strategy + Simulation

- `POST /api/strategy/profile`
- `POST /api/strategy/decide`
- `POST /api/sim/equity`
- `GET /api/swarm/status`

### Sponsorship

- `POST /api/sponsorships/open`
- `POST /api/sponsorships/:id/fund`
- `GET /api/sponsorships/:id/performance`
- `POST /api/sponsorships/:id/close`
- `POST /api/sponsorships/:id/claim`

### Poker/Table

- `POST /api/tables/create`
- `POST /api/tables/:id/join`
- `POST /api/tables/:id/action`
- `GET /api/tables/:id/state`
- `GET /api/tables/:id/events`

### Tournament

- `POST /api/tournaments/create`
- `POST /api/tournaments/:id/register`
- `GET /api/tournaments/:id/state`
- `GET /api/tournaments/:id/payouts`

### Fairness

- `GET /api/fair/commit/:sessionId`
- `POST /api/fair/verify`

## Reuse Strategy for Historical Poker Bots

Allowed reuse target:

- Decision heuristics and strategy abstractions.
- Hand evaluation test vectors.
- Simulation and opponent-modeling concepts.

Disallowed direct carryover:

- Old networking/runtime frameworks.
- Security/crypto assumptions from outdated code.
- Any code with incompatible license constraints.

Implementation pattern:

- Extract ideas -> re-spec behavior -> reimplement in typed modules with tests.

## Non-Card Graphics Required (for AI asset generation)

Current status: card deck is covered. Need generation for:

- Chip denominations + stack variants
- Dealer button and blind markers
- Turn timer ring states
- Pot/side-pot badges
- Table felt systems (cash, SNG, MTT variants)
- Tournament badges, rank ribbons, payout banners
- Sponsorship UI badges and profit waterfall visuals
- Agent identity avatars/icons and temperament badges
- Reconnect/error/health HUD states

## Phased Delivery

### Phase 1 (2-3 weeks): Poker Core + Agent Runtime

- Cash tables only
- Agent register/join/act flow
- Deterministic hand + ledger events
- Basic fairness receipts

### Phase 2 (2-3 weeks): Sponsorship + SNG

- Sponsorship positions and payout waterfall
- Sit & Go lifecycle
- Enhanced anti-abuse checks

### Phase 3 (3-5 weeks): MTT + Scale hardening

- Multi-table tournament orchestration
- Table balancing and payout ladders
- Load, chaos, and reconnect reliability testing

## Acceptance Gates

1. Financial gate

- 0 unresolved ledger diffs in replay tests.

2. Rules gate

- 100% pass on action legality + side-pot test suites.

3. Reliability gate

- Reconnect and resume works across all hand phases.

4. Fairness gate

- Every settled hand has verifiable receipt.

5. Agent gate

- Agents can play full sessions autonomously with policy controls.

## Immediate Task Split (Subagents)

1. Engine subagent

- Build deterministic holdem state machine + side-pot engine.

2. Agent-runtime subagent

- Build agent registration/config/action endpoints and policy checks.

3. Sponsorship subagent

- Build sponsorship position schema + payout waterfall calculator.

4. Tournament subagent

- Build SNG first, then MTT scheduler and balancing.

5. Security subagent

- Build fairness verifier + suspicious-play scoring baseline.

6. UI/graphics subagent

- Build poker-only UX screens and missing non-card asset spec packs.

## Dependencies Needed from You

1. Sponsorship business policy

- Exact payout formulas and fee model.

2. Agent policy

- Allowed autonomy levels and mandatory risk limits.

3. Tournament rules

- Blind structures, rebuy/re-entry defaults, late-reg windows.

4. Tokenomics constraints

- Buy-in caps, per-table limits, jurisdiction constraints.
