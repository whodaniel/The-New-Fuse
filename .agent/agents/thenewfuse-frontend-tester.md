---
category: Engineering
department: tech
domain: '[to be determined from content]'
visibility: collective
dacc_role: worker
worker_action: '[to be determined from capabilities]'
fulfillment:
  vendor: '[to be determined from tools/platform]'
  model: '[to be determined from configuration]'
  tools: '[to be extracted from capabilities/tools fields]'
traits:
  observability: '[to be determined]'
  subAgent_capable: '[to be determined]'
  orchestrates_agents: '[to be determined]'
  persona_source: '[to be determined]'
  autonomy_level: '[to be determined]'
name: thenewfuse-frontend-tester
description:
  Continuous frontend/API health probe of thenewfuse.com. Replaces the legacy
  OpenClaw launchd agent `com.openclaw.tnf-continuous-test`. Runs every 5
  minutes; no LLM required.
tags:
  - tester
  - frontend
  - api
  - health
  - fleet
  - thenewfuse
  - native-cron
schedule: every 5 minutes (system cron)
supervisor: false
depends_on: []
runtime: system cron `*/5 * * * *` (sidesteps Hermes cron interpreter bug)
---

# TheNewFuse Frontend Tester

## Operational Mandate

Native TNF replacement for what was `tnf-continuous-test.sh` running under
launchd as `com.openclaw.tnf-continuous-test`. The OpenClaw agent lived at
`~/.openclaw/workspace/scripts/cron/tnf-continuous-test.sh` and was a KeepAlive
loop probing thenewfuse.com every 5 minutes. This agent does the same job from
the system cron runtime, with no OpenClaw dependency. **System cron is used
because Hermes cron is currently broken**
(`RuntimeError: cannot schedule new futures after interpreter shutdown` in
`cron.scheduler`, observed across jobs `be1d08855b63`, `7565931a6dc3`,
`a28f0d31a6b3`, `6f0bec6dae4e`, `a9407d63ca93` between 2026-06-09 and
2026-06-22). The watchdog subset of `continuous-improver` emits a critical
finding whenever the interpreter bug recurs three cycles in a row on the same
job.

## Probe Targets

| Layer    | Endpoint                                  | Signal              |
| -------- | ----------------------------------------- | ------------------- |
| Frontend | `https://thenewfuse.com/`                 | HTTP 200, < 5s      |
| API      | `https://thenewfuse.com/api/health`       | JSON, status=ok     |
| API      | `https://thenewfuse.com/api`              | not 404, not 000    |
| Auth     | `https://thenewfuse.com/api/auth/session` | any HTTP — log code |
| Static   | `https://thenewfuse.com/_next/static`     | HTTP code recorded  |

## Probe Protocol

For each target:

1.  `curl -s -o /dev/null -w "%{http_code}|%{time_total}"` with `--max-time 10`.
2.  For `/api/health`, also read the body — fail if empty or not parseable JSON.
3.  Classify each result: `ok | warn | critical` against the table above.
4.  Compute cycle duration; append one JSONL record per cycle.
5.  If any `critical` found, append a task to `tnf:master:tasks:planning`
    describing the failure (severity, target, observed value, suggested next
    action).

## Output Artifacts

- JSONL: `~/.tnf/runtime/thenewfuse-tester/issues-YYYYMMDD.jsonl`
- Tasks: redis LPUSH `tnf:master:tasks:planning` (only on critical)
- Heartbeat: redis PUBLISH `tnf:agent-registry` with
  `agentId=agent:thenewfuse-frontend-tester`, `lastCycleAt=ISO_TIMESTAMP`,
  `cyclesToday=N`

## Behavior Rules

✅ Touch only `https://thenewfuse.com` subpaths. No other domains. ✅ Time
budget per cycle: 60 seconds wall-clock max. ✅ Open one JSONL append per cycle,
never truncate. ✅ Reference the bus, not Telegram, for issue routing — Telegram
alerts are owned by other agents (continuous-improver, tnf-fleet-health-probe).
❌ Never run during business maintenance window `Sun 02:00–02:15 UTC`. ❌ No LLM
in the hot path; if probes fail this agent escalates; downstream agents choose
whether to invoke an LLM.

## Trigger

- System cron `*/5 * * * *`, command:
  `$TNF_ROOT/scripts/agents/tnf-frontend-tester-cycle.sh` Cron label in user
  crontab: `tnf-thenewfuse-frontend-tester-cycle`.
- Manual: invoke the script directly (`bash tnf-frontend-tester-cycle.sh`).
- The OpenClaw launchd plist `com.openclaw.tnf-continuous-test.plist` must be
  booted out before this agent is the sole owner — see
  `scripts/operations/migrate-openclaw-crons.sh` (created by the TNF native cron
  migration 2026-06-23).
