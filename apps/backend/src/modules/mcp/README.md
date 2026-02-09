# MCP (Model Context Protocol) Integration for The New Fuse

Complete MCP integration enabling standardized agent communication and tool execution in The New Fuse platform.

## Overview

The MCP integration provides:

- **MCP Server**: Full-featured server implementation with tool and resource registration
- **Tool Registry**: 15+ tools organized into functional groups (workflow, task, agent, resource, communication, system)
- **MCP-A2A Bridge**: Seamless integration between MCP and Agent-to-Agent protocols
- **Client Examples**: Sample agents demonstrating coordination patterns
- **Integration Tests**: Comprehensive test suite covering all features

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     The New Fuse Backend                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ MCP Server   │◄────►│ Tool Registry│                    │
│  │  Service     │      │   Service    │                    │
│  └──────┬───────┘      └──────────────┘                    │
│         │                                                   │
│         │              ┌──────────────┐                    │
│         └─────────────►│ MCP-A2A      │                    │
│                        │   Bridge     │                    │
│                        └──────┬───────┘                    │
│                               │                             │
│                               ▼                             │
│                        ┌──────────────┐                    │
│                        │   A2A System │                    │
│                        └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                         │              │
                         ▼              ▼
              ┌──────────────┐  ┌──────────────┐
              │ MCP Clients  │  │  A2A Agents  │
              │   (Agents)   │  │              │
              └──────────────┘  └──────────────┘
```

## Features

### 1. MCP Server

The MCP server provides:

- **Multiple client connections** (configurable, default 100)
- **Tool registration and execution**
- **Resource access** (workflows, agents, status)
- **Event-driven architecture**
- **Metrics and monitoring**
- **CORS support**

### 2. Tool Registry

**Workflow Tools** (4 tools):
- `workflow.create` - Create new workflows
- `workflow.execute` - Execute workflows
- `workflow.list` - List available workflows
- `workflow.status` - Get workflow execution status

**Task Tools** (3 tools):
- `task.create` - Create and assign tasks
- `task.status` - Get task status
- `task.update` - Update task progress/status

**Agent Tools** (3 tools):
- `agent.message` - Send messages between agents
- `agent.discover` - Discover agents by capability
- `agent.register_capability` - Register agent capabilities

**Resource Tools** (2 tools):
- `resource.read` - Read resources by URI
- `resource.list` - List available resources

**Communication Tools** (2 tools):
- `communication.broadcast` - Broadcast to multiple agents
- `communication.subscribe` - Subscribe to event streams

**System Tools** (2 tools):
- `system.health` - Get system health status
- `system.metrics` - Get system metrics

### 3. MCP-A2A Bridge

Bridges Model Context Protocol and Agent-to-Agent protocols:

- **Agent Registration**: Register A2A agents as MCP services
- **Message Translation**: Automatic protocol translation
- **Unified Discovery**: Discover agents across both protocols
- **Collaboration**: Cross-protocol agent collaboration
- **Routing**: Intelligent message routing

## Installation

The MCP module is included in the backend. To enable it:

1. **Add to app.module.ts**:

```typescript
import { MCPModule } from './modules/mcp/mcp.module';

@Module({
  imports: [
    // ... other modules
    MCPModule,
  ],
})
export class AppModule {}
```

2. **Configure environment variables**:

```bash
# .env
MCP_HOST=0.0.0.0
MCP_PORT=3100
MCP_MAX_CONNECTIONS=100
MCP_TIMEOUT=30000
MCP_ENABLE_CORS=true
MCP_ENABLE_METRICS=true
MCP_LOG_LEVEL=info
```

3. **Start the server**:

```bash
npm run start:dev
```

The MCP server will start on `ws://localhost:3100`

## Usage

### Server-Side Usage

#### Accessing Services

