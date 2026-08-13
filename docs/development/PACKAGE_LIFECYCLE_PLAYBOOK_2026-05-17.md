# TNF Package Lifecycle Playbook

Generated: 2026-05-17

## Objective

Preserve and re-open access to original monorepo capability without accidental
feature sunsetting. This playbook replaces implicit deprecation with explicit
lifecycle governance.

## Evidence Baseline

- Source report:
  `docs/status-reports/package-lifecycle-baseline-2026-05-17.json`
- Generated via:
  `node scripts/package-lifecycle-audit.cjs --out docs/status-reports/package-lifecycle-baseline-2026-05-17.json`
- Snapshot (2026-05-17):
  - Total internal packages: 66
  - `active`: 33
  - `latent`: 33
  - `incubating`: 0
  - `archived_candidate`: 0

Interpretation: current TNF package graph shows no evidence that packages
should be deleted by default. Many packages are latent, not dead.

## Lifecycle States

### `active`

Criteria:
- External runtime import usage (`import/require`) exists.

Policy:
- Full CI/build/test ownership.
- Breaking changes require migration path.

### `latent`

Criteria:
- No external runtime import usage, but either:
  - external references exist, or
  - internal dependents exist.

Policy:
- Keep package in workspace.
- Keep buildable.
- No archive move without explicit owner decision.
- Require an integration intent statement (why latent, where to rewire later).

### `incubating`

Criteria:
- No runtime integration, but build/test scaffolding exists.

Policy:
- Allowed for prototypes.
- Must have owner + evaluation date.

### `archived_candidate`

Criteria:
- No runtime integration, no dependents/references, and minimal readiness
  signals.

Policy:
- Candidate only, never automatic archive.
- Requires explicit approval and rollback plan.

## Fairtable Status and Action

Fairtable is not deprecated. It is partially disconnected at integration points.

Concrete signals:
- UI route remains live:
  - `apps/frontend/src/ComprehensiveRouter.tsx`
  - `apps/frontend/src/routes/fairtable.route-registration.test.ts`
- Fairtable dashboard imports are commented:
  - `apps/frontend/src/pages/fairtable/FairtableDashboard.tsx`
- Relay fairtable integration currently uses placeholders:
  - `packages/relay-core/src/services/MasterAgentRegistry.ts`

### Fairtable Reactivation Track

1. Restore frontend wiring behind a feature flag
   - Re-enable `@the-new-fuse/fairtable-components` and
     `@the-new-fuse/fairtable-core` imports in `FairtableDashboard`.
   - Add route-level flag guard for staged rollout.
2. Replace temporary hook-local types with package types
   - Remove fallback enums/interfaces in
     `packages/hooks/src/hooks/useKanbanBoard.tsx`.
   - Reconnect canonical types from `@the-new-fuse/fairtable-core`.
3. Replace relay mock bridge with adapter calls
   - Swap placeholder sync logic in `MasterAgentRegistry` with
     `@the-new-fuse/fairtable-adapters` integration.
4. Add contract tests for round-trip integrity
   - `fairtable-core` types -> `fairtable-components` rendering ->
     `fairtable-adapters` bridge payload.

Exit criteria:
- `/fairtable` route uses fairtable components in at least one enabled path.
- Relay sync path calls adapter code (no placeholder-only flow).
- CI includes integration tests across fairtable package boundaries.

## Monorepo-Wide Recovery Track (Original Packages)

1. Create explicit package ownership map
   - Every package must have owner, state, and intent.
2. Freeze silent deprecation
   - No package moved to archive based solely on import counts.
3. Add monthly lifecycle audit
   - Regenerate baseline and compare drift.
4. Re-open latent packages intentionally
   - For each latent package, choose one:
     - promote to active (wire into runtime),
     - keep latent with intent note,
     - incubate with milestone,
     - archive candidate with approval record.

## Modularization Without Capability Loss

Package extraction to separate repos is allowed only when all are true:
- Stable public API boundary exists.
- Consumer tests run via published package interface (no deep imports).
- Compatibility bridge exists in TNF monorepo during transition.
- Rollback path is documented.

Recommended extraction order (when needed):
1. Low-coupling utilities
2. Standalone protocol/tooling packages
3. UI domains with clear interface contracts
4. Core orchestration packages last

## Operating Loop (Inspect -> Act -> Verify)

Inspect:
- Run lifecycle audit and inspect route/package integration points.

Act:
- Implement integration changes behind flags and explicit contracts.

Verify:
- Validate build/test + route and adapter behavior before promoting state.

## Commands

```bash
# Recompute package lifecycle baseline
node scripts/package-lifecycle-audit.cjs \
  --out docs/status-reports/package-lifecycle-baseline-$(date +%F).json

# Human-readable table
node scripts/package-lifecycle-audit.cjs --top 80
```
