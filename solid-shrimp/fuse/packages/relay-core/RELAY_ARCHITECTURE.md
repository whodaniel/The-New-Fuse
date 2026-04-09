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
│    WebSocket: ws://localhost:3000/ws                            │
│    Health:    http://localhost:3000/health                      │
│    Agents:    http://localhost:3000/agents                      │
│    Channels:  http://localhost:3000/channels                    │
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

Connect to `ws://localhost:3000/ws`

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

| Type                     | Direction              | Description                                   |
| ------------------------ | ---------------------- | --------------------------------------------- |
| `WELCOME`                | Server → Client        | Sent on connection                            |
| `AGENT_REGISTER`         | Client → Server        | Register as an agent                          |
| `AGENT_LIST`             | Both                   | Request/receive agent list                    |
| `AGENT_STATUS`           | Server → Clients       | Agent status change                           |
| `CHANNEL_LIST`           | Both                   | Request/receive channel list                  |
| `CHANNEL_CREATE`         | Client → Server        | Create a new channel                          |
| `CHANNEL_JOIN`           | Client → Server        | Join a channel                                |
| `CHANNEL_LEAVE`          | Client → Server        | Leave a channel                               |
| `MESSAGE_SEND`           | Client → Server        | Send a message                                |
| `MESSAGE_RECEIVE`        | Server → Client        | Receive a message                             |
| `CHANNEL_MESSAGE`        | Server → Client        | Channel broadcast                             |
| `HEARTBEAT`              | Client → Server        | Keep connection alive                         |
| `SUPER_CYCLE_REGISTER`   | Process → Master Clock | Register scheduled process in super-cycle     |
| `SUPER_CYCLE_HEARTBEAT`  | Process → Master Clock | Report scheduled process heartbeat/status     |
| `SUPER_CYCLE_UNREGISTER` | Process → Master Clock | Remove scheduled process from active registry |

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
`ws://localhost:3000/ws`.

### Configuration

- **Background Service**: `apps/chrome-extension/src/v5/background/index.ts`
- **Default URL**: `ws://localhost:3000/ws` (defined in `constants.ts`)

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
| `connection-manager.ts` | `relayUrl: 'ws://localhost:3000/ws'` |
| `popup-neon.js`         | `relayUrl: 'ws://localhost:3000/ws'` |
| `popup-neon.html`       | Default input value updated          |
| `SettingsTab.tsx`       | Default relay URL updated            |
| `BUILD_INSTRUCTIONS.md` | Documentation updated                |

## Programmatic Usage

```typescript
import { TNFRelayServer } from '@the-new-fuse/relay-core';

const relay = new TNFRelayServer(3000);

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

## Super-Cycle Registration (Scheduled Jobs/Cron)

Use the relay-core super-cycle client to register and heartbeat any scheduled
automation process against the TNF Master Clock state:

```bash
cd packages/relay-core

# Register once (for startup)
pnpm run super-cycle:event -- --action register --process-id jules-autonomous-loop --name "Jules Autonomous Loop" --kind cron --owner ci

# Heartbeat each run/tick
pnpm run super-cycle:event -- --action heartbeat --process-id jules-autonomous-loop --status running --result success --metadata '{"source":"cron"}'

# View centralized super-cycle state snapshot
pnpm run super-cycle:status
```

Master Clock writes this into Redis:

- `tnf:master:state` field `superCycle` (snapshot + stats)
- `tnf:master:super-cycle` hash (per-process records)
