# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-30T23:10:00.000Z` Handoff ID: `e8c4a1f2-7b3d-4c9e-91aa-2f6d0b8e4c11`

## Repository

- Actual: `whodaniel/tnf-monorepo`
- Canonical TNF source: `whodaniel/tnf-monorepo`
- Origin: `https://github.com/whodaniel/tnf-monorepo.git`
- Branch: `main`
- Head SHA: `63bdacdab65016b7a9be51fbdb83728a9002c9ed` (last pushed). Working
  tree has the full implementation on top of that commit.

## Classification

- Work domain: `core`
- Artifact destination: `oss_runtime`
- Data residency: `product_state`
- Sensitivity: `public`

## Capabilities

- Required: departments, memory, scout-staffing, host-prompt-profiles, cli
- Staffed by: cursor

## Work Summary

- Department tags applied: 196 agents, 326 TNF-owned skills; existing `category`
  values preserved; 533 vendor skills indexed only
- Interactive/`tnf agents run` inject `buildTnfAgentOrientation` (departments,
  remember, host profiles, scout brief)
- LLM tools: `memory_retain`, `memory_recall`, `department_route`
- Host prompt catalog includes Pi (`~/.pi/agent/AGENTS.md`); installer TARGETS
  now manage Pi
- `tnf harness host-profiles` / `tnf scout *` / `tnf department apply` wired;
  command-surface snapshot refreshed (518 paths)
- Scout missions staffed to `tnf-cli-agent` (brief only unless
  `TNF_SCOUT_RUN_AGENT=1`)
- Chronological catalog now matches registry for `tenant-knowledge-scout-sprint`
  and `tnf-recursive-logic-sieve`

## Next Actions

- Commit/push only if the operator asks. Do not use `git commit --no-verify`.
  Authority edits (`AGENTS.md`, `HARNESS_CONFIG.md`) need
  `TNF_AUTHORITY_EDIT_CONFIRM=1`
- Optional: `node scripts/setup/provision-local-cron.cjs` so the 4h scout job
  actually lands in crontab
- Pre-existing crontab drift remains: several crontab process-ids are not in the
  registry (watchdog, staff-role-call, orchestrator-pulse, continuous-qa,
  daily-priority, nightly-maintenance, memory-freshness)
- Absent/advisory hosts: command-code, droid, jules
- Public `The-New-Fuse` PR 161 remains open (publication sync, not this feature)
