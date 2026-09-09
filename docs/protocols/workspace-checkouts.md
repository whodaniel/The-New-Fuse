# Workspace Checkouts (canonical ledger)

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD]`

**Runtime authority:** `~/.tnf/checkouts/<repoFingerprint>/ledger.json`  
**Repo mirror (optional broadcast):**
`docs/protocols/workspace-checkouts.json`  
**Companion:** `docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md`  
**Tool:** `scripts/harness/checkout-ledger.cjs`

## What this is

One ledger listing **individually segregated checkouts** (shared primary, git
worktrees, clones). Separate checkouts prevent filesystem collisions;
overlapping file scopes still require leases + integration review.

Path leases stay in `docs/protocols/workspace-leases.json`. This ledger does
**not** replace leases. Leases may add optional `checkoutId`.

## Worker identity (TNF-0107)

Worker identity = **task + harness/session + assigned checkout**.  
`provider` / `model` are diagnostic metadata only — substitutions must not block
work. Acceptance = diffs, hashes, commands, exit codes, behavioral evidence.

## Commands

```bash
node scripts/harness/checkout-ledger.cjs migrate --json
node scripts/harness/checkout-ledger.cjs list
node scripts/harness/checkout-ledger.cjs verify [--enforce]
node scripts/harness/checkout-ledger.cjs register --path <abs> --kind worktree --task <id>
node scripts/harness/checkout-ledger.cjs mirror
```

`migrate` is append-only: registers existing `git worktree list` entries and the
shared primary **without** moving, deleting, stashing, or resetting work.

## Completion and retirement

Follow R7 in `TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` after a run: verify
integration, preserve a bounded receipt, remove the completed owned checkout,
and mark its ledger row retired with write readiness disabled. Preserve the row
as history; do not delete ledger entries or treat expired heartbeats as
permission to delete files. A retained checkout needs an owner, reason, next
action, and review condition in its handoff. Verify both filesystem removal and
Git/ledger state before reporting cleanup complete.
