# TNF Autopilot Recovery - 2026-03-26

## Incident

User-reported trust failure: expected daily autopilot loops were not visibly
sustaining.

## What Was True At Runtime

1. TNF master-clock control plane was healthy.
2. OpenClaw cron layer had degraded jobs (timeouts and delivery/channel errors).
3. Some OpenRouter-backed cron jobs were failing from provider-side
   quota/rate-limit issues.

## Evidence Collected

1. Full TNF reliability loop completed successfully:
   - `bash /Users/<owner>/.codex/skills/tnf-stack-self-improvement-loop/scripts/run_loop.sh --repo /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com`
   - Produced required artifacts under `apps/frontend/docs/audits/` and
     `docs/architecture/`.
2. Master clock sync audit passed with zero escalations:
   - `node scripts/protocols/master-clock-sync-audit.cjs --repo-root /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse --json`
   - Summary: `totalProcesses=19`, `escalations.total=0`.
3. OpenClaw cron degradation confirmed via:
   - `openclaw cron list`
   - `openclaw cron runs --id <job-id>`
   - `~/.openclaw/logs/gateway.err.log` showed rate limit and spend-limit errors
     for OpenRouter.

## Applied Fixes

### OpenClaw cron hardening

Patched `~/.openclaw/cron/jobs.json` for active autopilot jobs:

1. Replaced OpenRouter model dependency with a working local lane
   (`corethink:free` or `kilocode/corethink:free`).
2. Removed stale `delivery.channel` / `delivery.bestEffort` fields when
   `delivery.mode = "none"` to avoid channel resolution failures.
3. Increased timeout budgets on long-running loops:
   - `TNF Orchestrator Pulse`: `900s`
   - `TNF Self-Improve Loop`: `1200s`
   - `TNF Continuous QA Loop`: `1800s`
4. Normalized wake mode to `now` for active loops that were stalling in
   heartbeat mode.
5. Restarted gateway service after patch:
   - `openclaw daemon restart`

### Manual verification triggers

Triggered fresh runs for patched jobs:

1. `openclaw cron run 16410756-8c51-4199-9fe1-cf96cd726e1c`
2. `openclaw cron run 74ff6bf6-12c0-4a15-826f-6d7bfe48a0fe`
3. `openclaw cron run d9f19099-3ada-450c-a87c-2466189f3707`

## Current Operational Notes

1. Control-plane cron contracts are healthy.
2. OpenClaw cron config is hardened against the observed quota/channel failure
   class.
3. Manual verification runs were enqueued after patch; continue watching:
   - `openclaw cron runs --id <job-id> --limit 20`
   - `openclaw cron list`

## Quick Health Command Set

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse

# TNF master-clock / protocol-level health
node scripts/protocols/master-clock-sync-audit.cjs --repo-root "$PWD" --json

# OpenClaw scheduler health
openclaw cron status
openclaw cron list
openclaw cron runs --id 16410756-8c51-4199-9fe1-cf96cd726e1c --limit 20
openclaw cron runs --id 74ff6bf6-12c0-4a15-826f-6d7bfe48a0fe --limit 20
openclaw cron runs --id d9f19099-3ada-450c-a87c-2466189f3707 --limit 20
```

## Recovery Continuation (2026-03-26 13:28 ET)

1. Fixed a hard blocker in OpenClaw workspace automation script:
   - `~/.openclaw/workspace/cycle-completion-tracker.js`
   - Resolved `SyntaxError: Identifier 'result' has already been declared`.
2. Verified deterministic self-improvement commands run successfully in
   workspace:
   - `node cycle-completion-tracker.js`
   - `node post-implementation-validator.js`
   - `node validate-audit-report.js`
3. Added deterministic local fallback cron loop to bypass LLM-provider
   instability:
   - Script: `~/.openclaw/scripts/run-tnf-self-improvement-loop.sh`
   - Cron:
     `*/30 * * * * ~/.openclaw/scripts/run-tnf-self-improvement-loop.sh # tnf-self-improvement-loop-local`
4. Executed fallback script manually and verified fresh report outputs:
   - `~/.openclaw/workspace/cycle-effectiveness-report.json`
   - `~/.openclaw/workspace/post-implementation-validation-report.json`
5. Quarantined unstable OpenClaw LLM loops (disabled):
   - `TNF Self-Improve Loop` (`74ff6bf6-12c0-4a15-826f-6d7bfe48a0fe`)
   - `TNF Continuous QA Loop` (`d9f19099-3ada-450c-a87c-2466189f3707`)
6. Kept stable OpenClaw loops active:
   - `TNF Orchestrator Pulse`
   - `TNF Nightly Maintenance`
   - `TNF Daily Priority Plan`

### Current Preferred Execution Path

1. Deterministic TNF maintenance via local cron
   (`tnf-self-improvement-loop-local`).
2. OpenClaw orchestrator pulse for agent-layer continuity.
3. TNF master-clock watchdog/poll jobs remain active in user crontab.
