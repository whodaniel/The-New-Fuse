---
description: 'Check the status and metrics of a registered agent'
category: 'agent-management'
---

Retrieve comprehensive status information and performance metrics for a
registered agent.

**Endpoint**: GET /api/agent-registry/agents/:agentId/status

**Parameters**:

- Agent ID: $1

**Example Usage**:

```
/agent-status "agent-abc123"
```

**Response includes**:

- Agent ID and name
- Registration timestamp
- Last heartbeat (30s intervals)
- Current status (online, offline, busy)
- Capabilities and versions
- Performance metrics:
  - Tasks completed
  - Average response time
  - Success rate
  - Error count
- Resource usage
- Onboarding status (6 steps)

**Heartbeat System**:

- Agents send heartbeat every 60 seconds
- Marked offline after 90 seconds of no heartbeat
- Automatic cleanup of stale agents
