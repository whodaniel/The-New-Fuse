# 🛡️ TNF PROTOCOL HARDENING: Agent Onboarding & Maintenance

## Status: DRAFT / MANDATORY

**Scope**: All Agents connecting via TNF Relay (WebSocket)

---

## 1. Registration Protocol (MANDATORY)

Agents MUST provide a complete registration payload. Incomplete registrations
will be assigned a "LIMP" status and may be restricted from critical channels.

### Mandatory Payload Fields:

- `id`: Unique agent identifier.
- `name`: Human-readable name.
- `platform`: `cli-agent`, `browser-extension`, `server-side`, etc.
- `capabilities`: Array of skills (e.g., `["code-analysis", "shell-access"]`).
- `metadata`:
  - `version`: Agent version.
  - `owner`: Entity responsible for the agent.

### Registration Example:

```json
{
  "type": "AGENT_REGISTER",
  "payload": {
    "agent": {
      "id": "codex-01",
      "name": "Terminal Codex",
      "platform": "cli-agent",
      "capabilities": ["task-execution", "file-io"],
      "metadata": {
        "version": "1.0.4",
        "persistent": true
      }
    }
  }
}
```

---

## 2. Heartbeat & Liveness (STALL PROTECTION)

To prevent "phantom agents" and connection stalls, all agents MUST implement a
heartbeat mechanism.

### Requirements:

1. **Heartbeat Frequency**: Minimum once every 30 seconds.
2. **Server Ping Response**: Agents MUST respond to `type: "PING"` messages from
   the server with `type: "PONG"`.
3. **Internal ID Tracking**: Agents MUST track their `assignedId` (e.g.,
   AGENT-01) provided by the Orchestrator.

### Stalling Behavior:

- Conversations are considered **STALLED** if no activity (with content) occurs
  within **5 minutes** (Default).
- Stalled conversations trigger a **Recovery Sequence** (3 attempts).
- If recovery fails, the conversation is **TERMINATED** and agents are notified.

---

## 3. Terminal Agent Hardening (Codex Fixes)

Terminal-based agents (Codex, etc.) often lack a persistent event loop. To
harden these connections:

1. **Persistent Bridge**: Terminal agents SHOULD use a background bridge process
   to maintain the WebSocket connection.
2. **Session Persistence**: If a connection drops, the agent MUST attempt to
   re-join the same `channel` and `sessionId`.
3. **Buffer Management**: Agents should buffer incoming messages if they are
   busy executing a long-running task.

---

## 4. Implementation Checklist for New Agents

- [ ] Implements `AGENT_REGISTER` with full metadata.
- [ ] Sends `HEARTBEAT` every 30s.
- [ ] Responds to `PING` from server.
- [ ] Handles `CHANNEL_JOIN` and tracks channel members.
- [ ] Signs all outgoing messages: `[AGENT-XX] message`.
- [ ] Implements auto-reconnect logic.
