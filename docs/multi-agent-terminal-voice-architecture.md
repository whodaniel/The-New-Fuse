# Multi-Agent Terminal Voice Architecture

## Discovery: Federation System Components

Based on codebase search, TNF has the following infrastructure for multi-agent
coordination:

### 1. TerminalFederationBridge

**File**: `/packages/relay-core/src/adapters/TerminalFederationBridge.ts`

This is the key component for terminal-based agent federation:

- Registers terminals as official TNF Agents
- Bridges local terminal "Active Pulse" injections with Federation protocol
- Makes terminal agents visible in WS Relay
- Supports roles: `orchestrator`, `worker`, `participant`
- Capabilities: `terminal_injection`, `active_pulse`

### 2. HandoffStoreService

**File**: `/packages/relay-core/src/services/HandoffStoreService.ts`

Manages handoff packets between agents:

- Stores handoff packets in Redis
- Tracks acknowledgment status
- Supports inbox per-agent with TTL
- Enables agent-to-agent communication

### 3. Voice Relay System

**File**: `/packages/tnf-cli/src/cli.ts`

Commands found:

- `tnf voice relay` - Relay transcribed input between profiles
- `--bidirectional` - Enable reverse relay path
- `--require-live` - Fail fast if endpoints down
- Uses `/tmp/voice_relay_{from}_{to}.log`

### 4. WebSocket Transport

**File**: `/packages/relay-core/src/transports/WebSocketTransport.ts`

Enables real-time communication between agents.

## Proposed Architecture for Echo-Pulse Test

### Option 1: Third-Party Router (Switch Terminal)

```
┌─────────────┐
│   Router    │  <- Third terminal, always focused
│  Terminal   │     Receives all transcriptions
└──────┬──────┘     Routes to Echo or Pulse
       │
       ├────────────────┬────────────────┐
       │                │                │
       ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│   Echo   │     │   Pulse  │     │  Router  │
│ Terminal │     │ Terminal │     │  Agent   │
│ (ttys095)│     │ (ttys???)│     │(switcher)│
└──────────┘     └──────────┘     └──────────┘
```

The Router Agent would:

1. Always stay focused (receives all transcriptions)
2. Parse transcriptions to determine destination
3. Use `TerminalFederationBridge` to route messages
4. Switch focus between Echo and Pulse terminals

### Option 2: Redis Pub/Sub Federation

Use existing Redis infrastructure:

- Echo and Pulse both register via `TerminalFederationBridge`
- Use `tnf:conversations` channel for communication
- Each agent filters messages by sender
- No focus switching needed

```typescript
// Echo registers
const echoBridge = new TerminalFederationBridge(logger, {
  tty: 'ttys095',
  agentName: 'echo',
  role: 'participant',
  platform: 'kilo-glm5',
});

// Pulse registers
const pulseBridge = new TerminalFederationBridge(logger, {
  tty: 'ttys???',
  agentName: 'pulse',
  role: 'participant',
  platform: 'kilo-glm5',
});
```

### Option 3: Voice Profile Relay

Use `tnf voice relay` command:

```bash
# Terminal 1: Router (focused)
tnf voice up --profile router

# Terminal 2: Echo
tnf voice up --profile echo
tnf voice relay --from router --to echo

# Terminal 3: Pulse
tnf voice up --profile pulse
tnf voice relay --from router --to pulse --bidirectional
```

## Implementation Steps

### Phase 1: Simple Test

1. Open third terminal for Router
2. Router receives all transcriptions
3. Router uses AppleScript to switch focus between Echo/Pulse
4. Each agent responds when their terminal is focused

### Phase 2: Federation Integration

1. Use `TerminalFederationBridge` to register each agent
2. Implement message routing via HandoffStoreService
3. Add voice-target switching logic
4. Test echo suppression across agents

### Phase 3: WebSocket Relay

1. Connect agents to WS Relay
2. Real-time message passing
3. Dashboard visibility of all agents
4. Proper handoff protocol

## Code Structure for Router Agent

```typescript
// router-agent.ts
import { TerminalFederationBridge } from '@the-new-fuse/relay-core';

class RouterAgent {
  private echoTty = 'ttys095';
  private pulseTty = 'ttys???';
  private currentTarget = 'echo';

  async routeTranscription(text: string) {
    // Parse for destination keywords
    if (text.includes('echo') || text.includes('pulse')) {
      this.currentTarget = text.includes('echo') ? 'echo' : 'pulse';
    }

    // Switch focus to target terminal
    await this.switchFocus(this.currentTarget);
  }

  async switchFocus(agent: 'echo' | 'pulse') {
    const tty = agent === 'echo' ? this.echoTty : this.pulseTty;
    // Use AppleScript to activate terminal
    await exec(`osascript -e 'tell application "Terminal" to activate'`);
  }
}
```

## Key Files to Modify/Create

1. `/Users/<owner>/bin/voice-router-agent.ts` - Router implementation
2. Update `voice_server.py` - Add routing logic
3. Create multi-agent voice target configuration
4. Add focus switching commands to `tnf voice`

## Testing Protocol

1. Start Router terminal (focused)
2. Start Echo terminal (background)
3. Start Pulse terminal (background)
4. Speak "Echo, please respond"
5. Router detects "Echo", switches focus
6. Echo receives transcription, responds
7. Echo suppression prevents feedback
8. Repeat for Pulse

## Next Steps

1. Decide on architecture (Router vs Redis vs Relay)
2. Implement Router agent script
3. Test focus switching via AppleScript
4. Integrate with TerminalFederationBridge
5. Document multi-agent voice protocol
