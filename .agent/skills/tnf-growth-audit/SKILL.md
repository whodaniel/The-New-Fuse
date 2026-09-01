---
name: TNF Growth Audit
category: tnf-platform
department: marketing
description:
  Read-only inventory of where AI agents and TNF runtime processes accumulate
  large data (Hermes state.db, logs, snapshots, runtime JSONL, IDE chat stores,
  caches). Diff vs last snapshot; never auto-delete without operator approval.
version: 1.0.0
tags: [tnf, maintenance, disk, hermes, probe, audit]
tools: [Bash, Read, Grep]
---

# TNF Growth Audit

## Purpose

Surface disk pressure **before** builds, SQLite VACUUM, or subagent swarms fail
silently. Part of TNF self-maintenance alongside `swarm-disk-retention.sh` and
`hermes-state-retention.cjs`.

## Run (no LLM required)

From repo root:

```bash
pnpm ops:growth-audit
# or
tnf growth-audit
```

Retention pass (audit first, then safe pruning):

```bash
pnpm ops:disk-retention
```

## Outputs

| Artifact      | Path                                     |
| ------------- | ---------------------------------------- |
| Last snapshot | `~/.tnf/growth-audit/last-snapshot.json` |
| History JSONL | `.agent/runtime-logs/growth-audit.jsonl` |

Exit codes: `0` ok, `1` warn (low disk or growth spike), `2` critical disk.

## Review checklist (operator)

1. Is `hermes-state-db` > 500MB? → run `pnpm ops:hermes:retention` when ≥1GB
   free.
2. Is `hermes-snapshots` large? → retention script removes duplicate pre-update
   dirs.
3. Is `runtime-logs` growing? → `pnpm ops:disk-retention` truncates JSONL
   safely.
4. Is disk `critical`? → pause monorepo builds and parallel LLM subagents.

## Skill family

Sibling to the planned `tnf-probe-*` set (network, backbone, orchestration).
This skill is the **storage/growth** probe — same "set of skills" pattern as
`webdev-*` and `tnf-health-check`.
