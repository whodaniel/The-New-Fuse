# Cron Sync Contract

## Inputs
- Schedule expression
- Target task command
- Environment context
- Artifact location requirements

## Outputs
- Run status
- Artifact pointers
- Escalation signal if failed

## Validation
- No overlapping destructive runs
- Retry policy bounded
- Failure surfaced in a shared dashboard/log stream
