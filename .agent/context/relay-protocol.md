# TNF Relay Protocol

## Overview

The TNF Relay is a WebSocket-based real-time message bus that enables
low-latency communication between agents, the orchestrator, and external clients
(like web UIs or CLI tools). It serves as the "nervous system" of The New Fuse.

## Connection Details

- **URL**: `ws://localhost:3001/ws` (Default)
- **Protocol**: WebSocket (RFC 6455)
- **Serialization**: JSON

## Message Envelope

All messages sent to or received from the relay follow this envelope structure:

```json
{
  "type": "MESSAGE_TYPE",
  "source": "AGENT_ID_OR_CLIENT_ID",
  "target": "OPTIONAL_TARGET_ID",
  "payload": {
    // Message-specific data
  }
}
```

## Core Message Types

### 1. Agent Registration

Sent immediately after connection to identify the agent.

**Direction**: Client -> Relay

```json
{
  "type": "AGENT_REGISTER",
  "source": "agent-123",
  "payload": {
    "agent": {
      "id": "agent-123",
      "name": "Backend Specialist",
      "role": "coder",
      "capabilities": ["node", "typescript", "postgres"]
    }
  }
}
```

### 2. Joining Channels

Subscribe to a broadcast channel.

**Direction**: Client -> Relay

```json
{
  "type": "CHANNEL_JOIN",
  "source": "agent-123",
  "payload": {
    "channelId": "tnf-global"
  }
}
```

### 3. Sending Messages

Broadcast a message to a channel.

**Direction**: Client -> Relay

```json
{
  "type": "MESSAGE_SEND",
  "source": "agent-123",
  "channel": "tnf-global",
  "payload": {
    "content": "Task #45 completed successfully",
    "messageType": "text",
    "metadata": {
      "taskId": "45",
      "status": "success"
    }
  }
}
```

### 4. Receiving Messages

Messages arriving from the relay.

**Direction**: Relay -> Client

```json
{
  "type": "CHANNEL_MESSAGE",
  "source": "agent-456",
  "channel": "tnf-global",
  "payload": {
    "content": "Acknowledged. Starting verification.",
    "from": "agent-456",
    "timestamp": 1709392800000
  }
}
```

## System Events

The relay also emits system events:

- `AGENT_LIST`: Sent on connection or when agents join/leave.
- `CHANNEL_LIST`: Sent on connection or when channels change.
- `ERROR`: Sent when an operation fails.

## Best Practices

1.  **Always Register**: The relay may drop messages from unregistered
    connections.
2.  **Heartbeats**: The WebSocket connection serves as a liveness check. If the
    connection drops, the agent is considered offline by the relay (though the
    Orchestrator uses a separate Redis-based heartbeat).
3.  **Reconnect Strategy**: Implement exponential backoff for reconnection
    logic.
