# SaaS Frontend Overhaul Plan

## Goals

- Consolidate overlapping dashboard/admin pages into a small set of canonical
  surfaces.
- Remove duplicate data-fetch and state-management logic.
- Establish stable UI composition patterns that can scale without page sprawl.
- Preserve current working behaviors while refactoring in incremental,
  reversible steps.

## Canonical Surfaces

- `Super Admin Control Panel`:
  `apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx`
- `Operations / Live Activity`: `apps/frontend/src/pages/LiveView.tsx`
- `Agent Control`: `apps/frontend/src/pages/dashboard/AgentDashboard.tsx`
- `System Health`: `apps/frontend/src/pages/Admin/SystemHealth.tsx`

## Phase 1 (Stabilize and Unify Data)

- Introduce shared admin data hooks for:
  - relay health/channels/agents
  - network activity stream
  - admin metrics dashboard
- Replace page-local fetch duplication with shared hooks.
- Standardize status cards and activity feed rendering blocks.

## Phase 2 (Route and Component Consolidation)

- Reduce duplicate/legacy admin routes by routing to canonical pages.
- Move repeated card/grid/toolbar UI into shared admin components.
- Normalize top-level admin navigation to a single predictable information
  architecture.

## Phase 3 (Design System Hardening)

- Enforce consistent spacing/typography tokens.
- Remove one-off utility-class divergences where components already exist.
- Add visual regression checks for core admin pages.

## Phase 4 (Operational Confidence)

- Add smoke tests for Super Admin critical workflows:
  - relay connectivity
  - channel pause/resume/delete
  - activity feed refresh and filtering
- Add runtime telemetry for UI action failures.

## Guardrails

- No destructive route removal until replacement routes are validated in
  staging.
- Keep feature flags for high-risk migrations.
- Prefer additive refactors, then remove dead code after verification.
