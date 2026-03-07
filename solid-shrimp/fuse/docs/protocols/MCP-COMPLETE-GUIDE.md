# Model Context Protocol (MCP) - Complete Guide

## Overview

The Model Context Protocol (MCP) is a standardized communication protocol for inter-LLM communication in The New Fuse framework. It provides a unified interface for AI agents to access tools, resources, and capabilities through WebSocket and JSON-RPC communication.

## Understanding MCP Architecture

### What is MCP?

The Model Context Protocol (MCP) is a standardized communication protocol that allows different AI models and agents to:
- Share context across interactions
- Execute specialized capabilities
- Coordinate on complex tasks
- Access external tools and resources

### MCP Capability Providers vs. Traditional Servers

#### Traditional Servers
- Run continuously as long-lived processes
- Listen on specific ports
- Accept connections from clients
- Maintain state between connections

#### MCP Capability Providers
- Expose functionality through the MCP protocol
- Are invoked on-demand when needed by an LLM
- Execute specific commands when called
- Don't need to "run" continuously
- Provide a standardized interface for LLMs to access tools

## Core Components

### 1. WebSocket Protocol Layer

- Real-time bidirectional communication
- Automatic reconnection handling
- Heartbeat mechanism for connection health
- Comprehensive error handling and logging
- Event-based message routing system

### 2. MCP Broker Service

- Central hub for MCP communication
- Routes messages between components
- Manages server registration and discovery
- Handles capability resolution
- Provides task distribution

### 3. Director Agent Service

- Primary agent coordination
- Task lifecycle management
- Resource allocation
- Performance monitoring
- Error recovery

## MCP Configuration Management

### Configuration Structure

The MCP configuration follows a hierarchical structure:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "CUSTOM_VAR": "value"
      }
    }
  }
}
```

### Using the MCP Configuration Manager

The MCP Configuration Manager is a CLI tool that helps you manage MCP server configurations in JSON files. It can:

- List existing MCP capability providers
- Add new MCP capability providers 
- Update existing MCP capability providers
- Remove MCP capability providers

#### Interactive Mode

For a user-friendly interface, run the wizard in interactive mode:

```bash
./scripts/run-mcp-wizard.sh
```

This will guide you through:
1. Selecting an action (add, list, remove)
2. Choosing a configuration file
3. Providing necessary details for the action

#### Command-Line Mode

For scripting or direct access by AI agents:

**List MCP Servers:**
```bash
./scripts/run-mcp-wizard.sh list
```

**Add MCP Server:**
```bash
./scripts/run-mcp-wizard.sh add --config path/to/config.json --name server-name --command node --args "server.js"
```

**Remove MCP Server:**
```bash
./scripts/run-mcp-wizard.sh remove --config path/to/config.json --name server-name
```

### Environment Configuration

MCP servers can be configured with environment-specific settings:

- **Development**: Enhanced logging, debug mode
- **Production**: Optimized performance, minimal logging
- **Testing**: Mock services, isolated environments

### Config Manager Features

- **Dynamic Reloading**: Configuration changes apply without restart
- **Validation**: Automatic validation of configuration syntax
- **Fallback Handling**: Graceful degradation when servers are unavailable
- **Security**: Encrypted configuration for sensitive data

## MCP User Interface Components

### UI Architecture

The MCP UI provides several key interfaces:

1. **Server Management Panel**
   - View active MCP servers
   - Monitor server health and status
   - Configure server parameters
   - Restart/reload servers

2. **Tool Discovery Interface**
   - Browse available MCP tools
   - Search and filter capabilities
   - Test tool functionality
   - View tool documentation

3. **Real-time Monitoring**
   - Live server status updates
   - Performance metrics visualization
   - Error tracking and alerts
   - Communication flow diagrams

### MCP Tools Dashboard

#### Accessing the UI
There are several ways to access the MCP Tools interface:

1. **Command Palette:**
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type `MCP: Open Tools Dashboard`
   - Press Enter

2. **Status Bar:**
   - Click the MCP status icon in the VS Code status bar
   - Select "Open Tools Dashboard"

#### Dashboard Features

**Tool Management:**
- **Tool List**: Browse available tools with descriptions
- **Parameter Configuration**: User-friendly forms for tool parameters
- **Direct Execution**: Execute tools with validated parameters
- **Results View**: See tool execution results in a formatted view

**Webhook Integration:**
Each tool can have multiple webhooks configured to receive execution results:

- **Adding Webhooks:**
  1. Select a tool from the list
  2. Click the "Webhooks" tab
  3. Click "Add Webhook"
  4. Configure URL, events, secret, and retry settings

- **Webhook Events:**
  - `success`: Successful tool execution with results
  - `error`: Tool execution failures with error details
  - `test`: Manual webhook test events

- **Security Features:**
  - HMAC signatures using SHA-256
  - Optional webhook secrets
  - HTTPS-only endpoints supported
  - Retry logic with exponential backoff

### Wizard Integration

The Universal MCP Wizard provides:
- Step-by-step server setup
- Configuration validation
- Automated testing
- Integration verification

## MCP NestJS Integration

### Service Architecture

The MCP integration with NestJS provides:

```typescript
@Injectable()
export class MCPService {
  async initializeServer(config: MCPServerConfig): Promise<MCPServer> {
    // Server initialization logic
  }
  
