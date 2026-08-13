---
name: tnf-multi-agent-state-governor
description:
  Cross-agent snapshot/state retention governor for `.gemini`, `.claude`,
  `.opencode`, `.kilo`, `.augment`, `.codex`, and `.tnf`. Uses
  inspect→act→verify with explicit retention policy and report artifacts.
---

# TNF Multi-Agent State Governor

## Type

- `bridge`: Coordinates state retention across multiple agent homes.
- `validator`: Verifies post-action state and retention compliance.

## Purpose

Use this skill to audit and prune stale snapshot/state artifacts across local
agent homes while preserving active anchors.

Targets:

- `~/.gemini`
- `~/.claude`
- `~/.opencode`
- `~/.kilo`
- `~/.augment`
- `~/.codex`
- `~/.tnf`

## Workflow Contract

Always execute in this order:

1. `audit` current state.
2. `plan` actions from verified state.
3. `apply` only with explicit confirmation.
4. re-`audit` and verify counts/sizes.

## Commands

Run from repo root:

```bash
python3 .skills/tnf-multi-agent-state-governor/scripts/tnf_multi_agent_state_governor.py audit
```

```bash
python3 .skills/tnf-multi-agent-state-governor/scripts/tnf_multi_agent_state_governor.py plan
```

```bash
python3 .skills/tnf-multi-agent-state-governor/scripts/tnf_multi_agent_state_governor.py apply --yes
```

Optional policy override:

```bash
python3 .skills/tnf-multi-agent-state-governor/scripts/tnf_multi_agent_state_governor.py plan \
  --policy .skills/tnf-multi-agent-state-governor/references/policy-example.yaml
```

## Retention Defaults

### Agent Home Retention

- Keep latest 120 files in `~/.claude/shell-snapshots`.
- Keep latest 2 `~/.gemini/settings.json.backup.*` files.

### TNF Internal Retention

- Keep latest 50 files in `~/.tnf/inbound` queue.
- Keep latest 30 files in `~/.tnf/reports/protocols/agent-state-governance`.
- Delete `~/.tnf/inbound/*.json` older than 7 days.
- Delete `~/.tnf/terminal-heartbeat/state/history/*` older than 30 days.
- Delete `~/.tnf/gemini-wrapper-home/Library/Caches/**/*` older than 7 days.

### Stale Lock Detection

- Detect `~/.tnf/locks/*.lock` directories older than 1 day.
- Check PID liveness before deletion.
- Delete only confirmed stale locks.

### Federation Log Management

- Keep max 10 `~/.tnf/federation-watchdog-*.jsonl` files.
- Keep max 10 `~/.tnf/federation-watchdog-*.log` files.
- Delete files older than 30 days (if over max_count).

### Log Rotation

- Rotate `~/.tnf/logs/tnf-agent-daemon.log` if > 10MB or > 7 days old.
- Rotate `~/.tnf/logs/hermes-tnf-bridge.log` if > 5MB or > 7 days old.
- Rotate `~/.tnf/terminal-heartbeat/logs/cron.log` if > 10MB or > 7 days old.

### Gzip Dormant Histories

- Gzip TNF JSONL histories older than 21 days:
  - `~/.tnf/master-heartbeat/state/master-heartbeat-history.jsonl`
  - `~/.tnf/perpetual-scaffold/state/watchdog-history.jsonl`
  - `~/.tnf/subdirector-autopilot/state/subdirector-autopilot-history.jsonl`
  - `~/.tnf/cloud-health/state/history.jsonl`
  - `~/.tnf/terminal-heartbeat/state/terminal-heartbeat-history.jsonl`

## Output Artifacts

Reports are written to:

- `~/.tnf/reports/protocols/agent-state-governance/`

Artifacts:

- `audit-<stamp>.json`
- `plan-<stamp>.json`
- `apply-<stamp>.json`

`audit` also includes TNF protocol liveness checks for:

- `~/.tnf/handoff-current.json`
- `~/.tnf/master-heartbeat/state/master-heartbeat-latest.json`
- `~/.tnf/terminal-heartbeat/state/terminal-heartbeat-latest.json`
- `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json`

## Guardrails

- Never delete active "latest" state anchors.
- Default mode is non-destructive (`audit`/`plan`).
- `apply` requires `--yes`.
- Verify post-apply metrics before ending run.