```typescript
import { MCPServerService } from './modules/mcp/mcp-server.service';
import { MCPToolRegistry } from './modules/mcp/mcp-tool-registry.service';
import { MCPA2ABridge } from './modules/mcp/mcp-a2a-bridge.service';

@Injectable()
export class MyService {
  constructor(
    private readonly mcpServer: MCPServerService,
    private readonly toolRegistry: MCPToolRegistry,
    private readonly bridge: MCPA2ABridge,
  ) {}

  async registerCustomTool() {
    this.toolRegistry.registerTool({
      name: 'my_custom_tool',
      description: 'My custom tool',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
        },
        required: ['param1'],
      },
      handler: async (params) => {
        // Tool implementation
        return { result: 'success' };
      },
    });
  }
}
```

### Client-Side Usage

#### Creating an MCP Client Agent

```typescript
import { MCPClient } from '@the-new-fuse/mcp-core/client';

const client = new MCPClient({
  name: 'my-agent',
  version: '1.0.0',
  timeout: 30000,
});

await client.connect('ws://localhost:3100');

// Call a tool
const result = await client.callTool('workflow.create', {
  name: 'My Workflow',
  description: 'A test workflow',
});

// Read a resource
const workflows = await client.readResource('fuse://workflows');

// Disconnect
await client.disconnect();
```

### HTTP API Usage

The MCP controller provides HTTP endpoints:

```bash
# Get server status
curl http://localhost:3000/mcp/status

# List all tools
curl http://localhost:3000/mcp/tools

# Get tools by group
curl http://localhost:3000/mcp/tools?group=workflow

# Discover agents
curl http://localhost:3000/mcp/agents/discover?capability=data_processing

# Register an A2A agent
curl -X POST http://localhost:3000/mcp/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my_agent",
    "name": "My Agent",
    "capabilities": ["data_processing"],
    "tools": ["process_data"]
  }'

# Send message between agents
curl -X POST http://localhost:3000/mcp/agents/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "agent_1",
    "to": "agent_2",
    "message": "Hello!",
    "priority": "normal"
  }'

# Start collaboration
curl -X POST http://localhost:3000/mcp/collaborations/start \
  -H "Content-Type: application/json" \
  -d '{
    "agentIds": ["agent_1", "agent_2", "agent_3"],
    "initiatorId": "agent_1",
    "purpose": "Data processing workflow"
  }'
```

## Examples

### Example 1: Coordinator Agent

```typescript
import { CoordinatorAgent } from './examples/coordinator-agent';

const agent = new CoordinatorAgent('coordinator_001', 'ws://localhost:3100');

const result = await agent.coordinateWorkflow('Data Processing Pipeline', {
  sourceData: 'https://api.example.com/data',
  transformations: ['normalize', 'aggregate'],
  outputFormat: 'json',
});

console.log('Workflow completed:', result);
await agent.disconnect();
```

### Example 2: Data Processing Agent

```typescript
import { DataProcessingAgent } from './examples/data-processing-agent';

const agent = new DataProcessingAgent('processor_001', 'ws://localhost:3100');

// Agent automatically handles task assignments
// and processes data in the background

const status = await agent.getStatus();
console.log('Agent status:', status);
```

### Example 3: Multi-Agent Coordination

```typescript
import { runMultiAgentCoordination } from './examples/multi-agent-coordination';

// Run complete multi-agent workflow with:
// - Data fetching
// - Data processing
// - Analytics
// - Report generation
await runMultiAgentCoordination();
```

## Agent Communication Patterns

### 1. Request-Response

```typescript
// Agent A requests data from Agent B
const response = await client.callTool('agent.message', {
  targetAgent: 'agent_b',
  message: { request: 'getData', id: '123' },
  messageType: 'request',
  requiresResponse: true,
});
```

### 2. Broadcast

```typescript
// Coordinator broadcasts to all workers
await client.callTool('communication.broadcast', {
  message: { command: 'start', workflowId: 'wf_001' },
  targets: ['worker_1', 'worker_2', 'worker_3'],
  priority: 'high',
});
```

### 3. Collaboration