  async executeCapability(request: MCPRequest): Promise<MCPResponse> {
    // Capability execution logic
  }
}
```

### Module Configuration

```typescript
@Module({
  imports: [MCPModule.forRoot({
    servers: mcpServerConfigs,
    websocket: {
      port: 3000,
      path: '/mcp'
    }
  })],
  providers: [MCPService],
  exports: [MCPService]
})
export class AppModule {}
```

### Middleware Integration

- **Authentication**: Secure MCP communications
- **Rate Limiting**: Prevent server overload
- **Logging**: Comprehensive request/response logging
- **Error Handling**: Graceful error propagation

## Implementation Guidelines

### Setting Up MCP Servers

1. **Define Server Configuration**
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
       }
     }
   }
   ```

2. **Initialize in Application**
   ```typescript
   const mcpClient = new MCPClient();
   await mcpClient.connect(serverConfig);
   ```

3. **Register Capabilities**
   ```typescript
   await mcpClient.registerCapability('file-operations', fileHandler);
   ```

### Best Practices

- **Security**: Always validate and sanitize MCP inputs
- **Performance**: Implement connection pooling for high-traffic scenarios
- **Monitoring**: Set up comprehensive logging and metrics
- **Testing**: Create automated tests for all MCP capabilities
- **Documentation**: Maintain up-to-date capability documentation

### Error Handling

Implement robust error handling for:
- Connection failures
- Server timeouts
- Invalid requests
- Resource unavailability
- Authentication errors

## Development Workflow

### Local Development

1. **Setup Development Environment**
   ```bash
   # Install dependencies
   yarn install
   
   # Configure MCP servers
   cp mcp-config.example.json mcp-config.json
   
   # Start development server
   yarn dev
   ```

2. **Testing MCP Integration**
   ```bash
   # Run MCP health check
   node scripts/mcp-health-check.js
   
   # Test specific capabilities
   node scripts/test-mcp-tools.js
   ```

### Production Deployment

1. **Environment Configuration**
   - Set production MCP server endpoints
   - Configure authentication and security
   - Set up monitoring and logging

2. **Health Monitoring**
   - Implement health checks for all MCP servers
   - Set up alerting for server failures
   - Monitor performance metrics

## API Reference

### Core Methods

#### MCPClient.connect(config)
Establishes connection to MCP server
- **Parameters**: Server configuration object
- **Returns**: Promise<Connection>
- **Throws**: ConnectionError on failure

#### MCPClient.executeCapability(request)
Executes a specific MCP capability
- **Parameters**: MCPRequest object
- **Returns**: Promise<MCPResponse>
- **Throws**: CapabilityError on execution failure

#### MCPClient.listCapabilities()
Lists all available capabilities
- **Returns**: Promise<Capability[]>
- **Description**: Returns array of available capabilities

### Event Handling

```typescript
mcpClient.on('connected', (server) => {
  console.log(`Connected to ${server.name}`);
});

mcpClient.on('error', (error) => {
  console.error('MCP Error:', error);
});

mcpClient.on('capability-added', (capability) => {
  console.log(`New capability: ${capability.name}`);
});
```

## Troubleshooting

For troubleshooting MCP issues, see the [MCP Troubleshooting Guide](../troubleshooting/mcp-troubleshooting-complete.md).

## Version History

- **v1.0.0**: Initial MCP implementation
- **v1.1.0**: Added WebSocket support
- **v1.2.0**: NestJS integration
- **v1.3.0**: UI components and wizard
- **v1.4.0**: Enhanced configuration management

## Related Documentation

- [Getting Started with MCP](../getting-started/mcp-setup.md)
- [MCP Troubleshooting](../troubleshooting/mcp-troubleshooting-complete.md)
- [API Reference](../reference/mcp-api-reference.md)
- [Architecture Overview](../architecture/mcp-architecture.md)
