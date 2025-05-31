# Agent Registration Protocol

This document describes the standard protocol for registering AI agents in The New Fuse platform and making their tools available to other agents.

## Overview

The agent registration protocol provides a standardized way for AI agents to:

1. Register themselves in the database
2. Discover and register their available tools
3. Make these tools available to other agents
4. Discover other agents and their capabilities

This protocol ensures that all agents in the system can be properly discovered, monitored, and utilized.

## Registration Process

### 1. Agent Registration

An agent registers itself by providing:

- **Name**: Unique identifier for the agent
- **Description**: Brief description of the agent's purpose
- **Type**: Type of agent (CHAT, TASK, ANALYSIS)
- **Capabilities**: List of capabilities the agent provides
- **Tools**: List of tools the agent has access to

Example:

```typescript
const agent = await agentDiscoveryService.registerAgent(
  'Augment',
  'Augment AI Assistant by Augment Code',
  AgentType.ANALYSIS,
  adminUserId,
  ['code_analysis', 'code_generation', 'documentation'],
  mcpTools
);
```

### 2. Tool Discovery

Agents discover available tools through the MCP Broker:

```typescript
const mcpTools = await agentDiscoveryService.discoverMCPTools();
```

This returns a structured list of all available MCP tools, categorized by server.

### 3. Tool Registration

Agents can register their tools with the system:

```typescript
await agentDiscoveryService.updateAgentTools(agentId, tools);
```

### 4. Agent Discovery

Other agents can discover registered agents:

```typescript
const agents = await agentDiscoveryService.discoverAgents();
```

## Database Schema

Agents are stored in the database with the following schema:

```prisma
model Agent {
  id          String       @id @default(uuid())
  name        String
  description String?
  type        AgentType    @default(CHAT)
  config      Json?        // Contains capabilities and tools
  userId      String
  status      AgentStatus  @default(ACTIVE)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  user        User         @relation(fields: [userId], references: [id])
  metrics     CodeMetrics?
}
```

The `config` field contains a JSON object with:

- **capabilities**: List of agent capabilities
- **tools**: Structured list of tools the agent has access to
- **metadata**: Additional metadata about the agent

## API Endpoints

The following API endpoints are available for agent registration and discovery:

- **POST /agent-discovery/register**: Register a new agent
- **GET /agent-discovery/tools**: Discover all MCP tools
- **GET /agent-discovery/agents**: Discover all registered agents
- **POST /agent-discovery/agents/:id/tools**: Update agent tools

## Example: Registering Augment

Augment is registered using the standard protocol:

1. Discover all available MCP tools
2. Register Augment with its capabilities
3. Make Augment's tools available to other agents

```typescript
// Discover MCP tools
const mcpTools = await agentDiscoveryService.discoverMCPTools();

// Register Augment
const augmentAgent = await agentDiscoveryService.registerAgent(
  'Augment',
  'Augment AI Assistant by Augment Code, based on Claude 3.7 Sonnet',
  AgentType.ANALYSIS,
  adminUserId,
  [
    'code_analysis',
    'code_generation',
    'documentation',
    'refactoring',
    'debugging',
    'testing'
  ],
  mcpTools
);
```

## Conclusion

This standardized registration protocol ensures that all agents in The New Fuse platform can be properly discovered, monitored, and utilized. By following this protocol, agents can seamlessly integrate with the platform and make their capabilities available to other agents.
