---
name: tnf-worktree-reclamation
description:
  Decide safely whether a TNF worktree can be deleted. Use before any
  disk-pressure cleanup, when a lane looks finished, or when asked whether a
  worktree is still needed. Prevents destroying uncommitted work that exists
  nowhere else.
---

# Worktree Reclamation

`TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` says when work must move **into** a
worktree. Nothing said when one may be reclaimed. Measured 2026-09-02: **7.0
GB** across five worktrees, none labelled, on a machine that hit 35 MB free and
began failing shell commands with no output.

Running ledger: `docs/protocols/TNF_WORKTREE_RECLAMATION_LEDGER.md`.

## The one rule

**Untracked files exist nowhere but that directory.** Removing the worktree
destroys them permanently. Committed work is safe — `git worktree remove` does
not delete the branch, so commits survive on their ref.

So the question is never "is this lane finished?" It is "is this checkout
clean?"

A worktree with **zero dirty and zero untracked** files is always safe to
remove, merged or not.

## Survey

```bash
for w in ~/.tnf/worktrees/*/; do
  tip=$(git -C "$w" rev-parse --short HEAD 2>/dev/null) || continue
  printf "%-46s dirty=%-6s untracked=%-4s ahead=%-4s %s\n" "$(basename "$w")" \
    "$(git -C "$w" status --porcelain | wc -l | tr -d ' ')" \
    "$(git -C "$w" status --porcelain | grep -c '^??' | tr -d ' ')" \
    "$(git rev-list --count origin/main..$tip 2>/dev/null)" \
    "$(git merge-base --is-ancestor $tip origin/main 2>/dev/null && echo MERGED || echo unmerged)"
done
```

Size is deliberately not in the loop: `du` is slow on these trees and, on APFS,
overstates cloned blocks. Size decides _which_ safe worktree to reclaim first —
never whether an unsafe one may go.

## Decide

| Signal                                               | Verdict                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| 0 dirty, 0 untracked                                 | **SAFE** — remove; commits live on the branch ref                         |
| any untracked                                        | **NO** — those files exist nowhere else                                   |
| dirty but tracked                                    | **NO** until committed or confirmed disposable                            |
| merged **but** dirty/untracked                       | **NO** — "merged" describes commits, not the checkout                     |
| thousands of staged deletions against untracked dirs | **NO** — interrupted mass index operation; needs a human, do not automate |

## Before removing an unsafe one, look for an atomic unit

Uncommitted work is often a feature split across a new file and its
registration. `lane4-video-extraction` holds
`packages/tnf-cli/src/commands/video-ingest.ts` plus a `cli.ts` that imports and
registers it. **Committing `cli.ts` alone publishes an import of a module that
does not exist and breaks the CLI build.** Commit both or neither. Check for
this shape before advising anyone to "just commit it".

Also check whether superseded files are the only record of a prior approach.
Three scripts in lane4 self-declare
`DEPRECATED: Replaced by TNF native CLI 'tnf video-ingest'` — they are not
disposable until the replacement is committed and proven.

## Reclaiming

```bash
git worktree remove <path>          # refuses if dirty; do not reach for --force
git worktree prune                  # after any manual rm -rf
```

If `git worktree add` fails mid-checkout (out of space), it leaves a partial
tree: `rm -rf` the path and `git worktree prune`, then verify with
`git worktree list`. Check headroom first — `resolve-workspace-tier.cjs` now
warns below 1200 MB, since a TNF checkout runs 460–600 MB.

## Relationship to the ingestion pipeline

`TNF_INFORMATION_INGESTION_PIPELINE.md` governs _artifact_ status (`PENDING` →
promoted → `ARCHIVED`), not the _workspaces_ that produce artifacts. A lane is
"processed and no longer needed" only when its artifacts reached a terminal
status **and** its worktree is clean. The second test is the one that protects
work, and it fails independently of the first.

## Never

Delete another lane's worktree without asking, even when provably lossless.
Whoever resumes that lane loses their working state. Present the finding and let
the operator decide.
