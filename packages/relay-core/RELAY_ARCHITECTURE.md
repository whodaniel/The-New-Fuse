# TNF Relay System - Unified Architecture

## Overview

The TNF Relay is now properly integrated into the `@the-new-fuse/relay-core`
package, providing a unified WebSocket-based communication layer for all agents
in The New Fuse ecosystem.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TNF RELAY SERVER                           │
│                (packages/relay-core)                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Agents    │  │  Channels   │  │   Message Router        │  │
│  │   Registry  │  │   Manager   │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  Endpoints:                                                     │
│    WebSocket: ws://localhost:3001/ws                            │
│    Health:    http://localhost:3001/health                      │
│    Agents:    http://localhost:3001/agents                      │
│    Channels:  http://localhost:3001/channels                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
   │ Chrome Ext v6 │ │ VSCode Ext    │ │ Electron App  │
   │ (Fuse Connect)│ │               │ │               │
   └───────────────┘ └───────────────┘ └───────────────┘
```

## Starting the Relay

### From Project Root

```bash
# Quick start
pnpm relay:start

# Or via turbo
pnpm relay
```

### From relay-core Package

```bash
cd packages/relay-core
pnpm run relay
```

### Custom Port

```bash
PORT=3002 pnpm relay:start
```

## WebSocket Protocol

### Connection

Connect to `ws://localhost:3001/ws`

### Message Format

```typescript
interface ProtocolMessage {
  id?: string; // Auto-generated if not provided
  type: string; // Message type
  source?: string; // Agent ID
  channel?: string; // Channel ID for channel messages
  payload?: unknown; // Message payload
  timestamp?: number; // Auto-set if not provided
}
```

### Message Types

| Type              | Direction        | Description                  |
| ----------------- | ---------------- | ---------------------------- |
| `WELCOME`         | Server → Client  | Sent on connection           |
| `AGENT_REGISTER`  | Client → Server  | Register as an agent         |
| `AGENT_LIST`      | Both             | Request/receive agent list   |
| `AGENT_STATUS`    | Server → Clients | Agent status change          |
| `CHANNEL_LIST`    | Both             | Request/receive channel list |
| `CHANNEL_CREATE`  | Client → Server  | Create a new channel         |
| `CHANNEL_JOIN`    | Client → Server  | Join a channel               |
| `CHANNEL_LEAVE`   | Client → Server  | Leave a channel              |
| `MESSAGE_SEND`    | Client → Server  | Send a message               |
| `MESSAGE_RECEIVE` | Server → Client  | Receive a message            |
| `CHANNEL_MESSAGE` | Server → Client  | Channel broadcast            |
| `HEARTBEAT`       | Client → Server  | Keep connection alive        |

### Agent Registration

```json
{
  "type": "AGENT_REGISTER",
  "source": "my-agent-id",
  "payload": {
    "agent": {
      "id": "my-agent-id",
      "name": "My Agent",
      "platform": "chrome-extension",
      "capabilities": ["chat-injection", "dom-reading"],
      "channels": ["general"]
    }
  }
}
```

### Sending Messages

```json
{
  "type": "MESSAGE_SEND",
  "source": "sender-agent-id",
  "payload": {
    "to": "target-agent-id", // or "broadcast"
    "content": "Hello!",
    "messageType": "text"
  }
}
```

### Channel Message

```json
{
  "type": "MESSAGE_SEND",
  "source": "sender-agent-id",
  "channel": "general",
  "payload": {
    "to": "broadcast",
    "content": "Hello channel!",
    "messageType": "text"
  }
}
```

## Chrome Extension Integration

The Chrome Extension v6 automatically connects to the relay at
`ws://localhost:3001/ws`.

### Configuration

- **Background Service**: `apps/chrome-extension/src/v5/background/index.ts`
- **Default URL**: `ws://localhost:3001/ws` (defined in `constants.ts`)

### Native Messaging Host

The native messaging host can start the relay from the extension:

- **Location**: `apps/chrome-extension/src/v5/native-host/`
- **Command**: `pnpm run relay` in `packages/relay-core`

## Files Reference

| File                                                          | Purpose              |
| ------------------------------------------------------------- | -------------------- |
| `packages/relay-core/src/standalone-relay.ts`                 | Main relay server    |
| `packages/relay-core/src/index.ts`                            | Package exports      |
| `apps/chrome-extension/src/v5/background/index.ts`            | Extension connection |
| `apps/chrome-extension/src/v5/shared/constants.ts`            | Relay URL config     |
| `apps/chrome-extension/src/v5/native-host/tnf-native-host.js` | Service control      |

## Alignment Fixes Applied

| File                    | Change                               |
| ----------------------- | ------------------------------------ |
| `connection-manager.ts` | `relayUrl: 'ws://localhost:3001/ws'` |
| `popup-neon.js`         | `relayUrl: 'ws://localhost:3001/ws'` |
| `popup-neon.html`       | Default input value updated          |
| `SettingsTab.tsx`       | Default relay URL updated            |
| `BUILD_INSTRUCTIONS.md` | Documentation updated                |

## Programmatic Usage

```typescript
import { TNFRelayServer } from '@the-new-fuse/relay-core';

const relay = new TNFRelayServer(3001);

// Event handlers
relay.on('agent:registered', (agent) => {
  console.log('Agent joined:', agent.name);
});

relay.on('agent:disconnected', ({ agentId }) => {
  console.log('Agent left:', agentId);
});

relay.on('message', (message) => {
  console.log('Message:', message);
});

// Start
await relay.start();

// Get state
const agents = relay.getAgents();
const channels = relay.getChannels();

// Stop
await relay.stop();
```
