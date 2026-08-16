# Deep Thought Cycle — Local Subdirector Watchdog Routing — 2026-08-16T21:46Z

## Goal

Critical local watchdogs report to Local Subdirector (`tnf-cli-agent`) instead
of Super Director.

## Act

- `broker-agent.ts`: local tenant/watchdog detection;
  `reviewAuthority: local_subdirector`; escalate to
  `tnf:subdirector:review:pending` + `tnf:direct:sub-director:<alias>` queues.
- `chronological-dispatch.cjs`: stamp local tenant scope, cumulativeId, allow
  gateDecisions, `reportTo: tnf-cli-agent`.

## Verify

- Sample `tenant-loop-watchdog-verify-*` → log: Escalated to Local Subdirector
  (tnf-cli-agent)
- `tnf:subdirector:review:pending` contains reviewAuthority=local_subdirector
- Direct queue `tnf:direct:sub-director:tnf-cli-agent` received report envelope
- No Director escalation for that sample
