# The New Fuse MCP Server

Complete Model Context Protocol implementation for The New Fuse platform.

## Features

- **Agent Management**: Create, update, and control AI agents
- **Chat Operations**: Manage chat rooms and messaging
- **Workflow Execution**: Create and execute complex workflows
- **Monitoring**: System health and performance metrics
- **Automation**: Claude Dev automation templates

## Quick Start

### 1. Install Dependencies
```bash
yarn install
```

### 2. Build the MCP Server
```bash
npm run mcp:build
```

### 3. Start Development Mode
```bash
npm run mcp:dev
```

### 4. Test the Server
```bash
npm run mcp:test
```

## Usage

### Local Development (stdio)
```bash
npm run mcp:start
```

### Production (HTTP/SSE)
```bash
npm run mcp:start:remote [port]
```

### Development with Auto-reload
```bash
npm run mcp:dev
```

## Available Tools

The MCP server exposes 20+ tools across different categories:

### Agent Management
- `tnf_create_agent` - Create new AI agents
- `tnf_list_agents` - List all agents
- `tnf_get_agent` - Get agent details
- `tnf_update_agent` - Update agent configuration
- `tnf_execute_agent_task` - Execute tasks with agents
- `tnf_delete_agent` - Remove agents

### Chat Operations
- `tnf_create_chat_room` - Create chat rooms
- `tnf_list_chat_rooms` - List available rooms
- `tnf_send_message` - Send messages
- `tnf_get_messages` - Retrieve chat history
- `tnf_get_chat_analytics` - Chat statistics

### Workflow Management
- `tnf_create_workflow` - Create new workflows
- `tnf_list_workflows` - List all workflows
- `tnf_execute_workflow` - Execute workflows
- `tnf_get_workflow_status` - Check execution status
- `tnf_control_workflow` - Control workflow execution

### Monitoring & Analytics
- `tnf_get_system_health` - System health status
- `tnf_get_metrics` - Performance metrics
- `tnf_get_usage_stats` - Usage statistics

### Automation
- `tnf_list_automation_templates` - List templates
- `tnf_execute_automation` - Execute automations

## Configuration

The server uses environment variables for configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `NODE_ENV`: Environment (development, production)

## Claude Desktop Integration

The server is automatically configured for Claude Desktop. After setup:

1. Restart Claude Desktop
2. The server will appear as "the-new-fuse-main" in your MCP servers
3. You can use all TNF tools directly in Claude

## Example Usage in Claude

```
# Create a new agent
Create an agent named "DataAnalyst" of type "analysis" with capabilities for data processing

# Send a chat message
Send a message "Hello team!" to room "general-chat"

# Execute a workflow
Execute workflow "data-processing-pipeline" with input data from the uploaded CSV

# Get system health
Show me the current system health status with deep checks enabled

# Create automation
Execute the "code-review" automation template with the current repository as input
```

## Development

### File Structure
```
src/mcp/
├── TheNewFuseMCPServer.ts  # Main server implementation
├── server.ts               # Entry point
├── tsconfig.json          # TypeScript config
└── README.md              # This file

dist/mcp/
├── TheNewFuseMCPServer.js  # Compiled server
└── server.js              # Compiled entry point
```

### Adding New Tools

1. Define schema in `TheNewFuseMCPServer.ts`
2. Add tool definition to `setupToolHandlers()`
3. Implement handler method
4. Add case in tool call router
5. Rebuild and test

### Testing

Use the MCP Inspector for interactive testing:
```bash
npx @modelcontextprotocol/inspector dist/mcp/server.js
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure TypeScript dependencies are installed
2. **Permission Errors**: Run `chmod +x` on shell scripts
3. **Connection Issues**: Check database and Redis connectivity
4. **Claude Desktop Not Seeing Server**: Restart Claude Desktop after config changes

### Debug Mode

Set `LOG_LEVEL=debug` for detailed logging:
```bash
LOG_LEVEL=debug npm run mcp:start
```

## Integration with Your Services

To integrate with your actual services, modify the service injection in `TheNewFuseMCPServer.ts`:

```typescript
// In your NestJS module
const mcpServer = new TheNewFuseMCPServer();
mcpServer.setServices({
  agent: agentService,
  chat: chatService,
  workflow: workflowService,
  monitoring: monitoringService,
  claudeDev: claudeDevService
});
```

This replaces the mock implementations with your actual service instances.
