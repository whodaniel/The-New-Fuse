# The New Fuse

A multi-agent AI orchestration platform that enables AI agents to communicate,
collaborate, and execute workflows across browsers, IDEs, desktop apps, and
cloud services.

**Live:** [thenewfuse.com](https://thenewfuse.com)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10.19.0+ (`npm install -g pnpm`)
- Docker (for PostgreSQL + Redis)

### Install TNF CLI (Direct Command Line)

```bash
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse/main/scripts/install-tnf-cli.sh | bash
tnf
```

### Setup

```bash
git clone https://github.com/whodaniel/fuse.git
cd fuse
pnpm install
pnpm run docker:start    # PostgreSQL (5433) + Redis (6380)
pnpm run dev              # All services
```

### Operator Commands (TNF CLI)

```bash
tnf onboard
tnf doctor
tnf menu
tnf menu --full
tnf splash --theme neon --animate on
tnf agents list
tnf types list
tnf traits list
tnf paths
tnf scripts list
```

### Full Command Discovery

Use these when you need the complete TNF command universe:

```bash
tnf paths                 # All CLI command paths
tnf menu --full           # Expanded organized menu (namespaces + paths + tnf:* scripts)
tnf scripts list --json   # Root scripts + runnable script files
```

Additional operations docs:

- `docs/JULES_AUTONOMOUS_LOOP.md`
- `docs/SKILL_BANK_OPERATIONS.md`
- `packages/tnf-cli/README.md`

### Access Points

| Service        | URL                   |
| -------------- | --------------------- |
| Frontend       | http://localhost:3000 |
| API Server     | http://localhost:3001 |
| API Gateway    | http://localhost:3005 |
| Drizzle Studio | `pnpm run db:studio`  |

## Architecture

```
Browser/Chrome Ext ──> Cloudflare Relay (Edge) <──> Upstash (REST) <──> SharedState
VSCode Extension  ──/                                                  │
                                                              Supabase (pgvector)
Frontend (Cloudflare) ──> GCP API Gateway ──> API Server (GCP) ──> Drizzle ──> Supabase
                                       ──> Backend (GCP)

API Server <── TNF MCP Module <── Claude / other MCP clients
           <── A2A Protocol   <── Cross-agent messages

OpenClaw Mesh (Cloudflare) <──> Anthropic Claude Pro (OAuth)
PicoClaw Fleet (Edge) <── Lightweight edge agents
```

### Core Services

| Service          | Platform      | Tech         | Purpose                                                          |
| ---------------- | ------------- | ------------ | ---------------------------------------------------------------- |
| **Frontend**     | Cloudflare    | React + Vite | SPA: dashboard, workflow builder, agent management, chat, admin  |
| **API Server**   | GCP Cloud Run | NestJS       | Main backend: agents, chat, LLM routing, MCP, workflows, GraphQL |
| **API Gateway**  | GCP           | NestJS       | Single ingress proxy, auth, API versioning                       |
| **Relay Server** | Cloudflare    | Node.js      | WebSocket hub connecting all agents across tabs/processes        |
| **Database**     | Supabase      | PostgreSQL   | Primary database via Drizzle ORM (with pgvector)                 |
| **Redis**        | Upstash       | Serverless   | Global Pub/sub, caching, job queues via UnifiedRedisService      |

### Message Flow

1. **Frontend -> GCP Gateway -> API Server** — REST/GraphQL
2. **Agent -> Cloudflare Relay -> Upstash REST -> Other Agents** — Agent mesh
3. **Chrome Extension -> Cloudflare Relay** — Browser AI automation relay
4. **VSCode Extension -> Cloudflare Relay -> API** — IDE integration
5. **Any Agent -> MCP Server (embedded in API)** — Tool invocation via Model
   Context Protocol
6. **A2A Messages**: TNFEnvelope format (Zod-validated), carried over WebSocket
   (Edge) or Upstash (REST)

## Apps

### Core Services

- **[apps/api/](apps/api/)** — Main NestJS backend: agent CRUD, LLM providers
  (Anthropic/OpenAI/Google), MCP server, A2A protocol, GraphQL, Web3Auth,
  Swagger docs
- **[apps/frontend/](apps/frontend/)** — React SPA with ReactFlow workflow
  builder, Monaco editor, Three.js visualizations, premium UI components,
  Firebase auth
- **[apps/api-gateway/](apps/api-gateway/)** — NestJS gateway: request proxy,
  JWT auth, API versioning
- **[apps/poker-room/](apps/poker-room/)** — High-performance Poker Arcade with
  autonomous agent participation, deterministic engine, and workspace-scoped
  agent crafting.
- **[apps/backend/](apps/backend/)** — Secondary NestJS service: AG-UI protocol,
  Bull job queues, Prometheus metrics
- **[apps/relay-server/](apps/relay-server/)** — WebSocket relay hub for
  inter-agent messaging, MCP integration, React UI

### Client Extensions

- **[apps/chrome-extension/](apps/chrome-extension/)** — Injects into
  Claude/Gemini/ChatGPT/Perplexity tabs, captures AI responses, relays via
  WebSocket (V7 active)
- **[apps/vscode-extension/](apps/vscode-extension/)** — Full VS Code extension
  (v9.1.0): multi-LLM chat, A2A, AG-UI, MCP client, agent registry, collective
  orchestrator
- **[apps/electron-desktop/](apps/electron-desktop/)** — Electron desktop app
  with Chakra UI + Socket.io

### AI Infrastructure

- **[apps/picoclaw-overseer/](apps/picoclaw-overseer/)** — Go-based
  ultra-lightweight AI agent (<10MB RAM), three CloudRuntime instances
  (tester/subject/perplexity)
- **[apps/mcp-servers/](apps/mcp-servers/)** — MCP tool servers: network
  management, DevOps bridge, Claude/Gemini integration
- **[apps/cloud-sandbox/](apps/cloud-sandbox/)** — Playwright browser automation
  sandbox with Socket.io

### Other

- **[apps/visualization-hub/](apps/visualization-hub/)** — D3.js real-time agent
  network visualization
- **[apps/ai-arcade/](apps/ai-arcade/)** — NFT/crypto-powered agent marketplace
- **[apps/skideancer-ide/](apps/skideancer-ide/)** — Theia-based cloud IDE with
  AI plugins (port 3007, excluded from pnpm workspace)

## Shared Packages

### Foundation

| Package                        | Purpose                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `@the-new-fuse/types`          | Shared TypeScript types/interfaces for agents, auth, API, workflows, chat |
| `@the-new-fuse/utils`          | Utility functions                                                         |
| `@the-new-fuse/infrastructure` | NestJS providers: Redis, caching, shared services                         |

### Database

| Package                  | Purpose                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@the-new-fuse/database` | Drizzle ORM with PostgreSQL. ~15 schema tables (users, agents, workflows, chat, billing, wallets, marketplace, workspace, audit-logs, etc.) |

### Communication & Protocols

| Package                      | Purpose                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@the-new-fuse/relay-core`   | WebSocket relay, Redis pub/sub, TNF Envelope protocol, protocol translators (A2A, OpenAI, Anthropic, LangChain, CrewAI), JWT auth, Master Agent Registry, heartbeat monitoring |
| `@the-new-fuse/mcp-core`     | Full MCP client/server/broker implementation                                                                                                                                   |
| `@the-new-fuse/a2a-core`     | Agent-to-Agent protocol v0.3.0 (Linux Foundation spec)                                                                                                                         |
| `@the-new-fuse/ag-ui-core`   | AG-UI protocol (Microsoft's agent-UI spec)                                                                                                                                     |
| `@the-new-fuse/ap2-protocol` | AP2 protocol integration (HTTP-based, Zod)                                                                                                                                     |

### Agent & Workflow Layer

| Package                         | Purpose                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@the-new-fuse/agent`           | Core agent abstractions, NestJS providers, Redis-backed state                                                                           |
| `@the-new-fuse/core`            | Largest shared package: auth, AI adapters (Anthropic, Google), analysis, chat, workflow, vectordb (ChromaDB), webhooks, Supabase client |
| `@the-new-fuse/workflow-engine` | UnifiedWorkflowEngine (EventEmitter-based): builder, executor, validator, repository                                                    |
| `@the-new-fuse/core-vector-db`  | Vector database service (Qdrant + ChromaDB) with gRPC + MCP interfaces                                                                  |

### Integrations

| Package                              | Purpose                                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| `@the-new-fuse/claude-skills`        | Claude Skills format: parser, loader, executor                       |
| `@the-new-fuse/gemini-browser-skill` | Chrome's built-in Gemini AI automation                               |
| `@the-new-fuse/jules-integration`    | Google Jules coding agent integration (GitHub Issues, Redis queuing) |
| `@the-new-fuse/jules-skill`          | Claude skill wrapper for Jules delegation                            |
| `@the-new-fuse/n8n-workflows`        | Community n8n workflow fetching, parsing, categorization             |

### UI & Developer Tools

| Package                            | Purpose                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `@the-new-fuse/ui-consolidated`    | Shared UI component library (tsup)                                                |
| `@the-new-fuse/tnf-cli`            | CLI binaries (`tnf`, `tnf-agent`) for terminal agent messaging and TNF operations |
| `@the-new-fuse/security`           | Encryption, security middleware, rate limiting, audit logging                     |
| `@the-new-fuse/build-optimization` | Adaptive build system: detects RAM, adjusts concurrency/strategy                  |
| `@the-new-fuse/port-management`    | Port assignment management across the monorepo                                    |

## Key Patterns

### TNF Envelope Protocol

The canonical inter-agent message format, defined in
`packages/relay-core/src/protocol/tnf-envelope.ts` and validated with Zod:

- **Message types**: command, event, task, state-sync, query, response
- **Agent identity**: id, role, platform, capabilities
- **Context**: workflowId, stepId, sessionId, channelId, parentMessageId
- **Transport**: WebSocket relay or Redis pub/sub

### MCP Integration (4 modes)

1. **TNF as MCP Server** — API exposes agents/workflows/chat as MCP tools via
   `TNFMCPModule`
2. **TNF as MCP Client** — `packages/mcp-core/` provides full client. VSCode
   extension uses `MCPService`
3. **Network MCP Server** — `apps/mcp-servers/tnf-network-mcp/` exposes network
   management as tools
4. **Relay MCP Transport** — MCP as one of the relay's transport mechanisms

### Protocol Translation

The relay-core implements adapters for multiple agent communication standards:

- A2A v0.3.0 (Linux Foundation)
- AG-UI (Microsoft)
- OpenAI function calling format
- Anthropic XML tool format
- LangChain / CrewAI formats

The `ProtocolTranslator` converts between any of these, enabling cross-framework
agent collaboration.

### Auth Stack

- **Firebase** — Browser-side auth UI (Google sign-in, etc.)
- **JWT** — API issues its own access/refresh tokens (`@nestjs/jwt` + bcrypt)
- **Web3Auth** — Crypto wallet authentication
- **Relay JWT** — Separate JWT auth for agents connecting to relay

### OpenClaw Mesh

Federated gateway network using the `openclaw` npm package with Claude Pro
OAuth:

- **Local**: `ws://127.0.0.1:18789`
- **Cloud Primary**: `openclaw-cloud-production-934c.thenewfuse.com` ⚠️
  **DEPRECATED — CloudRuntime is no longer used. Migrated to GCP (Cloud Run) +
  Cloudflare + Supabase + Upstash. See `CLOUD_MIGRATION_BLUEPRINT.md`.**
- **Cloud Secondary**: `openclaw-primary-production.thenewfuse.com` ⚠️
  **DEPRECATED**
- **Cloud Sandbox**: `openclaw-sandbox-cloud-production.thenewfuse.com` ⚠️
  **DEPRECATED**
- **Model**: `anthropic/claude-opus-4-6`

### Premium UI Components

Located at `apps/frontend/src/components/ui/premium/`:

- `GlassCard` — Replaces Card/CardContent/CardHeader/CardTitle
- `PremiumButton` — Variants: primary, secondary, outline, ghost, danger,
  gradient
- `PremiumInput`, `PremiumSelect`, `PremiumTextarea`, `ToggleSwitch`,
  `StatsCard`, `ActionCard`, `IconButton`

Import all from `@/components/ui/premium`.

## Database

**ORM**: Drizzle ORM with PostgreSQL

Schema files in `packages/database/src/drizzle/schema/`:

| Schema           | Purpose                               |
| ---------------- | ------------------------------------- |
| `users.ts`       | Users, auth sessions, login attempts  |
| `agents.ts`      | Agents, metadata, NFTs, registrations |
| `workflows.ts`   | Workflows, steps, executions          |
| `chat.ts`        | Chat sessions, messages               |
| `tasks.ts`       | Tasks with priority/status            |
| `billing.ts`     | Billing/subscription data             |
| `wallets.ts`     | Smart account wallets, transactions   |
| `marketplace.ts` | NFT agent marketplace listings        |
| `workspace.ts`   | Workspace multi-tenancy               |
| `audit-logs.ts`  | Security audit trail                  |

```bash
pnpm run db:generate     # Generate schema from changes
pnpm run db:migrate      # Run migrations
pnpm run db:push         # Push schema directly (dev)
pnpm run db:studio       # Open Drizzle Studio GUI
```

## The `.agent/` Directory

AI agent operating instructions for any AI working in this codebase:

```
.agent/
├── SYSTEM_PROMPT.md          # Global identity prompt
├── CODEBASE_INTELLIGENCE.md  # Auto-indexing system docs
├── RESOURCE_REGISTRY.md      # Typed catalog of all TNF resources
├── ROLE_DEFINITIONS.md       # Agent role specs
├── agents/                   # 16 specialized agent personas
├── skills/                   # 15+ skill modules
├── workflows/                # Slash-command procedures
├── context/                  # System knowledge docs
└── session-logs/             # Past session histories
```

## Project Structure

```
The-New-Fuse/
├── apps/
│   ├── api/                    # Main NestJS API server (port 3001)
│   ├── api-gateway/            # NestJS gateway (port 3005)
│   ├── backend/                # Secondary NestJS service (port 3004)
│   ├── frontend/               # React + Vite SPA (port 3000)
│   ├── relay-server/           # WebSocket relay hub
│   ├── chrome-extension/       # Browser AI automation (V7)
│   ├── vscode-extension/       # VS Code extension (v9.1.0)
│   ├── electron-desktop/       # Electron desktop app
│   ├── picoclaw-overseer/      # Go-based lightweight AI agent
│   ├── mcp-servers/            # MCP tool servers
│   ├── cloud-sandbox/          # Playwright browser sandbox
│   ├── visualization-hub/      # D3.js agent network viz
│   ├── ai-arcade/              # Agent marketplace
│   └── skideancer-ide/         # Theia cloud IDE (excluded from workspace)
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── database/               # Drizzle ORM + PostgreSQL schemas
│   ├── relay-core/             # WebSocket relay, protocols, TNF Envelope
│   ├── mcp-core/               # MCP client/server/broker
│   ├── a2a-core/               # Agent-to-Agent protocol (legacy)
│   ├── a2a-protocol/           # Next-Gen A2A protocol and Agent Cards
│   ├── tnf-orchestrator-go/    # High-performance Go agent orchestrator
│   ├── lpm-native/             # (Assimilated) Localhost Port Monitor native kernel
│   ├── ag-ui-core/             # AG-UI protocol
│   ├── core/                   # AI adapters, auth, vectordb, webhooks
│   ├── agent/                  # Agent abstractions
│   ├── workflow-engine/        # Workflow executor
│   ├── security/               # Encryption, middleware, audit
│   ├── ui-consolidated/        # Shared UI components
│   ├── tnf-cli/                # Terminal agent CLI
│   ├── build-optimization/     # Adaptive build system
│   └── ...                     # 25+ more packages
├── .agent/                     # AI agent instructions & personas
├── docs/                       # Documentation (1,200+ files)
├── turbo.json                  # Turbo pipeline config
├── pnpm-workspace.yaml         # Workspace definition
├── docker-compose.dev-simple.yml  # Dev infrastructure (PG + Redis)
├── cloud_runtime.toml # ⚠️ DEPRECATED — CloudRuntime deployment (15+ services). TNF migrated to GCP Cloud Run + Cloudflare. See CLOUD_MIGRATION_BLUEPRINT.md.
└── Dockerfile.cloud_runtime # ⚠️ DEPRECATED — Multi-stage CloudRuntime build. No longer used for production.
```

## Development Commands

```bash
# Infrastructure
pnpm run docker:start       # Start PostgreSQL + Redis
pnpm run docker:stop        # Stop Docker services
pnpm run docker:status      # Check service status
pnpm run docker:logs        # View logs
pnpm run docker:test        # Test connectivity

# Development
pnpm run dev                # Start all services
pnpm run dev:no-ide         # Core services only (fastest)
pnpm run dev:frontend       # Frontend only
pnpm run dev:backend        # Backend only

# Building
pnpm run build              # Build all (via Turbo)
pnpm run type-check         # TypeScript checking

# Quality
pnpm run lint               # Lint all code
pnpm run format             # Format code
pnpm run test               # Run all tests

# Database
pnpm run db:generate        # Generate Drizzle schema
pnpm run db:migrate         # Run migrations
pnpm run db:push            # Push schema (dev)
pnpm run db:studio          # Drizzle Studio GUI

# Agent Management
pnpm run claude:agents:sync      # Sync .claude agents
pnpm run claude:agents:register  # Register agents in DB
pnpm run claude:agents:search    # Search agent ecosystem
pnpm run claude:agents:status    # Agent system status

# Workspace Operations
pnpm --filter @the-new-fuse/[package] add [dep]    # Add dependency
pnpm --filter @the-new-fuse/[package] run [cmd]    # Run command in package
pnpm -r run [cmd]                                   # Run in all packages

# Cleaning
pnpm run clean              # Clean build artifacts
pnpm run clean:full         # Full clean + remove node_modules
```

## Deployment

The project has migrated from CloudRuntime to a modern, edge-ready stack:

- **Cloudflare Workers**: Edge substrate for relay, shared state, and frontend.
- **Google Cloud Platform (GCP)**: Scalable backend hosting via Cloud Run.
- **Supabase**: Managed PostgreSQL with native vector support.
- **Upstash**: Serverless Redis providing a unified REST + TCP substrate.

```bash
# Deploy Cloudflare components
pnpm run deploy:cloudflare

# Deploy GCP components
pnpm run deploy:gcp
```

## Technology Stack

| Layer        | Technologies                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| Frontend     | React 19, Vite 7, TypeScript, ReactFlow, Monaco Editor, Three.js, TanStack Query, Redux Toolkit, Firebase SDK |
| Backend      | NestJS, TypeScript, Drizzle ORM, GraphQL (Apollo), BullMQ (job queues), Swagger                               |
| Database     | Supabase (PostgreSQL 15 + pgvector), Upstash (Serverless Redis)                                               |
| Protocols    | MCP, A2A v0.3.0, AG-UI, TNF Envelope, WebSocket (Edge)                                                        |
| AI Providers | Anthropic, OpenAI, Google (Gemini / GenKit)                                                                   |
| Desktop      | Electron, Tauri                                                                                               |
| Build        | pnpm, Turborepo, Docker, tsup                                                                                 |
| Deployment   | Cloudflare Workers, GCP Cloud Run, GitHub Actions                                                             |
| Edge AI      | PicoClaw (Go), OpenClaw (Cloudflare Edge)                                                                     |

## Documentation

- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** — Navigational index
  with guided paths
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** — Fast setup guide
- **[CLOUD_MIGRATION_BLUEPRINT.md](./CLOUD_MIGRATION_BLUEPRINT.md)** —
  Infrastructure reference (GCP + Cloudflare)
- **[RELEASE_GATE.md](./RELEASE_GATE.md)** — Merge-blocking release gate
- **[PRODUCTION_READINESS.md](./docs/project-management/PRODUCTION_READINESS.md)**
  — Production status

### By Topic

| Topic               | Primary Doc                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Architecture        | [docs/architecture/ARCHITECTURE_STANDARDS.md](./docs/architecture/ARCHITECTURE_STANDARDS.md) |
| Agent Development   | [docs/agents/COMPLETE-AGENT-GUIDE.md](./docs/agents/COMPLETE-AGENT-GUIDE.md)                 |
| Agent Communication | [docs/AGENT_COMMUNICATION_PROTOCOL.md](./docs/AGENT_COMMUNICATION_PROTOCOL.md)               |
| API Usage           | [docs/api/COMPLETE-API-GUIDE.md](./docs/api/COMPLETE-API-GUIDE.md)                           |
| GraphQL             | [apps/api/src/graphql/README.md](./apps/api/src/graphql/README.md)                           |
| MCP Integration     | [apps/backend/src/modules/mcp/README.md](./apps/backend/src/modules/mcp/README.md)           |
| Deployment          | [docs/guides/deployment-guide.md](./docs/guides/deployment-guide.md)                         |
| Cloud Infra         | [CLOUD_MIGRATION_BLUEPRINT.md](./CLOUD_MIGRATION_BLUEPRINT.md)                               |
| Security            | [docs/security/audit-findings.md](./docs/security/audit-findings.md)                         |
| Testing             | [docs/testing/TESTING_SETUP_COMPLETE.md](./docs/testing/TESTING_SETUP_COMPLETE.md)           |
| Design System       | [docs/PREMIUM_THEME_MANIFEST.md](./docs/PREMIUM_THEME_MANIFEST.md)                           |
| Chrome Extension    | [apps/chrome-extension/README.md](./apps/chrome-extension/README.md)                         |
| VS Code Extension   | [apps/vscode-extension/README.md](./apps/vscode-extension/README.md)                         |
| Workflows           | [docs/workflows/WORKFLOW_QUICKSTART.md](./docs/workflows/WORKFLOW_QUICKSTART.md)             |
| CLI Commands        | [docs/reference/command-map.md](./docs/reference/command-map.md)                             |
| Cloud QA            | [docs/qa/cloud-qa-guide.md](./docs/qa/cloud-qa-guide.md)                                     |

## Package Manager

This project uses **pnpm** exclusively. Do not use npm or yarn.

## License

[Add license information here]

## Support

- **Issues**: [GitHub Issues](https://github.com/whodaniel/fuse/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/whodaniel/fuse/discussions)
