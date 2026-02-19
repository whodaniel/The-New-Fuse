# Unified Ledger: Timeline + Goals + Plans

## What is now unified

- Task + suggestion records are persisted in one ledger store:
  - `data/unified-task-ledger.json`
- Every meaningful change emits a chronological timeline event.
- Goals and project plans are now first-class entities that can link to records.

## API Endpoints

### Records

- `GET /api/unified-ledger/records`
- `GET /api/unified-ledger/records/:id`
- `POST /api/unified-ledger/records`
- `PATCH /api/unified-ledger/records/:id`
- `POST /api/unified-ledger/records/:id/vote`
- `POST /api/unified-ledger/records/:id/feedback`
- `POST /api/unified-ledger/records/:id/links`

Compatibility routes used by frontend:

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `GET /api/suggestions`
- `POST /api/suggestions`
- `GET /api/suggestions/:id`
- `PATCH /api/suggestions/:id`
- `POST /api/suggestions/:id/vote`

### Timeline

- `GET /api/timeline/events?recordId=&goalId=&planId=`
- `GET /api/timeline/events/:id`
- `POST /api/timeline/events`
- `PATCH /api/timeline/events/:id`

Event types:

- `record_created`
- `record_updated`
- `record_voted`
- `feedback_iteration_added`
- `functional_link_added`
- `goal_created`
- `goal_linked`
- `plan_created`
- `plan_linked`
- `milestone_updated`
- `historical_event`

### Goals

- `POST /api/goals`
- `GET /api/goals`
- `GET /api/goals/:id`
- `POST /api/goals/:id/link-record`
- `POST /api/goals/:id/milestones`
- `PATCH /api/goals/:id/milestones/:milestoneId`
- `DELETE /api/goals/:id/milestones/:milestoneId`

### Plans

- `POST /api/plans`
- `GET /api/plans`
- `GET /api/plans/:id`
- `POST /api/plans/:id/link`

## Orchestration integration

- Relay task dispatch now ingests into ledger automatically:
  - `packages/relay-core/src/standalone-relay.ts`
  - Calls `POST /api/unified-ledger/ingest/orchestration`

## Design intent

- Treat timeline as the canonical chronological layer.
- Treat goals/plans as higher-order planning overlays linked back to raw
  records.
- Preserve iterative RAG feedback via `feedbackIterations` under each record’s
  `rag` section.

## Timeline service bridge

- Added `UnifiedLedgerTimelineService` for package-level timeline hooks:
  - `packages/feature-suggestions/src/services/unifiedLedgerTimeline.service.ts`
  - Exported by `packages/feature-suggestions/src/index.ts`

## Recent accomplishments (2026-02-19)

- Established primary record graph endpoint:
  - `GET /api/unified-ledger/records/:id/connections`
  - Implemented in both `apps/api` and `packages/api` unified-ledger modules.
- Updated creation flows to enter detail context immediately:
  - New task now navigates to `/tasks/:id`.
  - New suggestion now navigates to `/suggestions/:id`.
- Upgraded detail pages with primary connected graph + chronology:
  - `apps/frontend/src/pages/Tasks/Detail.tsx`
  - `apps/frontend/src/pages/Suggestions/Detail.tsx`
  - Both now show:
    - linked goals/plans
    - timeline events
    - create/link goal and plan actions
- Persisted discussion/notes into feedback iterations:
  - Uses `POST /api/unified-ledger/records/:id/feedback`
  - wired via `addFeedbackIteration(...)` in `apps/frontend/src/services/unifiedLedgerApi.ts`.
- Added first-class overview surfaces:
  - `apps/frontend/src/pages/Goals/index.tsx`
  - `apps/frontend/src/pages/Plans/index.tsx`
  - Routed in `apps/frontend/src/ComprehensiveRouter.tsx` at `/goals` and `/plans`.
- Added explicit chronology persistence endpoint in both API runtimes:
  - `POST /api/timeline/events`
  - supports optional `recordId`, `goalId`, `planId`, and custom timestamp for historical backfill.
- Connected planning pages to historical chronology:
  - `apps/frontend/src/pages/Goals/index.tsx`
  - `apps/frontend/src/pages/Plans/index.tsx`
  - both now support recording historical events and rendering recent per-goal/per-plan timeline entries.
- Added primary planning linkage controls in UI:
  - goals page can create milestones via `POST /api/goals/:id/milestones`
  - plans page can link plan->goal via `POST /api/plans/:id/link`
- Added dedicated detail/operations pages:
  - `apps/frontend/src/pages/Goals/Detail.tsx`
  - `apps/frontend/src/pages/Plans/Detail.tsx`
  - `apps/frontend/src/pages/Timeline/index.tsx`
  - Routed in `apps/frontend/src/ComprehensiveRouter.tsx`:
    - `/goals/:id`
    - `/plans/:id`
    - `/timeline`
- Added server-side validation + dedupe guard on timeline writes:
  - requires at least one of `recordId`, `goalId`, `planId`
  - validates referenced entity IDs exist
  - validates `eventType`
  - dedupes same actor+scope+payload+type in 60s window
- Upgraded shared hooks package from stubs to live unified API calls:
  - `packages/hooks/src/hooks/useFeatureSuggestions.ts`
  - `packages/hooks/src/hooks/useTimeline.ts`
- Upgraded timeline adapters/services to write chronology events:
  - `packages/feature-suggestions/src/services/unifiedLedgerTimeline.service.ts`
  - `apps/frontend/src/features/timeline/services/timeline.service.tsx`

## Validation update (2026-02-19)

- `pnpm --filter @the-new-fuse/hooks build` ✅
- `pnpm --filter @the-new-fuse/feature-suggestions build` ✅
- `pnpm --filter @the-new-fuse/api build` ✅
- `pnpm --filter ./apps/frontend build` ✅
