# TNF Federation Architecture

## Vision: Unified AI Chat Channel Federation

The Federation system allows grouping browser tabs (each running AI chats like
ChatGPT, Claude, Gemini) into **channels**, enabling coordinated multi-AI
conversations orchestrated through TNF infrastructure.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TNF RELAY SERVER                                   │
│                     (Central Communication Hub)                              │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Redis Channels │  │  WebSocket Hub  │  │   Agent Registry │              │
│  │  ─────────────  │  │  ─────────────  │  │  ───────────────  │              │
│  │  tnf:federation │  │  Client Pool    │  │  Chrome Tabs     │              │
│  │  tnf:channels   │  │  Message Queue  │  │  VS Code         │              │
│  │  tnf:agents     │  │  Broadcasting   │  │  Tauri App       │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  VS Code Ext  │           │  Chrome Ext   │           │  Tauri App    │
│               │           │               │           │               │
│  AI Chat      │           │ Tab A: Claude │           │  Dashboard    │
│  MCP Tools    │◀─────────▶│ Tab B: GPT    │◀─────────▶│  Orchestrator │
│  CLI Agents   │           │ Tab C: Gemini │           │  Workflows    │
│               │           │ Tab D: Claude │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     FEDERATION CHANNELS       │
                    │     ─────────────────────     │
                    │                               │
                    │  Channel "research":          │
                    │    • Tab A (Claude)           │
                    │    • Tab C (Gemini)           │
                    │                               │
                    │  Channel "coding":            │
                    │    • Tab B (GPT)              │
                    │    • VS Code AI               │
                    │                               │
                    │  Channel "review":            │
                    │    • Tab D (Claude)           │
                    │    • Tauri Agents             │
                    │                               │
                    └───────────────────────────────┘
```

## Core Concepts

### 1. **Federation**

A logical grouping that spans multiple AI endpoints (browser tabs, VS Code,
Tauri agents, local LLMs).

### 2. **Channel**

A communication pathway within a federation. Tabs/agents in the same channel
can:

- Share context and messages
- Route requests to each other
- Coordinate on tasks

### 3. **Tab/Endpoint**

An individual AI chat session. Each tab has:

- Unique ID
- Platform type (ChatGPT, Claude, Gemini, Local)
- Status (active, idle, responding)
- Capabilities

### 4. **Modal Bridge**

The injected UI in each browser tab that:

- Shows federation status
- Allows channel assignment
- Bridges between web AI and local AI

---

## Data Model

### Federation

```typescript
interface Federation {
  id: string;
  name: string;
  channels: FederationChannel[];
  createdAt: string;
  createdBy: 'user' | 'system';
  status: 'active' | 'paused' | 'archived';
  metadata: {
    purpose?: string;
    tags?: string[];
  };
}
```

### Channel

```typescript
interface FederationChannel {
  id: string;
  name: string;
  federationId: string;
  members: ChannelMember[];
  mode: 'broadcast' | 'round-robin' | 'first-responder' | 'orchestrated';
  settings: {
    autoRoute: boolean; // Auto-route messages to best member
    shareContext: boolean; // Share conversation context
    syncMessages: boolean; // Sync messages across members
    primaryMember?: string; // Default responder
  };
  createdAt: string;
  lastActivity: string;
}
```

### Channel Member

```typescript
interface ChannelMember {
  id: string;
  type: 'browser_tab' | 'vscode' | 'tauri' | 'local_llm' | 'mcp_server';
  platform?: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'custom';
  tabId?: number; // Chrome tab ID
  windowId?: number; // Chrome window ID
  url?: string;
  name: string;
  status: 'active' | 'idle' | 'responding' | 'offline';
  capabilities: string[];
  joinedAt: string;
  lastSeen: string;
  metadata?: {
    model?: string;
    version?: string;
    customData?: Record<string, any>;
  };
}
```

---

## Backend Chat Session Integration

The backend already has `ChatSession`:

```typescript
// apps/tauri-desktop/src/types/index.ts
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  agents: string[]; // Agent IDs in this session
  createdAt: string;
  updatedAt: string;
}
```

### Unified Model

To make Federation coherent with backend sessions:

```typescript
interface UnifiedChatSession extends ChatSession {
  // Existing fields
  id: string;
  title: string;
  messages: ChatMessage[];
  agents: string[];
  createdAt: string;
  updatedAt: string;

  // Federation fields
  federationId?: string; // Which federation this belongs to
  channelId?: string; // Which channel within federation
  browserTabs?: string[]; // Tab IDs participating
  syncEnabled: boolean; // Whether to sync with browser tabs

  // Session metadata
  source: 'tauri' | 'vscode' | 'chrome' | 'api';
  participants: SessionParticipant[];
}

interface SessionParticipant {
  id: string;
  type: 'user' | 'agent' | 'browser_tab' | 'mcp_tool';
  name: string;
  provider?: string; // AI provider
  platform?: string; // ChatGPT, Claude, etc.
  joinedAt: string;
}
```

---

## Message Flow

### Scenario: User asks question in Tab A (Claude), routed to Tab C (Gemini) for research

```
1. User types in Tab A (Claude)
   └─ Modal intercepts before send

2. Modal sends to Chrome Extension background
   └─ BrowserControlHandler receives

3. Background sends to TNF Relay via WebSocket
   └─ Message: { type: 'FEDERATION_MESSAGE', channelId: 'research', ... }

4. Relay routes to all "research" channel members
   └─ Tab C (Gemini) receives

5. Tab C's modal injects question into Gemini
   └─ Gemini processes and responds

6. Tab C's modal captures response
   └─ Sends back to Relay

7. Relay broadcasts to channel
   └─ Tab A receives Gemini's answer

8. Tab A's modal displays or injects response
   └─ User sees combined intelligence
```

---

## Implementation Files

### 1. Shared Types

`packages/shared/src/federation/types.ts`

### 2. Chrome Extension

`apps/chrome-extension/src/federation/`

- `FederationManager.ts` - Manages channel membership
- `ChannelBridge.ts` - Routes messages between tabs
- `FederationModal.tsx` - UI for channel assignment

### 3. Tauri Desktop

`apps/tauri-desktop/src/services/FederationService.ts`

### 4. VS Code Extension

`apps/vscode-extension/src/services/FederationService.ts`

### 5. Relay Core

`packages/relay-core/src/federation/`

- `FederationRouter.ts` - Routes channel messages
- `ChannelRegistry.ts` - Tracks active channels

### 6. Backend

`packages/core/src/services/FederationService.ts`

---

## Redis Channels for Federation

Add to Redis Transport:

```typescript
channels: {
  // Existing
  agentCommunication: 'tnf:agents',
  workflowExecution: 'tnf:workflows',
  systemEvents: 'tnf:system',
  heartbeat: 'tnf:heartbeat',

  // Federation
  federation: 'tnf:federation',         // Federation-wide events
  channels: 'tnf:federation:channels',  // Channel-specific messages
  sync: 'tnf:federation:sync'           // Context synchronization
}
```

---

## Next Steps

1. ✅ Document architecture (this file)
2. Create shared Federation types
3. Implement FederationService in Chrome Extension
4. Add Relay Connection to VS Code Extension
5. Create FederationService in Tauri
6. Update Relay Server with federation routing
7. Build UI for channel management
8. Test end-to-end federation workflow
