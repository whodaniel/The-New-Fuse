# The New Fuse - Complete Codebase Analysis

**Generated**: December 18, 2025  
**Purpose**: Full scope understanding of TNF architecture for SkIDEancer IDE
integration

---

## Executive Summary

The New Fuse (TNF) is a sophisticated **Inter-LLM Communication Framework**
with:

- **67 packages** in a monorepo structure
- **12 apps** including frontend, backend, API, chrome extension, VSCode
  extension, Tauri desktop
- **~100 documentation files** covering architecture, protocols, agents, and
  operations

This is a **self-orchestrating multi-agent platform** designed to enable
seamless AI-to-AI communication across different environments.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE NEW FUSE PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │    CLIENT LAYER         │  │    CLOUD LAYER          │                   │
│  │                         │  │                         │                   │
│  │  🖥️ Tauri Desktop       │  │  ☁️ Cloud Sandbox       │                   │
│  │  📦 Chrome Extension    │  │  🌐 Frontend (React)    │                   │
│  │  🔧 VSCode Extension    │◄─┼─►🔌 API Gateway         │                   │
│  │  📱 Native App          │  │  🗄️ Backend (NestJS)    │                   │
│  │                         │  │  📊 PostgreSQL + Redis  │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                    │                       │                                 │
│                    └───────────┬───────────┘                                 │
│                                │                                             │
│  ┌─────────────────────────────▼─────────────────────────────────────────┐  │
│  │                    COMMUNICATION LAYER                                 │  │
│  │                                                                        │  │
│  │  🔗 A2A Protocol    📡 MCP Protocol    🔄 Relay Core    💓 Heartbeat   │  │
│  │  (Agent-to-Agent)   (Model Context)    (Message Router)  (Health Mon)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                │                                             │
│  ┌─────────────────────────────▼─────────────────────────────────────────┐  │
│  │                    AGENT LAYER                                         │  │
│  │                                                                        │  │
│  │  🏰 Director Agent    🤖 Agent Pool    🛠️ Claude Skills    📋 Handoff │  │
│  │  🔀 Task Distribution    🧠 LLM Integration    📊 Workflow Engine      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Categories

### 1. Core Communication Protocols (7 packages)

| Package                                  | Description                                            | Status      |
| ---------------------------------------- | ------------------------------------------------------ | ----------- |
| `@the-new-fuse/a2a-core`                 | Agent-to-Agent Protocol v0.3.0 (Linux Foundation spec) | ✅ Complete |
| `@the-new-fuse/a2a-react`                | React hooks for A2A                                    | ✅ Complete |
| `@the-new-fuse/mcp-core`                 | Model Context Protocol core                            | ✅ Complete |
| `@the-new-fuse/relay-core`               | Unified relay system + heartbeat                       | ✅ Complete |
| `@the-new-fuse/agent-coordination`       | Redis-based coordination with patterns                 | ✅ Complete |
| `@the-new-fuse/websocket-infrastructure` | Production WebSocket with Redis pub/sub                | ✅ Complete |
| `@the-new-fuse/proto-definitions`        | gRPC protocol buffers                                  | ✅ Complete |

### 2. Agent Framework (5 packages)

| Package                           | Description                         | Status         |
| --------------------------------- | ----------------------------------- | -------------- |
| `@the-new-fuse/agent`             | Core agent implementations          | ✅ Implemented |
| `@the-new-fuse/claude-skills`     | Anthropic Claude Skills integration | ✅ Complete    |
| `@the-new-fuse/workflow-engine`   | Unified workflow execution          | ✅ Complete    |
| `@the-new-fuse/prompt-templating` | Modular prompt system               | ✅ Complete    |
| `@the-new-fuse/resource-registry` | Agent/resource management           | ✅ Complete    |

### 3. Infrastructure & Operations (8 packages)

| Package                             | Description                                  | Status      |
| ----------------------------------- | -------------------------------------------- | ----------- |
| `@the-new-fuse/core`                | Core services (monitoring, memory, workflow) | ✅ Complete |
| `@the-new-fuse/core-monitoring`     | Unified monitoring                           | ✅ Complete |
| `@the-new-fuse/core-error-handling` | Error handling                               | ✅ Complete |
| `@the-new-fuse/core-vector-db`      | Vector DB with gRPC/MCP                      | ✅ Complete |
| `@the-new-fuse/database`            | Drizzle ORM                                   | ✅ Complete |
| `@the-new-fuse/deployment-core`     | CI/CD pipeline                               | ✅ Complete |
| `@the-new-fuse/infrastructure`      | Unified infra services                       | ✅ Complete |
| `@the-new-fuse/port-management`     | Port configuration                           | ✅ Complete |

