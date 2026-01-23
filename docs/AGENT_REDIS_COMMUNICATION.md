# TNF CLI & Multi-Agent Redis Communication Architecture

## 🎯 Vision: Real-Time AI Agent Conversations Over Redis

This document outlines how TNF CLI agents (Gemini, Claude, Jules, Antigravity)
can have real-time conversations over Redis channels, enabling:

- Direct AI-to-AI dialogue
- Orchestrated multi-AI workflows
- Broker-mediated timing-controlled interactions
- Federation across browser tabs, VS Code, and Tauri

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               REDIS SERVER                                       │
│                          (Port 6380 - TNF Default)                              │
│                                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ tnf:agents   │ │ tnf:convos   │ │ tnf:broker   │ │tnf:orchestrator│          │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤           │
│  │ Agent regis- │ │ Active conv- │ │ Broker queue │ │ Orchestration │           │
│  │ tration and  │ │ ersation     │ │ and timing   │ │ commands and  │           │
│  │ heartbeats   │ │ messages     │ │ control      │ │ assignments   │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│   ANTIGRAVITY     │      │   GEMINI CLI      │      │   CLAUDE CLI      │
│   (This Agent)    │      │   Agent           │      │   Agent           │
│                   │      │                   │      │                   │
│  Role: Orchestrator│      │  Role: Worker     │      │  Role: Broker     │
│  or Participant   │      │  or Analyst       │      │  or Worker        │
│                   │      │                   │      │                   │
│  Commands:        │      │  Commands:        │      │  Commands:        │
│  - orchestrate    │      │  - analyze        │      │  - broker         │
│  - converse       │      │  - implement      │      │  - review         │
│  - delegate       │      │  - research       │      │  - synthesize     │
└───────────────────┘      └───────────────────┘      └───────────────────┘
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           JULES (GitHub Agent)                                   │
│                                                                                  │
│   Role: Async Implementation                                                     │
│   - Receives tasks from Orchestrator                                             │
│   - Reports back via Redis when complete                                         │
│   - Can run 50+ parallel sessions                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 Redis Channels Structure

### Agent Communication Channels

```typescript
const REDIS_CHANNELS = {
  // Core communication
  agents: 'tnf:agents', // Agent registration/discovery
  conversations: 'tnf:conversations', // Active conversation messages

  // Orchestration
  orchestrator: 'tnf:orchestrator', // Master orchestrator commands
  broker: 'tnf:broker', // Broker timing/coordination

  // Direct agent-to-agent
  direct: (from: string, to: string) => `tnf:direct:${from}:${to}`,

  // Named conversation rooms
  room: (name: string) => `tnf:room:${name}`,

  // Federation (from earlier work)
  federation: 'tnf:federation',
  federationChannels: 'tnf:federation:channels',
};
```

### Message Format

```typescript
interface AgentMessage {
  id: string;
  timestamp: string;

  // Source
  from: {
    agentId: string;
    agentName: string;
    role: 'orchestrator' | 'broker' | 'worker' | 'participant';
    platform:
      | 'antigravity'
      | 'gemini'
      | 'claude'
      | 'jules'
      | 'vscode'
      | 'browser';
  };

  // Destination
  to?: {
    agentId?: string; // Specific agent
    channel?: string; // Redis channel
    role?: string; // All agents with role
    broadcast?: boolean; // All agents
  };

  // Content
  type: 'message' | 'command' | 'response' | 'heartbeat' | 'status';
  content: string;

  // Conversation context
  conversationId?: string;
  replyTo?: string; // Message ID being replied to
  expectsResponse?: boolean;

  // Metadata
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    ttl?: number; // Time to live in seconds
    tags?: string[];
  };
}
```

---

## 🎭 Agent Roles

### Role 1: **Orchestrator**

- Controls the conversation flow
- Assigns tasks to other agents
- Coordinates multi-step workflows
- Example agents: Master Orchestrator, Antigravity

### Role 2: **Broker**

- Manages timing and turn-taking
- Prevents message collisions
- Ensures orderly conversation flow
- Example: Claude as Broker

### Role 3: **Worker**

- Executes assigned tasks
- Reports results back
- Can work in parallel (Jules)
- Example: Gemini analyzing code, Jules implementing

### Role 4: **Participant**

- Takes part in conversations
- Provides insights and responses
- No special coordination role
- Example: Any AI in a discussion

---

## 💬 Conversation Patterns

### Pattern 1: Direct Conversation (2 AIs)

```
Antigravity ──────────► Redis ──────────► Gemini
     ◄──────────────────────────────────────┘
```

### Pattern 2: Orchestrated Multi-AI

```
                    Orchestrator (Antigravity)
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
        Gemini          Claude          Jules
         (analyze)     (review)       (implement)
            │              │              │
            └──────────────┼──────────────┘
                           │
                    Results Aggregation
```

### Pattern 3: Broker-Mediated Discussion

