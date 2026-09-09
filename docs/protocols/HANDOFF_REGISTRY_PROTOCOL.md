`[CLASS:PROTOCOL] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`
— 2026-09-06

# TNF Handoff Registry Protocol (TNF-0108)

## Purpose

One canonical registry of individual turn-end handoffs, paired with one
canonical emitter. Every worker's handoff remains independently addressable
instead of competing to overwrite `SESSION_HANDOFF_LATEST.json`.

This protocol complements `TURN_END_MANDATE.md` (locked) without modifying it:
the emitter authority, schema location, and Turn End flow defined there are
unchanged. What this protocol adds is the record/registry layer underneath the
compatibility views.

## Authority model

| Layer                      | Authority                                                                                               | Mutability                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Canonical schema           | `docs/protocols/schemas/tnf-session-handoff.schema.json` (spec `0.3`; `0.2` artifacts remain valid)     | governed                                |
| Canonical emitter          | `scripts/protocols/emit-session-handoff.cjs` (`pnpm run handoff:emit:verified`)                         | sole publisher                          |
| Individual handoff record  | `~/.tnf/checkouts/<repoFingerprint>/handoffs/<created_at>_<handoff_id>.json`                            | immutable, write-once                   |
| Canonical registry (index) | `~/.tnf/handoffs/<repoFingerprint>/registry.json`                                                       | metadata-only rows; locked transactions |
| Committed mirror           | `docs/protocols/handoff-registry.json`                                                                  | broadcast-only, metadata-only           |
| Compatibility views        | `SESSION_HANDOFF_LATEST.{json,md}`, `~/.tnf/handoff-current*.json`, `LIVING_STATE.md` directive/history | generated, scoped                       |

Repository identity is the checkout-ledger fingerprint
(`sha256(origin|git-common-dir)[:16]`, TNF-0107), so every checkout of
`whodaniel/tnf-monorepo` resolves the same registry.

## Invariants

1. **Individual addressability.** Each emission writes one immutable record.
   Records are never edited, moved, or deleted by the emitter.
2. **Explicit supersession.** A new scoped publication supersedes the active
   record it declares to replace; both sides record the link (`supersedes` /
   `superseded_by`). "Most recently written" never automatically becomes
   everyone's next directive.
3. **Validation before publication.** The emitter validates the body
   structurally and the registry rejects invalid bodies before any write.
4. **Idempotent publication.** Re-publishing an existing record is a no-op; the
   on-disk record is canonical and fails its own hash if mutated.
5. **Crash recovery.** Records are truth; the index is a derived projection.
   `reconcile` re-indexes any record written before a crash and withdraws rows
   whose records vanished. Hash verification (`verify --enforce`) detects
   post-publication mutation.
6. **Residency boundaries.** The registry stores metadata only.
   `public`/`internal` records are additionally copied to
   `docs/protocols/reports/handoffs/<YYYY>/` for durability;
   `private`/`restricted` bodies stay host-local and their URIs are redacted in
   the committed mirror.
7. **Turn ≠ task ≠ acceptance.** `turn_status` is emitter-derived. `task_status`
   and `acceptance` are explicit transitions (`accept`/`reject` CLI) with
   retained evidence (`verification.evidence_refs`). A completed turn never
   implies a completed task.

## Scoped latest resolution

`latest --scope checkout|session|task|repo|global` resolves the newest
**active** record for the declared scope (default `checkout` via the checkout
ledger). Compatibility views render from that resolution:

- `SESSION_HANDOFF_LATEST.{json,md}` — per-checkout generated view; JSON view is
  byte-identical to the finalized record body.
- `~/.tnf/handoff-current-<checkoutId>.json` — per-checkout cache with a `_view`
  provenance block; the legacy global `~/.tnf/handoff-current.json` remains
  updated for un-migrated consumers.
- `LIVING_STATE.md` — directive fence preserves the standing directive unless
  the emitting record explicitly retargets it (existing
  `TNF_HANDOFF_SET_DIRECTIVE` semantics, unchanged).

## CLI

```bash
node scripts/harness/handoff-registry.cjs publish   --file <handoff.json> [--no-supersede] [--json]
node scripts/harness/handoff-registry.cjs latest    [--scope checkout] [--json]
node scripts/harness/handoff-registry.cjs list      [--state active] [--task <id>] [--json]
node scripts/harness/handoff-registry.cjs supersede --handoff-id <id> --by <id> [--reason <r>]
node scripts/harness/handoff-registry.cjs accept|reject --handoff-id <id> --by <who> [--basis <b>]
node scripts/harness/handoff-registry.cjs reconcile [--json]
node scripts/harness/handoff-registry.cjs verify    [--enforce] [--json]
node scripts/harness/handoff-registry.cjs backfill  [--json]   # additive legacy import
node scripts/harness/handoff-registry.cjs mirror    [--json]
```

## Migration (preserves existing artifacts)

1. Schema `0.3` fields are additive; `0.2` handoffs keep validating.
2. `backfill` imports existing `docs/protocols/reports/SESSION_HANDOFF_*.json`
   as `state: legacy` rows with computed hashes pointing at their committed
   locations — no file moves, no deletions.
3. The current `SESSION_HANDOFF_LATEST.json` becomes a generated view; all
   existing consumers keep reading it unchanged. Registry-first reads are a
   per-consumer follow-up, not a breaking cutover.

## Tests

`node scripts/harness/handoff-registry.test.cjs` — covers hashing determinism,
validation-before-publication, immutability, idempotent republish, explicit
supersession, acceptance transitions, reconcile-based crash recovery, hash
verification, additive backfill, and the scoped cache view (all against a
throwaway `TNF_HANDOFF_HOME`).
