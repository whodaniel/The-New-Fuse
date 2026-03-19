# Clock And Heartbeat Contract

## Required Cadence

- Master Orchestrator heartbeat: every 30 minutes
- Team Orchestrator heartbeat: every 60 minutes
- Investigator progress pulse: every 2 hours
- Periodic digest report: every 12 hours
- Blocked-state scan: every 15 minutes

## Required Files

Under `reports/personal-archaeology/`:

- `program.manifest.json`
- `status/*.json`
- `heartbeats/*.json`
- `progress/iteration-log.md`
- `blocked/human-actions.json`
- `notifications/alerts.jsonl`
- `reports/periodic-digest.md`

## Blocked-State Rule

When blocked by auth, permissions, approvals, or unavailable systems:

1. append a blocked item
2. append an alert record
3. keep findings path references
4. mark status as `blocked`

Never treat a blocked state as silent inactivity.
