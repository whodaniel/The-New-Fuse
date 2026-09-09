# Fleet Sweep Discipline Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

**Prompt hardening (the behavioral fix).**
`scripts/runtime/terminal-heartbeat-pulse.cjs`'s injected template now tells
every woken session: routine sweeps must not stage source code (no `git add -A`
/ `git commit -a`, never `packages/**/src`, `scripts/`, `apps/`, `.husky/`, or
source files by extension); commit only deliberately-written data/docs/reports
by explicit path; behavioral changes belong on task branches; on a zero-diff or
type-broken tree, stop and report rather than committing.

**Governance record.** Constraints 6 & 7 added as "Sweep Discipline" under
`docs/core/AGENTS.md`'s Autonomous Commits and Pushes section (authority-surface
edit with operator approval this session).

**Autopilot audit.** `subdirector-autopilot-loop.cjs` writes only under `~/.tnf`
(lock dir, payload history, signal file) — not the truncation agent. It was the
heartbeat-woken interactive sessions that truncated sources. Service re-loaded
into launchd; `state=running`.

**False alarms cleared.** `com.tnf.master-reconciliation` "failed: exit 1" is
`tnf-launchd-guard` preflight-denying on load-average (21.5) with correct
backoff; relay-monitor SIGTERM is the watchdog shedding load. Both self-recover
as load drops — resource governance working as designed.

Mechanical layer (`zero-file-guard.cjs`) shipped earlier this session blocks the
truncation shape at commit time regardless of prompt compliance.

## Next Actions

- Watch the next few fleet routine commits: sweeps should now carry only
  data/docs/report paths.
- Re-check services once machine load subsides; reconciliation should
  self-recover.
- Do not push without a separate explicit publication instruction.
