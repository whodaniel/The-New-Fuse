# TNF Worktree Reclamation Ledger

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

## Purpose

`TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` governs when work must move **into**
a separate worktree. Nothing governed when a worktree may be reclaimed. The
result, measured 2026-09-02: **7.0 GB** across five worktrees, none labelled
with whether its contents still matter, on a machine that reached 35 MB free and
began failing shell commands.

This ledger records, per worktree, whether reclaiming it is safe — and the
evidence for that answer.

## The one rule that matters

**Untracked files exist nowhere but that directory.** Removing a worktree
deletes them permanently. Committed work is safe — `git worktree remove` does
not delete the branch, so commits survive on their ref and can be checked out
again later.

So the reclaim test is not "is this lane finished?" It is:

```bash
git -C <worktree> status --porcelain | grep '^??'   # untracked -> DO NOT REMOVE
git -C <worktree> status --porcelain                # dirty -> DO NOT REMOVE
git merge-base --is-ancestor <tip> origin/main      # merged -> commits already safe
```

A worktree with **zero dirty and zero untracked** files is always safe to
remove, merged or not: everything in it is reachable from its branch ref.

## Status as of 2026-09-02

| Worktree                                      | Branch                                            | Size | Dirty | Untracked | Ahead of main | Reclaim?               |
| --------------------------------------------- | ------------------------------------------------- | ---- | ----- | --------- | ------------- | ---------------------- |
| `lane5-repo-separation-v2`                    | `lane5-repo-separation-v2`                        | 596M | 0     | 0         | 29            | **SAFE**               |
| `workspace-isolation-enforcement-20260901-v2` | `fix/workspace-isolation-enforcement-20260901-v2` | 78M  | 0     | 0         | 2             | **SAFE**               |
| `lane4-video-extraction`                      | `lane4-video-extraction`                          | 5.9G | 5     | 4         | 27            | **NO — unique work**   |
| `harness-hardening-20260831`                  | `codex/harness-hardening-20260831`                | 1.5G | 32    | 5         | 4             | **NO — unique work**   |
| `phase1-emitter`                              | `feat/emitter-scoped-receipts-20260902`           | 462M | 27171 | 88        | 0 (merged)    | **NO — needs a human** |

Reclaiming the two SAFE rows returns ~674 MB and loses nothing: both are
pristine checkouts whose commits live on their branch refs.

### `lane4-video-extraction` — do not delete

Holds the video-ingest feature as an **uncommitted atomic unit**. Four files
exist nowhere in git:

- `packages/tnf-cli/src/commands/video-ingest.ts` (5,839 B) — the implementation
- `scripts/autonomy/youtube_insights_extractor.py` (9,533 B)
- `scripts/autonomy/render_youtube_insights.py` (1,957 B)
- `scripts/autonomy/batch_youtube_insights.sh` (1,058 B)

plus a modified `packages/tnf-cli/src/cli.ts` that imports
`./commands/video-ingest.js` and calls `registerVideoIngestCommand`.

**The `.ts` and the `cli.ts` edit are one unit.** Committing `cli.ts` alone
publishes an import of a module that does not exist and breaks the CLI build —
the same split-commit failure already recorded against this repo. Commit both or
neither.

The three Python/shell scripts carry a self-declared header:
`DEPRECATED: Replaced by TNF native CLI 'tnf video-ingest'`. They are superseded
by `video-ingest.ts`, but they are the only surviving record of the prior
approach, so they are not disposable until the replacement is committed and
proven.

`origin/main` does not reference `video-ingest` anywhere, so nothing is
currently broken — the whole feature is contained here, unpublished.

**To reclaim:** commit `video-ingest.ts` + `cli.ts` together, decide whether the
three deprecated scripts are kept as history or dropped, push the branch, then
the worktree is reclaimable by the rule above.

### `phase1-emitter` — needs a human, do not automate

Branch is fully merged (0 commits ahead of `origin/main`), so its committed work
is already in main. But the checkout shows **27,171 staged deletions** spanning
`.agent/`, `packages/`, `archive/`, `apps/`, `scripts/` and `docs/`, while those
same paths appear as untracked directories. That is the signature of an
interrupted mass index operation, not of authored work. The worktree is also
`locked`, which suggests it was marked deliberately.

Do not "clean it up" and do not remove it on the strength of "merged". Someone
who knows what that operation was must look at it.

### `harness-hardening-20260831` — do not delete

32 dirty, 5 untracked, 4 commits ahead. Same rule as lane4: the untracked files
exist nowhere else. Not assessed in detail here.

## Relationship to the ingestion pipeline

`TNF_INFORMATION_INGESTION_PIPELINE.md` defines the lifecycle for intelligence
artifacts — `[STATUS:PENDING]` on emission, promoted after vetting,
`[STATUS:ARCHIVED]` when superseded or decayed, with `source_pointer` preserved
indefinitely. That lifecycle governs _artifacts_, not the _workspaces_ that
produce them, which is why a lane whose extraction is finished still leaves a
5.9 GB checkout behind with nothing recording that fact.

A lane is only "processed and no longer needed" when both are true: its
artifacts have reached a terminal status under that pipeline, **and** its
worktree holds no uncommitted or untracked work. lane4 currently fails the
second test regardless of the first.

## Maintaining this ledger

Re-run the survey and update the table whenever a lane completes, and before any
disk-pressure cleanup. The survey is mechanical:

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

Sizes are not in the loop deliberately: `du` on these trees is slow and, on
APFS, overstates cloned blocks. Size is a tiebreak for which safe worktree to
reclaim first, never the reason to reclaim an unsafe one.

### Do not trust the Size column for anything containing node_modules

Measured 2026-09-03: `du` reported **4.4 GB** for
`lane4-video-extraction/node_modules`; deleting it freed **0.10 GB** — a ~44x
overcount. pnpm materialises `node_modules` as APFS copy-on-write clones sharing
blocks with `~/Library/pnpm`, and `du` counts every shared block in full. A
hard-link check does not detect this either: the files report link count 1 and
distinct inodes while still sharing storage.

The same day, removing `lane5-repo-separation-v2` (596M) and
`workspace-isolation-enforcement-...-v2` (78M) freed ~700 MB, matching `du`
closely. The difference is what the tree contains:

| Tree contents                      | `du` accuracy     |
| ---------------------------------- | ----------------- |
| Source checkout, no `node_modules` | accurate          |
| pnpm `node_modules` on APFS        | wildly overstated |

So the Size column above is honest for the pristine rows and misleading for
lane4 and harness-hardening, whose totals are mostly dependencies. **Reclaiming
lane4 is worth roughly 100 MB, not 5.9 GB.** Keep it because it holds
uncommitted work that exists nowhere else — never delete it expecting space.

If you need the dependency space and not the worktree, delete
`<worktree>/node_modules` directly: it is regenerable, gitignored, and touches
no untracked source. That was done to lane4 on 2026-09-03; its four untracked
files were verified intact afterwards.
