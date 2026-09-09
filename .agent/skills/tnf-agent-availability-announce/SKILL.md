---
name: tnf-agent-availability-announce
category: tnf-platform
department: tech
description: >-
  Announce an interactive TNF agent session as available for local Subdirector
  dispatch (or withdraw offline). Use for any runtime on the TNF harness
  (Cursor, Claude, Pi, Codex, Kilo, …) when the operator wants Subdirector
  dispatch, or when /announce is invoked. Canonical skill under .agent/skills —
  not a Claude-only surface. Do not use tnf register --daemon for this.
primary_type: protocol
risk_tier: low
---

# TNF Agent Availability Announce

Tell the **local Subdirector** (`tnf-cli-agent`) that this interactive session
is dispatchable — without pretending to be a long-running daemon.

This skill is **TNF-canonical** (`.agent/skills/…`). Peer runtimes may mirror
it; edit here first.

## When to use

- Session start: operator wants you on the swarm for delegated work.
- Operator says “announce yourself”, “available for dispatch”, or `/announce`.
- After a context reset, if you were previously dispatchable.
- Session end / handoff: `/announce --offline`.

## When NOT to use

- Do **not** use `tnf register --daemon` for interactive availability — it
  registers then `cleanup()` marks the row **offline** (tombstone).
- Do **not** claim role `sub-director` unless this process _is_ the local
  Subdirector.
- Do **not** put personal/proprietary payloads in announce content.

## Authority

1. `docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md`
2. `docs/protocols/AGENT_BUS_CONTRACT.md` (v1 frames)
3. Durable drain: `tnf:direct:sub-director:tnf-cli-agent` (see
   `packages/tnf-cli/src/services/DispatchGuard.ts`)
4. Canonical command: `.tnf/command/announce.md`
5. Slash registry: `packages/tnf-cli/src/slashCommands.ts`

## Procedure (Inspect → Act → Verify)

### 1. Orient

From the TNF repository root, Redis must answer `PONG`.

### 2. Announce available

```bash
tnf agents announce
# equivalents:
# /announce
# node scripts/agents/announce-availability.cjs
```

Optional:

```bash
tnf agents announce --json \
  --name "$TNF_AGENT_NAME" \
  --platform "$TNF_PLATFORM" \
  --capabilities 'code_edit,frontend,protocol,personal_intelligence,cli,review'
```

Defaults auto-detect from `TNF_*` env / host runtime (not hard-coded to Claude
or Cursor).

### 3. Verify

```bash
tnf list --json   # your row: status idle/active, fresh lastSeen, dispatchable
redis-cli LLEN tnf:direct:sub-director:tnf-cli-agent
# receipt under ~/.tnf/receipts/availability-announce-*.json
```

### 4. Stay live

Re-run `/announce` (or `tnf agents announce`) while the session remains willing
to take work so `lastSeen` stays inside the Subdirector liveness window (default
expected cadence 900s).

### 5. Withdraw

```bash
tnf agents announce --offline
# /announce --offline
```

## Slash commands

| Slash                    | CLI                   |
| ------------------------ | --------------------- |
| `/announce`              | `tnf agents announce` |
| `/availability-announce` | same                  |
| `/dispatchable`          | same                  |

Canonical command file: `.tnf/command/announce.md`  
Peer adapters only: `.claude/commands/announce.md`, fleet, Cursor marketplace.

## Related

- Local Subdirector cycle: `scripts/agents/subdirector-local-cli-agent-cycle.sh`
- Skill sibling: `tnf-harness-protocol` (Turn Zero V2 boot)
- Wrong path: `tnf register --daemon` (offline tombstone)
