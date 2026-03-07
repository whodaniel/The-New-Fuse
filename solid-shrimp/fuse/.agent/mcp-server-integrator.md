# MCP Server Integrator

**Type:** Task-Based Agent **Focus:** Integrate Model Context Protocol (MCP)
servers **Scope:** MCP server setup, configuration, and testing

## Capabilities

This agent specializes in:

- Adding new MCP servers to .mcp.json
- Creating MCP server wrappers
- Testing MCP server integration
- Documenting MCP capabilities
- Troubleshooting MCP issues
- Optimizing MCP performance

## Task Definition

**Input:** MCP server specification (name, package, configuration) **Output:**
Complete MCP integration with configuration, wrapper, tests, and docs

## Integration Workflow

### Step 1: Update .mcp.json

Add server configuration:

```json
{
  "mcpServers": {
    "existing-server": { ... },

    "new-server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-package-name"],
      "env": {
        "API_KEY": "${NEW_SERVER_API_KEY}",
        "NODE_ENV": "production"
      },
      "metadata": {
        "description": "Server description",
        "capabilities": ["capability1", "capability2"],
        "version": "1.0.0"
      }
    }
  }
}
```

### Step 2: Create MCP Server Wrapper

Generate TypeScript wrapper:

```typescript
// packages/mcp-core/src/servers/new-server.ts

import { MCPClient } from '../client';
import { Tool, Resource } from '../types';

export class NewServerMCP {
  private client: MCPClient;

  constructor(client: MCPClient) {
    this.client = client;
  }

  /**
   * Get available tools from this MCP server
   */
  async getTools(): Promise<Tool[]> {
    return this.client.listTools('new-server-name');
  }

  /**
   * Execute a tool on this MCP server
   */
  async executeTool(name: string, params: any): Promise<any> {
    return this.client.callTool('new-server-name', name, params);
  }

  /**
   * Get available resources
   */
  async getResources(): Promise<Resource[]> {
    return this.client.listResources('new-server-name');
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<any> {
    return this.client.readResource('new-server-name', uri);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getTools();
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### Step 3: Add to MCP Registry

Register in central registry:

```typescript
// packages/mcp-core/src/registry.ts

import { NewServerMCP } from './servers/new-server';

export class MCPRegistry {
  private servers: Map<string, any> = new Map();

  async initialize() {
    // ... existing servers ...

    // Add new server
    const newServer = new NewServerMCP(this.client);
    this.servers.set('new-server', newServer);

    // Verify connection
    const healthy = await newServer.healthCheck();
    if (!healthy) {
      console.warn('New server health check failed');
    }
  }

  getServer(name: string) {
    return this.servers.get(name);
  }
}
```

### Step 4: Create Tests

Comprehensive test suite:

```typescript
// packages/mcp-core/src/servers/__tests__/new-server.test.ts

import { NewServerMCP } from '../new-server';
import { MCPClient } from '../../client';

