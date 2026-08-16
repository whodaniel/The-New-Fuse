# Executable Intelligence Artifact

**Artifact ID:** eia-ccdc5db92acb172f **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:45:08+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6357
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6357
- Title: Thought: The Chrome stability fix is in place. The audit script now…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:45:08+00:00

## Taxonomy of Actionability

### Procedural

- The audit script now…
- The audit script now:
- The full pipeline (build + audit) completed successfully.
- The pnpm exit code 1 is from FAIL_ON_BROKEN=true, not from crashes.
- (163 links checked, 15 broken - pnpm exits 1 due to FAIL_ON_BROKEN=true)
- The TNF state file (tnf-full-auto-state.json) doesn't update from direct once
  invocations because the state write happens in the hermes agent runtime, not
  in the once CLI subprocess.

### Strategic

- (none)

### Governance

- The audit script now…
- The audit script now:
- Restarts browser per-seed on failure
- The full pipeline (build + audit) completed successfully.
- The audit-live-links.mjs Chrome stability issues are resolved.
- main (line ~408): Per-seed browser restart on crawl failure, with a graceful
  fallback result if both attempts fail
- Live link audit:

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.207
- Verification Difficulty: Hard

## Synthesis

Artifact captures 6 procedural, 0 strategic, and 7 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
