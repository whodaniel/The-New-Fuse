# TNF Knowledge Graph

**Status**: Living Memory Bank **Purpose**: Persistent storage of "ingested"
architectural knowledge.

## 🧠 Application Layer

### 1. Chrome Extension ("The Bridge")

- **Role**: Enabling AI-to-AI communication by bridging web interfaces (Gemini,
  ChatGPT) with the TNF Relay.
- **Mechanism**:
  - **Injection**: Content scripts inject prompts into the DOM
    (ContentEditable/Clipboard).
  - **Capture**: MutationObservers watch for AI responses.
  - **Relay**: Forwards captured data to `localhost:3000/relay`.
- **Key Components**: Background Service Worker (Routing), Carrier Pigeons
  (Content Scripts).

### 2. Frontend & Tauri

- **Structure**: shared `src/` structure based on Atomic Design or Feature-based
  organization.
- **Finding**: `apps/tauri-desktop` README appears to be a direct clone of
  `apps/frontend`, suggesting tight coupling or documentation drift.

### 3. Backend & API

- **Split**: Architecture separates "Backend Service" (likely the
  runner/container) from "API Layer" (routes/logic).
- **Core**: Built on NestJS (inferred from codebase analysis) with heavy
  reliance on `@the-new-fuse/core` shared libraries.

## 🏗️ Architectural Core (The Pillars)

### Pillar 1: Orchestrator

- **Pattern**: "Director" pattern.
- **Tech**: Redis Pub/Sub + BullMQ.
- **Logic**: Intelligent task distribution (Map-Reduce, Swarm).

### Pillar 2: Heartbeat

- **Pulse**: 30-second interval.
- **Function**: Stagnation detection -> "If you don't beat, you are dead/stuck"
  -> Trigger recovery.

### Pillar 3: Message Broker (A2A)

- **Protocol**: A2A v0.3.0 (JSON-RPC 2.0).
- **Transport**: Redis, WebSocket, Http.
- **Vision**: Standardized "Agent Card" for discovery.

### 4. Workflow Engine

- **Unified System**: Replaces scattered implementations.
- **Node Types**:
  - `agent_task`: Core unit of work.
  - `agent_handoff`: Explicit context transfer (with `stagnationThresholdMs`).
  - `llm_prompt`: Direct LLM calls.
- **Validation**: "Validator" component runs custom rules (e.g. "Must have at
  least one agent").
- **State**: Redis-backed context preservation.

### 5. Relay Architecture (Definitive)

- **Source of Truth**: `tnf-relay-package` (Root).
- **Core Components**:
  1. **Proxy Server (8888)**: Intercepts HTTP/HTTPS (Claude Code, VS Code).
  2. **Relay API (3000)**: Management interface.
  3. **WebSocket (3001)**: Real-time agent bus.
  4. **Dashboard (3002)**: React UI for monitoring.
- **Integration**:
  - Intercepts environment variables (`HTTP_PROXY`).
  - Connects to "Claude Desktop Bridge".
  - **Recovery**: Backup implementations found in `Relay Related -Temp`.
- **Key File**: `tnf-relay-package/src/comprehensive-tnf-relay.js`.

### 6. Agent Protocols (A2A)

- **Message Structure**: `BaseMessage` (id, type, sender, recipient, payload).
- **Transports**: WebSocket, HTTP, File (IPC), MCP.
- **Coordination**:
  - "Legacy" Redis coordinator vs "Core" components (`AgentPool`,
    `TaskAssigner`).
  - Patterns: Broadcast, Request-Response, Pub-Sub.

## 🌐 API & Web3

- **Smart Accounts**: Native Web3 "UserOperation" support via `/smart-accounts`
  endpoints.
- **Auth**: Standard JWT (15m expiry).
- **Socket**: `ws://localhost:3000/workflow-execution` for real-time monitoring.

## 🛡️ MCP Core Best Practices

- **Design**: Use connection pooling and Circuit Breaker patterns.
- **Security**: Strict input validation (Ajv) and sanitization.
- **Performance**: Batch operations, Resource monitoring (CPU/RAM).
- **Graceful Shutdown**: Handle SIGTERM/SIGINT to close connections cleanly.
- **Testing**: End-to-end integration tests are preferred.

## ⚠️ Documentation Gaps

- **Package-Level**: Many critical packages (`database`, `infrastructure`,
  `deployment-core`, `relay-core`) have missing or empty `README.md` files.
- **Implication**: Source of Truth is currently centralized in `/docs/` or
  implicitly in the code structure, rather than distributed in packages.

## 🤝 Coordination Protocols

- **Jules Rule**: NEVER assign tasks to Jules (GitHub Agent) without checking
  `git status` / branching strategy. Jules commits directly.