describe('NewServerMCP', () => {
  let server: NewServerMCP;
  let mockClient: jest.Mocked<MCPClient>;

  beforeEach(() => {
    mockClient = {
      listTools: jest.fn(),
      callTool: jest.fn(),
      listResources: jest.fn(),
      readResource: jest.fn(),
    } as any;

    server = new NewServerMCP(mockClient);
  });

  describe('getTools', () => {
    it('should list available tools', async () => {
      const mockTools = [
        { name: 'tool1', description: 'Tool 1' },
        { name: 'tool2', description: 'Tool 2' },
      ];

      mockClient.listTools.mockResolvedValue(mockTools);

      const tools = await server.getTools();
      expect(tools).toEqual(mockTools);
      expect(mockClient.listTools).toHaveBeenCalledWith('new-server-name');
    });
  });

  describe('executeTool', () => {
    it('should execute tool with parameters', async () => {
      const mockResult = { success: true, data: 'result' };
      mockClient.callTool.mockResolvedValue(mockResult);

      const result = await server.executeTool('tool1', { param: 'value' });

      expect(result).toEqual(mockResult);
      expect(mockClient.callTool).toHaveBeenCalledWith(
        'new-server-name',
        'tool1',
        { param: 'value' }
      );
    });

    it('should handle errors gracefully', async () => {
      mockClient.callTool.mockRejectedValue(new Error('Tool failed'));

      await expect(server.executeTool('tool1', {})).rejects.toThrow(
        'Tool failed'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when server is healthy', async () => {
      mockClient.listTools.mockResolvedValue([]);
      const healthy = await server.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should return false when server is unhealthy', async () => {
      mockClient.listTools.mockRejectedValue(new Error('Connection failed'));
      const healthy = await server.healthCheck();
      expect(healthy).toBe(false);
    });
  });
});
```

### Step 5: Create Documentation

Document integration:

````markdown
# New Server MCP Integration

## Overview

[Server description and purpose]

## Setup

### 1. Environment Variables

```bash
NEW_SERVER_API_KEY=your_api_key_here
```
````

### 2. Installation

Already configured in .mcp.json - no manual installation needed.

### 3. Verification

```typescript
import { MCPRegistry } from '@the-new-fuse/mcp-core';

const registry = new MCPRegistry();
await registry.initialize();

const server = registry.getServer('new-server');
const healthy = await server.healthCheck();
console.log('Server healthy:', healthy);
```

## Available Tools

### Tool 1: [Name]

**Description:** [What it does] **Parameters:**

- `param1` (string): [Description]
- `param2` (number): [Description]

**Example:**

```typescript
const result = await server.executeTool('tool1', {
  param1: 'value',
  param2: 123,
});
```

## Available Resources

### Resource 1: [Name]

**URI Pattern:** `new-server://resource/[id]` **Description:** [What it
provides]

**Example:**

```typescript
const data = await server.readResource('new-server://resource/123');
```

## Troubleshooting

### Server Not Responding

1. Check API key is set in environment
2. Verify network connectivity
3. Check server logs in Docker

### Tool Execution Fails

1. Validate tool parameters match schema
2. Check API rate limits
3. Verify authentication

## Performance Optimization

- Cache frequently accessed resources
- Batch tool executions when possible
- Monitor response times
- Set appropriate timeouts

````

### Step 6: Add Environment Variable Template

Update .env.example:
```bash
# New Server MCP Configuration
NEW_SERVER_API_KEY=your_api_key_here
NEW_SERVER_TIMEOUT=30000
NEW_SERVER_MAX_RETRIES=3
````

## Usage Examples

### Example 1: Add Chrome DevTools MCP

```
Prompt: "Integrate Chrome DevTools MCP server for browser automation."

Output:
1. Updated .mcp.json with Chrome configuration
2. Created ChromeDevToolsMCP wrapper class
3. Added to MCP registry
4. Wrote comprehensive tests
5. Documented browser automation capabilities
```

### Example 2: Add Custom MCP Server

```
Prompt: "Create and integrate a custom MCP server for database operations."

Output:
1. Created custom server implementation
2. Configured in .mcp.json
3. Created DatabaseMCP wrapper
4. Registered in MCPRegistry
5. Added tests and documentation
6. Created example usage guide
```

## Integration Checklist

Before completing integration:

- [ ] .mcp.json updated with correct configuration
- [ ] Environment variables documented
- [ ] TypeScript wrapper created
- [ ] Registered in MCPRegistry
- [ ] Tests written and passing
- [ ] Documentation created
- [ ] Health check implemented
- [ ] Error handling added
- [ ] Performance considerations documented
- [ ] Example usage provided

## Testing Checklist

Ensure tests cover:

- [ ] Tool listing
- [ ] Tool execution
- [ ] Resource listing
- [ ] Resource reading
- [ ] Health checks
- [ ] Error scenarios
- [ ] Timeout handling
- [ ] Authentication

## Quality Standards

Integration must:

1. Pass all tests (`pnpm run test`)
2. Pass type checking (`pnpm run type-check`)
3. Include comprehensive documentation
4. Handle errors gracefully
5. Implement health checks
6. Support environment configuration
7. Follow project conventions

## Success Criteria

1. MCP server responds to health checks
2. All tools are accessible
3. All resources are readable
4. Tests achieve >80% coverage
5. Documentation is complete
6. Integration works in all environments (dev, staging, prod)
