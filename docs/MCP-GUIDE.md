# Model Context Protocol (MCP) Complete Guide

## Overview

The Model Context Protocol (MCP) is a standardized communication protocol for inter-LLM communication in The New Fuse framework. It provides a unified interface for AI agents to access tools, resources, and capabilities through WebSocket and JSON-RPC communication.

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

### 4. VS Code Integration
- Command integration via command palette
- Tool discovery and testing
- Real-time status updates
- Progress indicators for long operations
- Custom MCP tool development support

### Agent Context Management (VS Code Extension)

To provide agents (MCP servers) with persistent instructions and state across tool calls, the VS Code extension implements a context loading and update mechanism:

**1. Context Loading:**
   - Before the extension calls an agent's tool (`call_tool` via MCP), it attempts to load context specific to that agent.
   - The agent is identified by its server name configured in `mcp_config.json`.
   - The extension looks for files in the workspace directory: `.vscode/fuse-agent-context/<agent-id>/`
     - **Instructions:** Reads content from `instructions.md`.
     - **Memory Bank:** Reads content from all `.md` files within the `memory-bank/` subdirectory (e.g., `activeContext.md`, `progress.md`).
   - If context is found, it's injected into the `arguments` object of the `call_tool` JSON-RPC request under the key `_agent_context`.
   - **Agent-Side Responsibility:** The agent implementation must check for the `_agent_context` field in the received arguments and utilize the provided `instructions` (string) and `memoryBank` (object mapping filenames to content) as needed.

**2. Memory Update:**
   - Agents can request updates to their memory bank files using a dedicated VS Code command.
   - **Command:** `theFuse.updateAgentMemory`
   - **Arguments:** An object `{ agentId: string, fileName: string, content: string }`
     - `agentId`: The ID of the agent (must match the server name).
     - `fileName`: The target `.md` file name within the `memory-bank` directory (e.g., `progress.md`). Path traversal is prevented.
     - `content`: The new string content for the file.
   - The command handler in the VS Code extension verifies the request, ensures the target directory exists (creating it if necessary), and writes the content to the specified file within `.vscode/fuse-agent-context/<agent-id>/memory-bank/`.
   - **Agent-Side Responsibility:** The agent needs the capability to execute VS Code commands (e.g., via specific tools or environment integration) to use this update mechanism.

**Setup:**
   - Users need to create the `.vscode/fuse-agent-context/<agent-id>/` directories for each agent requiring persistent context.
   - Inside, create `instructions.md` (optional) and a `memory-bank/` subdirectory containing relevant `.md` files (e.g., `activeContext.md`, `progress.md`, `techContext.md`, etc.).

## Agent Self-Registration and Management (via MCP Registry Service)

Agents running as MCP Servers are expected to manage their lifecycle state within the central system by interacting with the **MCP Registry Service** (typically running alongside the backend API, e.g., at `ws://localhost:3002`). This service exposes specific MCP tools for registration and updates.

**Required Agent Behavior:**

1.  **Configuration:**
    *   Obtain the WebSocket URL of the MCP Registry Service (e.g., from `MCP_REGISTRY_URL` env var).
    *   Know its own `name` (unique identifier recommended) and `type`.
