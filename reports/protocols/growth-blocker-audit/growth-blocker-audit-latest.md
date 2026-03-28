# TNF Growth Blocker Protocol Audit

Generated: 2026-03-26T20:31:40.527Z

## Summary

- Total findings: 13
- Critical: 0
- High: 9
- Medium: 4
- Low: 0
- Policy signal files reviewed: 20

## Priority Findings

- [high] stale-run-window (tenant-hourly-attribution-audit):
  tenant-hourly-attribution-audit has stale-run-window warning.
- [high] stale-run-window (tenant-orchestrator-pulse): tenant-orchestrator-pulse
  has stale-run-window warning.
- [high] stale-run-window (tenant-personal-archaeology-blocker-watch):
  tenant-personal-archaeology-blocker-watch has stale-run-window warning.
- [high] stale-run-window (tenant-personal-archaeology-master-loop):
  tenant-personal-archaeology-master-loop has stale-run-window warning.
- [high] stale-run-window (tenant-terminal-awareness-default):
  tenant-terminal-awareness-default has stale-run-window warning.
- [high] stale-run-window (tnf-master-clock-super-cycle):
  tnf-master-clock-super-cycle has stale-run-window warning.
- [high] stale-run-window (tnf-openclaw-runtime-sync): tnf-openclaw-runtime-sync
  has stale-run-window warning.
- [high] stale-run-window (tnf-terminal-awareness-reminder):
  tnf-terminal-awareness-reminder has stale-run-window warning.
- [high] stale-run-window (tnf-twip-macro-board-refresh):
  tnf-twip-macro-board-refresh has stale-run-window warning.
- [medium] disabled-schedule (tenant-launch-validation):
  tenant-launch-validation is disabled.
- [medium] disabled-schedule (tenant-loop-watchdog): tenant-loop-watchdog is
  disabled.
- [medium] locked-policy-review (tnf-master-clock-super-cycle):
  tnf-master-clock-super-cycle is locked in system scope; confirm lock intent
  still supports growth.
- [medium] locked-policy-review (tnf-self-improvement-scorecard):
  tnf-self-improvement-scorecard is locked in system scope; confirm lock intent
  still supports growth.

## Policy Signal Hotspots

- data/protocols/cron-jobs.control-plane-state.json: hits=99 score=10
- data/protocols/cron-jobs.registry.json: hits=36 score=8
- data/protocols/tnf-staff-master-calendar.json: hits=39 score=8
- scripts/protocols/build-staff-master-calendar.cjs: hits=14 score=7
- docs/operations/TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md: hits=6 score=6
- scripts/protocols/cron-governance-gate.cjs: hits=6 score=6
- docs/operations/TNF_CORPORATE_CHAIN_OF_COMMAND_AND_ORDER_OF_OPERATIONS_MANUAL.md:
  hits=5 score=5
- data/protocols/twip-inventory.snapshot.json: hits=5 score=5
- docs/protocols/bridges/tnf-openclaw-schedule-assimilation.yml: hits=4 score=4
- docs/protocols/reports/federation-gate-api-integration-2026-03-18.md: hits=4
  score=4
- docs/protocols/storage/rclone-provider-extension-protocol.md: hits=4 score=4
- docs/operations/tnf-dont-die-workflow-contract.json: hits=6 score=4
- docs/operations/tnf-personal-archaeology-runbook.md: hits=5 score=4
- docs/operations/tnf-self-improvement-workflow-contract.json: hits=8 score=4
- scripts/protocols/twip-conformance.cjs: hits=6 score=4
- docs/protocols/tnf-cron-governance-protocol-v0.1.md: hits=3 score=3
- docs/protocols/twip-universalization-playbook.md: hits=3 score=3
- docs/protocols/reports/federation-gate-operator-dashboard-2026-03-19.md:
  hits=3 score=3
- docs/protocols/reports/handoff-selfprompt-review-2026-03-18.md: hits=3 score=3
- docs/operations/TNF_SUBDIRECTOR_AUTOPILOT_FRONTLOAD_LOOP_2026-03-26.md: hits=3
  score=3

## Suggested Remediation Loop

1. Confirm each critical/high finding has a current business justification.
2. Convert unjustified blockers into dated temporary controls with expiry.
3. Re-run this audit after each policy mutation and compare deltas.
