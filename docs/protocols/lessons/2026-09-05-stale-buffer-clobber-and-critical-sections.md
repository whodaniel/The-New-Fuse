# Stale-buffer write-back is a fourth clobber class — edit inside freeze windows — 2026-09-05

`[CLASS:INTEL] [STATUS:ACTIVE] [DOC_TYPE:LESSON] [VISIBILITY:COLLECTIVE]`

## What happened

During the workspace-isolation rollout (2026-09-05), a live co-tenant agent
(Codex, sweeping every ~5-7 min) erased completed, on-disk edits **twice** —
`AGENTS.md`, `CLAUDE.md`, and this protocol family's own doc — by writing them
back from its stale in-memory model. The erasure was invisible to every git
hook: no stash, no reset, no merge, no branch switch. Files simply reverted to
the co-tenant's buffered content between two of my tool calls. Code files
survived only by accident: the co-tenant's own sweep commits happened to include
them.

The session-handoff receipt also surfaced two corollary traps:

1. A receipt binds to the branch it was emitted on. Porting a commit to another
   branch (`cherry-pick`) fails the handoff gate ("Receipt branch binding
   mismatch") until a fresh receipt is emitted on the target branch.
2. `git switch main 2>&1 | tail -2 && <next-state-changing-command>` continued
   executing after the switch had aborted — the pipe made the chain's exit
   status that of `tail`, not of `git switch`. A cherry-pick then misfired on
   the wrong branch.

## Why it happened

The protocol's incident table (stash erasure, branch-switch erasure,
`checkout -f` erasure) assumed the clobbering agent acts through **git**. A live
agent process also acts through its **file-write tool**, replaying a buffered
model of a file taken minutes earlier. That write path is outside git entirely:
the reference-transaction hook never fires, the pre-commit gates never see it,
and the resulting content is often a _plausible older version_ of the file — the
most confusing possible failure, because it looks like your edit "never
happened" rather than being visibly destroyed.

## Rules

1. **Never edit a co-tenant-owned file while it runs.** Freeze the co-tenant
   first (`kill -STOP <pids>`), verify with `ps ... stat` (T), do all edits,
   stage, emit the receipt, commit, push — and only then resume
   (`kill -CONT <pids>`; chain with `;` not `&&` so resume always runs; verify
   STAT returns to S).
2. **Commit before resume.** A resumed agent immediately regenerates files from
   its buffers; anything unstaged when it wakes is at risk again.
3. **New files with unique names are safe mid-session** (no buffer holds them);
   tracked files the co-tenant has loaded are not. Re-check `git status` after
   every multi-minute pause.
4. **Never pipe a state-changing git command** when the chained next step
   assumes its success: `git switch x 2>&1 | tail` reports tail's exit code. Use
   `set -o pipefail`, or capture and test the status explicitly.
5. **After any multi-branch operation, verify behavior on the target branch**
   (run the gate/test there), not just commit membership. Docs landed on `main`
   describing gate behavior whose code lived only on a task branch; one Turn
   Zero run on `main` exposed the gap instantly.
6. **When a gate blocks you, read its message before reaching for
   `--no-verify`.** The merge-guard prints its own deliberate-finish override
   (`TNF_ALLOW_MERGE_COMMIT=1 git commit`). Prefer the prescribed path; reserve
   `--no-verify` for checkpoint/park commits on a co-tenant's own branch, and
   say so in the commit message.

## Relationship to existing doctrine

This is the fourth clobber class in `TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md`
(stash / branch-switch / `checkout -f` / **buffer write-back**). Like
`checkout -f`, it is undetectable by git hooks — but unlike it, Turn Zero cannot
catch it either, because it strikes _between_ your tool calls. The only control
is the freeze window above, or the protocol's end state: every agent in its own
worktree (`.tnf/worktrees/agent-<name>`), so buffer write-backs land in private
trees.
