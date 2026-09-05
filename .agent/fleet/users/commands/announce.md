---
description: >-
  Announce this interactive TNF session as available for local Subdirector
  dispatch (or withdraw offline). Canonical TNF command — peer CLI mirrors must
  point here.
skill: tnf-agent-availability-announce
---

# /announce — TNF availability announce

Tell the **local Subdirector** (`tnf-cli-agent`) this interactive session is
dispatchable. This is a **TNF** protocol surface, not a Claude-only command.

**Authority**

- Law: `docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md`
- Skill: `.agent/skills/tnf-agent-availability-announce/SKILL.md`
- CLI: `tnf agents announce`
- Script: `scripts/agents/announce-availability.cjs`
- Slash registry: `packages/tnf-cli/src/slashCommands.ts` (`/announce`)

**Do not use** `tnf register --daemon` for interactive availability — it leaves
an offline tombstone.

## Run (from TNF repo root)

```bash
tnf agents announce
# slash (TNF CLI / any runtime that loads TNF slashCommands):
# /announce
# /availability-announce
# /dispatchable
```

Withdraw:

```bash
tnf agents announce --offline
# /announce --offline
```

## Flags

- `--json`
- `--name <name>` (default: env `TNF_AGENT_NAME` or `tnf-<platform>-worker`)
- `--platform <token>` (default: env `TNF_PLATFORM` or auto-detect; not
  hard-bound to Claude)
- `--to <subdirectorId>` (default `tnf-cli-agent`)
- `--capabilities <csv>`

## Verify

```bash
tnf list --json
redis-cli LLEN tnf:direct:sub-director:tnf-cli-agent
```

Peer-runtime mirrors (`.claude/commands`, fleet, Cursor marketplace) are
adapters only — edit this file when behavior changes.
