---
name: tnf-artifacts-lifecycle
description:
  Codifies the D25 retention policy with three categories (persistent logic /
  transient state / open tasks), hard numeric caps, sweep reports, and
  operator-owned gates. Use whenever you are adding a new artifact directory,
  designing a retention cron, pruning state, or auditing open tasks across the
  swarm.
---

# TNF Artifacts Lifecycle Skill

Extracted from `docs/protocols/TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md` (D25,
DIRECTIVES.md) after the 2026-07-28 operator audit found 5,727 heartbeat history
files at cap 200, 6,264-line JSONL at cap 500, and no CI enforcement of the
retention policy that already existed in
`.agent/skills/tnf-multi-agent-state-governor/SKILL.md`.

## When to use this skill

Load this skill whenever you are:

- **Adding a new artifact directory** under `~/.tnf/`, `.agent/`, or any
  LLM-runner state dir.
- **Designing a retention cron** or sweep script.
- **Pruning** state files, logs, history directories, or JSONL tails.
- **Auditing** open tasks across the swarm.
- **Writing or modifying** `swarm-disk-retention.sh`,
  `hermes-state-retention.cjs`, or `tnf-state-governor-cron.sh`.
- **Diagnosing** retention-policy drift between what the policy says and what
  the disk shows.

## The categories (D25, in one diagram)

```
                        ┌─────────────────────────────────────┐
                        │  Persistent logic — never deleted   │
                        │  by retention (D25 §3.1)            │
                        ├─────────────────────────────────────┤
                        │  • ~/.tnf/authority/roles.json      │
                        │  • ~/.tnf/handoff-current.json      │
                        │  • ~/.tnf/handoff-lineage.json      │
                        │  • ~/.tnf/lessons-learned.md        │
                        │  • [STATUS:LOCKED] docs             │
                        │  • *-latest.json / *-latest.md      │
                        │  • Authority audit.jsonl            │
                        └─────────────────────────────────────┘
                                       │
                                       │
                        ┌─────────────────────────────────────┐
                        │  Transient state — hard numeric     │
                        │  caps enforced by CI (D25 §3.2)     │
                        ├─────────────────────────────────────┤
                        │  • terminal-heartbeat/history ≤200  │
                        │  • terminal-heartbeat-jsonl ≤500 ln │
                        │  • relay-monitor, wrapper-logs ≤400 │
                        │  • tnf-logs ≤600, hermes-cron ≤400  │
                        └─────────────────────────────────────┘
                                       │
                                       │
                        ┌─────────────────────────────────────┐
                        │  Open tasks — canonical surfaces    │
                        │  only (D25 §3.3)                    │
                        ├─────────────────────────────────────┤
                        │  • handoff-current::IMMEDIATE_TASKS │
                        │  • handoff-current::next_actions    │
                        │  • lessons-learned.md (Verified: N) │
                        │  • [STATUS:PENDING] doc headers     │
                        │  • run reports (sweep-, audit-)     │
                        └─────────────────────────────────────┘
                                       │
                                       │
                        ┌─────────────────────────────────────┐
                        │  Operator-owned — manual decision   │
                        │  required (D25 §5.6)                │
                        ├─────────────────────────────────────┤
                        │  • ~/.tnf/openclaw-pre-migration-*  │
                        │  • ~/.tnf/node_modules (5.1 GB)     │
                        │  • Anything marked "Manual" in §3   │
                        └─────────────────────────────────────┘
```

## How to apply

1. **Read** the protocol:
   - `docs/protocols/TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md`
   - DIRECTIVES.md D25, D27 (Self-Evolution Mandate — adding new rules is
     TIER 3)

2. **Run the CI guard** before merging any change that touches artifact
   locations:

   ```bash
   node scripts/protocols/check-artifacts-lifecycle.cjs
   ```

   The guard fails on missing persistent-logic anchors OR transient-state caps
   exceeded (with 10% grace). Operator-owned items are reported but do not fail
   CI.

