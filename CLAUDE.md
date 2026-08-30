# TNF / Claude Project Harness Pointer

Canonical TNF authority lives in-repo. This file is a pointer, not a copied Turn
Zero stack.

## Required Session Entry

From the TNF repository root:

```bash
pnpm run tnf:onboard -- --task "<current task if known>"
```

`docs/core/FRONTLOAD_MANIFEST.md` is the only Stage A rail inventory.
`docs/protocols/TURN_ZERO_MANDATE.md` governs lifecycle/write readiness.
`docs/protocols/TNF_RESOURCE_GOVERNANCE_MANDATE.md` governs CPU/memory/process
management for any new cron/launchd job — route it through
`scripts/runtime/tnf-launchd-guard.sh` before wiring it up, or it's unprotected.

Do not use `scripts/tnf-onboard.cjs` as the normal entrypoint; it is legacy
diagnostics only.

For nontrivial engineering, load
`.agent/skills/tnf-engineering-context/SKILL.md`. Before overlapping code
changes, inspect current branches/PRs/handoffs and respect active
package/workstream ownership.

**This is a shared checkout other agent processes also write to.**
`docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` governs which
workspace a task belongs in — it exists because a concurrent agent's
branch-maintenance operation has silently discarded another agent's uncommitted
work here twice (2026-08-09, 2026-08-27). Before any
branch-maintenance/history-rewrite/release-build/large-refactor work — anything
that moves HEAD or is broad/risky — run
`node scripts/harness/resolve-workspace-tier.cjs --describe "<task>"` and follow
its guidance (worktree via `EnterWorktree`, or a separate clone). It is advisory
only; nothing currently blocks a forced checkout after the fact, so treat
"uncommitted work is unprotected work" (R3) as literal and commit at every stage
boundary regardless of tier.

After context compaction/provider substitution/repo movement/rail-hash change,
rerun onboarding.

Operating discipline: **Inspect → Act → Verify**.

Named operator departments and the remember write-path:
`docs/operations/TNF_DEPARTMENTS_AND_MEMORY.md`.

See `docs/claude.md` for broader project conventions.