### 4. API & Client (7 packages)

| Package                          | Description                              | Status      |
| -------------------------------- | ---------------------------------------- | ----------- |
| `@the-new-fuse/api`              | API implementation                       | ✅ Complete |
| `@the-new-fuse/api-client`       | API client                               | ✅ Complete |
| `@the-new-fuse/api-types`        | Type definitions                         | ✅ Complete |
| `@the-new-fuse/api-optimization` | Rate limiting, caching, CDN              | ✅ Complete |
| `@the-new-fuse/contracts`        | Smart contracts for decentralized agents | ✅ Complete |
| `@the-new-fuse/security`         | Security package                         | ✅ Complete |
| `@the-new-fuse/shared`           | Shared utilities                         | ✅ Complete |

### 5. UI & Frontend (8 packages)

| Package                              | Description                             | Status      |
| ------------------------------------ | --------------------------------------- | ----------- |
| `@the-new-fuse/ui-consolidated`      | Consolidated UI components              | ✅ Complete |
| `@the-new-fuse/fairtable-core`       | Airtable-like functionality             | ✅ Complete |
| `@the-new-fuse/fairtable-components` | React Fairtable components              | ✅ Complete |
| `@the-new-fuse/fairtable-adapters`   | Migration adapters                      | ✅ Complete |
| `@the-new-fuse/fairtable-utils`      | Utility functions                       | ✅ Complete |
| `@the-new-fuse/hooks`                | React hooks                             | ✅ Complete |
| `features`                           | Feature components (AI, LLM, dashboard) | ✅ Complete |
| `layout`                             | Layout components                       | ✅ Complete |

### 6. Extensions & Integrations (5 packages)

| Package                          | Description                 | Status      |
| -------------------------------- | --------------------------- | ----------- |
| `@the-new-fuse/extension-system` | Unified extension framework | ✅ Complete |
| `@the-new-fuse/n8n-workflows`    | N8N workflow integration    | ✅ Complete |
| `@the-new-fuse/web-scraping`     | Web scraping for AI agents  | ✅ Complete |
| `@the-new-fuse/ap2-protocol`     | AP2 Protocol                | ✅ Complete |
| `integrations`                   | Various integrations        | ✅ Complete |

### 7. Testing & Quality (4 packages)

| Package                           | Description           | Status      |
| --------------------------------- | --------------------- | ----------- |
| `@the-new-fuse/testing`           | E2E testing framework | ✅ Complete |
| `@the-new-fuse/test-utils`        | Test utilities        | ✅ Complete |
| `@the-new-fuse/integration-tests` | Integration tests     | ✅ Complete |
| `eslint-config-custom`            | ESLint configuration  | ✅ Complete |

---

## Apps Directory

| App                     | Description                | Technology            |
| ----------------------- | -------------------------- | --------------------- |
| `apps/frontend`         | Main React frontend        | React, TypeScript     |
| `apps/backend`          | NestJS backend service     | NestJS, TypeScript    |
| `apps/api`              | API service                | NestJS                |
| `apps/api-gateway`      | API gateway                | Express               |
| `apps/tauri-desktop`    | Desktop application        | Tauri + Rust          |
| `apps/cloud-sandbox`    | Cloud MCP server           | Node.js + Playwright  |
| `apps/chrome-extension` | Browser extension          | Chrome Extension      |
| `apps/vscode-extension` | VS Code integration        | VS Code Extension API |
| `apps/browser-hub`      | Browser hub component      | React                 |
| `apps/mcp-servers`      | MCP server implementations | Node.js               |
| `apps/relay-server`     | Message relay server       | Node.js               |

---

## Key Documentation Sections

### Architecture

- `ARCHITECTURE.md` - System overview
- `ARCHITECTURE_STANDARDS.md` - Coding standards (36KB)
- `MONOREPO_ARCHITECTURE.md` - Package organization
- `CODE_DUPLICATION_REPORT.md` - Refactoring analysis

### Agent Communication

- `AGENT_COMMUNICATION_GUIDE.md` - Complete comm guide (21KB)
- `AGENT_COMMUNICATION_ARCHITECTURE.md` - Technical architecture
- `TNF_AGENT_THREE_PILLARS.md` - Orchestrator + Heartbeat + Broker
- `MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md` - Multi-agent coordination

### Protocols

