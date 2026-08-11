`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL] [VISIBILITY:COLLECTIVE]`

# TNF Artifacts Lifecycle Protocol

**Protocol ID:** `TNF_ARTIFACTS_LIFECYCLE` **Status:** ACTIVE **Authority:**
Codifies how TNF agents distinguish persistent logic from transient state,
surface open tasks, and prune obsolete artifacts without losing auditable
history. **Codifies:** Operator audit 2026-07-28 — the heartbeat artifact sprawl
(`~/.tnf/terminal-heartbeat/state/history/` 5,727 files / 68 MB,
`~/.tnf/openclaw-pre-migration-carry/` 949 MB, `~/.tnf/node_modules/` 5.1 GB)
coexisted with an unenforced retention policy. This protocol makes the policy
load-bearing.

## Purpose

Three things were happening simultaneously and each was wrong in its own way:

1. **Persistent logic was drifting.** The retention policy lived in
   `.agent/skills/tnf-multi-agent-state-governor/SKILL.md` and a separate script
   in `scripts/operations/swarm-disk-retention.sh`, but nothing in CI failed
   when retention was skipped. Retention policy was documentation, not
   enforcement.
2. **Open tasks were scattered.** A task might be in `~/.tnf/lessons-learned.md`
   (action: Y/N), in `handoff-current.json` `IMMEDIATE_TASKS`, in the
   heartbeat's own history JSON, or just in the operator's head. There was no
   canonical surface.
3. **"Old crap" accumulated.** Files older than the documented retention windows
   sat on disk indefinitely because the cron that was supposed to prune them was
   either paused, the script threw a non-fatal warning, or nobody watched the
   warning.

This protocol names the three categories, names the canonical surface for each,
and enforces retention through a CI gate rather than a polite cron.

## Definitions

### Persistent logic — MUST NEVER be deleted by retention

Anything that represents **current load-bearing behavior** of the system. If it
vanished, agents would have to rediscover how the system works or the operator
would lose operator-facing control.

| Category                       | Where it lives                                                                                                                 | Retention policy                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Agent-role registry            | `~/.tnf/authority/roles.json` (mode 0600, operator-owned)                                                                      | Never. Mirror to git-tracked backup monthly.                                                                                          |
| Per-agent keys                 | `~/.tnf/authority/keys/<agent-id>` (mode 0600)                                                                                 | Never while the agent is `active` or `standingBy`.                                                                                    |
| Operator handoff (current)     | `~/.tnf/handoff-current.json`                                                                                                  | Never. Updated on every session; the _current_ state must not vanish.                                                                 |
| Operator handoff (lineage)     | `~/.tnf/handoff-lineage.json`                                                                                                  | Keep all rows (append-only lineage, see CHALLENGE_RATIONALE_LOG entries)                                                              |
| Operator lessons-learned       | `~/.tnf/lessons-learned.md`                                                                                                    | Keep all `Verified: Y` entries forever. Soft-archive `Verified: N` after 200-entry threshold (per `tnf-self-improvement-loop` skill). |
| Authority audit log            | `~/.tnf/authority/audit.jsonl`                                                                                                 | Never within the SKEW_WINDOW + NONCE_TTL horizon (5 min). Cap at 50,000 lines after that with gzip.                                   |
| Active state anchors           | `*-latest.json` / `*-latest.md` under every `state/` dir (`terminal-heartbeat`, `master-heartbeat`, `local-subdirector`, etc.) | Never while a heartbeat loop is enabled.                                                                                              |
| LOCKED docs                    | Any `docs/protocols/*` doc with `[STATUS:LOCKED]` header                                                                       | Never. Mutation requires `challenge_rationale` + CHALLENGE_RATIONALE_LOG entry.                                                       |
| Handoff packet `verified` rows | `tnf:handoff:v1:verify:{packetId}` (Redis)                                                                                     | Soft-retire → archive → purge per `HANDOFF_PACKET_LIFECYCLE.md`.                                                                      |
| Mission-critical queue tables  | `inbox:*`, `index:session:*` (Redis)                                                                                           | LREM on terminal ack only; never blanket-prune.                                                                                       |

