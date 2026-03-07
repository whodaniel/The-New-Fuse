# Alerts Reference

## Webhook payload

`jules-followup-supervisor.sh` sends JSON payloads with this shape:

```json
{
  "level": "warning",
  "title": "Jules sessions stalled without PR",
  "message": "Some sessions remain REVIEW/COMPLETED without PR across multiple cycles.",
  "timestamp": "2026-02-22T19:00:00Z",
  "supervisor": "jules-followup-supervisor",
  "repo": "/path/to/repo",
  "meta": {
    "offenders": "123:4 456:3",
    "stalled_threshold_cycles": 3,
    "cycle": 9
  }
}
```

## Alert types

- `stalled-sessions`: sessions remain `REVIEW` or `COMPLETED` without PR beyond
  threshold.
- `cycle-errors`: a supervisor cycle had one or more failed steps.
- `supervisor-stopped-errors`: supervisor exited after hitting max consecutive
  errors.

## Tuning

- Lower `JULES_SUPERVISOR_INTERVAL_SEC` for faster reaction.
- Increase `JULES_ALERT_COOLDOWN_SEC` to reduce noisy repeated alerts.
- Increase `JULES_ALERT_STALLED_CYCLES` if publish conflicts are expected during
  heavy rebases.

## Operator checklist when alert fires

1. Run `pnpm run jules:supervisor:status`.
2. Inspect `.agent/jules-logs/jules-followup-launch.log`.
3. Identify repeated conflict files from publish logs.
4. Decide whether to:
   - rerun another cycle,
   - manually resolve high-value conflict branches,
   - or cancel low-value stale sessions.
