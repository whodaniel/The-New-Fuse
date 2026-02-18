# TNF Entity ID Taxonomy V2 - Design Specification

**Status**: DRAFT
**Author**: Claude Opus 4.6 + Daniel Goldberg
**Created**: 2026-02-18
**Supersedes**: V1 (AGENT-ID-TAXONOMY.md in openclaw memory)

---

## 1. Problem Statement

### Current State: Three Fragmented Systems

The TNF database currently has **three disconnected entity tracking systems**:

| System | Table(s) | Purpose | Status |
|--------|----------|---------|--------|
| **agents** | `agents` | TNF entity registry (V1) | 35 entities registered |
| **registered_entities** | `registered_entities` | Generic entity registry | **EMPTY** |
| **A2A** | `a2a_agents`, `a2a_agent_capabilities`, `a2a_conversations`, `a2a_messages`, `a2a_heartbeats` | Agent-to-Agent communication protocol | **EMPTY** |

Additionally, the **Drizzle ORM schema** (in `packages/database/src/drizzle/schema/`) defines a much richer schema than what actually exists in PostgreSQL. The Drizzle schema uses `uuid` primary keys and `jsonb` configs; the live DB uses `text` PKs and a smaller enum set.

### V1 Shortcomings

1. **Everything in one table**: LLMs, Harnesses, Humans, Agents all crammed into `agents` table
2. **Template/Instance conflation**: Agent definitions and runtime sessions are the same record
3. **No composition tracking**: Cannot express "Agent X runs LLM Y on Harness Z with MCPs [A,B,C]"
4. **Overloaded namespace**: ACCESS_LEVEL + PERSISTENCE + CLASSIFICATION in one field
5. **No version lineage**: LLM versions can't be tracked over time
6. **Missing entities**: MCPs, browser agents, endpoints, tools not tracked
7. **No runtime binding**: A2A system is disconnected from the entity registry

---

## 2. Design Principles

1. **Separate concerns**: Each entity class gets its own table with class-specific fields
2. **Compose, don't inherit**: Runtime instances are compositions of definitions + LLMs + harnesses + MCPs
3. **Stable IDs, mutable state**: TNF IDs are permanent; status/config can change
4. **Unify, don't duplicate**: A2A messaging should reference TNF IDs, not maintain a parallel registry
5. **Schema-first**: Drizzle schema IS the source of truth; DB matches schema exactly
6. **Version everything**: LLM models carry version qualifiers; agent definitions are versioned
7. **Backward compatible**: V1 `agents` table data migrates cleanly into V2 tables

---

## 3. TNF ID Format V2

### Structure

```
TNF:<CLASS>:<SCOPE>:<IDENTIFIER>[:<INSTANCE>][@<VERSION>]
```

### Components

| Component | Required | Values | Purpose |
|-----------|----------|--------|---------|
| `TNF` | Yes | Literal | Root namespace prefix |
| `CLASS` | Yes | `LLM`, `HARNESS`, `MCP`, `AGENT`, `SESSION`, `HUMAN`, `TOOL`, `SERVICE` | Entity classification |
| `SCOPE` | Yes | `base`, `sys`, `usr`, `ext` | Origin/access tier |
| `IDENTIFIER` | Yes | kebab-case string | Unique name within class+scope |
| `INSTANCE` | No | kebab-case string | Distinguishes multiple copies |
| `VERSION` | No | semver-like string | Version qualifier (primarily for LLMs) |

### Scope Definitions

| Scope | Meaning | Access | Mutable by |
|-------|---------|--------|------------|
| `base` | Foundational/canonical entity (LLM models, protocols) | Read-only for users | System only |
| `sys` | System-level infrastructure (harnesses, system agents, internal MCPs) | Admin/SuperAdmin | Dev team |
| `usr` | User-created or user-configurable (personas, custom agents, user MCPs) | Owner | Owner user |
| `ext` | External/third-party (marketplace agents, external services) | Varies | External provider |

### Examples

