# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.3` Created At:
`2026-09-09T03:18:17.287Z` Handoff ID: `acfce24f-a80f-4235-82eb-3311c0b19414`

## Repository

- Actual: `whodaniel/tnf-monorepo`
- Canonical TNF source: `whodaniel/tnf-monorepo`
- Origin: `https://github.com/whodaniel/tnf-monorepo.git`
- Branch: `fix/public-launch-readiness-20260909`
- Head SHA: `f6806db2b676018952416f89eec93c7a33f2e635`

## Classification

- Work domain: `core`
- Artifact destination: `oss_runtime`
- Data residency: `product_state`
- Sensitivity: `public`

## Capabilities

- Required: (not recorded)
- Staffed by: (not recorded)

## Work Summary

- Excluded archived browser run state from public export and added fail-closed
  binary-profile publication checks. Four regression checks and shell syntax
  pass. Existing public history retains profile objects; no historical rewrite
  or runtime readiness claim.

## Next Actions

- Merge PR353
- Block browser profile publication
- Correct PR352 runtime and RLS findings
- ⚠️ NEEDS LIVE OPERATOR CONFIRMATION (do not auto-commit): 4 file(s)
  uncommitted — see
  docs/core/AGENTS.md#commits-and-pushes-require-live-operator-confirmation
