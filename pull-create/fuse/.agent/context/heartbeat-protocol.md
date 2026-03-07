# TNF Heartbeat Protocol

## Overview

The Heartbeat Protocol ensures the **Orchestrator** knows which agents are
active, what they are working on, and their current health status. It is the
primary mechanism for detecting stalled or failed agents and triggering
auto-recovery.

## Mechanism

Agents report their status via two channels:

1.  **Registration API**: Initial handshake to define capabilities.
2.  **Redis Pub/Sub**: High-frequency status updates (every ~5 seconds).

## 1. Initial Registration

**Endpoint**: `POST http://localhost:3000/api/orchestrator/register-agent`
**Content-Type**: `application/json`

```json
{
  "agentId": "backend-specialist-01",
  "role": "coder",
  "expectedResponseTime": 60000 // Milliseconds before considered stalled
}
```

## 2. Heartbeat Pulse (Redis)

**Channel**: `agent:heartbeat` **Frequency**: Every 5 seconds (configurable)

**Payload Structure**:

```json
{
  "agentId": "backend-specialist-01",
  "timestamp": "2024-03-02T12:00:00.000Z", // ISO 8601
  "status": "active", // active | idle | stalled | failed
  "currentTask": {
    "id": "task-123",
    "type": "code-generation",
    "startedAt": "2024-03-02T11:55:00.000Z"
  },
  "queueSize": 2 // Number of pending tasks in inbox
}
```

## Status Definitions

| Status    | Description                                  | Orchestrator Action       |
| --------- | -------------------------------------------- | ------------------------- |
| `active`  | Processing a task normally                   | None (Update dashboard)   |
| `idle`    | Waiting for work, inbox empty                | Assign pending tasks      |
| `stalled` | Has task but no progress updates > threshold | Log warning, maybe retry  |
| `failed`  | Explicit error reported or crashed           | Trigger recovery workflow |

## Stagnation Detection

The Orchestrator monitors the `timestamp` of the last heartbeat. If
`now - lastHeartbeat > expectedResponseTime`, the agent is marked as **OFFLINE**
or **UNRESPONSIVE**.

## Implementation Guide (Node.js)

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

async function sendHeartbeat() {
  const payload = JSON.stringify({
    agentId: process.env.AGENT_ID,
    timestamp: new Date(),
    status: getCurrentStatus(),
    currentTask: taskManager.getCurrentTask(),
    queueSize: taskManager.getPendingCount(),
  });

  await redis.publish('agent:heartbeat', payload);
}

// Start loop
setInterval(sendHeartbeat, 5000);
```
