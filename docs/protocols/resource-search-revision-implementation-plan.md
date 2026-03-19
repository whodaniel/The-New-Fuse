# Resource Search Revisions Implementation Plan

## Objective

Implement three high-value revisions for the resources search and interaction
flow:

1. Move trait-screen metadata from mutable frontend service state to
   query-returned data.
2. Add trait-screen plan cache and endpoint circuit-breaker in API policy flow.
3. Replace placeholder favorite/share endpoints with real persistence and
   auth-aware identity handling.

## Scope

### In scope

- API:
  - `apps/api/src/modules/resources/resource-search-policy.service.ts`
  - `apps/api/src/modules/resources/resources.controller.ts`
  - new resources interaction persistence service
  - resources module wiring
  - unit tests for new behavior
- Frontend:
  - `apps/frontend/src/services/resources.service.ts`
  - `apps/frontend/src/pages/Resources/ResourceSearch.tsx`
  - updated service tests
- Docs:
  - protocol/bridge docs update for behavior and endpoint semantics

### Out of scope

- Broad UI redesign beyond search/trait metadata and interaction correctness.
- Re-architecture of marketplace catalog data source.

## Implementation Steps

1. Frontend query/meta refactor

- Add a typed search result object (`{ items, traitScreen }`) return path.
- Keep legacy `searchResources()` compatibility for callers that need only
  items.
- Update `ResourceSearch` page to read trait metadata from query data, not
  global mutable state.
- Update frontend tests.

2. Trait plan resilience

- Add in-memory plan cache keyed by normalized inquiry + trait params.
- Add endpoint-level circuit-breaker with failure threshold and cooldown.
- Add config knobs with safe defaults.
- Add focused unit tests for cache and breaker behavior.

3. Favorite/share full implementation

- Add a resources interaction service with DB-backed persistence.
- Add typed Drizzle schema for interaction tables and migration-managed DDL.
- Implement real toggle favorite and share insert behavior.
- Require authenticated identity for interaction endpoints.
- Return meaningful endpoint payloads (`favorite` state, share record).
- Update controller tests and frontend integration calls.
- Add resource page share-action UX wiring to collect `toAgentId` and optional
  notes before calling backend.

4. Documentation and validation

- Update docs to reflect behavior and contracts.
- Add build-order guard so API isolated builds refresh database schema exports.
- Run targeted lint/tests and API build.
- Record validation results in final handoff.

## Delivery Checklist

- [x] Frontend query/meta refactor complete
- [x] Trait plan cache/circuit-breaker complete
- [x] Favorite/share persistence complete
- [x] Docs updated
- [x] API build passes
- [x] Frontend tests for resources service pass

## Validation Results

- Database package build: `pnpm --filter @the-new-fuse/database build` passed.
- API build: `pnpm --filter @the-new-fuse/api-server build` passed.
- API resources tests passed:
  - `resources.controller.spec.ts`
  - `resource-search-policy.service.spec.ts`
  - `resource-search-protocol.service.spec.ts`
  - `resource-interaction.service.spec.ts`
- Frontend resources service tests passed:
  - `pnpm --filter @the-new-fuse/frontend-app exec vitest run src/services/resources.service.spec.ts`

## Persistence Artifacts

- New schema: `packages/database/src/drizzle/schema/resource-interactions.ts`
- Schema export: `packages/database/src/drizzle/schema/index.ts`
- Migration: `packages/database/drizzle/0008_add_resource_interactions.sql`
- Migration journal entry: `packages/database/drizzle/meta/_journal.json`
- API build guard: `apps/api/package.json` (`prebuild` -> database build)
