# AI agent artifact retention

Status: ACTIVE. Extends NON_DESTRUCTIVE_PRUNING_PROTOCOL.md, Agent Resource
Convergence, and workspace isolation R7. Applies to every agent and scheduled
retention job. Ownership, confidentiality, recovery and host correctness outrank
space savings. A timestamp or stale heartbeat is never disposal authority.

## Required procedure

Inspect → classify → plan → preserve → verify restore → reclaim → receipt.

1. Inventory allocated and logical bytes separately, file count, owner,
   producer, consumers, active processes, leases, Git state and regeneration
   requirements. Never report `du` totals as guaranteed freed space
   (hardlinks/APFS sharing).
2. Classify each artifact: live state; sealed history; regenerable output;
   immutable reusable resource; recovery evidence; credential/key material.
3. Produce exact-path candidates with action, retention reason, estimated bytes,
   consumer checks and rollback. Scheduled jobs default to plan-only. `--apply`
   authorizes only the implemented, bounded class; it is not a blanket purge.
4. Closed history: losslessly compress, verify decompressed SHA-256, fsync a
   restore receipt containing source path, content pointer, mode and timestamps,
   then recheck source identity and active use before unlinking the original.
   Preserve the compressed object indefinitely until a separately approved
   cold-storage lifecycle exists. Distillation never replaces raw evidence.
5. Failed checks retain originals. An interrupted prepared receipt is recovery
   evidence: inspect original and archive hashes before resuming. Do not delete
   locks automatically. Archives and receipts are machine-private, never source.
6. Verify actual volume space change, archive integrity and consumers. Preserve
   the exact applied receipt, retained items and unresolved reasons. Do not
   claim completion for a plan or infer unique reclaimed blocks from file size.

## Implemented entrypoint

`pnpm ops:disk-retention` plans sealed timestamp-named terminal heartbeat logs
older than 14 days. `pnpm ops:disk-retention -- --apply` archives those files.
The helper also accepts explicit `--sealed-backup <absolute-path>` selections
for old Claude rollback executables; this is never automatic discovery of vendor
backups. Confirm the selected version is not the active executable.

Objects are stored once by uncompressed SHA-256 under
`~/.tnf/artifact-retention/`, with one small restore receipt per original path.
`python3 scripts/operations/artifact-retention.py --apply --restore <receipt>`
restores verified bytes, executable mode and mtime without overwriting a file.
It requires `lsof`; absence or ambiguous output blocks archival. The archive
must fit alongside its source until verification completes. A sealed producer
contract is required because an active-use probe alone cannot prevent a future
writer from reopening a path. Never apply this primitive to mutable log names.

The former retention entrypoint's blind file deletion, live JSONL truncation,
Git temporary-pack removal, cold-archive deletion, npm cache purge, pnpm pruning
and automatic Hermes database pruning are retired. Existing schedules invoking
it without arguments now produce a plan, not destructive maintenance. Enabling
bounded archival is an explicit scheduler rollout, with a verified first cycle.

## Scheduled rollout

On macOS, `python3 scripts/operations/install-artifact-retention.py` shows the
deployment plan. Add `--apply` to install a SHA-bound machine-local executable
and a daily launchd job. The installer refuses to replace an existing job,
verifies the installed hash, executes a bounded cycle, then loads and kicks the
job. Verify `launchctl print gui/<uid>/com.thenewfuse.artifact-retention`
reports exit 0. Receipts live outside the source checkout; the job survives
worktree retirement. Upgrades require review of the current plist and
executable, then bootout of that exact job, preservation of rollback evidence
and reinstall. Never bind a scheduled task to a disposable implementation
worktree.

## Larger opportunities and their gates

- Worktrees: follow R7, including remote integration proof, dirty/untracked/
  ignored inventory, process and lease checks, retained recovery refs, Git-aware
  removal, checkout-ledger retirement and post-removal verification. Unmerged
  work stays. Dependency eviction is separate: prove task inactivity, preserve
  lockfile/toolchain/install recipe, check local modifications and outside
  consumers, then delete only the classified regenerable subtree. Never share
  mutable node_modules directories across incompatible checkouts.
- Reconciliation clones: preserve unique refs and dirty/untracked evidence and
  test recovery before retiring. A remote URL or clean status is insufficient.
- Session/chat databases: use a host-supported export/retention adapter with
  restore proof. No direct SQLite row deletion or VACUUM as generic cleanup.
- Credentials and signing keys: excluded from reusable resource deduplication.
  Storage packing requires a security-specific adapter preserving permissions,
  key identity, lookup, revocation, rotation and recovery. File count alone does
  not authorize it.
- Skills/templates: use the existing resource fabric and verified host adapters;
  do not create another resource authority or import everything before
  measuring.

## Prevent regrowth at the producer

Every new artifact producer must declare owner, class, consumer, byte/file
budget, retention tier, regeneration or restore procedure, and terminal cleanup.
Snapshot producers compare meaningful content (exclude observation timestamps)
and write only on change, with periodic checkpoints when recovery requires them.
Keep stable latest pointers plus indexed immutable records, not repeated
complete copies per consumer. Preserve individually addressable handoffs behind
the existing handoff registry; do not lossy-dedupe history. Generate
Markdown/HTML views from canonical data where consumers support it. Never remove
existing views until consumer migration is verified.

Rotate logs into sealed bounded segments; keep live segments bounded at the
producer, not by replacing an open file under a writer. Expose daily bytes and
file-count growth through the existing growth audit. Exceeding a budget triggers
bounded retention or dispatch backpressure, never an unreviewed destructive
fallback. Emit one receipt per state transition; do not create per-poll reports
when nothing changed. Completed agent tasks include R7 cleanup or an explicit
retained-work handoff with owner, reason and next review.
