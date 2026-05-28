# Contract And Env

## Endpoints

- `GET /api/tasks/:taskId/execution-logs`
- `POST /api/tasks/:taskId/execution-logs`

POST body (minimum):

```json
{
  "level": "info",
  "message": "node started",
  "actor": "workflow-worker",
  "source": "workflow-worker"
}
```

Expected mirror event:

- timeline `eventType`: `historical_event`
- payload key: `category: task_execution_log`

## Production monitor

- Default interval: `1800000` ms (30 minutes)
- Override: `TASK_HEALTH_CHECK_INTERVAL_MS`
- Optional auto-fail: `TASK_STUCK_AUTO_FAIL=true`

## Validation commands

```bash
pnpm --filter @the-new-fuse/database run build
pnpm --filter @the-new-fuse/api-server run type-check
pnpm --filter @the-new-fuse/api-server run build
```