### Transient state — retention policy applies

Anything that records **observations or computations** that are correct at the
time of writing but lose value as they age. These are the targets of retention
policy.

| Category                                 | Where it lives                                                                         | Default retention                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Heartbeat history snapshots              | `~/.tnf/terminal-heartbeat/state/history/*.json`                                       | 30 days OR 200 files (whichever is shorter)                                                       |
| Heartbeat JSONL tail                     | `terminal-heartbeat-history.jsonl`                                                     | 500 lines (head truncated, tail preserved)                                                        |
| Master-clock JSONL                       | `~/.tnf/master-heartbeat/state/master-heartbeat-history.jsonl`                         | 7 days hot, gzip thereafter per `hermes-state-retention.cjs::rotateMasterClockLogs`               |
| Watchdog / autopilot JSONL               | `~/.tnf/{perpetual-scaffold,subdirector-autopilot,cloud-health}/state/*-history.jsonl` | Gzip after 21 days                                                                                |
| Crontab-mirrored scripts                 | `~/.tnf/bin/*`, `~/.tnf/terminal-heartbeat/bin/*`                                      | Mirror-then-overwrite on every cron install; old version lives in git history, not on disk        |
| Relay monitor logs                       | `~/.tnf/relay-monitor/*`                                                               | 14 days                                                                                           |
| Wrapper logs                             | `~/.tnf/wrapper-logs/*`                                                                | 14 days                                                                                           |
| Hermes cron output                       | `~/.hermes/cron/output/*`                                                              | 14 days                                                                                           |
| `openclaw-pre-migration-carry` snapshots | `~/.tnf/openclaw-pre-migration-carry/`                                                 | **Manual**: operator must verify migration is complete and explicitly authorize delete (see §5.3) |
| `node_modules` mirrors under `~/.tnf/`   | `~/.tnf/node_modules/`, `~/.tnf/venv/`                                                 | **Manual**: pnpm store prune is fine; wholesale delete needs operator go                          |

### Open tasks — always surfaced, never lost

Every open task in TNF MUST be visible in **at least one canonical surface** and
that surface MUST be queryable without grep archaeology.

| Surface                                   | Used for                                               | Owner               |
| ----------------------------------------- | ------------------------------------------------------ | ------------------- |
| `handoff-current.json::IMMEDIATE_TASKS`   | Operator-blocking tasks (secrets, destructive actions) | Operator            |
| `handoff-current.json::next_actions`      | Non-blocking work the next agent should pick up        | Next agent          |
| `~/.tnf/lessons-learned.md` (Verified: N) | Lessons learned but not yet validated across sessions  | Anyone              |
| `*.ledger.md` and `reports/*`             | Audit-visible tasks (CI failures, run outcomes)        | Continuous Improver |
| `[STATUS:PENDING]` doc headers            | Docs awaiting vetting                                  | Doc vetting loop    |

If a task does not appear in one of these, it is not an open task — it is a
local note. Local notes are fine but they MUST NOT block other agents.

## Hard rules

1. **Persistent logic is append-only or operator-owned.** No cron, no retention
   script, no CI sweep may delete a row from `roles.json`, `audit.jsonl`,
   `lessons-learned.md` (when `Verified: Y`), `handoff-current.json`, or any
   `*-latest.json` anchor. If a script needs to "rotate" such a file, it MUST
   copy (not move) to a timestamped archive first and surface the archive in the
   sweep report.

2. **Transient state has a hard cap.** Every retention rule above has a numeric
   cap. The CI guard `scripts/protocols/check-artifacts-lifecycle.cjs` reads the
   policy table in §3 and fails any build where the actual on-disk count exceeds
   the cap minus a `TNF_RETENTION_GRACE_PCT` (default 10%) margin.

3. **Open tasks live in canonical surfaces only.** When an agent identifies an
   open task, it MUST write it into one of the five surfaces above within the
   same session that found it. Local-only TODO comments in code are acceptable
   as breadcrumbs but MUST NOT be the only place a task lives.

