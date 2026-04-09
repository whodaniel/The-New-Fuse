# Overwatch Heartbeat

1.  **Poll Active Sessions**: Fetch the latest active sessions from the local
    OpenClaw gateway (`http://127.0.0.1:18789/api/sessions`).
2.  **Verify Mesh Sync**: For each active session, fetch the latest handoff from
    the Orchestration Worker
    (`https://tnf-agent-orchestration.bizsynth.workers.dev/handoff/latest?sessionKey=...`).
3.  **Detect Divergence**: Check if any node is working on a mission that
    doesn't match the latest handoff for that session.
4.  **Update Report**: Write the results to `MESH_REPORT.md`.
5.  **Billing Safety Check**: Verify that the `primary` model for each instance
    is correctly set to a free/stable provider.
