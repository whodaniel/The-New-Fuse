# Workspace cleanup completion handoff

Protocol ACK: `TNF_PROTOCOL_ACK`

Scope: core / oss_runtime / product_state / public.

The shared workspace protocol now requires commit, push, merge verification,
cleanup, and verification of removal. The checkout-ledger guide links retirement
to the same rule. These are operating requirements, not a new automatic garbage
collector.

The completed consolidation worktree was verified clean and tree-equivalent to
merge `4cd41ee309a20d93b309fff11a6903527da8b147` (PR #323), removed with
Git-aware tooling, and retired in the local checkout ledger. Sixteen temporary
files were removed; small audit receipts and branch refs were retained. Other
owners and shared caches were preserved.

Validation: Markdown formatting, diff checks, and repository content gates. A
scoped receipt is used because another agent owns the shared latest-handoff
paths. See the matching JSON for identity and changed-path coverage.

## Next Actions

Push and merge this policy change, verify the remote merge, then retire and
remove its completed owned worktree. Preserve this receipt in Git and local
audit storage before removal.
