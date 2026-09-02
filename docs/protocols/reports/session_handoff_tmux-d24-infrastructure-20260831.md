# SESSION_HANDOFF session_handoff_tmux-d24-infrastructure-20260831

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-31T05:34:00.000Z` Handoff ID: `e20ba1a9-3137-43b8-81e1-744792e4ff93`

## Scope

- Branch: `main`
- Head SHA: `c6163f291caed0fde13daf1f52da71526379948f`

## Work Summary

- Reintroduce tmux as TWIP infrastructure: dedicated socket, agent launch wrap,
  idle reaper, TWIP scanner alignment.
- Gate tmux send-keys under D24 via allowlisted `tnf-tmux-inject.cjs` and
  heartbeat pulse integration.
- Enable heartbeat prompt injection opt-in with challenge_rationale and governed
  cron wiring.

## Changed Paths

- apps/relay-server/src/mcp-server.mjs
- data/protocols/system-processes.json
- docs/operations/TNF_SWARM_MASTER_SCHEDULE.md
- docs/operations/TNF_TMUX_MULTIPLEXER_CONVENTION_PLAN.md
- docs/protocols/CHALLENGE_RATIONALE_LOG.md
- docs/protocols/DIRECTIVES.md
- docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md
- docs/protocols/challenge-rationales/2026-08-30-d24-tmux-send-keys.md
- docs/protocols/reports/session_handoff_tmux-d24-infrastructure-20260831.json
- docs/protocols/reports/session_handoff_tmux-d24-infrastructure-20260831.md
- docs/protocols/twip-operator-runbook.md
- docs/tnf-tmux-setup-guide.md
- packages/tnf-cli/src/commands/tmux.ts
- scripts/lib/tnf-terminal-attention.cjs
- scripts/lib/tnf-tmux-inject.cjs
- scripts/lib/tnf-tmux-inject.test.cjs
- scripts/protocols/check-operator-terminal-inviolability.cjs
- scripts/runtime/launch-agent-wrapper.sh
- scripts/runtime/terminal-heartbeat-cron.sh
- scripts/runtime/terminal-heartbeat-pulse.cjs
- scripts/runtime/tnf-tmux.cjs
- scripts/runtime/tnf-tmux.test.cjs
- scripts/start-agent-network.sh

## Next Actions

- Relaunch agent network so new launches pick up tmux wrap on the dedicated
  socket.
- Optionally wrap operator pi sessions under `tnf-o-*` for crash resilience
  (Track 2).
- Wire `tnf tmux` into `packages/tnf-cli/src/cli.ts` if not already registered
  on main.
