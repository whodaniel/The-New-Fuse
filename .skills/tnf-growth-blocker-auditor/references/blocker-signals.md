# Growth Blocker Signals

Use these signals to identify protocol drift that can silently suppress delivery
velocity.

## High-Risk Signals

- `enabled=false` on recurring loops that gate planning, coordination, or
  recovery.
- `runtime.status` in `error`, `paused`, or `manual` for core process
  categories.
- stale-run-window warnings in master-clock sync audit.
- lock-heavy system schedules with no periodic policy review.

## Medium-Risk Signals

- repeated local fallback execution (`fallback=local-artifact`) without queue
  recovery.
- missing explicit runbook/protocol links on scheduled jobs.
- unowned schedules (`owner_agent_id` missing or placeholder).

## Candidate Restrictive Policy Patterns

Search policy and protocol docs/scripts for terms like:

- `deny`, `blocked`, `freeze`, `manual-only`, `disabled`, `requires_approval`
- `never`, `must not`, `prohibit`, `restrict`, `locked`

These patterns are not automatically bad. Flag only when they affect delivery
cadence, scale, or task throughput and do not have a current business
justification.
