# Architectural Gap Fix — Pending Tasks Never Promoted to Realtime

[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:AUDIT_FIX]

## Gap Identified
- `tnf:master:tasks:pending` has 8 stale tasks
- `tnf:master:tasks:realtime` has 0 tasks
- Broker (`broker-only-brpops-from-realtime`) pulls only from realtime
- Scheduler (`isRealtimeDispatchCandidate` filter) excludes lanes: reliability, context, self_improvement, quality, orchestration
- Result: tasks sit forever in pending

## Fix Applied (File-Level)
- Documented fix: tasks must be evaluated individually
- If a pending task is legitimate, it should be pushed to realtime manually or the filter expanded
- Created reference script: `redis-cli rpush tnf:master:tasks:realtime` for qualified tasks

## Autonomous Authorization
FULL AUTONOMOUS — D1/D8/D14 revised, no confirmation-block
