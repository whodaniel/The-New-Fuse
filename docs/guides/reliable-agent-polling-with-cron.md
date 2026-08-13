# Reliable Agent Polling With Cron

This guide packages TNF's robust polling pattern into reusable scripts for
long-running autonomous workflows.

## Why this polling pattern works

The runner uses the same reliability primitives that make TNF loops stable:

- lock directory with stale-lock recovery to prevent overlapping runs
- heartbeat + state files for observability and recovery
- exponential backoff after failures to avoid hot-loop retries
- jitter before execution to reduce synchronized bursts
- idempotent cron pulses (safe to run every minute)

## Scripts

- Poll pulse runner: `scripts/runtime/agent-poll-pulse.cjs`
- Cron installer: `scripts/runtime/agent-poll-cron.sh`

## One-shot execution

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
node scripts/runtime/agent-poll-pulse.cjs \
  --job "example-health-check" \
  --command "curl -fsS https://thenewfuse.com/healthz" \
  --jitter-sec 3 \
  --timeout-sec 30
```

## Install as cron loop

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
./scripts/runtime/agent-poll-cron.sh install \
  --job "example-health-check" \
  --command "curl -fsS https://thenewfuse.com/healthz" \
  --schedule "*/1 * * * *"
```

Check status:

```bash
./scripts/runtime/agent-poll-cron.sh status --job "example-health-check"
```

Remove:

```bash
./scripts/runtime/agent-poll-cron.sh uninstall --job "example-health-check"
```

## State and logs

Each job writes to:

- `~/.tnf/poll-jobs/<job>/state.json`
- `~/.tnf/poll-jobs/<job>/heartbeat.json`
- `~/.tnf/poll-jobs/<job>/history.jsonl`
- `~/.tnf/poll-jobs/<job>/cron.log`

## Cross-agent sharing

1. Place shared workflows in scripts that are deterministic and idempotent.
2. Schedule each workflow with `agent-poll-cron.sh`.
3. Keep independent job IDs per agent/workflow.
4. Use heartbeat files as a handoff surface for other agents and dashboards.
