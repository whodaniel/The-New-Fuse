# Execution Audit Contracts

## Task Execution Log Entry

```ts
type TaskExecutionLogEntry = {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  actor: string;
  source: string;
  stage?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};
```

## API Endpoints

### GET `/api/tasks/:taskId/execution-logs`

Response:

```json
{
  "taskId": "task_123",
  "logs": [],
  "count": 0
}
```

### POST `/api/tasks/:taskId/execution-logs`

Request body:

```json
{
  "message": "Node started",
  "level": "info",
  "actor": "workflow-worker",
  "source": "workflow-worker",
  "stage": "execute_node",
  "metadata": {}
}
```

All fields except `stage` and `metadata` are required.

Response:

```json
{
  "taskId": "task_123",
  "logs": [],
  "count": 1
}
```

## Persistence Notes

- Persist execution logs as `task_executions` rows.
- Store the log payload in `task_executions.output`.
- Use a log-oriented status marker (for example `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`) when writing execution-log rows.

## Task Health Monitor Defaults

- Scan interval: `1800000` ms (30 minutes)
- Override env: `TASK_HEALTH_CHECK_INTERVAL_MS`
- Optional stuck-task auto-fail env: `TASK_STUCK_AUTO_FAIL=true`

## Timeline Mirror Event

Use existing timeline event types when possible. Prefer:

- `eventType`: `historical_event`
- `payload.category`: `task_execution_log`

Suggested payload fields:

```json
{
  "category": "task_execution_log",
  "level": "info",
  "source": "workflow-worker",
  "stage": "execute_node",
  "message": "Node executed successfully",
  "metadata": {}
}
```
