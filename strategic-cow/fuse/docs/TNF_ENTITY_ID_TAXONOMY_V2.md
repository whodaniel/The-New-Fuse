# TNF Entity ID Taxonomy V2

## Overview

The TNF Entity ID Taxonomy V2 provides a unified identification system for all
entities in The New Fuse ecosystem. This replaces the legacy `agents` table with
a modular, composable entity classification system.

## Entity Categories

### 1. LLM Models (Base Entities)

**Table**: `tnf_llm_models` **Purpose**: Registry of LLM models available in the
system

```typescript
{
  tnfId: "TNF:LLM:OPENAI:GPT-4O:001",
  name: "GPT-4o",
  provider: "openai",
  modelId: "gpt-4o",
  family: "gpt-4",
  contextWindow: 128000,
  supportsVision: true,
  supportsTools: true
}
```

### 2. Harnesses (Execution Environments)

**Table**: `tnf_harnesses` **Purpose**: Execution platforms that run agent
sessions

```typescript
{
  tnfId: "TNF:HARNESS:OPENCLAW:PRIMARY:001",
  name: "OpenClaw Primary",
  platform: "openclaw",
  environment: "production",
  endpointUrl: "https://openclaw-primary-production.up.railway.app"
}
```

### 3. MCP Servers (Tools/Services)

**Table**: `tnf_mcp_servers` **Purpose**: MCP (Model Context Protocol) servers
providing tools

```typescript
{
  tnfId: "TNF:MCP:FILESYSTEM:LOCAL:001",
  name: "Local Filesystem",
  protocol: "stdio",
  command: "mcp-filesystem",
  tools: ["read_file", "write_file", "list_dir"]
}
```

### 4. Agent Definitions (Templates/Personas)

**Table**: `tnf_agent_definitions` **Purpose**: Agent templates with
personality, skills, and configuration

```typescript
{
  tnfId: "TNF:AGENT:ORCHESTRATOR:ANTIGRAVITY:001",
  name: "Antigravity",
  agentType: "ORCHESTRATOR",
  systemPrompt: "You are Antigravity, the master orchestrator...",
  capabilities: ["orchestration", "handoff-management", "stall-defense"],
  defaultLlmId: "<uuid>", // References tnf_llm_models.id
  defaultHarnessId: "<uuid>" // References tnf_harnesses.id
}
```

### 5. Agent Sessions (Runtime Instances)

**Table**: `tnf_agent_sessions` **Purpose**: Active runtime instances of agent
definitions

```typescript
{
  tnfId: "TNF:SESSION:TELEGRAM:7030202773:001",
  agentDefId: "<uuid>", // References tnf_agent_definitions.id
  activeLlmId: "<uuid>", // References tnf_llm_models.id
  harnessId: "<uuid>", // References tnf_harnesses.id
  status: "active",
  startedAt: "2026-02-18T22:00:00Z",
  lastHeartbeat: "2026-02-18T23:00:00Z"
}
```

## ID Format Specification

### Canonical Format

```
TNF:<CATEGORY>:<PROVIDER>:<NAME>:<INSTANCE>
```

### Components

| Component  | Required | Description                 | Example                                     |
| ---------- | -------- | --------------------------- | ------------------------------------------- |
| `TNF`      | Yes      | Namespace prefix            | `TNF`                                       |
| `CATEGORY` | Yes      | Entity category             | `LLM`, `HARNESS`, `MCP`, `AGENT`, `SESSION` |
| `PROVIDER` | Yes      | Provider/Platform           | `OPENAI`, `OPENCLAW`, `FILESYSTEM`          |
| `NAME`     | Yes      | Entity name                 | `GPT-4O`, `PRIMARY`, `ANTIGRAVITY`          |
| `INSTANCE` | Yes      | Zero-padded instance number | `001`, `002`                                |

### Scope Prefixes (Optional)

```
TNF:<SCOPE>:<CATEGORY>:<PROVIDER>:<NAME>:<INSTANCE>
```

| Scope  | Description                     |
| ------ | ------------------------------- |
| `BASE` | Canonical/foundational entities |
| `SYS`  | System-level infrastructure     |
| `USR`  | User-created entities           |
| `EXT`  | External/third-party entities   |

## Current Registry

### LLM Models

