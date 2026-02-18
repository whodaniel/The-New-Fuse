# Jules Autonomous Loop

This loop runs Jules delegation and PR lifecycle programmatically, end to end:

1. refresh session status
2. approve pending plans
3. publish completed sessions to branches
4. create PRs
5. resolve/merge open PRs

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

## Scheduled unattended loop (cron)

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

## Logs

- loop log: `.agent/jules-logs/jules-autonomous-loop-*.log`
- merge log: `.agent/jules-logs/jules-merge-open-*.log`
- post-merge open queue snapshot: `.agent/jules-logs/jules-open-prs-after-merge-*.json`
- cron log: `.agent/jules-logs/jules-cron.log`

## Safety behavior

- Idempotent by default: re-running does not duplicate already merged work.
- Merge conflict resolver uses branch updates in isolated git worktrees.
- Known recurring conflict for `apps/frontend/src/routes/routes.test.tsx` is resolved by honoring `main` deletion.

