# TNF Harness Framework - Comprehensive Documentation

## Overview

The TNF Harness Framework is a deterministic protocol layer that provides
secure, observable, and verifiable agent operations across all TNF systems
including browser control surfaces, desktop applications, and backend services.

## Core Architecture

### The Three Layers (Based on TNF Entity ID Taxonomy)

```
┌─────────────────────────────────────────────────────────────┐
│                    THE NEW FUSE SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   THE CORE   │───▶│   THE HARNESS │───▶│ THE CAPABILITY│   │
│  │ (MoE Engine) │    │  (Weights)   │    │   (Tools/MCP) │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│
│  Gemini/Claude/Ollama    Prompts/Directives    Browser/Relay/Disk
│                         Skills/Policies       Audio/Vision/Redis
└─────────────────────────────────────────────────────────────┘
```

## The Harness Protocol

### 1. Inspect → Act → Verify Pattern

Every operation follows this fundamental pattern:

**INSPECT**: Read current state before acting

- Check browser platform and capabilities
- Verify federation connection and gateway health
- Confirm permissions and gate decisions
- Read agent registry and channel status

**ACT**: Execute with intent and logging

- Send commands to relay with correlation IDs
- Initialize browser control session
- Delegate tasks to appropriate agents
- Record all actions in audit trail

**VERIFY**: Confirm state changed as expected

- Verify heartbeat signal received
- Confirm agent registration acknowledged
- Validate message delivery receipts
- Check gate decision outcomes

### 2. Gate Decisions System

The harness enforces gate decisions defined in the TNF protocol:

| Gate                    | Purpose                               | Failure Mode     |
| ----------------------- | ------------------------------------- | ---------------- |
| TENANT_SCOPE_GATE       | Ensures operation within tenant scope | Request rejected |
| TRACE_CONTINUITY_GATE   | Verifies trace lineage unbroken       | Correlation lost |
| CHANNEL_MEMBERSHIP_GATE | Confirms channel membership           | Message rejected |

### 3. Terminal Heartbeat Protocol

```
┌─────────────┐    30s interval    ┌─────────────┐
│   Agent     │───────────────────▶│   Relay     │
│             │◀───────────────────│             │
│  (tnf-agent-daemon.py)          │  (WebSocket) │
└─────────────┘                    └─────────────┘
      │                                    │
      ▼                                    ▼
┌─────────────┐                    ┌─────────────┐
│ Terminal    │ Ping every 5min    │ Redis       │
│ Heartbeat   │───────────────────▶│ Agent       │
│ (cjs)       │◀───────────────────│ Registry    │
└─────────────┘                    └─────────────┘
```

## Browser Control Surface Implementation

### Platform Detection

```tsx
const PLATFORM_CONFIG: Record<string, BrowserPlatform> = {
  'claude.ai': {
    name: 'Claude',
    icon: '🤖',
    controller: 'anthropic-direct',
    features: ['conversation-history', 'custom-instructions'],
    capabilities: ['read-conversation', 'write-message', 'summarize'],
  },
  'chatgpt.com': {
    name: 'ChatGPT',
    icon: '🟦',
    controller: 'openai-direct',
    features: ['memory', 'plugins', 'custom-gpts'],
    capabilities: ['read-history', 'send-message', 'activate-plugin'],
  },
  'gemini.google.com': {
    name: 'Gemini',
    icon: '🟡',
    controller: 'google-direct',
    features: ['ai-studio', 'vision', 'code-execution'],
    capabilities: ['read-chat', 'send-text', 'upload-file'],
  },
};
```

### Control Flow

1. **Platform Detection**: Automatic detection via URL pattern matching
2. **Session Initialization**: Create browser session with TNF context
3. **Element Selection**: Identify target elements using platform-specific
   strategies
4. **Action Execution**: Perform actions with human-like timing
5. **State Verification**: Confirm DOM state after each action
6. **Audit Logging**: Record all actions with timestamps and correlation IDs

## Security Features

### Permission System

```typescript
const PERMISSIONS = {
  'browser-control': {
    description: 'Ability to control browser automation',
    requiredFor: ['start-control', 'execute-action'],
  },
  'federation-connect': {
    description: 'Connect to TNF federation relay',
    requiredFor: ['federation-messages', 'agent-discovery'],
  },
  'agent-dispatch': {
    description: 'Dispatch tasks to fleet agents',
    requiredFor: ['delegate-task', 'orchestrate'],
  },
};
```

### Safety Guards

1. **Slash-Command Guard**: Prevents accidental execution of dangerous commands
2. **AppleScript Circuit Breaker**: Limits terminal automation frequency
3. **Typing Guard**: Ensures automation doesn't violate platform terms
4. **Coordination Poll**: Verifies multi-agent task status

### Audit Trail

All operations are logged with:

- Timestamp (ISO 8601 with timezone)
- Operation ID (UUID v4)
- Correlation ID (chain of related operations)
- Source agent/operator
- Target (platform, agent, or operation)
- Result (success/failure with details)

## Federation Integration

### WebSocket Connection

```typescript
class TnfFederationClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private identity: AgentIdentity;
  private capabilities: string[];

  async connect() {
    this.ws = new WebSocket('ws://127.0.0.1:3007/ws');
    this.ws.on('open', () => this.onConnected());
    this.ws.on('message', (data) => this.onMessage(JSON.parse(data)));
  }

  send(message: FederationMessage) {
    const envelope = {
      ...message,
      timestamp: Date.now(),
      id: uuidv4(),
      source: this.identity.id,
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(envelope));
    }
  }
}
```

### Message Types

| Type            | Direction     | Purpose          |
| --------------- | ------------- | ---------------- |
| HEARTBEAT       | Agent → Relay | Liveness check   |
| AGENT_REGISTER  | Agent → Relay | Join federation  |
| CHANNEL_JOIN    | Agent → Relay | Join channel     |
| CHANNEL_MESSAGE | Any → Any     | Send message     |
| AGENT_LIST      | Relay → Any   | Get agent list   |
| CHANNEL_LIST    | Relay → Any   | Get channel list |

## Deployment

### Browser Extension

```bash
cd apps/chrome-extension/src/v6
npm run build
# Load unpacked extension in Chrome/Edge
```

### Desktop Application

```bash
cd apps/tauri-desktop
npm run tauri build
```

### API Gateway

```bash
cd apps/api-gateway
npm run build
npm start
```

## Monitoring & Debugging

### Health Endpoints

```
GET /health                  # Overall health
GET /api/v1/health          # API-specific health
GET /api/v1/status          # Detailed status
GET /api/v1/agents          # Connected agents
GET /api/v1/gate-decisions  # Current gate status
```

### Debug Tools

- `/dev/protocol/gate-decisions` - Gate decision audit
- `/dev/protocol/heartbeat` - Heartbeat visualization
- `/dev/protocol/messages` - Message flow inspection
- `/dev/agents/fleet` - Agent fleet status

## Version History

- **v2.0.0**: Initial harness framework release
  - Added federation integration
  - Implemented browser detection
  - Added safety guards
  - Enhanced security monitoring

## Related Documentation

- [TNF Protocol Definitions](../DEFINITIONS.md)
- [INSPECT → ACT → VERIFY Protocol](../docs/INSPECT_ACT_VERIFY_PROTOCOL.md)
- [Turn Zero Mandate](../docs/ZERO_TURN.md)
- [Agent Definition Consistency](../docs/protocols/AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.json)
