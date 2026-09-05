# Turn Zero V2 is foundational — not lane- or video-scoped — 2026-09-04

`[CLASS:INTEL] [STATUS:ACTIVE] [DOC_TYPE:LESSON] [VISIBILITY:COLLECTIVE]`

## What happened

A host session (Kilo, launched from `$HOME`) concluded that the Turn Zero V2
implementation lived at:

`~/.tnf/worktrees/lane4-video-extraction/scripts/protocols/turn-zero-v2-gate.cjs`

That path is a **lane worktree checkout shadow**. The same filename exists there
because the worktree is a git checkout of the monorepo, not because Turn Zero V2
belongs to video extraction.

Operator correction: Turn Zero V2 is foundational canonical TNF protocol logic.
It is not specific to video processing and not owned by a feature branch.

## Why it happened

1. Agents searching the filesystem (or inheriting a worktree cwd) can surface a
   lane path before the canonical `main` root.
2. `docs/core/FRONTLOAD_MANIFEST.md` contains a later **task-conditional** video
   intelligence route. That co-location was easy to misread as Turn Zero being
   video-owned.
3. The gate historically did not print `repoRoot` / foundational scope in the
   human receipt, so a wrong absolute path looked authoritative.

## Rule

- Authority: `docs/protocols/TURN_ZERO_MANDATE.md` +
  `scripts/protocols/turn-zero-v2-gate.cjs` resolved from the **active repo
  root** (prefer canonical development on `main`).
- Operator path: `pnpm run tnf:onboard -- --task "<task>"` from that root.
- Never cite `~/.tnf/worktrees/<lane>/.../turn-zero-v2-gate.cjs` as the protocol
  source of truth.
- Lane worktrees (including `lane4-video-extraction`) may contain WIP for that
  lane; they inherit Turn Zero — they do not redefine it.

## Residue note

- `lane4-video-extraction` was **kept**: it has uncommitted video-ingest WIP.
- Merged-but-lingering `authority-lane-task0` worktree on
  `fix/turn-zero-classification-source` (PR #301 squash-merged) was removed as
  stale orientation noise.
