---
name: tnf-task-production-pipeline
description: Operate and validate the TNF task execution production pipeline end-to-end. Use when requests involve running or hardening TNF task APIs, execution-log ingestion, unified timeline mirroring, stuck-task monitoring on a 30-minute cadence, production readiness checks, or rollout verification in The New Fuse.
---

# TNF Task Production Pipeline

## Overview

Run TNF task operations as a production pipeline: validate builds, verify API behavior, confirm execution-log and timeline flow, and enforce a 30-minute stuck-task monitor.

## Workflow

1. Confirm code paths in `apps/api/src/modules/task/` and `packages/database/src/drizzle/repositories/task.repository.ts` are present and wired.
2. Run scoped compile checks:
   - `pnpm --filter @the-new-fuse/database run build`
   - `pnpm --filter @the-new-fuse/api-server run type-check`
   - `pnpm --filter @the-new-fuse/api-server run build`
3. Validate task API endpoints in a live environment:
   - `GET /api/tasks`
   - `GET /api/tasks/:taskId/execution-logs`
   - `POST /api/tasks/:taskId/execution-logs`
4. Confirm timeline mirroring by checking unified ledger events where:
   - `eventType = historical_event`
   - `payload.category = task_execution_log`
5. Confirm production cadence:
   - default monitor interval is 30 minutes
   - `TASK_HEALTH_CHECK_INTERVAL_MS` overrides interval
   - `TASK_STUCK_AUTO_FAIL=true` enables automatic failover for stuck tasks
6. Report any gap as one of:
   - wiring gap (module/controller/service)
   - persistence gap (task_executions / delete path)
   - observability gap (timeline mirror / log retrieval)
   - runtime policy gap (monitor interval/env behavior)

## Operations Script

Use `scripts/smoke_task_pipeline.sh` to run build checks and optional API smoke checks.

Required env for API smoke checks:

- `TNF_API_BASE_URL` (example: `http://localhost:3001`)
- `TNF_BEARER_TOKEN`
- `TNF_TASK_ID`

Optional env:

- `TNF_SKIP_BUILD=1` to skip compile steps

## References

- Runtime contract: `references/contract-and-env.md`
