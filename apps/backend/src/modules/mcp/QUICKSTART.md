# MCP Integration - Quick Start Guide

Get up and running with MCP in The New Fuse in 5 minutes.

## 1. Installation

The MCP module is already included in the backend. Just enable it:

```typescript
// apps/backend/src/app.module.ts
import { MCPModule } from './modules/mcp/mcp.module';

@Module({
  imports: [
    // ... other modules
    MCPModule,  // Add this line
  ],
})
export class AppModule {}
```

## 2. Configuration

Add to your `.env` file:

```bash
# MCP Configuration
MCP_HOST=0.0.0.0
MCP_PORT=3100
MCP_MAX_CONNECTIONS=100
MCP_TIMEOUT=30000
MCP_ENABLE_CORS=true
MCP_ENABLE_METRICS=true
MCP_LOG_LEVEL=info
```

## 3. Start the Server

```bash
npm run start:dev
```

You should see:
```
[MCPServerService] MCP Server started on 0.0.0.0:3100
[MCPToolRegistry] Registered 16 MCP tools
```

## 4. Test the Server

### Using HTTP API

```bash
# Check server status
curl http://localhost:3000/mcp/status

# List available tools
curl http://localhost:3000/mcp/tools

# Discover agents
curl http://localhost:3000/mcp/agents/discover
```

### Using MCP Client

Create a test file `test-client.ts`:

```typescript
import { MCPClient } from '@the-new-fuse/mcp-core/client';

async function testMCP() {
  const client = new MCPClient({
    name: 'test-client',
    version: '1.0.0',
  });

  await client.connect('ws://localhost:3100');

  // Test workflow tool
  const result = await client.callTool('workflow.list', {});
  console.log('Workflows:', result);

  // Test system health
  const health = await client.callTool('system.health', {});
  console.log('Health:', health);

  await client.disconnect();
}

testMCP();
```

Run it:
```bash
npx ts-node test-client.ts
```

## 5. Create Your First Agent

```typescript
import { MCPClient } from '@the-new-fuse/mcp-core/client';

class MyFirstAgent {
  private client: MCPClient;
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.client = new MCPClient({
      name: `my-agent-${agentId}`,
      version: '1.0.0',
    });
  }

  async start() {
    await this.client.connect('ws://localhost:3100');
    console.log(`Agent ${this.agentId} connected`);

    // Discover other agents
    const agents = await this.client.callTool('agent.discover', {
      status: 'active',
    });
    console.log('Found agents:', agents.result.agents);

    // Create a workflow
    const workflow = await this.client.callTool('workflow.create', {
      name: 'My First Workflow',
      description: 'Testing MCP integration',
    });
    console.log('Created workflow:', workflow.result);
  }

  async stop() {
    await this.client.disconnect();
    console.log(`Agent ${this.agentId} disconnected`);
  }
}

// Run it
const agent = new MyFirstAgent('agent_001');
agent.start().then(() => {
  setTimeout(() => agent.stop(), 5000);
});
```

## 6. Register an A2A Agent via HTTP

```bash
curl -X POST http://localhost:3000/mcp/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my_first_agent",
    "name": "My First Agent",
    "capabilities": ["data_processing", "api_integration"],
    "tools": ["process_data", "fetch_api"]
  }'
```

Expected response:
```json
{
  "success": true,
  "endpoint": "mcp://agent/my_first_agent"
}
```

## 7. Send Messages Between Agents

```bash
curl -X POST http://localhost:3000/mcp/agents/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "my_first_agent",
    "to": "another_agent",
    "message": "Hello from my first agent!",
    "messageType": "notification",
    "priority": "normal"
  }'
```

## 8. Run Example Agents

The module includes complete examples:

```typescript
// Example 1: Coordinator Agent
import { runCoordinatorExample } from './modules/mcp/examples/coordinator-agent';
await runCoordinatorExample();

// Example 2: Data Processing Agent
import { runDataProcessingExample } from './modules/mcp/examples/data-processing-agent';
await runDataProcessingExample();

// Example 3: API Integration Agent
import { runAPIIntegrationExample } from './modules/mcp/examples/api-integration-agent';
await runAPIIntegrationExample();

// Example 4: Multi-Agent Coordination
import { runMultiAgentCoordination } from './modules/mcp/examples/multi-agent-coordination';
await runMultiAgentCoordination();
```

## 9. Run Integration Tests

```bash
# Run all MCP tests
npm test apps/backend/src/modules/mcp

# Run with coverage
npm test -- --coverage apps/backend/src/modules/mcp
```

## 10. Next Steps

- ✅ Server running and tools registered
- ✅ First agent created and tested
- ✅ Agent-to-agent communication working

Now explore:

1. **Custom Tools**: Add your own tools to the registry
2. **Advanced Coordination**: Try multi-agent workflows
3. **A2A Bridge**: Integrate with existing A2A agents
4. **Monitoring**: Use the metrics and health endpoints

## Common Commands

```bash
# Check server status
curl http://localhost:3000/mcp/status

# List tools
curl http://localhost:3000/mcp/tools

# List tool groups
curl http://localhost:3000/mcp/groups

# Get bridge statistics
curl http://localhost:3000/mcp/bridge/stats

# Discover agents
curl http://localhost:3000/mcp/agents/discover

# Get tool by name
curl http://localhost:3000/mcp/tools/workflow.create
```

## Troubleshooting

### Port 3100 already in use

Change the port in `.env`:
```bash
MCP_PORT=3101
```

### Can't connect to server

1. Check server is running: `curl http://localhost:3000/mcp/status`
2. Check firewall settings
3. Verify WebSocket endpoint: `ws://localhost:3100`

### Tool execution fails

1. Check tool exists: `curl http://localhost:3000/mcp/tools`
2. Verify parameters match schema
3. Check server logs for errors

## Resources

- [Full Documentation](./README.md)
- [Example Agents](./examples/)
- [Integration Tests](./tests/)
- [API Reference](./docs/api-reference.md)

## Support

Having issues? Create an issue on GitHub or check the documentation.

---

**Congratulations!** You now have MCP fully integrated into The New Fuse. 🎉
