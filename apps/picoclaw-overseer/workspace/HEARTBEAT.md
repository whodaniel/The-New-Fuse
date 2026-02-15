# Overwatch Heartbeat

1.  **Poll Worker**: Run `web_fetch` on
    `https://tnf-agent-orchestration.bizsynth.workers.dev/handoff/list?limit=5`.
2.  **Verify Mesh Sync**: Check if the latest missions in the handoffs align
    with the tasks assigned to the current node.
3.  **Update Report**: Write the summary to `MESH_REPORT.md`.
4.  **Signal Health**: If all is synced, emit a "Mesh Synced" event.