```
                    Broker (Claude)
                         │
            ┌────────────┼────────────┐
            │            │            │
        Gemini ◄─────────┼────────► Antigravity
            │            │            │
            └────────────┼────────────┘
                         │
                  Timing Control:
                  "Gemini, your turn"
                  "Antigravity, respond"
```

---

## 🔧 CLI Commands

### `tnf agent register`

Register an agent with the Redis network.

### `tnf agent list`

List all registered and active agents.

### `tnf convo start <topic>`

Start a new conversation on a topic.

### `tnf convo join <conversation-id>`

Join an existing conversation.

### `tnf convo send <message>`

Send a message to the current conversation.

### `tnf orchestrate <workflow>`

Execute an orchestrated multi-agent workflow.

### `tnf broker start`

Become the broker for the current conversation.

---

## 🛠️ Implementation Steps

### Phase 1: CLI Agent Base (✅ COMPLETED)

1. Create `scripts/tnf-agent-cli.ts` -> Now `@the-new-fuse/tnf-cli` package
2. Create `packages/agent/src/redis-agent.ts` -> Integrated into `RedisAgentClient`
3. Test direct conversation between Antigravity and Gemini -> Verified

### Phase 2: Orchestration (IN PROGRESS)

1. Implement orchestrator role in `MasterOrchestratorRegistration`
2. Add task delegation over Redis
3. Test multi-agent workflow

### Phase 3: Broker Pattern

1. Implement broker logic for turn-taking
2. Add timing controls
3. Test broker-mediated discussion

### Phase 4: Integration

1. Connect VS Code extension to Redis agent network
2. Connect Chrome extension federation to agents
3. Connect Tauri app to agent network

---

## 🔮 Future Possibilities You Haven't Thought Of

### 1. **Consensus Voting**

Multiple AIs vote on code changes before committing:

```
Antigravity: "Should we refactor this function?"
Gemini: 👍 "Yes, cleaner"
Claude: 👍 "Improves readability"
Jules: 👍 "I can implement it"
→ Consensus reached, Jules implements
```

### 2. **Chain-of-Thought Relay**

One AI starts reasoning, another continues:

```
Gemini: "The bug is in the authentication flow because..."
Claude: "...the token refresh happens before validation, so we should..."
Antigravity: "...add a validation check in the middleware"
```

### 3. **Specialized Expert Panels**

Different AIs for different domains:

```
Security Panel:  Claude + Gemini (security review)
Performance Panel: DeepSeek + GPT (optimization)
UX Panel: Claude + Gemini (user experience)
```

### 4. **Autonomous Improvement Loop**

```
1. Gemini: Analyze codebase, find issues
2. Claude: Prioritize and plan fixes
3. Jules: Implement fixes (parallel sessions)
4. Gemini: Review implementations
5. Repeat until quality threshold met
```

### 5. **Real-Time Pair Programming**

```
User types code in VS Code
→ Antigravity suggests improvement
→ Gemini analyzes for bugs
→ Claude reviews for best practices
→ Suggestions appear in real-time
```

### 6. **Federated Browser AI Council**

Multiple browser tabs with different AIs:

```
Tab 1: ChatGPT (ideas)
Tab 2: Claude (critique)
Tab 3: Gemini (implementation plan)
→ All connected via federation
→ Real-time collaborative discussion
```

### 7. **Self-Healing Codebase**

```
Monitor → Detect issue → Convene agents → Fix automatically
```

### 8. **Cross-Model Verification**

Critical code verified by multiple independent AIs before merge.

---

## 📊 OAGI/Lux Integration (From Your Link)

The OAGI Python SDK features are highly relevant:

### Features to Integrate into Tauri:

1. **Tasker Mode** - Step-by-step task execution
   - Perfect for workflow builder nodes

2. **Actor Mode** - Immediate action execution
   - For quick automation tasks

3. **Thinker Mode** - Complex goal understanding
   - For high-level task delegation

4. **Screenshot Integration**
   - For browser automation in Tauri

5. **PyAutoGUI Action Handling**
   - Cross-platform mouse/keyboard control

6. **Socket.IO Server**
   - Real-time client-server communication
   - Session namespaces for isolation

### Tauri Features to Add:

```rust
// Computer Use capabilities
- screen_capture()
- execute_click(x, y)
- execute_type(text)
- execute_scroll(amount)
- execute_hotkey(keys)

// Session management
- create_session(instruction)
- get_session_status(id)
- cancel_session(id)

// Integration with TNF agents
- delegate_to_oagi(task)
- monitor_oagi_session(id)
```

---

## ✅ Today's Goal: Agent Conversation Demo

Let's create a working demo where:

1. **I (Antigravity)** register as an agent
2. **Gemini CLI** registers as an agent
3. We have a real conversation over Redis
4. Messages flow through `tnf:conversations` channel

Ready to implement?
