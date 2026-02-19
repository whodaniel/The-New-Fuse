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

### Goals

- `POST /api/goals`
- `GET /api/goals`
- `POST /api/goals/:id/link-record`
- `POST /api/goals/:id/milestones`

### Plans

- `POST /api/plans`
- `GET /api/plans`
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
