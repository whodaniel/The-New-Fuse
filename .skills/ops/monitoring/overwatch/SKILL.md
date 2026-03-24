---
name: overwatch
description: |
  Permanent TNF skill promoted from snapshot for Overwatch Skill.
primary_type: operational
secondary_tags:
  - continuous
category: ops/monitoring
risk_tier: medium
harmful_pattern_detection: false
harmful_pattern_signals:
  - mesh-monitoring
  - state-synchronization
metadata:
  source: snapshot-promotion
  source_snapshot: .agent/skill-bank/snapshots/picoclaw/overwatch-3581432c/SKILL.md
  status: permanent
---
> Promoted from TNF snapshot history into permanent skill inventory.
> Category and risk metadata added for adaptive routing and harmful-pattern recognition.
# Overwatch Skill

Skill for mesh-wide synchronization and monitoring.

## Tools

None.

## Routine

1.  **Poll Worker**: Use `web_fetch` to GET
    `https://tnf-agent-orchestration.bizsynth.workers.dev/handoff/list?limit=10`.
2.  **Verify Tasks**: Read each handoff. Identify any tasks marked as "COMPLETED
    ✅" and update the local `MESH_STATE.json`.
3.  **Conflict Check**: If multiple nodes are assigned the same pending task,
    flag it.
4.  **Reporting**: Update `MESH_REPORT.md` with a summary of the current global
    situation.
