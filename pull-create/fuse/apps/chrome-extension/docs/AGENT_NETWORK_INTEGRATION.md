# TNF Chrome Extension - Agent Network Integration

## Overview

The Chrome Extension now has full integration with the TNF Redis agent network,
allowing browser-based AI interactions to participate in multi-agent workflows.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TNF Agent Network                            │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Antigravity │  │   Claude    │  │   Gemini    │              │
│  │ Orchestrator│  │   Broker    │  │   Worker    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                       │
│         └────────────────┼────────────────┘                       │
│                          │                                        │
│                    ┌─────▼─────┐                                  │
│                    │   Redis   │                                  │
│                    │  Pub/Sub  │                                  │
│                    └─────┬─────┘                                  │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Redis WS   │
                    │   Bridge    │
                    │  Server     │
                    └──────┬──────┘
                           │
                    WebSocket Connection
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   Chrome    │ │    Tauri    │ │   Web App   │
    │  Extension  │ │   Desktop   │ │  (Future)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## Components

### 1. Redis Bridge (`src/federation/RedisBridge.ts`)

The core client that connects the extension to the agent network:

- **Connection Management**: Auto-reconnect, heartbeat
- **Agent Registration**: Joins network with capabilities
- **Message Handling**: Routes messages to/from Redis
- **Task Execution**: Handles browser automation tasks

```typescript
import { redisBridge } from './federation';

// Connect
await redisBridge.connect();

// Send message
redisBridge.sendMessage('Hello from browser!');

// Listen for messages
redisBridge.onMessage('message', (msg) => {
  console.log('Received:', msg.content);
});
```

### 2. Redis WebSocket Bridge Server (`scripts/redis-ws-bridge.cjs`)

Since Chrome extensions can't directly connect to Redis, this server bridges
WebSocket connections:

```bash
# Start the bridge server
node scripts/redis-ws-bridge.cjs

# Server runs at: ws://localhost:3000/redis-bridge
# Health check: http://localhost:3000/health
# Agent list: http://localhost:3000/agents
```

### 3. Agent Network Panel (`src/popup/components/AgentNetworkPanel.ts`)

UI component for the extension popup showing:

- Connection status
- List of connected agents
- Message input/output
- Direct messaging to specific agents

## Capabilities

The extension registers with these capabilities:

- `browser_automation` - Navigate, click, type
- `chat_interaction` - Interact with AI chat pages
- `tab_management` - Manage browser tabs
- `screen_capture` - Capture screenshots
- `element_selection` - Select page elements

## Message Types

| Type               | Direction | Description               |
| ------------------ | --------- | ------------------------- |
| `AGENT_REGISTER`   | Out       | Register as agent         |
| `AGENT_MESSAGE`    | Both      | General message           |
| `AGENT_COMMAND`    | In        | Command from orchestrator |
| `TASK_ASSIGNMENT`  | In        | Task from workflow        |
| `CONTEXT_REQUEST`  | In        | Request browser context   |
| `CONTEXT_RESPONSE` | Out       | Browser context data      |

## Task Types

The extension can execute these browser tasks:

| Task Type    | Description               |
| ------------ | ------------------------- |
| `navigate`   | Go to URL                 |
| `click`      | Click element             |
| `type`       | Type into input           |
| `screenshot` | Capture visible tab       |
| `extract`    | Extract text from element |
| `chat_input` | Send message to AI chat   |

## Usage Example

### Full Multi-Agent Workflow

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start WS Bridge
node scripts/redis-ws-bridge.cjs

# Terminal 3: Start Antigravity (Orchestrator)
node scripts/antigravity-redis-wrapper.cjs

# Terminal 4: Load Chrome Extension
# - Go to chrome://extensions
# - Load unpacked: apps/chrome-extension/dist

# In Antigravity terminal, run workflow:
antigravity> code-review
```

The extension will:

1. Receive task assignments
2. Execute browser actions (screenshot, extract, etc.)
3. Send results back to the workflow

## Configuration

```typescript
const config: RedisBridgeConfig = {
  relayUrl: 'ws://localhost:3000/redis-bridge',
  agentName: 'chrome-browser',
  agentRole: 'participant',
  capabilities: ['browser_automation', 'chat_interaction'],
  autoReconnect: true,
  reconnectInterval: 5000,
};
```

## Files Added

| File                                        | Description                       |
| ------------------------------------------- | --------------------------------- |
| `src/federation/RedisBridge.ts`             | WebSocket client for Redis bridge |
| `src/popup/components/AgentNetworkPanel.ts` | Agent list UI component           |
| `scripts/redis-ws-bridge.cjs`               | WebSocket-to-Redis bridge server  |

## Next Steps

1. **Test Integration**: Verify full workflow with all agents
2. **Add More Tasks**: Implement additional browser tasks
3. **UI Polish**: Enhance popup with better agent visualization
4. **Error Handling**: Add robust error handling and retries
5. **Documentation**: Create user-facing docs
