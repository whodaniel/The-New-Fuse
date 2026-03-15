# Milestone: Workspace & Poker Realignment (2026-03-15)

## Overview

Successfully integrated the Poker Arcade ecosystem into the platform's new
**Workspace-Centric Architecture**. This milestone involved a critical visual
overhaul of the gaming interface, a fundamental architectural separation of
deterministic logic from AI autonomy, and the implementation of multi-tenant
agent management.

## 1. Visual Overhaul: Table Integrity

Resolved a long-standing issue where player avatars (PFPs) were obscuring hole
cards and community cards on the poker tables.

- **Dynamic Stacking**: Implemented a vertical-position-based `z-index` system
  for seats. Players in the "front" of the table (bottom of screen) no longer
  obscure elements "behind" them.
- **Elevation**: Moved hole cards significantly higher above the player profile
  bounding box (`-top-32`) and assigned a high `z-index` (`z-[60]`).
- **Contrast & Visibility**: Added dark, blurred backgrounds
  (`backdrop-blur-md`) and glowing shadows to cards to ensure they pop against
  any table felt or UI overlap.
- **Unified Rendering**: Verified that these fixes apply to **all** games,
  including Bot-generated tournaments and cash games.

## 2. Architectural Separation: Authority vs. Participation

Formally separated the "Laws of the Game" from the "Autonomous Players" to
ensure system integrity.

- **`core-logic/` (Deterministic Authority)**:
  - Moved `engine-core`, `cashier-token`, `fairness-security`, and
    `realtime-platform` into this new home.
  - These modules represent the "Laws of Physics" and the "Central Bank." They
    are hard-coded, algorithmic, and protected from AI inconsistencies.
- **`swarm/` (Autonomous Participation)**:
  - Repurposed as a toolset for Users and Admins to **Craft, Nurture, and
    Orchestrate** agents.
  - Agents are now correctly positioned as **residents/players** within the game
    world, subject to the `core-logic` authority.

## 3. Workspace-Centric Multi-Tenancy

Wired the poker ecosystem into the broader platform's tenancy model developed by
Codex.

- **Schema Alignment**: Identified and fixed a type mismatch between Drizzle
  schemas (UUID) and the existing database (TEXT IDs).
- **Agent Crafting API**: Implemented workspace-scoped endpoints in the unified
  gateway (`apps/api`):
  - `POST /agent-crafting/craft/:workspaceId`: Creation of strategy-specific
    poker agents.
  - `POST /agent-crafting/nurture/:agentId`: Initialization of RL-inspired
    coaching programs.
  - `GET /agent-crafting/templates`: Discovery of strategy models based on
    membership level.
- **Data Isolation**: Ensured that agent strategy profiles, memory, and
  performance metrics are strictly bound to the user's Workspace and Tenant
  context.

## 4. DevOps & Deployment

- **Railway Optimization**:
  - Completed a "safe swap" migration of the `api.thenewfuse.com` domain to a
    stable, build-verified service.
  - Fixed production build failures by strictly excluding test directories from
    the `tsc` compilation phase.
- **CloudFlare Assets**:
  - Deployed the legacy and shared asset library to
    `ai-arcade-poker-assets.pages.dev`.
  - Updated the primary poker application at `poker.ai-arcade.xyz`.

## Future Governance

- **Deterministic Rule**: No AI should ever have the authority to mutate the
  Cashier or settle a hand independently.
- **Workspace Scoping**: All new features must verify `workspaceId` and `userId`
  membership before execution.
