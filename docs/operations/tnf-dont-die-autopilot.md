# TNF Don't Die Autopilot

Status: Active Audience: Super Admin operators

## Objective

Keep the TNF recurring process ecosystem self-healing by continuously:

1. auditing control-plane process health,
2. remediating stale critical processes,
3. re-auditing and writing evidence artifacts.

## Primary Command

```bash
node scripts/protocols/dont-die-supervisor.cjs --json
```

## Key Flags

- `--max-runs <n>`: cap remediations per cycle.
- `--process-id <id>`: target one process.
- `--include-warnings`: include warning-level escalations.
- `--warn-only`: return exit code 0 even if critical escalations remain.
- `--no-local-dispatch-fallback`: disable local dispatch fallback path.
- `--dry-run`: plan actions without executing process runs.

## Artifacts

- `reports/protocols/dont-die-supervisor/dont-die-latest.json`
- `reports/protocols/dont-die-supervisor/dont-die-latest.md`
- `reports/protocols/master-clock-sync/master-clock-sync-latest.json`
- `reports/protocols/master-clock-sync/master-clock-sync-latest.md`

## Local Cron Installation

Install a resilient 15-minute loop with backoff and lock control:

```bash
bash scripts/runtime/agent-poll-cron.sh install \
  --job tnf-dont-die-supervisor \
  --schedule "*/15 * * * *" \
  --command "cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse && node scripts/protocols/dont-die-supervisor.cjs"
```

Check status:

```bash
bash scripts/runtime/agent-poll-cron.sh status --job tnf-dont-die-supervisor
```

Uninstall:

```bash
bash scripts/runtime/agent-poll-cron.sh uninstall --job tnf-dont-die-supervisor
```

## Cloud Sync Notes

1. In cloud-hosted TNF workers, set `REDIS_URL` so `chronological-dispatch`
   writes directly to Redis.
2. Without `REDIS_URL`, supervisor enables local fallback artifacts by default.
3. Keep `data/protocols/cron-jobs.control-plane-state.json` synchronized into
   your cloud control-plane snapshots for drift detection.