4. **Every prune writes a sweep report.** `swarm-disk-retention.sh` (and any new
   retention entry-point) MUST append a JSONL row to
   `~/.tnf/reports/retention/sweep-<date>.jsonl` with
   `{ at, rule, before, after, removed, archived, errors }`. The
   self-improvement-scorecard ingests the report on its 6-hourly cycle and flags
   regressions.

5. **The CI guard owns the policy.** A retention rule is not in force until
   `scripts/protocols/check-artifacts-lifecycle.cjs` references it AND that
   script runs in CI AND the operator's `~/.tnf/ci/retention-policy.json`
   agrees. Drift between script and operator config is a CI failure, not a
   warning.

6. **Operator-owned files require explicit confirmation to delete.** Files
   marked **Manual** in the table above cannot be deleted by any agent or sweep
   without a documented operator decision. The protocol offers
   `tnf artifacts lifecycle plan` (read-only) and
   `tnf artifacts lifecycle apply --yes` (executor) commands; `apply` refuses
   without `--yes` and without the operator's confirmation token (when isolation
   is in force, per D23).

7. **Lessons learned with `Verified: N` get a 90-day shelf-life.** After 90 days
   without verification they are archived to
   `~/.tnf/reports/self-improvement/lessons-archive/`. After 365 days
   unverified, archived lessons are purged unless an operator explicitly retains
   them. `Verified: Y` lessons never auto-archive.

8. **Handoff lineage is append-only.** `~/.tnf/handoff-lineage.json` rows may
   only be appended. Pruning lineage entries is a manual operator action and
   requires a `challenge_rationale`.

## Inspect checklist

```bash
# 1) Are any persistent-logic files missing?
test -f ~/.tnf/authority/roles.json
test -f ~/.tnf/handoff-current.json
test -f ~/.tnf/handoff-lineage.json
test -f ~/.tnf/lessons-learned.md

# 2) Are transient-state caps being respected? (sample)
find ~/.tnf/terminal-heartbeat/state/history -type f | wc -l   # ≤ 200 (or 30d)
find ~/.tnf/openclaw-pre-migration-carry -type f | wc -l        # flagged for manual review

# 3) Are open tasks in canonical surfaces only?
python3 ~/.tnf/bin/parse-handoff-tasks.py ~/.tnf/handoff-current.json

# 4) CI guard clean?
node scripts/protocols/check-artifacts-lifecycle.cjs
```

## Related

- `docs/protocols/HANDOFF_PACKET_LIFECYCLE.md` — packet state machine
- `docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md` — "archive don't delete"
  rule (§4 Deprecated Fact Archiving)
- `docs/protocols/TNF_ORCHESTRATION_GOVERNANCE_PROTOCOL.md` — schedule density
  audit
- `.agent/skills/tnf-multi-agent-state-governor/SKILL.md` — the policy source
  this protocol promotes from documentation to enforcement
- `scripts/operations/swarm-disk-retention.sh` — the cron-driven sweep that this
  protocol gates
- `scripts/operations/hermes-state-retention.cjs` — the sister sweep for Hermes
  state.db snapshots
- `scripts/protocols/check-artifacts-lifecycle.cjs` — the CI guard that makes
  the policy load-bearing

## Operator decision required on activation

The very next sweep will encounter `~/.tnf/openclaw-pre-migration-carry/` (949
MB) and `~/.tnf/node_modules/` (5.1 GB). Both are marked **Manual** in §3 and
cannot be pruned by the guard. The operator must decide:

- Is the OpenClaw → TNF migration complete? If yes, archive (gzip + move to
  `~/.tnf/reports/retention/archive/openclaw-pre-migration-carry-<date>/`) with
  a one-line `challenge_rationale` in `CHALLENGE_RATIONALE_LOG.md`.
- Is `~/.tnf/node_modules/` actually used by anything? If no, `pnpm store prune`
  is insufficient; a wholesale `rm -rf ~/.tnf/node_modules/` after confirming no
  live process imports from it is the correct action.
