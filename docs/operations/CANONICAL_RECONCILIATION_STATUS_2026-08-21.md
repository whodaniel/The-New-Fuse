# Canonical Reconciliation Status - 2026-08-21

Status: canonical engineering reconciliation complete; external gates remain.

## Canonical State

- Development authority: `whodaniel/tnf-monorepo`
- Public publication target: `whodaniel/The-New-Fuse`
- Private publication target: `whodaniel/fuse-control-plane`
- Canonical source at final publication: `9561fa7c1eb605f86d20f87405753d7bc46e43eb`
- Public publication: `The-New-Fuse` PR #154, merged as `f3f62adb85d8109fbcc2e13a6d4040ddecaa22a2`

## Completed Work

1. Preserved the divergent checkout in a verified recovery capsule at
   `/Users/danielgoldberg/TNF-Recovery-Capsules/2026-08-21-49902d36`.
2. Merged process single-instance locking through monorepo PR #125.
3. Repaired public-overlay application builds, contract stubs, gitlink handling,
   and topology documentation through PR #126.
4. Implemented Green/DACC V1 context references, executor-only hydration,
   Redis TTL/CAS behavior, CER telemetry, and failure tests through PR #127.
5. Removed credentials from publication command lines through PR #128.
6. Aligned all active handoff producers and validators with
   `tnf/session-handoff/0.2` through PR #129.
7. Replaced the 1 GB discard-and-reclone publication path with a parent-only
   partial clone and direct replacement-tree commit through PR #130.
8. Published the current open runtime through the upstream separation pipeline.
   Both proprietary boundary gates passed. Public issue #157 is closed.
9. Migrated Bolt, Palette, and Sentinel schedules from public
   `The-New-Fuse` to canonical `tnf-monorepo`; public scheduled-task inventory
   was zero after reload. The first canonical run is due at 21:30 EDT.

## Protected Checkout Classification

Protected checkout:

- Branch: `chore/retire-openclaw-cloudflare`
- Preserved HEAD: `49902d36676cd29e62eaa63314e8a9c53e54baae`
- Original comparison base: `be22d01a10b67016d1efceef546faa2c127bf057`
- Mutation state: prohibited until a path-by-path integration branch is chosen

Commit lanes:

- **Already superseded upstream:** `a9dc2e1268` process-leak work. PR #125
  contains the reviewed implementation plus atomic leases and tests.
- **Candidate source lane:** CLI parity/task-ledger/tool-gate commits from
  `da05748602` through `b2c4146967`, plus the full-auto boot step at
  `98e3497e05`. Port individually against current main with focused CLI tests.
- **Candidate product lane:** `26612ae8d2` combines Chrome Extension V7,
  subscriptions/email, task workers, and Cloudflare retirement. Split by
  ownership boundary before review; do not cherry-pick the aggregate commit.
- **Candidate API lane:** `36da6a4d16` admin backup routing. Re-audit against
  current API versioning before porting.
- **Generated/protocol history:** merge commits, handoff-only commits, and
  `a0635004ea` / `49902d3667` state syncs are evidence, not direct integration
  candidates.

Dirty-path lanes:

- **Generated/runtime state:** API audit logs, terminal macro-board snapshots,
  provider status, reconciliation reports, and validation reports. Preserve in
  the capsule; regenerate from current main instead of copying them.
- **Needs owner review:** `data/marketplace/catalog-items.json` and
  `docs/operations/TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md`. Review semantic
  additions separately before any upstream port.

No pull, merge, rebase, reset, checkout, restore, stash, clean, or commit was
performed in the protected checkout during this reconciliation.

## Remaining External Gates

- **GitHub Actions:** account-level hosted Actions restriction still prevents
  jobs from starting. The repository has no registered self-hosted runner.
  Billing changes are financial actions and runner registration handles
  credentials; both require operator action outside this engineering pass.
- **Jules cadence:** after 21:30 EDT on 2026-08-21, verify the three canonical
  schedules execute and that no public-overlay persona session recurs for one
  full cadence.
- **Control plane:** issue #113 remains the authority decision for locating the
  canonical proprietary service before replacing `EchoPromptExecutor` and
  file/in-memory persistence. Direct downstream edits remain prohibited.
- **Extension contract:** issue #114 remains open for a versioned manifest,
  activation lifecycle, real install source, compatibility, and isolation.
- **SSI/PASS/legal:** entity, equity, IP, compensation, trust, and benefits
  decisions remain frozen pending qualified benefits, tax, and legal review.

## Verification Receipts

- PR #125: service lease tests 4/4; Chrome Extension V6 tests 84/84.
- PR #126: API Jest 2 suites/9 tests; frontend production build; export and
  gitlink checks passed.
- PR #127: live Redis context-reference suite 7/7; protocol typecheck passed.
- PR #128: publication authentication tests 2/2.
- PR #129: V2 handoff tests 2/2; protocol-contract schema check passed.
- PR #130: publication tests 3/3; full open-runtime dry run passed.
- Final publication: proprietary path and content sweeps passed; public PR #154
  merged without force-pushing public `main`.
