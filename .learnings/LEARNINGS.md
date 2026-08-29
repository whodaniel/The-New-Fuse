# Learnings

Corrections, insights, and knowledge gaps captured during TNF development.

**Categories**: correction | insight | knowledge_gap | best_practice  
**Areas**: frontend | backend | infra | tests | docs | config  
**Statuses**: pending | in_progress | resolved | wont_fix | promoted | promoted_to_skill

## [LRN-20260829-001] correction

**Logged**: 2026-08-29T03:44:17Z  
**Priority**: critical  
**Status**: resolved  
**Area**: config

### Summary

Do not change application imports until the installed package version and runtime resolution path prove that the source contract is wrong.

### Incident

`tnf boot` failed while importing the named `Minimatch` export. The error looked like an application/API incompatibility and followed an earlier missing `minimatch/dist/esm/index.js` error.

### Original Hypothesis

`PermissionService.ts` was importing `minimatch` incorrectly, or the sparse workspace `.pnpm` directory proved a corrupt install.

### Attempted Action

Agents explored changing the application import and manually repairing package contents before the resolved dependency graph and linker mode were fully established.

### Contrary Evidence

The `tnf-cli` manifest required `minimatch` v10, the lockfile selected v10.2.4, that version exposes the named `Minimatch` export, and `node-linker=hoisted` makes a sparse workspace `.pnpm` directory normal. The failing runtime was resolving a different hoisted package version rather than disproving the source import contract.

### Corrected Diagnosis

The failure was an installation/resolution mismatch. It was not evidence that `PermissionService.ts` needed a compatibility rewrite.

### Authoritative Resolution

The named import was preserved, the dependency resolution/install state was repaired, and the RC Phase B suite completed with natural exit. The minimatch premise is closed unless a new runtime probe supplies contrary evidence.

### Prevention Rule

For package-export failures, verify the manifest range, lockfile selection, actual resolved file, installed package version, linker mode, and runtime export keys before editing application source.

### Reusable Detector/Check

From the affected package directory, run:

```bash
node --input-type=module -e "console.log(import.meta.resolve('minimatch')); import('minimatch').then((m) => { console.log(Object.keys(m)); if (!m.Minimatch) process.exit(1); })"
```

### Metadata

- Source: error, user_feedback
- Related Files: packages/tnf-cli/package.json, packages/tnf-cli/src/services/PermissionService.ts, pnpm-lock.yaml
- Tags: dependencies, esm, hoisted-linker, causal-diagnosis, invalidated-premise
- Pattern-Key: diagnose.runtime_resolution_before_source_change
- Recurrence-Count: 1
- First-Seen: 2026-08-28
- Last-Seen: 2026-08-28

### Resolution

- **Resolved**: 2026-08-28
- **Commit/PR**: RC Phase B verified receipt at 39893b5c7e25d56a4050b1c8fc9bbd446486777e
- **Notes**: Application source was restored/preserved; runtime evidence superseded the initial source-change narrative.

---

## [LRN-20260829-002] best_practice

**Logged**: 2026-08-29T03:44:17Z  
**Priority**: high  
**Status**: resolved  
**Area**: tests

### Summary

A test-count claim is valid only when bound to an immutable SHA, exact command, complete result tuple, and process-exit evidence.

### Incident

RC evidence alternated between 719 and 722 total tests, creating uncertainty about whether the full repaired matrix had actually run.

### Original Hypothesis

The 719 count represented the authoritative complete suite, so the three-test difference might indicate nondeterminism, exclusion, or a regression.

### Attempted Action

Agents compared narrative summaries and partial receipts without first binding each count to the exact revision and test inventory that produced it.

### Contrary Evidence

Three new T3 regression guards increased the inventory. At the verified remote repair SHA, the complete run reported 31 suites, 722 total tests, 716 passed, 6 intentional load-gated skips, exit 0, natural teardown, and no force-exit or MaxListeners warnings.

### Corrected Diagnosis

The divergence was stale evidence scope: the 719 count predated or omitted the three T3 guards. It was not a failing or nondeterministic final suite.

### Authoritative Resolution

The closure receipt at `39893b5c7e25d56a4050b1c8fc9bbd446486777e` reconciled the counts and recorded the full result tuple. The T5 candidate carries that receipt forward.

### Prevention Rule

Never promote a bare test count. Record SHA, exact command, suite count, total, passed, failed, skipped, exit code, teardown mode, warnings, and timestamp together; reject comparisons where any identity field differs.

### Reusable Detector/Check

Before accepting a release receipt, compare its immutable SHA and exact command with the live checkout, then require the final runner summary to satisfy:

```text
failed = 0
passed + intentional_skips = total
exit = 0
natural_teardown = true
force_exit_warnings = 0
listener_warnings = 0
```

Any added or removed guard must update both the expected inventory and the receipt in the same candidate.

### Metadata

- Source: conversation, error
- Related Files: docs/recon/rc-phase-b-test-integrity-repair.md
- Tags: test-integrity, evidence, immutable-sha, teardown, release-candidate
- See Also: LRN-20260829-001
- Pattern-Key: verify.test_receipt_identity_tuple
- Recurrence-Count: 1
- First-Seen: 2026-08-28
- Last-Seen: 2026-08-28

### Resolution

- **Resolved**: 2026-08-28
- **Commit/PR**: 39893b5c7e25d56a4050b1c8fc9bbd446486777e
- **Notes**: The final 722-test result supersedes the stale 719-test narrative for that repair line.

---
