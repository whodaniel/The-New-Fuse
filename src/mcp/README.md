# MCP Integration in The New Fuse

This directory contains the implementation of the Model Context Protocol (MCP) in The New Fuse.

## Overview

The New Fuse serves as the primary MCP server in this architecture, while also being able to act as an MCP client to other MCP servers. This dual role creates a powerful ecosystem for AI agent coordination and communication.

## Directory Structure

- `MCPServer.ts` - Base class for all MCP servers
- `MCPAgentServer.ts` - MCP server for agent-related capabilities
- `MCPChatServer.ts` - MCP server for chat-related capabilities
- `MCPWorkflowServer.ts` - MCP server for workflow-related capabilities
- `MCPFuseServer.ts` - MCP server for Fuse-specific capabilities
- `mcp.module.ts` - NestJS module that provides all MCP server implementations
- `mcp.controller.ts` - NestJS controller that exposes MCP capabilities via REST API
- `services/` - Directory containing MCP-related services
  - `mcp-broker.service.ts` - Central broker for all MCP communication
  - `director-agent.service.ts` - Main agent that coordinates all MCP operations

## Key Components

### MCP Broker Service

The `MCPBrokerService` is the central hub for all MCP communication. It:

- Provides a unified interface for executing MCP directives
- Routes messages to the appropriate MCP server
- Handles communication via Redis for distributed setups
- Manages message passing between MCP servers and agents

### Director Agent Service

The `DirectorAgentService` is the primary agent that coordinates all MCP operations. It:

- Manages tasks and their lifecycle
- Assigns tasks to appropriate agents
- Monitors task execution
- Provides a high-level interface for task management

### MCP Servers

The MCP servers provide the actual implementation of MCP capabilities and tools:

- `MCPAgentServer`: Agent-related capabilities
- `MCPChatServer`: Chat-related capabilities
- `MCPWorkflowServer`: Workflow-related capabilities
- `MCPFuseServer`: Fuse-specific capabilities

## Client-Server Relationships

The New Fuse can act as both an MCP server and an MCP client:

- As a server, it provides MCP capabilities to external systems
- As a client, it consumes MCP capabilities from external systems
- All agents within The New Fuse inherit these client-server relationships

## Adding a New MCP Server

To add a new MCP server:

1. Create a new class that extends `MCPServer`
2. Register it in the `MCPModule`
3. Add it to the `MCPBrokerService` constructor

Example:

```typescript
// 1. Create the server
@Injectable()
export class MCPNewServer extends MCPServer {
  constructor() {
    super({
      capabilities: {
        // Define capabilities
      },
      tools: {
        // Define tools
      }
    });
  }
}

// 2. Register in MCPModule
@Module({
  providers: [
    // ...
    MCPNewServer
  ],
  exports: [
    // ...
    MCPNewServer
  ]
})
export class MCPModule {}

// 3. Add to MCPBrokerService
constructor(
  // ...
  private readonly newServer: MCPNewServer
) {
  // ...
  this.servers.set('new', this.newServer);
}
```

## Configuration

The MCP integration uses Redis for distributed communication. The Redis connection is configured through environment variables:

- `REDIS_URL`: URL of the Redis server (default: `redis://localhost:6379`)
- `INSTANCE_ID`: Unique identifier for this instance (default: `default`)

## Further Documentation

For more detailed information about the MCP integration, see:

- [MCP NestJS Integration](../../docs/mcp-nestjs-integration.md) - Detailed documentation of the MCP architecture
- [MCP Configuration](../../mcp_config.README.md) - Documentation of the MCP configuration file
