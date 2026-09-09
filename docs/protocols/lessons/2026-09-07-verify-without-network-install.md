# Verifying a worktree when pnpm install cannot complete — 2026-09-07

`[CLASS:INTEL] [STATUS:PROPOSED] [DOC_TYPE:LESSON] [VISIBILITY:COLLECTIVE]`

## What happened

A new worktree (`.tnf/worktrees/code-graph-phase1`) needed `pnpm install` before
`tnf-cli` could build and the command-surface gate could run. The install never
finished:

- `pnpm install --filter …` timed out at 2 minutes in the foreground.
- A full background `pnpm install --no-frozen-lockfile` reached
  `Progress: resolved 352, reused 0, downloaded 0` after ~15 minutes.
- The log carried **136** `Request took …` warnings, **median 26 s**, **max
  339 s** for a single package metadata request. A plain
  `curl https://registry.npmjs.org/web-tree-sitter` took **9.6 s**.

Two assumptions made at the start were both wrong, and each cost time:

1. *"The pnpm store is warm because the main checkout is installed, so an install
   will mostly hard-link."* The store held **1,413 files / 44 MB**, and every
   entry in the main checkout's `node_modules` was a real directory with
   hardlink count **1**. `.npmrc` sets `node-linker=hoisted` + `shamefully-hoist=true`,
   so pnpm **copies** rather than links. Nothing was shared, and a fresh install
   would have to download essentially everything.
2. *"Load is the problem."* Load was 42, but it fell to 18 while the install
   stayed stuck. The blocker was network latency to the registry, not CPU.

Aborting the install left `pnpm-lock.yaml` modified with **243 insertions and
375 deletions** — a *net removal* of 132 lines. It looked like an ordinary diff
and would have corrupted resolution for everyone had it been committed.

## Why it happened

A worktree created with `git worktree add` contains only what git tracks.
`node_modules` is ignored, so a new worktree always starts with zero
dependencies and *must* install — which makes every worktree hard-blocked on
registry reachability, even though a fully-populated `node_modules` for the same
commit already exists two directories up.

The `node-linker=hoisted` setting is what makes the alternative viable and is
also what invalidates the "warm store" intuition carried over from default
pnpm: with hoisting, `node_modules` is a **self-contained flat tree**, so it can
be pointed at from elsewhere by symlink and it just resolves.

## What a future session should do differently

When a worktree needs dependencies and the network is degraded, do **not** wait
on `pnpm install`. Point the worktree at the main checkout's existing tree:

```bash
M=<main checkout>; WT=$M/.tnf/worktrees/<name>
ln -sfn "$M/node_modules" "$WT/node_modules"
for d in "$M"/packages/*/ "$M"/apps/*/; do
  p=${d%/}; n=$(basename "$p"); parent=$(basename "$(dirname "$p")")
  [ -d "$p/node_modules" ] && [ -d "$WT/$parent/$n" ] && \
    ln -sfn "$p/node_modules" "$WT/$parent/$n/node_modules"
done
```

For a package that must resolve a **new** workspace dependency, replace that
package's symlink with a real directory mirroring main's entries plus the new
link — otherwise the new package is unresolvable.

Three rules that go with it:

- **Remove the links before any `pnpm install` in the worktree.** A write
  through `$WT/node_modules` lands in the shared checkout's `node_modules`,
  which is the shared-checkout mutation hazard in a new disguise.
- **Never commit a lockfile from an aborted install.** Check the diff direction:
  a large *deletion* count means truncated resolution. `git checkout --
  pnpm-lock.yaml` and record that the lockfile update is still outstanding.
- **Verify the store before claiming it helps:** `find ~/Library/pnpm/store/v11/files
  -type f | wc -l` and `stat -f "%l" <some node_modules file>`. A hardlink count
  of 1 means the store is not backing that tree.

This substitution is for **building and gating**, not a replacement for a real
install: the branch's new dependencies remain absent from `pnpm-lock.yaml` until
a full install runs on a working network.

## Evidence

- Commit `2a178b9b3`, merge `5bb11ed87` (pushed to `main` as `5afa06e80..5bb11ed87`).
- `.npmrc:2 shamefully-hoist=true`, `.npmrc:5 node-linker=hoisted`.
- Store measurement: 1,413 files, 44 MB; `stat -f "%l"` on
  `node_modules/commander/package.json` returned `1`.
- Registry latency: 136 slow-request warnings, median 26,297 ms, max 339,127 ms.
- Truncated lockfile: `git diff --stat pnpm-lock.yaml` → `243 insertions(+), 375 deletions(-)`.
- After substitution: `tsc --build` 0 errors, bundle 957,340 bytes,
  `command-surface-gate --mode=ci` OK, `core-vector-db` build exit 0 — all with
  no network access at all.

## Related

A second, independent finding from the same session, worth its own note if it
recurs: adding a package to `packages/tsconfig.references.json` is **not**
sufficient. Each consuming package's own `tsconfig.json` `references` array must
list it too, or TypeScript resolves the dependency to its **source** and fails
with `TS6059` ("not under rootDir") and `TS6307` ("not listed within the file
list of project"). The aggregate file is not what `tsc --build` reads when
compiling a consumer.

## Provenance of the evidence

A real `node_modules` (2,096 entries, not hardlinked to the main checkout)
appeared in the worktree at **12:42:00**, origin unattributed — plausibly the
full-auto daemon, which was writing to the repo throughout the session. Because
that tree could in principle explain a successful build, the timeline matters:

| Time | Event |
|---|---|
| 12:30:53 | first `tsc --build` with symlinked deps: **31 errors** |
| 12:32:08 | after adding the missing project reference: **0 errors** |
| 12:32-12:40 | `command-surface-gate --mode=ci` OK, `core-vector-db` build exit 0 |
| **12:42:00** | real `node_modules` appears in the worktree |
| 12:47:31 | commit `2a178b9b3` |
| 12:50:39 | post-merge rebuild: 0 errors |

The first clean build and the original gate run predate the real tree by ~10
minutes, so the symlink substitution is what carried them. The *post-merge*
re-verification at 12:50:39 ran after 12:42 and may have resolved through the
real tree instead; it is not independent evidence for this technique, though it
is still valid evidence that the merged tree builds and gates cleanly.

One artifact of the substitution worth avoiding: `ln -sfn TARGET LINK` places
the link *inside* `LINK` when `LINK` already exists as a directory. That left a
stray `node_modules/node_modules -> <main checkout>/node_modules` in the
worktree — a write-through path into the shared checkout. Removed. Check for it
after any re-link, and prefer `rm -rf LINK && ln -s TARGET LINK` over `-sfn`
when the target may already exist as a directory.