2.  **Startup Sequence:**
    *   Connect to the MCP Registry Service WebSocket URL.
    *   Execute the `registerAgent` tool with parameters:
        *   `name`: string (agent's name)
        *   `type`: string (agent's type)
        *   `metadata`: object (optional, any relevant static/dynamic info)
    *   **Store the returned `agentId` securely.** This is essential for all future updates.
    *   If registration succeeds, execute the `updateAgentStatus` tool with:
        *   `agentId`: The stored agent ID.
        *   `status`: `AgentStatus.ACTIVE` (import from `@the-new-fuse/types`).
    *   *(Error Handling):* Log errors. Consider retry logic. If registration fails potentially due to prior registration, attempt `findAgents` (e.g., using `name` and `type` filters) to retrieve the existing `agentId`.
3.  **Runtime Updates:**
    *   If configuration/metadata changes, execute `updateAgentProfile` with:
        *   `agentId`: The stored agent ID.
        *   *(optional)* `name`, `type`, `metadata` fields containing the new values.
4.  **Status Changes:**
    *   On significant state changes (errors, recovery, becoming busy), execute `updateAgentStatus` with the stored `agentId` and the appropriate `status` (`AgentStatus.ERROR`, `AgentStatus.BUSY`, `AgentStatus.ACTIVE`, etc.).
5.  **Shutdown:**
    *   On graceful shutdown, attempt to execute `updateAgentStatus` with the stored `agentId` and `status: AgentStatus.INACTIVE`.
    *   Disconnect from the MCP Registry Service.

**MCP Registry Service Tools:**
*   `registerAgent(name: string, type: string, metadata?: object) => Agent`
*   `updateAgentProfile(agentId: string, updates: { name?: string, type?: string, metadata?: object }) => Agent`
*   `getAgentProfile(agentId: string) => Agent`
*   `findAgents(filters: { status?: AgentStatus, capability?: string, name?: string, role?: string, type?: string }) => Agent[]`
*   `updateAgentStatus(agentId: string, status: AgentStatus) => Agent`

*(See `packages/api/src/modules/mcp/mcp-registry.service.ts` for detailed schemas)*

## Architecture

### Communication Flow
1. Client sends request through VS Code command or API
2. Request routed through MCP Broker Service
3. Director Agent assigns to appropriate handler
4. Results returned through WebSocket connection
5. Status updates provided via progress API

### WebSocket Protocol
```typescript
interface MCPMessage {
    type: string;
    data?: any;
    timestamp?: number;
    metadata?: Record<string, any>;
}
```

### Tool Registration
```typescript
interface MCPTool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}
```

## Usage

### VS Code Commands
- `thefuse.mcp.initialize`: Initialize MCP system
- `thefuse.mcp.showTools`: Display available tools
- `thefuse.mcp.testTool`: Test a specific tool
- `thefuse.mcp.askAgent`: Send request to agent

### Configuration
```json
{
    "mcpServers": {
        "filesystem": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-filesystem",
                "--allow-dir", "./data"
            ]
        }
    }
}
```

### Tool Development
1. Extend MCPServer class
2. Define capabilities and tools
3. Register with MCPBrokerService
4. Implement tool handlers

## Security

### Authentication
- Token-based authentication for agents
- Capability verification
- Resource access control
- Session management

### Monitoring
- Real-time connection monitoring
- Resource usage tracking
- Error rate monitoring
- Performance metrics collection

## Error Handling

### Common Issues
1. Connection Problems
   - Check WebSocket status
   - Verify server availability
   - Check authentication tokens
   - Review firewall settings

2. Tool Execution Issues
   - Verify tool registration
   - Check parameter validation
   - Review permission settings
   - Monitor resource limits

3. Performance Issues
   - Check connection latency
   - Monitor message queue size
   - Review resource utilization
   - Analyze error patterns

### Debugging
- VS Code output channel logs
- WebSocket connection status
- Tool execution traces
- Performance metrics

## Best Practices

### Development
1. Use TypeScript for type safety
2. Implement comprehensive error handling
3. Add detailed logging
4. Include performance monitoring
5. Write thorough tests

### Deployment
1. Configure proper security settings
2. Set up monitoring
3. Enable analytics collection
4. Plan for scalability

### Tool Implementation
1. Clear parameter documentation
2. Proper error messages
3. Progress reporting
4. Resource cleanup
5. Performance optimization

## Testing

### Unit Tests
- Protocol implementation
- Message handling
- Error scenarios
- Resource management

### Integration Tests
- Tool execution
- WebSocket communication
- VS Code commands
- Error recovery

### Performance Tests
- Message throughput
- Connection stability
- Resource utilization
- Error handling under load

## Extensions

### Adding New Tools
1. Create tool definition
2. Implement handlers
3. Register with broker
4. Add documentation
5. Write tests

### Custom Protocols
1. Extend base protocol
2. Implement message types
3. Add security measures
4. Document changes
5. Update tests

## Troubleshooting

### Diagnostics
1. Check VS Code output channel
2. Review WebSocket connection logs
3. Monitor tool execution status
4. Analyze error patterns

### Common Solutions
1. Connection Issues
   - Retry initialization
   - Check network settings
   - Verify authentication
   - Reset connection

2. Tool Problems
   - Verify registration
   - Check parameters
   - Review permissions
   - Monitor resources

3. Performance
   - Optimize message size
   - Reduce polling frequency
   - Implement caching
   - Scale resources

## API Reference

See TypeScript definitions and interfaces in the codebase for detailed API documentation.

## Future Development

### Planned Features
1. Enhanced tool discovery
2. Improved error reporting
3. Advanced monitoring
4. Extended analytics
5. Performance optimizations

### Contributing
1. Follow style guide
2. Add tests
3. Update documentation
4. Submit pull request
