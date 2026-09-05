---
description:
  'Announce this interactive session as available for local Subdirector dispatch
  (TNF AGENT_AVAILABILITY_ANNOUNCE)'
---

Announce this session to the local Subdirector so it can delegate tasks here.

1. From the TNF repository root, run:
   ```bash
   tnf agents announce
   ```
   Equivalents: `/announce`, `/availability-announce`, `/dispatchable`.
2. Do **not** use `tnf register --daemon` (leaves an offline tombstone).
3. Verify with `tnf list --json` and
   `redis-cli LLEN tnf:direct:sub-director:tnf-cli-agent`.
4. Re-announce while still willing to take work; withdraw with
   `tnf agents announce --offline`.

Authority:

- `docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md`
- Skill: `.agent/skills/tnf-agent-availability-announce/SKILL.md`