```
TNF:LLM:base:claude-opus@4.6              # Claude Opus 4.6 model
TNF:LLM:base:claude-opus@4.5              # Previous version (still tracked)
TNF:LLM:base:gemini-3-pro                  # Gemini 3 Pro (no version suffix = latest)
TNF:LLM:base:glm@5.0                       # GLM 5.0

TNF:HARNESS:sys:openclaw:primary           # OpenClaw local primary instance
TNF:HARNESS:sys:openclaw:cloud-primary     # OpenClaw Railway cloud instance
TNF:HARNESS:sys:picoclaw:tester            # PicoClaw tester instance
TNF:HARNESS:sys:zeroclaw:sandbox           # ZeroClaw sandbox

TNF:MCP:sys:gdrive                          # Google Drive MCP server
TNF:MCP:sys:vercel                          # Vercel MCP server
TNF:MCP:sys:cloudflare                      # Cloudflare MCP server
TNF:MCP:usr:custom-db-mcp                   # User-created MCP

TNF:AGENT:sys:antigravity:main             # System agent: Antigravity
TNF:AGENT:sys:orchestrator                  # System agent template: Orchestrator
TNF:AGENT:usr:my-seo-bot                    # User-configured agent persona

TNF:SESSION:sys:antigravity:abc123         # Active runtime session
TNF:SESSION:usr:debugger:xyz789            # User's debugger session

TNF:HUMAN:usr:daniel                        # Human user
TNF:HUMAN:usr:guest-42                      # Guest user

TNF:TOOL:sys:web-search                     # Built-in tool
TNF:SERVICE:sys:redis:primary               # Infrastructure service
TNF:SERVICE:sys:postgres:primary            # Infrastructure service
```

---

## 4. Entity-Relationship Diagram

```
                                    ┌─────────────────┐
                                    │     users        │  (existing table, unchanged)
                                    │─────────────────│
                                    │ id          PK   │
                                    │ email            │
                                    │ name             │
                                    │ role             │
                                    │ tnf_id      UQ   │  ← NEW: TNF:HUMAN:usr:daniel
                                    └────────┬────────┘
                                             │ 1
                                             │
                    ┌────────────────────────┼──────────────────────────┐
                    │                        │                          │
                    ▼ *                       ▼ *                        ▼ *
    ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
    │   tnf_llm_models  │    │   tnf_harnesses   │    │  tnf_mcp_servers  │
    │───────────────────│    │───────────────────│    │───────────────────│
    │ id            PK  │    │ id            PK  │    │ id            PK  │
    │ tnf_id        UQ  │    │ tnf_id        UQ  │    │ tnf_id        UQ  │
    │ name              │    │ name              │    │ name              │
    │ provider          │    │ platform          │    │ protocol          │
    │ model_id          │    │ version           │    │ transport         │
    │ family            │    │ environment       │    │ endpoint_url      │
    │ version           │    │ endpoint_url      │    │ tools       JSONB │
    │ context_window    │    │ ws_url            │    │ resources   JSONB │
    │ supports_vision   │    │ access_level      │    │ auth_method       │
    │ supports_tools    │    │ features    JSONB │    │ status            │
    │ supports_streaming│    │ allowed_models [] │    │ owner_id     FK   │
    │ input_cost_per_1m │    │ status            │    │ created_at        │
    │ output_cost_per_1m│    │ owner_id     FK   │    │ updated_at        │
    │ is_current        │    │ created_at        │    └─────────┬─────────┘
    │ superseded_by  FK │    │ updated_at        │              │
    │ created_at        │    └─────────┬─────────┘              │
    │ updated_at        │              │                        │
    └─────────┬─────────┘              │                        │
              │                        │                        │
              │    ┌───────────────────┴────────────────────────┘
              │    │
              ▼    ▼
    ┌───────────────────────┐
    │  tnf_agent_definitions│  ← Templates / Personas / Blueprints
    │───────────────────────│
    │ id               PK   │
    │ tnf_id           UQ   │
    │ name                  │
    │ description           │
    │ definition_source     │  ← File path: .agent/agents/debugger.md
    │ definition_format     │  ← md | yaml | json
    │ system_prompt    TEXT  │
    │ persona_source        │  ← SOUL.md path or content ref
    │ avatar_url            │
    │ default_llm_id   FK   │  → tnf_llm_models
    │ default_harness_id FK │  → tnf_harnesses
    │ skills          JSONB │
    │ capabilities    JSONB │
    │ tags            JSONB │
    │ access_level          │  ← superadmin | admin | dev | user
    │ is_system             │  ← true for built-in agents
    │ owner_id         FK   │  → users
    │ version               │
    │ created_at            │
    │ updated_at            │
    └───────────┬───────────┘
                │ 1
                │
                ▼ *
    ┌───────────────────────┐       ┌─────────────────────────┐
    │  tnf_agent_sessions   │──────▶│  tnf_session_mcps       │
    │  (Runtime Instances)  │  1:*  │  (Junction table)       │
    │───────────────────────│       │─────────────────────────│
    │ id               PK   │       │ session_id         FK   │
    │ tnf_id           UQ   │       │ mcp_id             FK   │
    │ agent_def_id     FK   │       └─────────────────────────┘
    │ active_llm_id    FK   │  → tnf_llm_models (what's ACTUALLY running)
    │ harness_id       FK   │  → tnf_harnesses (WHERE it's running)
    │ user_id          FK   │  → users (WHO started it)
    │ status                │  ← active | idle | busy | error | terminated
    │ started_at            │
    │ last_heartbeat        │
    │ metadata         JSONB│
    │ config           JSONB│  ← Runtime overrides
    └───────────────────────┘
                │
                │  References A2A system via tnf_id
                ▼
    ┌───────────────────────┐
    │  a2a_agents           │  ← MODIFIED: agentId now references tnf_id
    │  a2a_messages         │
    │  a2a_conversations    │
    │  a2a_heartbeats       │
    │  a2a_capabilities     │
    └───────────────────────┘
```

