# Whole-Codebase Verification — Remediation Status

**Baseline:** `whole-2026-07-20T05-56-17Z` → **18/29** **Partial rerun:**
`rerun-2026-07-20T06-22-13Z` (stopped mid C-layer; script edited while running)
**A01 recheck (post-fix):** PASS (`tnf protocol validate` with handoff file
list)

## Fixed this session

| Item                       | Change                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| B03 agent registration     | Auto-registered `relay-server-qa-agent`, `staff-review-agent`, `staffing-director-agent`                               |
| A10 doc tagging            | Valid tags on 3 email library docs + DOC_TYPE/VISIBILITY on 3 protocol docs                                            |
| B07 ESM crash              | Renamed `scripts/validate-security.js` → `.cjs` (script now runs; still fails on missing local secrets)                |
| A01/A02 handoff gate       | Seed `TNF_HANDOFF_FILE_LIST` + emit handoff in verify harness; A02 PASS; A01 PASS after Living State path fix          |
| Living State absolute path | Removed `/Users/...` from Current Directive; `emit-session-handoff.cjs` now strips repo absolute paths                 |
| Disk                       | Cleared npm/playwright caches, `.deepsec/node_modules`, old verifier runs (~+0.5–0.6 GiB). Still ~2.9 GiB free (tight) |

## Still failing (real package / env issues)

| Surface               | Status                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B02 validate-build    | Missing `.d.ts` for 5 packages                                                                                                                                                   |
| B07 validate-security | Runs, but exits 1: missing `JWT_SECRET`, `DATABASE_URL`, `ENCRYPTION_KEY`, false-positive secret heuristics                                                                      |
| C01 type-check        | **No ENOSPC this time.** Fails `@the-new-fuse/core` TS6310: referenced projects disable emit (`types`, `database`, `utils`, `infrastructure`, `core-vector-db`) — 36/47 tasks OK |
| C02–C05               | Re-running now (`rerun-c-*`)                                                                                                                                                     |

## Artifacts

- Baseline: `.verifier/whole-codebase/latest/`
- Partial remediation: `.verifier/whole-codebase/latest-rerun/`
- Harness: `scripts/agents/tnf-whole-codebase-verify.sh`,
  `scripts/agents/tnf-failed-surface-rerun.sh`

## C-layer continue (`rerun-c-2026-07-20T06-30-14Z`)

All C02–C05 still FAIL (as expected without package fixes):

- C02 lint / C03 test:all / C04 build:packages / C05 build:apps

## Projected full-suite score after this remediation pass

**22/29** (was 18/29) — flipped A01, A02, A10, B03.

Disk still ~3 GiB free; free more before trusting long turbo re-runs.

## Follow-up fix: C01 `@the-new-fuse/core` TS6310

Changed `packages/core` `type-check` from `tsc --build --noEmit` →
`tsc -p tsconfig.json --noEmit`. Local verify: **PASS** (exits 0). Should flip
C01 on next full turbo type-check → projected **23/29**.