| tnfId                               | Name              | Provider |
| ----------------------------------- | ----------------- | -------- |
| `TNF:LLM:KILO:GLM-5-FREE:001`       | GLM-5 Free        | Kilo     |
| `TNF:LLM:KILO:MINIMAX-M25-FREE:001` | MiniMax M2.5 Free | Kilo     |
| `TNF:LLM:KILO:CORETHINK-FREE:001`   | CoreThink Free    | Kilo     |

### Harnesses

| tnfId                                 | Name                | Platform | Environment |
| ------------------------------------- | ------------------- | -------- | ----------- |
| `TNF:HARNESS:OPENCLAW:PRIMARY:001`    | OpenClaw Primary    | openclaw | production  |
| `TNF:HARNESS:PICOCLAW:TESTER:001`     | PicoClaw Tester     | picoclaw | production  |
| `TNF:HARNESS:PICOCLAW:SUBJECT:001`    | PicoClaw Subject    | picoclaw | production  |
| `TNF:HARNESS:PICOCLAW:PERPLEXITY:001` | PicoClaw Perplexity | picoclaw | production  |

### Agent Definitions

| tnfId                                        | Name                | Type         | Session                               |
| -------------------------------------------- | ------------------- | ------------ | ------------------------------------- |
| `TNF:AGENT:ORCHESTRATOR:ANTIGRAVITY:001`     | Antigravity         | ORCHESTRATOR | `TNF:SESSION:TELEGRAM:7030202773:001` |
| `TNF:AGENT:VALIDATOR:PICOCLAW-TESTER:001`    | PicoClaw-Tester     | VALIDATOR    | `TNF:SESSION:RAILWAY:TESTER:001`      |
| `TNF:AGENT:CLI_TESTER:PICOCLAW-SUBJECT:001`  | PicoClaw-Subject    | CLI_TESTER   | `TNF:SESSION:RAILWAY:SUBJECT:001`     |
| `TNF:AGENT:RESEARCH:PICOCLAW-PERPLEXITY:001` | PicoClaw-Perplexity | RESEARCH     | `TNF:SESSION:RAILWAY:PERPLEXITY:001`  |

## Migration from Legacy Schema

### Old `agents` Table → New TNF Tables

```sql
-- Step 1: Create agent definition from legacy agent
INSERT INTO tnf_agent_definitions (tnfId, name, agentType, capabilities, ...)
SELECT
  'TNF:AGENT:' || type || ':' || UPPER(REPLACE(name, '-', '_')) || ':001',
  name,
  type,
  capabilities,
  ...
FROM agents;

-- Step 2: Create sessions for active agents
INSERT INTO tnf_agent_sessions (tnfId, agentDefId, status, ...)
SELECT
  'TNF:SESSION:' || platform || ':' || session_key || ':001',
  tad.id,
  'active',
  ...
FROM agent_registrations ar
JOIN tnf_agent_definitions tad ON tad.tnfId LIKE '%:' || a.name;
```

## API Endpoints

### Resolve by tnfId

```
GET /api/v2/entity/:tnfId
```

Returns the full entity record with all relations.

### List by Category

```
GET /api/v2/entities?category=AGENT&status=active
```

### Register New Entity

```
POST /api/v2/entity
{
  "category": "AGENT",
  "provider": "OPENCLAW",
  "name": "NEW-AGENT",
  "agentType": "CLI_CODER",
  ...
}
```

Auto-generates tnfId: `TNF:AGENT:OPENCLAW:NEW-AGENT:001`

## Validation Rules

1. **Uniqueness**: `(category, provider, name, instance)` must be unique
2. **Format**: Regex `^TNF(:[A-Z_]+){3,4}:[0-9]{3}$`
3. **Relations**: Foreign keys must reference valid UUIDs
4. **Scope**: If provided, must be one of: BASE, SYS, USR, EXT

## Implementation Status

| Component             | Status      | Notes                        |
| --------------------- | ----------- | ---------------------------- |
| Schema                | ✅ Complete | `tnf.ts` in database package |
| Migrations            | ⏳ Pending  | Need to run migrations       |
| Seed Data             | ⏳ Pending  | Need to seed existing agents |
| API Endpoints         | ⏳ Pending  | Need to implement REST API   |
| Roll Call Integration | ⏳ Pending  | Need to update cron job      |

## Next Steps

1. Run database migrations to create TNF tables
2. Seed existing agents into new schema
3. Implement `/api/v2/entity/:tnfId` endpoint
4. Update Roll Call to use tnfId format
5. Add tnfId to OpenClaw session metadata
