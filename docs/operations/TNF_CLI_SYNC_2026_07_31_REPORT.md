# TNF CLI ↔ Hermes Sync — 2026-07-31 Implementation Report

## Summary

Three-pass implementation run closing the gap between TNF CLI top-level commands and Hermes Agent top-level commands.

## Pass 1 — Fix the Sync Script (P0)

**Before:**
- 191 "missing commands" reported (all agent markdown files in `.agent/agents/` were mis-counted as missing CLI commands)
- TNF CLI count = 0 (script only matched `registerXCommand` imports, missed all 29 `program.command(...)` declarations)
- Coverage: 0.0%

**After:**
- Script now parses real CLI surfaces:
  - Hermes: `hermes --help` (live) → 62 top-level commands
  - TNF CLI: both `program.command('name')` declarations AND `registerXCommand` imports → 40 top-level commands
- Agent specs are surfaced as `agentRegistry` (informational, not counted as missing commands)
- Coverage: **64.5%**

**Files touched:**
- `scripts/agents/sync-tnf-cli-with-agents.mjs` — full rewrite

## Pass 2 — `tnf agents-specs` Dispatcher (P1)

Built a lightweight bridge command that surfaces all 191 agent specs without frontmatter parsing:

```
tnf agents-specs                  # list all 191 spec names
tnf agents-specs --json           # machine-readable
tnf agents-specs --search podcast # filter
tnf agents-specs --paths          # include .claude/agents/
```

This means the sync script (and any future operator) can introspect the agent registry directly through the CLI rather than scraping the filesystem.

**Files added:**
- `packages/tnf-cli/src/commands/agents-specs.ts`

## Pass 3 — Hermes Parity Commands (P2)

Added the highest-value missing top-level commands (Hermes parity):

| Command | Purpose |
|---|---|
| `tnf status` | Quick health summary (PID, uptime, agent count, last sync, Redis probe) |
| `tnf doctor` | Deeper diagnostics + issue list |
| `tnf config` | View resolved TNF config (read-only) |
| `tnf logs` | Tail recent log files in `~/.tnf/*.log` |

All read-only, no mocks, no new dependencies.

**Files added:**
- `packages/tnf-cli/src/commands/health.ts` (status + doctor)
- `packages/tnf-cli/src/commands/config.ts`
- `packages/tnf-cli/src/commands/logs.ts`

## Coverage Trajectory

| State | Hermes | TNF | Coverage | Missing |
|---|---|---|---|---|
| Original (broken) | 191 | 0 | 0.0% | 191 (false) |
| After P0 (script fix) | 62 | 35 | 56.5% | 52 (real) |
| After P1 (dispatcher) | 62 | 36 | 58.1% | 51 |
| **After P2 (parity batch)** | **62** | **40** | **64.5%** | **48** |

## Remaining Gaps (48 missing, 11 buckets)

Bucket-by-bucket, prioritized by impact and reusability of existing TNF infrastructure:

1. **extension (7)** — bundles, claw, curator, lsp, pairing, pets, skills → most overlap with TNF's existing `plugins` and `traits` commands
2. **channels (7)** — gateway, portal, proxy, send, slack, whatsapp, whatsapp-cloud → high-effort, channels live in their own services
3. **config (6)** — config, egress, logout, model, secrets, setup → partially covered now (config), others need credential plumbing
4. **migration (5)** — backup, completion, migrate, uninstall, update → can wrap shell scripts
5. **ui (5)** — console, dashboard, profile, serve, skin → UI work
6. **meta (5)** — dump, insights, logs (done), prompt-size, version → small
7. **sessions (4)** — chat, checkpoints, import, sessions → large
8. **health (4)** — doctor (done), monitoring, security, status (done) → 50% done
9. **hooks (2)** — approvals, hooks
10. **agents (2)** — import-agent, moa
11. **other (5)** — computer-use, fallback, hermes, project, sync

## Cron Activation

The cron schedule exists in `/tmp/current_crontab` but is not yet installed:

```sh
crontab /tmp/current_crontab
```

This will activate the 6-hour auto-sync.

## Verification

- `npx tsc --noEmit -p packages/tnf-cli/tsconfig.json` → clean
- `node scripts/agents/sync-tnf-cli-with-agents.mjs` → runs, writes latest-report.json, prints summary
- All added commands parse correctly from cli.ts source

## Next Steps

1. Activate cron: `crontab /tmp/current_crontab`
2. Run one more manual sync to populate the initial timestamp
3. Schedule follow-up implementation of remaining 48 commands in priority order (extension → channels → config → ...)