- `MCP-COMPLETE-GUIDE.md` - Model Context Protocol
- `CLAUDE_SKILLS.md` - Anthropic skills integration (16KB)
- `A2A Protocol` - Agent-to-Agent messaging

### AI Integration

- `RESEARCH_GOOGLE_APIS_AND_SKILLS.md` - Google APIs & Anthropic Skills
- `TNF_AGENTIC_INFRASTRUCTURE_VISION.md` - Full vision document (35KB)
- `CLOUD_SANDBOX_AI_TOOLS_PLAN.md` - Cloud sandbox tools plan

### Deployment

- `RAILWAY_DEPLOYMENT_GUIDE.md` - Railway deployment
- `DOCKER_BEST_PRACTICES.md` - Docker guidelines
- `ENVIRONMENT_VARIABLES.md` - Configuration

---

## The Three Pillars System

From `TNF_AGENT_THREE_PILLARS.md`:

### Pillar 1: Orchestrator (AgentSwarmOrchestrationService)

- Swarm initialization and configuration
- Agent registration with capabilities
- Quality-based task distribution
- Execution metrics tracking

### Pillar 2: Heartbeat (HeartbeatMonitoringService)

- 30-second health check intervals
- 60-second timeout detection
- Health scoring: excellent/good/fair/poor
- Stagnation detection and recovery

### Pillar 3: Message Broker (A2AMessageBrokerService)

- Direct messaging (point-to-point)
- Broadcast messaging (all agents)
- Channel-based pub/sub
- Conversation management
- Presence tracking

---

## Current Integration Points for SkIDEancer IDE

### Recommended Integration Architecture

```
┌────────────────────┐     ┌────────────────────┐
│   TAURI DESKTOP    │     │   THEIA IDE        │
│   (Local Shell)    │     │   (Cloud Browser)  │
│                    │     │                    │
│  • Light UI        │     │  • Full IDE        │
│  • MCP Client      │─────│  • File Editing    │
│  • Local Files     │     │  • Terminal        │
│                    │     │  • Extensions      │
└────────┬───────────┘     └────────┬───────────┘
         │                          │
         └──────────┬───────────────┘
                    │
         ┌──────────▼───────────┐
         │   CLOUD SANDBOX      │
         │   (Railway)          │
         │                      │
         │  • Playwright        │
         │  • MCP Tools         │
         │  • LLM APIs          │
         │  • Agent Runtime     │
         └──────────────────────┘
```

### Key Integration Files to Connect

1. **Relay Core** → SkIDEancer Extension
   - `packages/relay-core/src/index.ts`

2. **MCP Core** → SkIDEancer Language Server
   - `packages/mcp-core/src/index.ts`

3. **Workflow Engine** → SkIDEancer Task Runner
   - `packages/workflow-engine/src/index.ts`

4. **Agent Coordination** → SkIDEancer Commands
   - `packages/agent-coordination/src/index.ts`

---

## Gaps Identified for Full AI Integration

### 1. LLM API Tools (Not in Cloud Sandbox yet)

- `llm_chat` - Chat completion
- `llm_generate_code` - Code generation
- `llm_analyze_code` - Code review
- `llm_embedding` - Vector embeddings

### 2. Agent Implementation (Stubbed)

The files in `packages/agent/src/implementations/` are stubs (12 bytes each):

- `cascade_agent.ts`
- `cline_agent.ts`
- `llm_chat_agent.ts`
- `research_agent.ts`
- etc.

### 3. SkIDEancer Integration (Pending)

- SkIDEancer IDE as cloud browser
- Direct file editing via MCP
- Terminal integration
- Custom extensions

---

## Recommendations for SkIDEancer Integration

1. **Deploy SkIDEancer alongside Cloud Sandbox on Railway**
   - Share network with sandbox
   - Access same file system

2. **Create MCP Bridge to SkIDEancer**
   - `ide_open_file`, `ide_edit`, `ide_search`, `ide_terminal`
   - Extensions for agent-controlled editing

3. **Connect Heartbeat to SkIDEancer**
   - Monitor IDE health
   - Track editor activity

4. **Integrate Workflow Engine**
   - Visual workflow editor in SkIDEancer
   - Task execution from IDE

---

## Summary Statistics

- **67 packages** organized in monorepo
- **12 apps** (frontend, backend, desktop, extensions)
- **~100 docs** with comprehensive coverage
- **3 protocols**: A2A, MCP, Handoff
- **3 pillars**: Orchestrator, Heartbeat, Broker
- **Active deployment**: Railway (cloud sandbox)
- **Desktop app**: Tauri (connected, working)

**Ready for SkIDEancer IDE integration!**
