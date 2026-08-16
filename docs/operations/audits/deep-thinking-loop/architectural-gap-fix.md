# Architectural Gap Fix — Pending Tasks → Realtime + Local Subdirector

[CLASS:PRIME] [STATUS:RESOLVED] [DOC_TYPE:AUDIT_FIX] [UPDATED:2026-08-16T22:10Z]

## Original Gap

- `tnf:master:tasks:pending` accumulated realtime-eligible work
- Broker only consumes `tnf:master:tasks:realtime`
- Critical local watchdogs escalated to Super Director review

## Resolution (2026-08-16)

1. **Promote + prevent refill**
   - `scripts/protocols/promote-pending-to-realtime.cjs`
   - `chronological-dispatch.cjs` routes realtime-eligible lanes to realtime and
     no longer dual-writes those into pending
2. **Local authority**
   - `broker-agent.ts` escalates local tenant/watchdog criticals to Local
     Subdirector (`tnf-cli-agent`) via `tnf:subdirector:review:pending` +
     `tnf:direct:sub-director:*`
3. **Consume**
   - `drain_local_subdirector.py` + `subdirector-local-cli-agent-cycle.sh` (cron
     `*/5`)

## Rollup

See `CLI_AGENT_CONTROL_PLANE_CYCLE_2026-08-16.md` in this directory.
