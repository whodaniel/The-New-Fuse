# The New Fuse - AI Agent Collaborative Refactoring Plan

## Overview

Comprehensive refactoring using multi-agent AI collaboration to consolidate 46+
workspaces into a coherent, maintainable architecture.

## Agent Coordination Protocol

### Primary Orchestrator: Claude (Main)

- **Role**: Project coordination, architecture decisions, conflict resolution
- **Responsibilities**: Overall plan execution, quality assurance, integration
  testing

### Agent Assignments

#### Phase 1: Core Relay Consolidation (Gemini Instance 1)

**Target**: Merge relay implementations into unified core

- Files to consolidate:
  - `comprehensive-tnf-relay.js` (1092 lines)
  - `enhanced-tnf-relay.js` (790 lines)
  - `basic-relay.js`, `tnf-relay.js`, `tnf-relay-fixed.js`
  - `relay-adapter.js`, `message-bridge.js`

**New Structure**:

```
packages/relay-core/
├── src/
│   ├── server/
│   │   ├── RelayServer.ts           # Unified server (HTTP/WS/MCP)
│   │   ├── MessageRouter.ts         # Centralized routing
│   │   └── AgentRegistry.ts         # Discovery & management
│   ├── transports/
│   │   ├── WebSocketTransport.ts    # WebSocket protocol
│   │   ├── HTTPTransport.ts         # HTTP/REST API
│   │   ├── FileTransport.ts         # File-based queuing
│   │   └── MCPTransport.ts          # MCP protocol
│   └── adapters/
│       ├── ChromeExtensionAdapter.ts
│       └── AppleScriptAdapter.ts
```

#### Phase 2: Protocol Harmonization (Claude Instance 2)

**Target**: Unify protocol adapters and detection

- Consolidate: `src/protocols/ProtocolTranslator.js`
- Merge: A2A, MCP, Anthropic XML adapters
- Framework adapters: Langchain, CrewAI, Pydantic, SMOL

#### Phase 3: Workflow Engine (Gemini Instance 2)

**Target**: Consolidate workflow components

- Merge: `packages/core/src/workflow/WorkflowEngine.js`
- Unify: `media/workflow-builder.js` with backend
- Database: Consolidate workflow repositories

#### Phase 4: Extension Architecture (Claude Instance 3)

**Target**: Refactor extensions

- VSCode: `src/vscode-extension/` (100+ files)
- Chrome: `chrome-extension/`
- Electron: `apps/electron-desktop/`

#### Phase 5: Service Architecture (Orchestrator + All)

**Target**: Final integration and microservice boundaries

## Communication Protocol

### File-Based Coordination

- **Inbox/Outbox**: `cli-relay-queue/instance_X/`
- **Status Updates**: Every 30 minutes
- **Progress Reports**: JSON format with timestamps
- **Conflict Resolution**: Orchestrator mediation

### Message Format

```json
{
  "timestamp": "ISO8601",
  "source_agent": "agent_name",
  "target_agent": "target_name",
  "phase": 1,
  "task_id": "unique_id",
  "status": "in_progress|completed|blocked",
  "content": {
    "files_modified": [],
    "tests_status": "pass|fail",
    "dependencies": [],
    "notes": "Any issues or observations"
  }
}
```

## Success Metrics

- [ ] Reduce file count by 60%+
- [ ] Maintain all functionality
- [ ] Improve startup performance
- [ ] Enable better multi-agent coordination
- [ ] Pass all existing tests

## Execution Timeline

- **Phase 1-2**: Parallel execution (4-6 hours)
- **Phase 3-4**: Parallel execution (4-6 hours)
- **Phase 5**: Integration (2-3 hours)
- **Total**: 10-15 hours over 2-3 days

## Getting Started

1. Each agent reads this coordination plan
2. Agents claim their assigned phase by updating status
3. Begin parallel execution with regular check-ins
4. Orchestrator monitors progress and resolves conflicts

Let's revolutionize The New Fuse architecture together! 🚀
