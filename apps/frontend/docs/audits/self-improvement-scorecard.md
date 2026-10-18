# TNF Self-Improvement Scorecard

- Generated: 2026-10-18T05:00:07.587Z
- Overall: FAIL
- Required audits present: yes
- Evidence freshness threshold: [object Object] minutes

## Live Link Crawl

- checked: 4
- broken: 4
- network unreliable (transport-only, inconclusive): true
- semantic broken: 0
- evidence age: 53 minutes
- passed: false
- falsified_by: crawl reported 4 failure(s) but registered
  networkUnreliable=true — transport-level failures, audit INCONCLUSIVE
  (PS-005), not evidence of broken links; re-run on a reliable network path
  before concluding either way

## Semantic Route Audit

- routes: 260
- hard broken: 0
- network broken: 0
- network unreliable (transport-only, inconclusive): true
- transport-only failures set aside: 260
- same as root: 0
- duplicate groups: 0
- evidence age: 53 minutes
- passed: false
- falsified_by: every failure is transport-level (260 row(s), no HTTP status —
  consistent with TLS interception / middlebox on this host) — audit
  INCONCLUSIVE per PS-005, not evidence the routes are broken; re-run on a
  reliable network path

## Auth Path Audit

- checks: 4
- failed checks: 0
- negative credentials probes: 3
- evidence age: 0 minutes
- passed: true
- falsified_by: none — passed

## Audit Cycle Run Log

- cycle: light
- last run: 2026-10-18T05:00:03.762Z (0 minutes ago)
- exit code: 0
- steps: auth-path-audit(0)
- inconclusive steps: none
- passed: true
- falsified_by: none — passed

- **live**: crawl reported 4 failure(s) but registered networkUnreliable=true —
  transport-level failures, audit INCONCLUSIVE (PS-005), not evidence of broken
  links; re-run on a reliable network path before concluding either way
- **semantic**: every failure is transport-level (260 row(s), no HTTP status —
  consistent with TLS interception / middlebox on this host) — audit
  INCONCLUSIVE per PS-005, not evidence the routes are broken; re-run on a
  reliable network path

## Notes

- This scorecard is produced by
  scripts/ci/generate-self-improvement-scorecard.mjs.
- Every terminal state carries a falsified_by: a test is only valid if we can
  prove how it fails.
- Stale evidence (>threshold), zero-work executions, and missing negative probes
  all falsify.
- Failures should trigger immediate audit regeneration, then route/auth
  remediation before release promotion.
