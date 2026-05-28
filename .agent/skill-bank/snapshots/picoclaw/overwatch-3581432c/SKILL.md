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
