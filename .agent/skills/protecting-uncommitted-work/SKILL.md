---
name: protecting-uncommitted-work
description:
  How to park, find and recover uncommitted work in a shared git checkout or
  worktree. Why `git stash` is not a safe park, the file-by-file recovery ladder
  after a destructive tree mutation, and how work goes missing without anyone
  deleting it — a stale index.lock freezing a worktree, an interrupted checkout
  that reads as a mass deletion, a staged deletion left armed, a branch that
  exists on no remote. Use when work may be stranded, when `git status` reports
  something implausible, or before removing or repairing any worktree.
primary_type: operational
category: engineering/governance
department: tech
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
2. `git stash list` — check **both** the stash's tracked set _and_ whether the
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

## Work also goes missing without anyone deleting it

The recovery ladder assumes something *happened* to the work. The harder case is
work nobody touched — it simply stopped being visible. Three shapes, all found in
one worktree on 2026-09-07:

**A stale `index.lock` freezes a worktree indefinitely.** A checkout interrupted
at 22:55 on Sep 1 left a 0-byte lock. Every subsequent index write in that
worktree failed for six days, silently.

```bash
find .git -name index.lock -exec stat -f '%Sm  %z bytes  %N' -t '%Y-%m-%d %H:%M' {} +
lsof <path-to-lock>     # no output + old mtime = stale, safe to remove
```

**An interrupted checkout looks exactly like a mass deletion.** `git status`
reported 27,083 files deleted; they had never been written. Git writes in index
order, so an unfinished checkout leaves a clean cutoff. Test before concluding
anything was destroyed:

```bash
# if the missing set clusters at the END of index order, it is an unfinished
# checkout, not a deletion — so complete it rather than "restoring a backup"
git ls-files --deleted -z | xargs -0 git checkout --
```

Use `git ls-files --deleted`. **Never `git checkout -- .`** — that also reverts
genuinely modified files, and modified files are where the unique work lives.
In this case one of them held the only copy of a fix that existed on no branch.

**A frozen index can hold a staged deletion of the whole repo.** That worktree
had 27,083 staged deletions (5.45M lines) armed. Any agent running `git commit`
there would have committed the repo's removal, looking like a normal commit.
Audit every worktree, not just yours:

```bash
for w in $(git worktree list --porcelain | awk '/^worktree /{print $2}'); do
  n=$(git -C "$w" diff --cached --numstat | wc -l)
  [ "$n" -gt 100 ] && echo "WARN $w: $n staged"
done
```

**Committed is not protected.** A branch on no remote is one disk away from gone:

```bash
git -C "$w" log --oneline @{u}..HEAD      # unpushed commits
git ls-remote --heads origin "<branch>"   # empty = this machine is the only copy
```

## Reconciling work stranded across a divergence

Stranded work is usually *older* than main in some respects and *newer* in
others, so neither side is correct alone. Three-way merge against the common
ancestor instead of choosing:

```bash
git show <merge-base>:<file> > /tmp/base
git show origin/main:<file>  > /tmp/main
cp <working-copy> /tmp/merged
git merge-file /tmp/merged /tmp/base /tmp/main
```

A clean merge with zero conflicts still proves nothing. **Run the result** and
confirm both parents' behaviours survive, then check which lines were dropped and
that they are the ones that should lose.

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
