# Ledger tenancy handoff

Protocol ACK: `TNF_PROTOCOL_ACK`

Partition ledger by authenticated tenant and workspace; unify CLI goals and
Kanban projections; validate explicit legacy import

PASS: 32 Jest ledger/controller tests; 3 real filesystem and JWT/Nest HTTP
integration cases; CLI and packages/api TypeScript checks; git diff --check.
apps/api typecheck reports 3 existing unrelated errors in
relay-health.controller.ts and fuseApp.ts; no errors in changed sources. No
production deployment or data migration performed. API storage requires a
durable shared POSIX filesystem across replicas.

## Next Actions

- Commit, push, and merge under explicit user authorization; verify remote main
  and retire only this worktree.
- Deploy API and CLI together with durable ledger storage, then explicitly
  import selected owner data using documented endpoints.
