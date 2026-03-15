# Platform Core Logic (Deterministic Authority)

This directory contains the strictly algorithmic, hard-coded game logic and platform rules. 
These modules represent the "Laws of Physics" and the "Central Bank" of the ecosystem.

**CRITICAL: These modules must NEVER be made autonomous or dependent on AI inconsistencies.**

## Modules

- `engine-core`: The authoritative poker engine. Handles table snapshots, action validation (rules of play), and state transitions.
- `cashier-token`: The immutable token ledger. Handles deposits, withdrawals, and table buy-ins using idempotent operations and BigInt precision.
- `fairness-security`: Provably fair protocols (commit/reveal), receipt verification, and collusion detection algorithms.
- `holdem-engine`: V2 No-Limit Hold'em implementation including complex side-pot math and idempotent settlement.
- `holdem-tournaments`: Authoritative tournament director for MTT/SNG (registration, blind levels, table balancing).
- `tournaments-sng` / `tournaments-mtt`: Specific lifecycle logic for different tournament formats.
- `realtime-platform`: The sequenced event bus and recovery boundary (`tableId:seq`).
- `engine-sim`: Deterministic equity estimation and game state simulations for strategy testing.

## Integration Rules

1. **Engine Authority**: The engine is the sole source of truth for game state. Agents and Humans alike must submit "Intents" which the engine validates against hard-coded rules.
2. **Ledger Integrity**: All token movements must be triggered by the engine (e.g., settlement) or authenticated user requests, never by autonomous agent "decisions."
3. **Idempotency**: All mutations must use idempotency keys to ensure platform stability.
