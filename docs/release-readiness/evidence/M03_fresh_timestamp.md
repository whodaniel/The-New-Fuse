# Evidence: M03 — Fresh health timestamp

## Probe
```
curl -s https://api.thenewfuse.com/health
```

## Result (2026-06-19T10:11Z)
```
{"status":"healthy","service":"api"}
```

## Verdict

- Status field present: ✅.
- Service field present: ✅.
- RFC3339 `timestamp` field present: **NO**.
- Cannot compute staleness without a timestamp; cannot be green.

## Action

Update the NestJS service handler at `apps/api/src/health` (or wherever the `/health` controller lives) to return:

```json
{
  "status": "healthy",
  "service": "api",
  "timestamp": "2026-06-19T10:20:00.000Z",
  "redis": { "connected": true }
}
```

Without `timestamp`, the public cloud health endpoint is non-monitorable. CI probe in checklist will continue to return red.
