---
name: tnf-execution-audit-trail
description: Implement or repair per-task execution audit logging across The New Fuse stack. Use when requests involve task execution visibility, audit trails, timeline logging, or “what happened during task/workflow execution” features in TNF. Trigger for tasks that require wiring logs through backend API endpoints, workflow engine telemetry/router/worker events, and Task Detail frontend filtering/presets/shareable log views.
---

# TNF Execution Audit Trail

## Overview

Implement execution logging as a single chain: API persistence, workflow emission, and UI consumption. Keep behavior additive and backward compatible.

## Workflow

1. Confirm backend task logging endpoints exist.
2. Ensure task logs persist and mirror to unified timeline events.
3. Ensure workflow engine emits execution events and optionally persists to API.
4. Ensure Task Detail renders logs with filtering and preset UX.
5. Run focused lint/type/test checks and report pre-existing failures separately.

## Step 1: Backend API and service

Implement or verify these in `apps/api/src/modules/task/`:

- `GET /tasks/:taskId/execution-logs`
- `POST /tasks/:taskId/execution-logs`
- Service method to append logs into `task_executions` using structured JSON payload in `output`.
- Timeline mirror event (typically `historical_event`) with payload category `task_execution_log`.

Require `message`, `level`, `actor`, `source` in POST body. Use ownership checks so users can only access their own task logs.

Add `TaskHealthMonitorService` in `TaskModule`:

- Run scan every 30 minutes by default.
- Detect tasks stuck in `IN_PROGRESS` for >30 minutes.
- Append execution log entries for stuck tasks.
- Optional auto-fail via env `TASK_STUCK_AUTO_FAIL=true`.
- Optional interval override via `TASK_HEALTH_CHECK_INTERVAL_MS` (default `1800000`).

Wire `TaskModule` to `UnifiedLedgerModule` if timeline creation is needed.

Read [references/contracts.md](references/contracts.md) for payload and response shapes.

## Step 2: Workflow engine emission

Implement or verify in `packages/workflow-engine/src/`:

- Telemetry helper to emit structured task execution logs.
- Optional API persistence path gated by env (`TNF_API_BASE_URL` or `API_BASE_URL`).
- Router emission on ingress/routing/dispatch outcomes.
- Worker emission on start/execute/finalize phases.
- `taskId` propagation in queue payloads so worker can persist to real task IDs.

If worker writes context, ensure engine exposes the method worker calls (for example `updateExecutionState`).

## Step 3: Frontend Task Detail

Implement or verify in `apps/frontend/src/pages/Tasks/Detail.tsx` and `apps/frontend/src/services/unifiedLedgerApi.ts`:

- Fetch logs via task execution-log endpoints.
- Send note panel entries to execution logs (not feedback iteration).
- Render execution log list with:
  - `level`, `source`, `stage`, `message`, `actor`, `timestamp`
- Add filtering (`level`, `source`, `stage`, search).
- Add presets (`All`, `Errors Only`, `Router Events`, `Dispatch Stage`, `Worker Execution`).
- Add active preset visual state and `Custom` indicator when manual filters diverge.
- Sync filters/preset/search to URL query params for shareable views.

## Step 4: Validate

Run minimal, scoped validation first:

```bash
pnpm --filter @the-new-fuse/database run build
pnpm --filter @the-new-fuse/api-server run type-check
pnpm --filter @the-new-fuse/workflow-engine exec tsc -p tsconfig.json --noEmit
pnpm -C apps/frontend exec eslint src/pages/Tasks/Detail.tsx src/services/unifiedLedgerApi.ts
```

If full frontend typecheck is known to hang in this repo, state that explicitly and use file-scoped lint as fallback.

## Guardrails

- Avoid introducing new event enums if existing timeline types are sufficient.
- Keep persistence best-effort from workflow engine; never fail execution flow only because logging API failed.
- Do not overwrite unrelated dirty worktree files.
- Treat pre-existing compiler/test failures as separate from your changes.
