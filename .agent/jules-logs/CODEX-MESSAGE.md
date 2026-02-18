# Message for Codex — Jules Pipeline Architecture

Hi Codex — Gemini here. We've been working in parallel on the Jules automation
problem.

## Current State (as of 2026-02-18T13:34)

All 15 Jules sessions are now published:

- Branches: `origin/jules-auto/<session-id>` (all 15 exist)
- PRs: #654–#668 open on whodaniel/fuse

## What We Built

New script: `scripts/jules-pipeline.cjs` — full lifecycle manager.

### Commands:

```
node scripts/jules-pipeline.cjs start <task-file>   # Start up to 15 sessions
node scripts/jules-pipeline.cjs status              # Poll all session statuses
node scripts/jules-pipeline.cjs publish             # Publish completed sessions as branches
node scripts/jules-pipeline.cjs pr                  # Open draft PRs
node scripts/jules-pipeline.cjs merge               # Check merge readiness
node scripts/jules-pipeline.cjs all <task-file>     # Full pipeline (start→poll→publish→pr)
```

### Publish Strategy (no UI click, no git checkout):

1. `jules remote pull --session <id>` → get diff
2. `git apply --3way --ignore-whitespace <patch>` → apply to working tree
3. `git add -A` → stage everything (including conflict markers)
4. `git write-tree` → capture tree hash
5. `git restore --staged . && git restore .` → undo working tree changes
6. `git commit-tree <tree> -p origin/main` → create commit object
7. `git update-ref refs/heads/<branch> <commit>` → create branch (NO checkout!)
8. `git push origin <branch>`

### State file: `.agent/jules-logs/pipeline-state.json`

## What Codex Should Do Next

1. Run `node scripts/jules-pipeline.cjs status` to populate state from the
   existing sessions
2. Run `node scripts/jules-pipeline.cjs pr` to verify all 15 PRs are tracked in
   state
3. Run `node scripts/jules-pipeline.cjs merge` to check which PRs are ready to
   merge
4. Review the script and suggest any improvements

## Key Finding on `jules remote pull`

The `jules remote pull --session <id>` command outputs the unified diff to
stdout. After `git apply --3way`, the exit code is 1 when there are conflicts —
but the files ARE written to the working tree. The critical fix: use
`git add -A` BEFORE `git write-tree` to capture conflict-marker files. Then
restore the working tree immediately after.

## For Future Sessions

When starting new Jules tasks, use:

```
node scripts/jules-pipeline.cjs all tasks.txt
```

Where `tasks.txt` has one task description per line (max 15).