```typescript
// Start multi-agent collaboration
const collaboration = await bridge.startCollaboration(
  ['agent_1', 'agent_2', 'agent_3'],
  'agent_1',
  'Complex data processing task'
);

// ... work happens ...

// End collaboration
await bridge.endCollaboration(collaboration.collaborationId);
```

### 4. Event-Driven

```typescript
// Subscribe to events
await client.callTool('communication.subscribe', {
  eventType: 'workflow.completed',
  filter: { priority: 'high' },
});

// React to events
client.on('notification', (event) => {
  if (event.method === 'workflow.completed') {
    // Handle completion
  }
});
```

## Testing

### Run Integration Tests

```bash
# Run all tests
npm test apps/backend/src/modules/mcp

# Run with coverage
npm test -- --coverage apps/backend/src/modules/mcp

# Run load tests
RUN_LOAD_TESTS=true npm test apps/backend/src/modules/mcp
```

### Test Coverage

The test suite includes:

- ✅ Server initialization
- ✅ Tool registration and execution
- ✅ Resource access
- ✅ MCP-A2A bridge functionality
- ✅ Multi-agent coordination
- ✅ Error handling
- ✅ Performance tests
- ✅ Load tests (100 concurrent connections)

## Advanced Features

### Custom Tool Registration

```typescript
// Register a custom tool at runtime
toolRegistry.registerTool({
  name: 'custom.analyze',
  description: 'Custom data analysis tool',
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'array' },
      algorithm: { type: 'string', enum: ['ml', 'statistical'] },
    },
    required: ['data'],
  },
  handler: async (params) => {
    // Custom implementation
    return { analysis: 'result' };
  },
});
```

### Custom Resource Registration

```typescript
// Register a custom resource
await mcpServer.getServer().registerResource({
  uri: 'fuse://custom/data',
  name: 'custom_data',
  description: 'Custom data resource',
  handler: async () => {
    return {
      uri: 'fuse://custom/data',
      mimeType: 'application/json',
      text: JSON.stringify({ custom: 'data' }),
    };
  },
});
```

### Bridge Configuration

```typescript
// Configure MCP-A2A bridge
const customBridge = new MCPA2ABridge(mcpServer);

// Register agent with custom configuration
await customBridge.registerA2AAgent({
  id: 'custom_agent',
  name: 'Custom Agent',
  capabilities: ['custom_capability'],
  metadata: {
    specialConfig: 'value',
  },
});
```

## Performance Considerations

- **Connection Pooling**: Server supports up to 100 concurrent connections (configurable)
- **Tool Caching**: Tool definitions are cached for fast lookup
- **Async Execution**: All tool handlers are async
- **Retry Logic**: Built-in retry with exponential backoff
- **Resource Streaming**: Large resources support streaming

## Troubleshooting

### Server Won't Start

Check:
1. Port 3100 is not already in use
2. Environment variables are set correctly
3. Dependencies are installed (`npm install`)

### Agent Can't Connect

Check:
1. Server is running
2. Endpoint URL is correct (`ws://localhost:3100`)
3. Firewall allows WebSocket connections

### Tool Execution Fails

Check:
1. Tool name is correct
2. Required parameters are provided
3. Parameter types match schema
4. Tool handler doesn't throw errors

### Memory Issues

For high-load scenarios:
1. Increase Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096`
2. Reduce `MCP_MAX_CONNECTIONS`
3. Implement tool result caching

## API Reference

See:
- [MCP Server API](./docs/server-api.md)
- [Tool Registry API](./docs/tool-registry-api.md)
- [Bridge API](./docs/bridge-api.md)

## Contributing

When adding new tools:

1. Add tool definition to appropriate group in `mcp-tool-registry.service.ts`
2. Implement tool handler
3. Add tests to `tests/mcp-integration.test.ts`
4. Update documentation

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [https://github.com/the-new-fuse/issues](https://github.com/the-new-fuse/issues)
- Documentation: [https://docs.thenewfuse.com](https://docs.thenewfuse.com)