3. **When adding a new artifact directory**:
   - Classify it: persistent logic, transient state, or operator-owned?
   - If transient state: pick a cap (`count` and/or `days`).
   - If operator-owned: mark it Manual; the guard will report but not fail.
   - Add the rule to `POLICY` in
     `scripts/protocols/check-artifacts-lifecycle.cjs`.

4. **When designing a retention cron**:
   - Never delete persistent-logic anchors (D25 hard rule §1).
   - Never blanket-delete; carry forward or archive before deleting.
   - Append a sweep report row to `~/.tnf/reports/retention/sweep-<date>.jsonl`
     with `{ at, rule, before, after, removed, archived, errors }`.
   - Honor the operator's tier setting (D26 TIER 3 default for retention).

5. **When auditing open tasks**:

   ```bash
   python3 -c "import json; print(json.dumps(json.load(open('$HOME/.tnf/handoff-current.json'))['IMMEDIATE_TASKS'], indent=2))"
   grep -E '^- ### ' ~/.tnf/lessons-learned.md | head
   grep -lr 'STATUS:PENDING' docs/protocols/ 2>/dev/null | head
   ```

   Any task not in one of these surfaces is not an open task — it's a local
   note.

6. **When pruning state**:
   - Read `~/.tnf/reports/retention/sweep-<date>.jsonl` first; understand what
     prior sweeps removed before adding new rules.
   - Dry-run is the default; commit `apply --yes` only after operator
     confirmation or TIER 4 standing authorization.

## Anti-patterns

| Anti-pattern                                                             | Why it fails                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| `rm -rf ~/.tnf/handoff-current.json`                                     | D25 hard rule §1 — persistent anchor                      |
| `find ~/.tnf -mtime +30 -delete`                                         | Targets persistent anchors; D7 Class-1 violation          |
| Quietly gzipping `lessons-learned.md` "to save space"                    | Lessons are persistent; loss = no self-improvement loop   |
| Adding a retention rule without updating `check-artifacts-lifecycle.cjs` | The rule is not in force until the CI guard references it |
| Writing open tasks to a local file with no canonical surface             | Local-only TODOs are breadcrumbs; not open tasks          |
| Pruning `openclaw-pre-migration-carry` because it's old                  | Operator-owned; D25 §5.6                                  |
| Sweep without a sweep report row                                         | D25 hard rule §4                                          |

## Self-test

```bash
# 1) CI guard clean against current tree?
node scripts/protocols/check-artifacts-lifecycle.cjs

# 2) Persistent-logic anchors all present?
for f in roles.json handoff-current.json handoff-lineage.json lessons-learned.md; do
  test -f ~/.tnf/$f && echo "✓ $f" || echo "✗ MISSING $f"
done

# 3) Transient-state caps respected (sample)?
find ~/.tnf/terminal-heartbeat/state/history -type f | wc -l    # ≤ 200
find ~/.tnf/openclaw-pre-migration-carry -type f 2>/dev/null | wc -l  # flagged manual

# 4) Open tasks in canonical surfaces?
jq '.IMMEDIATE_TASKS' ~/.tnf/handoff-current.json
```

A clean CI scan + visible anchor presence + sensible transient counts +
canonical-surface tasks is the green light.

## Related

- Protocol: `docs/protocols/TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md`
- Directive: `DIRECTIVES.md` D25, D26 (TIER 3 default for retention sweeps), D27
  (Self-Evolution Mandate — adding retention rules is TIER 3)
- CI guard: `scripts/protocols/check-artifacts-lifecycle.cjs`
- Sister skill: `.agent/skills/tnf-multi-agent-state-governor/SKILL.md` (the
  policy source this skill promotes to enforcement)
- Sibling cron: `scripts/operations/swarm-disk-retention.sh`
- Sister sweep: `scripts/operations/hermes-state-retention.cjs`
- Handoff lifecycle: `docs/protocols/HANDOFF_PACKET_LIFECYCLE.md`
- Doc archive rule: `docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md` §4
