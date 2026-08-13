---
name: hermes-state-snapshot-governor
description: Audit, consolidate, and safely prune Hermes `~/.hermes/state-snapshots` using a strict inspect-act-verify loop. Use when Hermes snapshot storage is large, when stale snapshots must be identified from real DB/file state, or when retention pruning is requested without losing rollback anchors.
---

# Hermes State Snapshot Governor

Use this skill to manage Hermes snapshot retention with deterministic verification.

## Workflow Contract

Always run in this order:

1. Inspect current snapshot state.
2. Generate a prune plan from verified state.
3. Apply deletion only after reviewing the plan.
4. Re-audit and verify the result.

Never delete snapshots before an audit pass.

## Commands

Run from repo root:

```bash
python3 .skills/hermes-state-snapshot-governor/scripts/hermes_snapshot_governor.py audit
```

Plan prune candidates (dry-run):

```bash
python3 .skills/hermes-state-snapshot-governor/scripts/hermes_snapshot_governor.py prune --include-stale --include-epoch-intermediate
```

Apply the same plan:

```bash
python3 .skills/hermes-state-snapshot-governor/scripts/hermes_snapshot_governor.py prune --include-stale --include-epoch-intermediate --apply
```

Use `--root <path>` to target a non-default snapshot directory.

## Pruning Logic

`--include-stale` candidates:

1. missing `state.db`,
2. empty `state.db`,
3. invalid `state.db` schema,
4. duplicate non-DB metadata signatures.

`--include-epoch-intermediate` candidates:

1. group contiguous snapshots by `model_default + model_provider`,
2. keep epoch boundary snapshots (first/last),
3. delete only intermediate snapshots,
4. only if session/message counts are monotonic across the epoch.

## Output Artifacts

Audit writes:

1. `consolidated-index-YYYY-MM-DD.json`
2. `consolidated-report-YYYY-MM-DD.md`

Prune writes:

1. `prune-plan-YYYY-MM-DD.json`
2. refreshed consolidated audit artifacts after apply.

## Guardrails

1. Treat prune mode as dry-run unless `--apply` is explicitly set.
2. Never delete the latest valid snapshot anchor.
3. Re-run audit after apply and confirm `stale_count` and `latest_valid`.
4. If verification fails, stop and investigate before further deletions.

## Reference

- `references/governance-notes.md`
