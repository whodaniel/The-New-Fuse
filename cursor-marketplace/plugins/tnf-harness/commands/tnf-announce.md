---
description: >-
  TNF /announce — announce interactive session for local Subdirector dispatch.
  Canonical: .tnf/command/announce.md +
  .agent/skills/tnf-agent-availability-announce
---

Announce this session to the local Subdirector (TNF protocol, not Claude-only).

1. From the TNF repository root:
   ```bash
   tnf agents announce
   ```
   Equivalents: `/announce`, `/availability-announce`, `/dispatchable`.
2. Do **not** use `tnf register --daemon` (offline tombstone).
3. Verify with `tnf list --json` and
   `redis-cli LLEN tnf:direct:sub-director:tnf-cli-agent`.
4. Withdraw with `tnf agents announce --offline`.

Authority (TNF-first):

- `.tnf/command/announce.md`
- `.agent/skills/tnf-agent-availability-announce/SKILL.md`
- `docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md`
