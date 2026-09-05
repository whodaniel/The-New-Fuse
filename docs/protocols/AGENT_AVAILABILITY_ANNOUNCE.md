# TNF Agent Availability Announce — Session Workers to Local Subdirector

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

**Status:** Active  
**Depends on:** `docs/protocols/AGENT_BUS_CONTRACT.md` (v1), DACC role taxonomy,
local Subdirector drain (`tnf:direct:sub-director:<id>`)  
**Executable:** `scripts/agents/announce-availability.cjs`  
**Operator path:** `tnf agents announce` (wraps the script)  
`node scripts/agents/announce-availability.cjs` remains valid.

## Purpose

Interactive coding sessions (Cursor, Claude Code, Pi, Codex, Kilo, …) need a
**durable, honest way** to tell the local Subdirector they are available for
delegated tasks — without pretending to be a long-running daemon.

This is **not** a second bus. It is a constrained use of Agent Bus Contract v1
frames + registry rows.

## Gap this closes

`tnf register --daemon` registers, then `cleanup()` marks the row `offline`.
That leaves a tombstone, not a dispatchable worker. Cron workers refresh via
cycle scripts; interactive sessions had no equivalent announce primitive.

## Naming law

- **Local Subdirector** consumer ids (durable LIST drain): `tnf-cli-agent`,
  `tnf-local-subdirector`, `sub-director` (see `DispatchGuard.ts`
  `QUEUE_DRAINED_RECIPIENTS`).
- Announcer role: normally `worker` (never claim `sub-director` unless this
  process _is_ the local Subdirector).
- Platform: use the real host taxonomy token (`cursor`, `claude`, `pi`, …).

## Announce procedure

1. **ORIENT** — Redis reachable; know local Subdirector id (default
   `tnf-cli-agent`).
2. **CLASSIFY** — This is a `status` frame with
   `metadata.event = agent_available_for_dispatch`. Not a `task`.
3. **REGISTER/UPSERT** — Stable agent id (do **not** mint a new
   `agent_<name>_<Date.now()>` on every announce). Upsert `tnf:agent-registry`
   with:
   - `status: 'idle'` (or `'active'` if already working)
   - `isOnline: true` semantics via fresh `lastSeen`
   - `currentLoad` / `maxLoad` (default 0 / 1)
   - `capabilities[]` (honest, bounded)
   - `expectedCadenceSec` (how often this session will re-announce; default 900)
   - `dispatchable: true`
4. **PROPAGATE** — Broadcast `status` on the agents/conversations channel (bus
   contract `type: status`).
5. **NOTIFY Subdirector** — Direct `status` to the local Subdirector id so the
   durable LIST lane receives it (`tnf send -t tnf-cli-agent` equivalent / LPUSH
   `tnf:direct:sub-director:<id>`). Prefer durable queue write; ack is optional.
6. **VERIFY** — `tnf list --json` shows the announcer live/idle with fresh
   `lastSeen`; Subdirector queue length increased or ack received.

## Re-announce / offline

- Re-run announce when the session is still willing to take work (keeps
  `lastSeen` inside the Subdirector liveness window).
- On session end: set `status: 'offline'`, `dispatchable: false`, refresh
  `lastSeen`, optional direct notify. Do **not** delete historical rows unless
  using an ephemeral one-shot sender path (`deregister`).

## Compliance notes

- Frames MUST satisfy Agent Bus Contract v1 field shapes.
- Do not auto-increment load on announce (announce is not a `task` frame).
- Do not bypass Turn Zero for mutations outside registry/bus traffic.
- Personal / proprietary payloads stay out of announce content — ids,
  capabilities, and readiness only.

## Related

- `docs/protocols/AGENT_BUS_CONTRACT.md`
- `packages/tnf-cli/src/services/DispatchGuard.ts`
- `scripts/agents/subdirector-local-cli-agent-cycle.sh`
- `.claude/agents/sub-director.md`
