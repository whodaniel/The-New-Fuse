---
description:
  'Announce this interactive session as available for local Subdirector dispatch'
category: 'agent-management'
skill: tnf-agent-availability-announce
---

Announce this interactive coding session to the **local Subdirector** so it can
delegate tasks to you.

**Do not use** `tnf register --daemon` for this — it leaves an offline
tombstone. Use the availability announce path instead.

## Run

From the TNF repository root:

```bash
tnf agents announce
```

Aliases / slash:

```text
/announce
/availability-announce
/dispatchable
```

Withdraw when the session ends:

```bash
tnf agents announce --offline
# or: /announce --offline
```

## Useful flags

- `--json` — machine-readable receipt
- `--name <name>` — display name (default `Cursor-Composer`)
- `--platform <platform>` — taxonomy token (`cursor`, `claude`, `pi`, …)
- `--to <agentId>` — Subdirector id (default `tnf-cli-agent`)
- `--capabilities <list>` — honest capability tokens

## Verify

```bash
tnf list --json | rg -i 'cursor|Composer|dispatchable'
redis-cli LLEN tnf:direct:sub-director:tnf-cli-agent
```

## Authority

- Law: `docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md`
- Bus: `docs/protocols/AGENT_BUS_CONTRACT.md`
- Skill: `.agent/skills/tnf-agent-availability-announce/SKILL.md`
- Script: `scripts/agents/announce-availability.cjs`
