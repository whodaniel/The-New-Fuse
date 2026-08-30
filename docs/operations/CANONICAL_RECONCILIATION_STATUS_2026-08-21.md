# Canonical Reconciliation Status - 2026-08-21

Status: canonical engineering reconciliation complete; external gates remain.

## Canonical State

- Development authority: `whodaniel/tnf-monorepo`
- Public publication target: `whodaniel/The-New-Fuse`
- Private publication target: `whodaniel/fuse-control-plane`
- Canonical source: `e3635bccda9e98836ddfb686d0f98bda5ba2a04f`
- Public publication: `The-New-Fuse` PR #160, merged as
  `2c5fa089cf10058745e3720b2ae4d09c7fb4294a`
- Pending public publication: PR #161 from canonical `e3635bcc`

## Completed Work

1. Preserved the divergent checkout in a verified recovery capsule at
   `$HOME/TNF-Recovery-Capsules/2026-08-21-49902d36`.
2. Merged process single-instance locking through monorepo PR #125.
3. Repaired public-overlay application builds, contract stubs, gitlink handling,
   and topology documentation through PR #126.
4. Implemented Green/DACC V1 context references, executor-only hydration, Redis
   TTL/CAS behavior, CER telemetry, and failure tests through PR #127.
5. Removed credentials from publication command lines through PR #128.
6. Aligned all active handoff producers and validators with
   `tnf/session-handoff/0.2` through PR #129.
7. Replaced the 1 GB discard-and-reclone publication path with a parent-only
   partial clone and direct replacement-tree commit through PR #130.
8. Published the current open runtime through the upstream separation pipeline.
   Both proprietary boundary gates passed. Public issue #157 is closed.
9. Migrated Bolt, Palette, and Sentinel schedules from public `The-New-Fuse` to
   canonical `tnf-monorepo`; public scheduled-task inventory was zero after
   reload. The first canonical run is due at 21:30 EDT.
10. Added publication status, validation-gate, and portable recovery-path
    continuity through monorepo PRs #131 and #132, then republished through
    public PR #160.
11. Implemented issue #114's extension contract: the versioned
    `tnf.extension/v1` manifest, four satellite classifications, compatibility
    and contained-entrypoint validation, real local/Git installation, atomic
    registry writes, worker-isolated activation/deactivation hooks, update
    rollback, CLI commands, and failure-isolation tests.
12. Merged the extension contract through monorepo PR #133 and closed issue
    #114. Public PR #161 then exposed executed CI failures that had previously
    been masked by the hosted-runner restriction.
13. Repaired those executed CI paths upstream: conventional publication
    commits/PRs, `sync/` train policy, canonical-only boundary jobs, declared
    TWIP dependencies, the missing root OpenAPI source, and Tauri Redis cache
    types/pipeline behavior.

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
  `docs/operations/TNF_SWARM_MASTER_SCHEDULE.md`. Review semantic additions
  separately before any upstream port.

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
- PR #131: Turn Zero and handoff-source validation passed; handoff tests 3/3.
- PR #132: privacy, secret, docs PII, and portable-path publication gates
  passed.
- Extension contract: protocol package build and typecheck passed; manifest
  tests 7/7; plugin lifecycle tests 13/13; CLI build and typecheck passed;
  command surface 474/474; all remaining CLI tests passed. The full chained CLI
  suite retains the documented unrelated `tnf doctor` 30-second latency failure.
- Public CI remediation: OpenAPI drift check passed; TWIP conformance passed;
  Tauri typecheck passed; Tauri tests 49/49; Tauri production build passed;
  publication authentication/title tests 4/4; `sync/open-runtime` train policy
  passed.
- Final publication: proprietary path and content sweeps passed; public PR #160
  merged without force-pushing public `main`.
