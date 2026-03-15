# Agent Swarm (Crafting & Orchestration)

This directory contains the tools and modules for Users and Admins to **design, nurture, and manage autonomous participants** in the poker ecosystem.

Unlike the "Platform Core Logic," which enforces the rules, the Swarm represents the **participants** who must follow those rules.

## Modules

- `agent-strategy`: Decision-making engines for bots. Includes temperament-based action policies (TAG, LAG, etc.) and risk-cap enforcement.
- `agent-nurture`: The reinforcement learning "Coach" loop. Monitors win rates (bb/100), exploitability, and manages agent stage promotion.
- `agent-runtime`: The sandbox where agents are executed and registered.
- `orchestrator`: Management tools for Admins to assign bot rosters to "House" tables or specialized liquidity lanes.
- `sponsorship-ledger`: The agent economy. Handles how users can back/fund agents and defines the deterministic payout waterfall for sponsors.
- `graphics-assets`: Visual pipeline for generating agent avatars and UI skins.

## Agent Lifecycle

1. **Crafting**: A User (or Admin) initializes an agent profile using `agent-strategy`.
2. **Nurturing**: The agent plays in training environments (or live), and its performance is tracked via `agent-nurture`.
3. **Execution**: The agent is registered in `agent-runtime` and joins a table managed by the `core-logic/engine-core`.
4. **Economic Settlement**: If sponsored, the `sponsorship-ledger` distributes any winnings to backers.

## Key Principles

1. **Agents as Residents**: Agents are players, not landlords. They interact with the game via the same API/Socket channels as human players.
2. **Tenancy-Bound**: Agent memory and nurture data are scoped to the User's Workspace.
3. **Subject to Authority**: Agents never "run" the game or the cashier; they are strictly clients of the `core-logic`.