---

## 5. Table Definitions (Drizzle Schema)

### 5.1 `tnf_llm_models` - Base LLM Model Registry

```typescript
export const tnfLlmModels = pgTable('tnf_llm_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  modelId: varchar('model_id', { length: 255 }).notNull(),       // API model identifier
  family: varchar('family', { length: 100 }).notNull(),            // claude, gemini, gpt, glm
  version: varchar('version', { length: 50 }),                     // 4.6, 3-pro, 5.0
  contextWindow: integer('context_window'),
  supportsVision: boolean('supports_vision').default(false).notNull(),
  supportsTools: boolean('supports_tools').default(false).notNull(),
  supportsStreaming: boolean('supports_streaming').default(true).notNull(),
  supportsMultimodal: boolean('supports_multimodal').default(false).notNull(),
  inputCostPer1m: integer('input_cost_per_1m_cents'),              // Cents per 1M tokens
  outputCostPer1m: integer('output_cost_per_1m_cents'),
  isCurrent: boolean('is_current').default(true).notNull(),        // Is this the "current" version?
  supersededBy: uuid('superseded_by'),                              // FK to newer version
  apiEndpoints: jsonb('api_endpoints').$type<string[]>().default([]),
  authMethod: varchar('auth_method', { length: 50 }),               // api-key, oauth, etc.
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Known Models to Register:**

| TNF ID | Provider | Model ID | Family | Version | Context |
|--------|----------|----------|--------|---------|---------|
| `TNF:LLM:base:claude-opus@4.6` | anthropic | claude-opus-4-6 | claude | 4.6 | 200K |
| `TNF:LLM:base:claude-opus@4.5` | anthropic | claude-opus-4-5-20250929 | claude | 4.5 | 200K |
| `TNF:LLM:base:claude-sonnet@4.5` | anthropic | claude-sonnet-4-5-20250929 | claude | 4.5 | 200K |
| `TNF:LLM:base:claude-haiku@4.5` | anthropic | claude-haiku-4-5-20251001 | claude | 4.5 | 200K |
| `TNF:LLM:base:gemini-3-pro` | google | gemini-3-pro-preview | gemini | 3 | 1M+ |
| `TNF:LLM:base:gemini-3-flash` | google | gemini-3-flash | gemini | 3 | 1M+ |
| `TNF:LLM:base:gpt-4o` | openai | gpt-4o | gpt | 4o | 128K |
| `TNF:LLM:base:o3` | openai | o3 | o-series | 3 | 200K |
| `TNF:LLM:base:codex` | openai | codex | codex | - | - |
| `TNF:LLM:base:glm@5.0` | zhipu | glm-5.0 | glm | 5.0 | - |
| `TNF:LLM:base:minimax-m2.1` | minimax | MiniMax-M2.1 | minimax | 2.1 | - |
| `TNF:LLM:base:kimi-k2` | moonshot | kimi-k2-0905-preview | kimi | k2 | - |
| `TNF:LLM:base:deepseek-v3` | deepseek | DeepSeek-V3 | deepseek | 3 | 128K |
| `TNF:LLM:base:grok-3` | xai | grok-3 | grok | 3 | 128K |

### 5.2 `tnf_harnesses` - Execution Environment Registry

```typescript
export const tnfHarnesses = pgTable('tnf_harnesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 100 }).notNull(),       // OpenClaw, PicoClaw, ZeroClaw, Claude Code, etc.
  version: varchar('version', { length: 50 }),
  instance: varchar('instance', { length: 100 }),                   // primary, tester, sandbox
  environment: varchar('environment', { length: 50 }).notNull(),   // local, railway, cloudflare, vercel
  endpointUrl: text('endpoint_url'),                                // HTTP endpoint
  wsUrl: text('ws_url'),                                            // WebSocket endpoint
  accessLevel: varchar('access_level', { length: 50 }).default('user').notNull(),
  features: jsonb('features').$type<string[]>().default([]),
  allowedModelIds: jsonb('allowed_model_ids').$type<string[]>().default([]),  // TNF IDs of compatible LLMs
  status: varchar('status', { length: 50 }).default('offline').notNull(),
  ownerId: uuid('owner_id'),                                        // FK to users
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Known Harnesses:**

| TNF ID | Platform | Instance | Environment | Endpoint |
|--------|----------|----------|-------------|----------|
| `TNF:HARNESS:sys:openclaw:primary` | OpenClaw | primary | local | ws://127.0.0.1:18789 |
| `TNF:HARNESS:sys:openclaw:cloud-primary` | OpenClaw | cloud-primary | railway | https://openclaw-cloud-production-934c.up.railway.app |
| `TNF:HARNESS:sys:openclaw:cloud-secondary` | OpenClaw | cloud-secondary | railway | https://openclaw-primary-production.up.railway.app |
| `TNF:HARNESS:sys:openclaw:cloud-sandbox` | OpenClaw | cloud-sandbox | railway | https://openclaw-sandbox-cloud-production.up.railway.app |
| `TNF:HARNESS:sys:picoclaw:tester` | PicoClaw | tester | railway | (Railway URL) |
| `TNF:HARNESS:sys:picoclaw:subject` | PicoClaw | subject | railway | (Railway URL) |
| `TNF:HARNESS:sys:picoclaw:perplexity` | PicoClaw | perplexity | railway | (Railway URL) |
| `TNF:HARNESS:sys:zeroclaw:sandbox` | ZeroClaw | sandbox | railway | (TBD) |
| `TNF:HARNESS:sys:claude-code:local` | Claude Code | local | local | (CLI) |
| `TNF:HARNESS:ext:gemini-cli:local` | Gemini CLI | local | local | (CLI) |
| `TNF:HARNESS:ext:antigravity:local` | Antigravity | local | local | (OpenClaw bridge) |

### 5.3 `tnf_mcp_servers` - MCP Server Registry

```typescript
export const tnfMcpServers = pgTable('tnf_mcp_servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  protocol: varchar('protocol', { length: 50 }).default('stdio').notNull(),  // stdio, sse, ws
  transport: varchar('transport', { length: 100 }),                           // npx, node, python, docker
  command: text('command'),                                                    // Actual launch command
  args: jsonb('args').$type<string[]>().default([]),
  env: jsonb('env').$type<Record<string, string>>().default({}),
  endpointUrl: text('endpoint_url'),                                           // For SSE/WS MCPs
  tools: jsonb('tools').$type<string[]>().default([]),                         // Tool names exposed
  resources: jsonb('resources').$type<string[]>().default([]),                 // Resource names exposed
  authMethod: varchar('auth_method', { length: 50 }),
  status: varchar('status', { length: 50 }).default('available').notNull(),
  scope: varchar('scope', { length: 50 }).default('user').notNull(),           // sys, usr, ext
  ownerId: uuid('owner_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Known MCPs to Register (partial - pending full audit):**

| TNF ID | Name | Transport | Source |
|--------|------|-----------|--------|
| `TNF:MCP:ext:vercel` | Vercel | (remote) | claude_desktop_config |
| `TNF:MCP:ext:cloudflare` | Cloudflare Developer Platform | (remote) | claude_desktop_config |
| `TNF:MCP:sys:gdrive` | Google Drive | npx | claude settings |
| `TNF:MCP:sys:gdocs` | Google Docs | npx | claude settings |
| `TNF:MCP:sys:youtube` | YouTube | npx | claude settings |
| `TNF:MCP:sys:filesystem` | Filesystem | npx @modelcontextprotocol/server-filesystem | data/mcp_config.json |
| `TNF:MCP:sys:github` | GitHub | npx @modelcontextprotocol/server-github | data/mcp_config.json |
| `TNF:MCP:sys:postgres` | PostgreSQL | npx @modelcontextprotocol/server-postgres | data/mcp_config.json |
| `TNF:MCP:sys:tnf-relay` | TNF Relay MCP | node | custom |
| `TNF:MCP:sys:openclaw-gateway` | OpenClaw CF Gateway | cloudflare worker | wrangler.toml |
| `TNF:MCP:sys:openclaw-runtime` | OpenClaw CF Runtime | cloudflare worker | wrangler.toml |
| `TNF:MCP:sys:shared-state` | Shared State Worker | cloudflare worker | wrangler.toml |

### 5.4 `tnf_agent_definitions` - Agent Templates / Personas

```typescript
export const tnfAgentDefinitions = pgTable('tnf_agent_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  definitionSource: text('definition_source'),          // File path or URL
  definitionFormat: varchar('definition_format', { length: 20 }),  // md, yaml, json
  systemPrompt: text('system_prompt'),
  personaSource: text('persona_source'),                 // SOUL.md ref
  avatarUrl: text('avatar_url'),
  defaultLlmId: uuid('default_llm_id'),                 // FK to tnf_llm_models
  defaultHarnessId: uuid('default_harness_id'),          // FK to tnf_harnesses
  skills: jsonb('skills').$type<string[]>().default([]),
  capabilities: jsonb('capabilities').$type<string[]>().default([]),
  tags: jsonb('tags').$type<string[]>().default([]),
  mcpIds: jsonb('mcp_ids').$type<string[]>().default([]),  // TNF IDs of required MCPs
  agentType: varchar('agent_type', { length: 50 }).default('GENERIC').notNull(),
  accessLevel: varchar('access_level', { length: 50 }).default('user').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  ownerId: uuid('owner_id'),                              // FK to users
  version: varchar('version', { length: 50 }).default('1.0.0').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Known Agent Definitions:**

| TNF ID | Source | Type | System? |
|--------|--------|------|---------|
| `TNF:AGENT:sys:antigravity` | OpenClaw AGENTS.md | COORDINATOR | Yes |
| `TNF:AGENT:sys:picoclaw-tester` | PicoClaw config | ANALYZER | Yes |
| `TNF:AGENT:sys:picoclaw-subject` | PicoClaw config | ANALYZER | Yes |
| `TNF:AGENT:sys:picoclaw-perplexity` | PicoClaw config | ANALYZER | Yes |
| `TNF:AGENT:usr:orchestrator` | .agent/agents/orchestrator.md | COORDINATOR | No |
| `TNF:AGENT:usr:backend-specialist` | .agent/agents/backend-specialist.md | CODER | No |
| `TNF:AGENT:usr:database-architect` | .agent/agents/database-architect.md | CODER | No |
| `TNF:AGENT:usr:debugger` | .agent/agents/debugger.md | ANALYZER | No |
| `TNF:AGENT:usr:devops-engineer` | .agent/agents/devops-engineer.md | CODER | No |
| `TNF:AGENT:usr:documentation-writer` | .agent/agents/documentation-writer.md | COMMUNICATOR | No |
| `TNF:AGENT:usr:explorer-agent` | .agent/agents/explorer-agent.md | ANALYZER | No |
| `TNF:AGENT:usr:frontend-specialist` | .agent/agents/frontend-specialist.md | CODER | No |
| `TNF:AGENT:usr:game-developer` | .agent/agents/game-developer.md | CODER | No |
| `TNF:AGENT:usr:mobile-developer` | .agent/agents/mobile-developer.md | CODER | No |
| `TNF:AGENT:usr:penetration-tester` | .agent/agents/penetration-tester.md | ANALYZER | No |
| `TNF:AGENT:usr:performance-optimizer` | .agent/agents/performance-optimizer.md | ANALYZER | No |
| `TNF:AGENT:usr:project-planner` | .agent/agents/project-planner.md | COORDINATOR | No |
| `TNF:AGENT:usr:security-auditor` | .agent/agents/security-auditor.md | ANALYZER | No |
| `TNF:AGENT:usr:seo-specialist` | .agent/agents/seo-specialist.md | ANALYZER | No |
| `TNF:AGENT:usr:test-engineer` | .agent/agents/test-engineer.md | ANALYZER | No |

### 5.5 `tnf_agent_sessions` - Runtime Instances

```typescript
export const tnfAgentSessions = pgTable('tnf_agent_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  agentDefId: uuid('agent_def_id').notNull(),              // FK to tnf_agent_definitions
  activeLlmId: uuid('active_llm_id'),                      // FK to tnf_llm_models (what's ACTUALLY running)
  harnessId: uuid('harness_id'),                            // FK to tnf_harnesses (WHERE it's running)
  userId: uuid('user_id'),                                  // FK to users (WHO started it)
  status: varchar('status', { length: 50 }).default('initializing').notNull(),
  configOverrides: jsonb('config_overrides'),                // Runtime config that differs from definition
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastHeartbeat: timestamp('last_heartbeat'),
  terminatedAt: timestamp('terminated_at'),
  metadata: jsonb('metadata'),
});

// Junction table for session -> MCPs (many-to-many)
export const tnfSessionMcps = pgTable('tnf_session_mcps', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),                  // FK to tnf_agent_sessions
  mcpId: uuid('mcp_id').notNull(),                          // FK to tnf_mcp_servers
});
```

---

## 6. A2A Integration Strategy

The existing A2A tables are well-designed for runtime communication. **Do not recreate them.** Instead:

### Modification: `a2a_agents.agentId` references TNF IDs

```sql
-- a2a_agents.agentId should match tnf_agent_sessions.tnf_id
-- This means when a session starts, it auto-registers in a2a_agents
-- When a session ends, the a2a_agent goes OFFLINE

-- Example flow:
-- 1. Agent session starts: INSERT into tnf_agent_sessions with tnf_id = 'TNF:SESSION:sys:antigravity:abc123'
-- 2. Auto-register in A2A: INSERT into a2a_agents with agentId = 'TNF:SESSION:sys:antigravity:abc123'
-- 3. Heartbeats flow through a2a_heartbeats
-- 4. Messages flow through a2a_messages
-- 5. Session ends: UPDATE a2a_agents SET status = 'OFFLINE', UPDATE tnf_agent_sessions SET status = 'terminated'
```

### What A2A Already Provides (don't duplicate):
- `a2a_agent_capabilities` - Runtime capability advertisement
- `a2a_conversations` - Conversation tracking with participants
- `a2a_messages` - Full message protocol with routing, TTL, signatures, checksums
- `a2a_heartbeats` - Load monitoring, active connections

---

## 7. `registered_entities` Deprecation

The `registered_entities` table is a generic catch-all that overlaps with both `agents` and the new `tnf_*` tables. It is currently empty.

**Recommendation**: Deprecate. Its use cases are fully covered by:
- `tnf_agent_definitions` (for agents)
- `tnf_mcp_servers` (for tools/services)
- `tnf_harnesses` (for infrastructure)

---

## 8. Migration Path: V1 -> V2

### Phase 1: Create V2 Tables
1. Add new `tnf_*` tables alongside existing `agents` table
2. Do NOT modify or delete `agents` table yet

### Phase 2: Data Migration
1. Extract LLM entities from `agents` WHERE `entity_type = 'LLM'` -> `tnf_llm_models`
2. Extract HARNESS entities -> `tnf_harnesses`
3. Extract AGENT entities -> `tnf_agent_definitions`
4. Extract HUMAN entities -> add `tnf_id` to `users` table
5. Register all known MCPs into `tnf_mcp_servers`

### Phase 3: Application Updates
1. Update backend services to read/write from V2 tables
2. Update Cloudflare Worker (tnf-agent-orchestration) to use V2 schema
3. Update A2A system to reference TNF IDs
4. Update frontend dashboard to display entity hierarchy

### Phase 4: Cleanup
1. Mark old `agents` rows with `entity_type != 'AGENT'` as deprecated
2. Eventually remove non-agent rows from `agents` table
3. Remove `registered_entities` table

---

## 9. Query Examples

### "What LLM is Antigravity currently running?"

```sql
SELECT lm.name, lm.provider, lm.version
FROM tnf_agent_sessions s
JOIN tnf_agent_definitions d ON s.agent_def_id = d.id
JOIN tnf_llm_models lm ON s.active_llm_id = lm.id
WHERE d.tnf_id = 'TNF:AGENT:sys:antigravity'
  AND s.status = 'active';
```

### "Which MCPs does the debugger agent have access to?"

```sql
SELECT m.name, m.tnf_id, m.tools
FROM tnf_agent_definitions d
CROSS JOIN LATERAL jsonb_array_elements_text(d.mcp_ids) AS mcp_tnf_id
JOIN tnf_mcp_servers m ON m.tnf_id = mcp_tnf_id
WHERE d.tnf_id = 'TNF:AGENT:usr:debugger';
```

### "List all active sessions with their full composition"

```sql
SELECT
  s.tnf_id AS session,
  d.name AS agent,
  lm.name AS llm,
  h.name AS harness,
  h.endpoint_url
FROM tnf_agent_sessions s
JOIN tnf_agent_definitions d ON s.agent_def_id = d.id
LEFT JOIN tnf_llm_models lm ON s.active_llm_id = lm.id
LEFT JOIN tnf_harnesses h ON s.harness_id = h.id
WHERE s.status IN ('active', 'idle', 'busy');
```

### "Show version history for Claude Opus"

```sql
WITH RECURSIVE versions AS (
  SELECT id, tnf_id, version, is_current, superseded_by
  FROM tnf_llm_models
  WHERE family = 'claude' AND tnf_id LIKE '%opus%' AND superseded_by IS NULL
  UNION ALL
  SELECT m.id, m.tnf_id, m.version, m.is_current, m.superseded_by
  FROM tnf_llm_models m
  JOIN versions v ON m.superseded_by = v.id
)
SELECT * FROM versions ORDER BY version DESC;
```

---

## 10. Chrome Extension / Browser Agents

The Chrome Extension V7 injects into browser-based LLM interfaces. These should be tracked as:

| TNF ID | Type | Notes |
|--------|------|-------|
| `TNF:HARNESS:ext:chrome-ext:gemini` | HARNESS | Chrome Extension tab running Gemini |
| `TNF:HARNESS:ext:chrome-ext:perplexity` | HARNESS | Chrome Extension tab running Perplexity |
| `TNF:HARNESS:ext:chrome-ext:chatgpt` | HARNESS | Chrome Extension tab running ChatGPT |

These are harnesses (execution environments) that can be bound to sessions. When the relay connects a browser tab, a `tnf_agent_session` is created referencing both the browser harness and the LLM being accessed through it.

---

## 11. Cloudflare Worker Integration

Three Cloudflare Workers exist in the project:

| Worker | wrangler.toml Location | Purpose |
|--------|----------------------|---------|
| openclaw-runtime | cloudflare-openclaw-runtime/ | OpenClaw LLM runtime |
| openclaw-gateway | cloudflare-openclaw-gateway/ | API gateway for OpenClaw |
| tnf-sharedstate | cloudflare-sharedstate/ | Shared state via Durable Objects |

Additionally, `tnf-agent-orchestration.bizsynth.workers.dev` hosts the current agent registry API. This worker should be updated to query V2 tables (or a D1 mirror of the PostgreSQL data).

---

## 12. Open Questions

1. **D1 vs PostgreSQL**: Should the Cloudflare Worker use D1 (Cloudflare's SQLite) as a read replica of PostgreSQL, or query PostgreSQL directly via Hyperdrive?
2. **Session TTL**: How long should terminated sessions be retained? (Suggest: 30 days, then archive)
3. **MCP discovery**: Should MCPs self-register, or should the system scan claude_desktop_config.json on startup?
4. **Browser tab tracking**: Should each Chrome Extension tab create a persistent harness entry, or use SESSION-type ephemeral entries?
5. **NFT integration**: The existing `agent_nfts` table references `agents.id`. Should V2 agent definitions be NFT-eligible?

---

## Appendix A: Full Database Table Inventory (Current)

| Table | Rows | V2 Fate |
|-------|------|---------|
| `users` | 1+ | KEEP - add `tnf_id` column |
| `agents` | 35 | MIGRATE to `tnf_agent_definitions` + `tnf_llm_models` + `tnf_harnesses` |
| `registered_entities` | 0 | DEPRECATE |
| `a2a_agents` | 0 | KEEP - reference TNF IDs |
| `a2a_agent_capabilities` | 0 | KEEP |
| `a2a_conversations` | 0 | KEEP |
| `a2a_messages` | 0 | KEEP |
| `a2a_heartbeats` | 0 | KEEP |
| `chat_messages` | ? | KEEP |
| `tasks` | ? | KEEP |
| `_prisma_migrations` | ? | KEEP (Prisma history) |

## Appendix B: Enum Alignment

The live PostgreSQL enums differ from the Drizzle schema enums:

| Enum | DB Values | Drizzle Values | Action |
|------|-----------|----------------|--------|
| `AgentType` | GENERIC, CODER, ANALYZER, COORDINATOR, COMMUNICATOR | 140+ values | V2 tables use VARCHAR instead of enum (more flexible) |
| `AgentStatus` | IDLE, BUSY, ERROR, OFFLINE | 9 values | V2 tables use VARCHAR |
| `TNFEntityType` | LLM, HARNESS, AGENT, SESSION, HUMAN, TOOL, SERVICE | Same | KEEP |
| `TNFNamespace` | BASE, SYSTEM, USER, TEMP, PERSIST, OWNER, ADMIN, MEMBER | Same | SIMPLIFY to base, sys, usr, ext, tmp |

**V2 Decision**: Use `varchar` for type/status fields in new tables instead of PostgreSQL enums. Enums are rigid and require migrations to add new values. VARCHAR with application-level validation is more practical for a rapidly evolving system.
