---
name: jules-followup-ops
description:
  Operate and stabilize Jules session follow-up in The-New-Fuse. Use when
  sessions are stuck in REVIEW or COMPLETED without publish/PR, when you need
  continuous supervision of Jules follow-up and merges, when cron-based
  follow-up is failing, or when alert-driven escalation is required for brittle
  scattered Jules processes.
---

# Jules Follow-up Ops

Use this runbook to keep Jules session follow-up reliable and observable.

## Baseline

Run these commands first:

```bash
pnpm run jules:supervisor:status
node scripts/jules-pipeline.cjs status
```

Confirm:

- Supervisor status is `running`.
- Heartbeat file is fresh.
- Session counts (`without_pr`, `without_branch`) are trending down, not up.

## Start Or Recover Supervision

Prefer supervisor mode over cron.

```bash
pnpm run jules:supervisor:migrate-from-cron
pnpm run jules:supervisor:start
pnpm run jules:supervisor:status
```

If a stale PID is reported:

```bash
pnpm run jules:supervisor:stop
pnpm run jules:supervisor:start
```

## Enforce No Manual Frontend Delegation To Jules

Before submitting or following up Jules work, keep tasks limited to logs, tests,
and code.

Use the guard directly when needed:

```bash
bash scripts/jules-task-guard.sh --text "<task prompt>"
```

If blocked, reroute the work to a browser-capable path and keep Jules on
code-only remediation.

## Follow-up Actions For Stalled Sessions

Use this order:

1. Refresh status and approve plans.
2. Advance sessions without PR.
3. Attempt publish pass.
4. Open/fetch PRs.
5. Attempt merge wave.

Commands:

```bash
node scripts/jules-pipeline.cjs status
node scripts/jules-pr-orchestrator.cjs approve-plans --sessions-file .agent/jules-logs/jules-followup-sessions-<stamp>.txt
node scripts/jules-pr-orchestrator.cjs advance --sessions-file .agent/jules-logs/jules-followup-sessions-<stamp>.txt
node scripts/jules-publish-prs.cjs --sessions-file .agent/jules-logs/jules-followup-publish-<stamp>.txt --mode publish --limit <n> --repo whodaniel/fuse --base main
node scripts/jules-pipeline.cjs pr
bash scripts/jules-merge-open-prs.sh
```

## Alerting

Set these environment variables in `.env.local` for webhook alerts:

- `JULES_ALERT_WEBHOOK_URL`
- `JULES_ALERT_COOLDOWN_SEC`
- `JULES_ALERT_STALLED_CYCLES`
- `JULES_SUPERVISOR_INTERVAL_SEC`
- `JULES_SUPERVISOR_ADVANCE_EVERY`

Read `references/alerts.md` for payload format and tuning guidance.

## Escalation Rule

Escalate when either condition persists for 3+ cycles:

- `without_pr` flat or rising.
- Repeated publish conflicts on the same sessions.

Escalation output:

- Session IDs.
- Primary conflict files.
- Last successful action in the cycle.
- Recommended next operator step.
