---
description:
  'Run TNF Turn Zero — orient from state, ledger, and handoff artifacts, then
  await confirmation'
---

Execute the TNF Turn Zero orientation for the current repository.

Steps:

1. Read, if present:
   - `docs/protocols/TURN_ZERO_MANDATE.md`
   - `docs/protocols/LIVING_STATE.md`
   - `docs/protocols/AGENT_STATUS_LEDGER.md`
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (or `.md` fallback)
2. Check repo state: current branch, ahead/behind `origin`, dirty file count.
3. Emit a compact orientation briefing:
   - Handoff id + timestamp, branch, head SHA
   - Current directive
   - Open and operator-gated tasks
   - Any P0 or `session-stale` flags
4. Stop and await operator confirmation before any code change, unless the
   operator has already requested implementation.

If a local `tnf` CLI is available, you may run `tnf onboard` and
`node scripts/cursor/tnf-cursor-harness-onboard.cjs` to automate boot. This
command is read-only: do not edit, commit, or kill processes.
