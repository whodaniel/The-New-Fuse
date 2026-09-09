# Tenant-aware unified ledger

`apps/api/src/modules/unified-ledger` is the authoritative ledger. Goals, tasks,
suggestions, plans, and timeline events share that ledger. The CLI GoalsService
uses its goal/task API; Kanban is a projection of plans and their linked task
records. The older `packages/api` flat-file module is now an inert compatibility
marker, with no registered controller or storage provider.

## Ownership and storage

The authenticated JWT determines tenant identity. When a JWT has no tenant
claim, the authenticated user gets a personal tenant named `user:<user ID>`.
Request bodies cannot select a different tenant, including for privileged users.
Workspace selection requires ownership or membership for reads and writes; an
authenticated workspace claim cannot be overridden. No selected workspace means
`personal`, not all workspaces.

Storage uses an absolute `UNIFIED_LEDGER_ROOT`, defaulting to `~/.tnf/ledger` on
the API host. Partitions are:

```text
<root>/<SHA256 tenant ID>/<SHA256 workspace ID>/ledger.json
```

Each file records its exact scope and contains only matching rows. IDs, owners,
and scope are immutable on updates. References must resolve inside the partition
and match the owning user. Unscoped service calls fail instead of listing every
tenant. Trusted background callers must supply scope or an owner; owner-only
calls use that user's personal partition. Caller-supplied scope is not an auth
mechanism: the HTTP boundary derives and checks it from verified identity.

An operation loads fresh state under an exclusive filesystem claim, mutates a
transaction-local copy, validates it, and commits through a private temporary
file and atomic rename. Multiple service instances sharing the same filesystem
do not overwrite each other's changes. Failed operations discard the copy. Reads
return detached values. Invalid JSON, permission errors, invalid versions, and
scope mismatches fail without replacing the file or falling back to `/tmp`.

The lock timeout is 10 seconds. Crashed writers can leave a lock; its PID and
acquisition time are recorded. Do not remove a lock merely because it is old.
Quiesce the relevant API writers and verify no owner remains before recovery.
For multiple API replicas, use the same durable filesystem with the required
exclusive-create/atomic-rename semantics. Separate ephemeral container disks are
not a distributed ledger. This change does not provision storage or deploy an
API.

Personal librarian/public timeline enrichment remains available only in the
matching personal user partition. It is not injected into arbitrary tenant or
workspace timelines that cannot establish ownership of those legacy sources.

## CLI connection

Use the existing `TNF_API_URL` and `TNF_API_TOKEN`/`TNF_AUTH_TOKEN`, or explicit
`TNF_LEDGER_API_URL` (the full `/api/unified-ledger` base) and
`TNF_LEDGER_TOKEN`. Existing TNF auth credentials are also supported.
`TNF_WORKSPACE_ID` selects an authorized workspace. The server, not a CLI tenant
flag, determines tenancy. Without an explicit API address, the bound account's
cloud endpoint is used.

Connections require HTTPS except for loopback development. Redirects are not
followed, and errors do not fall back to local files. A service instance pins
its connection and workspace; construct a new instance after changing accounts.

Goals are not silently seeded during a read. `initializeDefaults()` is an
explicit writer. Goal task progress comes from linked ledger records. Moving a
Kanban card updates the same task status. Deleting a card archives its
underlying record; it does not destroy timeline history or links. Board IDs are
plan IDs.

Canonical routes include `/api/unified-ledger/records`, `/goals`, and `/plans`.
The historical duplicated `unified-ledger/unified-ledger/...` routes remain
aliases for compatibility. Creating a goal/plan task through its `/tasks`
endpoint creates and links the record in one transaction.

## Explicit migration

The old `data/unified-task-ledger.json` is never auto-loaded or overwritten. If
`UNIFIED_LEDGER_STORE_PATH` is still set, it must be absolute and new partition
files go under `<old path>.tenants`; the old file stays untouched.

After selecting and authenticating the target account/workspace:

- `POST /api/unified-ledger/migrations/legacy` accepts `{ "store": ... }` with
  all four canonical collections. Every row's owner/userId must match the
  caller; existing tenant/workspace stamps must match the target. Import one
  owner's complete linked subset, not a mixed-tenant dump.
- `POST /api/unified-ledger/migrations/cli` accepts
  `{ "goals": [...], "boards": [...] }` from legacy CLI files. Goals become
  goals with linked tasks; boards become plans with linked tasks. Stable IDs and
  CLI metadata are retained. Stamped ownerUserId values must match the caller.
  Unstamped data requires an explicit `"claimUnowned": true` decision; it is
  never adopted during a read.

Imports are transactional and idempotent. Conflicting existing IDs abort the
operation and preserve existing data. Source files are not deleted. Legacy CLI
files under `~/.tnf/goals` and `~/.tnf/kanban` remain available for this
explicit migration but are no longer a parallel read/write authority.

## Verification

```sh
TSX_TSCONFIG_PATH=apps/api/tsconfig.json node --import tsx --test apps/api/test/ledger-tenancy.node.ts
node_modules/.bin/jest --config apps/api/jest.config.js --runInBand --testPathPatterns=unified-ledger.service.spec.ts --env=node
```

The integration tests use real temporary filesystem partitions and a real Nest
HTTP server with signed JWTs, the production
guard/interceptor/controller/service, and the CLI clients. Workspace membership
responses are an isolated test fixture; no live database, deployment, or
production migration is claimed.
