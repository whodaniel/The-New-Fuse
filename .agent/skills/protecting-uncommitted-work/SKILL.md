---
name: protecting-uncommitted-work
description:
  How to park and recover uncommitted work in a shared git checkout. Why
  `git stash` is not a safe park, and the file-by-file recovery ladder that
  actually gets work back after a destructive tree mutation.
primary_type: operational
category: engineering/governance
risk_tier: high
harmful_pattern_detection: true
harmful_pattern_signals:
  - git-stash-drops-untracked
  - git-checkout-dot-discards-tree
  - bulk-checkout-aborts-on-missing-path
  - stash-drop-without-archive
---

# Protecting Uncommitted Work

Written from two data-loss events on 2026-08-09 in a checkout shared by four
agents. Roughly 30 files of uncommitted work were erased, twice, by a routine
branch-maintenance sequence: `stash push` → `merge origin/main` → branch switch.

The governing protocol is
[`TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL`](../../../docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md).
This skill is the operational half.

## `git stash` does not save untracked files

This is the load-bearing fact and it is not widely internalised.

```bash
git stash push          # tracked modifications only
git stash push -u       # includes untracked
```

Whether an agent's work survives a maintenance stash therefore depends on
whether it happened to be **staged** — an accident, not a policy. On 2026-08-09
three files survived only because an unrelated authority gate had blocked a
commit and left them in the index. `packages/claw-skills/` — which `openclaw`
and `picoclaw` symlink into — was untracked the entire time; a `git clean` would
have left both trees pointing at nothing.

**"I stashed first" is not evidence that work was protected.**

## Park to a scratch branch, not to the stash

```bash
git switch -c wip/$(date +%Y%m%d-%H%M%S)
git add -A && git commit -m "wip: parked before maintenance"
```

A commit captures tracked and untracked deterministically, is named, appears in
the reflog, and cannot be buried by the next stash push. A stash entry is
anonymous, ordered by a stack that other agents also push to, and silently
partial.

## Never stash paths you do not own

If a job must park foreign work, it commits to a scratch branch or **refuses and
reports**. Stashing another agent's uncommitted work is destroying it with extra
steps.

## Recovery ladder

Work is almost never actually gone. In order:

1. `git fsck --lost-found` and `git reflog` — commits survive nearly everything.
2. `git stash list` — check **both** the stash's tracked set *and* whether the
   missing file was ever untracked. Untracked absence is silent: the file simply
   is not there and nothing says so.
3. **Restore file by file.**

   ```bash
   # WRONG — one path missing from the ref aborts the whole checkout
   git checkout stash@{0} -- fileA fileB fileC …

   # RIGHT
   for f in $FILES; do
     git checkout stash@{0} -- "$f" 2>/dev/null || echo "not in ref: $f"
   done
   ```

   A single absent path made a bulk checkout fail entirely, which read as total
   loss when 35 of 36 files were recoverable.

4. **Tag before dropping anything.**

   ```bash
   git tag archive/stash-$(date +%F)-maintenance 'stash@{0}'
   git show archive/stash-2026-08-09-maintenance:path/to/file   # verify FIRST
   git stash drop 'stash@{0}'
   ```

   Tags are permanent, named, and cannot be buried.

## Prevention

- Commit at every stage boundary — no more than **20 minutes or one completed
  unit of work** uncommitted in a shared tree.
- Gates run at commit time; nothing guards the working tree. Run
  `node scripts/security/workspace-mutation-guard.cjs --check` before any
  tree-mutating operation.
- The guard rides `reference-transaction`, so it sees `stash`/`reset`/`merge`/
  `rebase` but **cannot** see `git clean -fd` or `git checkout -- .` — no ref
  changes, so no hook fires. Call `--check` explicitly before those.

See also [[verifying-command-success]].
