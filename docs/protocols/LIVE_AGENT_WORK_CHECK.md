# TNF Live Agent Work Check

`scripts/protocols/live-agent-work-check.cjs` is the shared live-state truth
source for concurrent local agent work.

Run it before an agent claims fleet success, commits multi-agent work, resumes
from another agent's handoff, or reports that TNF is healthy:

```bash
pnpm run tnf:live:agents:write
```

The checker writes:

- `docs/protocols/reports/LIVE_AGENT_WORK_CHECK_LATEST.json`
- `docs/protocols/reports/LIVE_AGENT_WORK_CHECK_LATEST.md`
- `~/.tnf/live-agent-work-check-latest.json`

## Verdicts

- `PROCEED`: no blocking live-state gaps were observed.
- `CAUTION`: work may continue, but the report contains warnings that must be
  named in the handoff.
- `BLOCK`: do not start new autonomous work or claim fleet health until the
  critical findings are repaired or explicitly accepted by the operator.

## Covered State

- Git branch, dirty tree, stashes, index lock, and active git/husky operations.
- Local agent processes for Codex, Cursor, Antigravity, Kilo, Gemini, OpenCode,
  Claude, Local Subdirector, and master heartbeat.
- Launchd state for Local Subdirector, master heartbeat, fleet health,
  reconciliation, Redis, API, gateway, and voice watchdog labels.
- TNF state anchors for Local Subdirector, master heartbeat, core fleet, and
  session handoff.
- Redis availability, master task queues, and agent registry presence.
- Full-auto recency and protected token presence.

## Operating Rule

No agent output propagates as current TNF state until this checker confirms it.
When agents disagree, the latest `LIVE_AGENT_WORK_CHECK_LATEST.*` report wins
over conversational summaries.
