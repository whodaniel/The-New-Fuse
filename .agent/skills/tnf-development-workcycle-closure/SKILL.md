---
name: tnf-development-workcycle-closure
description:
  Close an agent development work cycle from isolated worktree through tested
  commit, push, PR resolution, merge verification, and safe cleanup. Use when an
  agent creates a branch or worktree, hands off unfinished Git work, or claims a
  change is shipped.
---

# TNF Development Workcycle Closure

A worktree is temporary execution state, not a completed deliverable. Track the
work unit until it is merged and verified, precisely handed off, or
intentionally abandoned with recoverable preservation and operator approval.

For an authorized delivery cycle:

1. Reconcile ownership, base branch, dirty state, and existing PR/workstream.
2. Preserve unrelated changes and establish a clean test baseline.
3. Implement and verify in the isolated branch/worktree.
4. Commit only owned paths with an evidence-backed message.
5. Push and open or update the intended PR when publication is in scope.
6. Resolve review and CI failures; never treat “PR opened” as completion.
7. Verify the merge commit and target branch state.
8. Remove the worktree and branch only after merge and recovery checks; prune
   stale metadata and generated dependencies safely.
9. Emit a receipt covering commit, PR, checks, merge, cleanup, and exceptions.

External writes, merges, and deletion still require task authorization. When
authorization or credentials are missing, stop at a precise durable handoff; do
not silently leave an orphaned worktree or claim the cycle closed.

Pair with `.agent/skills/antigravity/using-git-worktrees/SKILL.md` for creation
and `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md` for ownership.
