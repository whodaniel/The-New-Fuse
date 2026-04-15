# Agent Bank & Monetization System

## Overview

The **Agent Bank** is a centralized library of AI agent persona templates and
skills stored within the repository. It allows for dynamic discovery and
adoption of specialized roles by both human users (via the Dashboard) and other
AI agents (via MCP).

To support the SAAS business model of The New Fuse, the Agent Bank is integrated
with a subscription-based monetization layer.

## Architecture

### 1. Unified Storage

Agent definitions are stored in two primary filesystem banks:

- **TNF Bank** (`.agent/agents/*.md`): Core technical and framework-specific
  agents.
- **Claude Bank** (`.claude/agents/*.md`): Specialized business, marketing, and
  niche agents.

### 2. Access Layers

- **REST API**: Exposed via `AgentBankController` at `/api/agents/bank`. This is
  the primary gateway for web-based access.
- **MCP Server**: Exposed via `TheNewFuseMCPServer` using the
  `get_agent_bank_resources` tool. Primarily for inter-agent communication and
  local sessions.

## Monetization & Membership Gating

Access to the agent banks is strictly controlled based on the user's membership
level, as determined by the `PayPalService`.

### Membership Levels

| Tier               | TNF Bank Access | Claude Bank Access | Price (approx)       |
| :----------------- | :-------------: | :----------------: | :------------------- |
| **STARTER**        |     ✅ Full     |   ❌ Restricted    | Free / Community     |
| **PRO**            |     ✅ Full     |      ✅ Full       | $30 / mo             |
| **ENTERPRISE**     |     ✅ Full     |      ✅ Full       | Custom / High Volume |
| **ADMIN / SYSTEM** |     ✅ Full     |      ✅ Full       | N/A                  |

### Gating Logic Implementation

The gating logic is centralized in the `AgentBankService`. When a request is
made from an external network (via REST):

1. The user's JWT is validated.
2. The `PayPalService` checks the current active subscription in the
   `paypal_subscriptions` table.
3. If the user is on the **STARTER** tier and attempts to access the **Claude
   Bank**, a `403 Forbidden` error is returned.
4. Search results for STARTER users are automatically filtered to only show TNF
   agents.

## Technical Components

- **`AgentBankService`**: The core logic handler for scanning directories,
  reading files, and enforcing membership rules.
- **`AgentBankController`**: REST endpoint exposing the bank to the internet.
- **`PayPalService`**: Handles subscription verification and tier resolution.
- **`register-tnf-entities-v2.ts`**: A database script that dynamically scans
  the banks and registers templates in the `tnf_agent_definitions` table,
  ensuring they are available for assignment.

## Adding New Agents

To add a new agent to the bank:

1. Create a new `.md` file in either `.agent/agents/` or `.claude/agents/`.
2. Follow the prompt engineering standards defined in `SYSTEM_PROMPT.md`.
3. Run `pnpm run tnf:onboard` or the registration script to sync the new agent
   with the database registry.

## Usage for AI Agents (MCP)

Agents can discover their peers using:

```typescript
use_mcp_tool({
  server_name: 'browsermcp', // Or the TNF MCP server
  tool_name: 'get_agent_bank_resources',
  arguments: {
    action: 'list',
    resourceType: 'agents',
    bank: 'all',
  },
});
```

_Note: MCP tools used within local sessions typically operate with ADMIN
privileges, while remote MCP calls follow the specific grant policies of the
caller._
