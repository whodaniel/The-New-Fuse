# Jules Autonomous Loop

This loop runs Jules delegation and PR lifecycle programmatically, end to end:

1. refresh session status
2. approve pending plans
3. publish completed sessions to branches
4. create PRs
5. resolve/merge open PRs

## Continuous supervisor mode (recommended)

Use the supervisor for persistent follow-up instead of one-shot runs.

```bash
pnpm run jules:supervisor:start
pnpm run jules:supervisor:status
```

Stop/restart:

```bash
pnpm run jules:supervisor:stop
pnpm run jules:supervisor:start
```

Migrate from cron to supervisor:

```bash
pnpm run jules:supervisor:migrate-from-cron
```

## One-shot run

```bash
pnpm run jules:loop
```

Optional with new task batch:

```bash
pnpm run jules:loop -- .agent/jules-logs/tasks-batch2-2026-02-18.txt
```

## Merge engine only

```bash
pnpm run jules:merge-open
```

## Scheduled unattended loop (cron, legacy fallback)

Install a cron entry (every 15 minutes by default):

```bash
pnpm run jules:cron:install
```

Custom interval:

```bash
INTERVAL_MINUTES=10 pnpm run jules:cron:install
```

Pass a task file for recurring starts:

```bash
INTERVAL_MINUTES=30 TASK_FILE=.agent/jules-logs/tasks-batch2-2026-02-18.txt pnpm run jules:cron:install
```

## Environment assumptions

- `jules` CLI is installed and authenticated.
- `gh` CLI is installed and authenticated to `whodaniel/fuse`.
- `jq` is installed.
- Repo remote `origin` is reachable.

## Alerting and escalation env vars

Set these in `.env.local` when using `jules:supervisor`:

- `JULES_ALERT_WEBHOOK_URL`
- `JULES_ALERT_COOLDOWN_SEC`
- `JULES_ALERT_STALLED_CYCLES`
- `JULES_SUPERVISOR_INTERVAL_SEC`
- `JULES_SUPERVISOR_ADVANCE_EVERY`
- `JULES_SUPERVISOR_MAX_ERRORS`

## Logs

- loop log: `.agent/jules-logs/jules-autonomous-loop-*.log`
- merge log: `.agent/jules-logs/jules-merge-open-*.log`
- post-merge open queue snapshot:
  `.agent/jules-logs/jules-open-prs-after-merge-*.json`
- cron log: `.agent/jules-logs/jules-cron.log`
- supervisor launch log: `.agent/jules-logs/jules-followup-launch.log`
- supervisor cycle logs: `.agent/jules-logs/jules-followup-supervisor-*.log`
- supervisor heartbeat: `.agent/jules-logs/jules-followup-heartbeat.json`
- supervisor alert state:
  `.agent/jules-logs/jules-followup-supervisor-state.json`

## Safety behavior

- Idempotent by default: re-running does not duplicate already merged work.
- Merge conflict resolver uses branch updates in isolated git worktrees.
- Known recurring conflict for `apps/frontend/src/routes/routes.test.tsx` is
  resolved by honoring `main` deletion.
- Manual frontend/browser viewing prompts are blocked from Jules delegation. Use
  browser-capable agents for visual/manual UI QA.
