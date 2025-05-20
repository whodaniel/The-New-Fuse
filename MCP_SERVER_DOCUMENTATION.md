# The New Fuse MCP Server Documentation

## Overview

The Model-Controller-Provider (MCP) server is a critical middleware component in The New Fuse that enables AI agents to securely interact with your development environment. It provides a standardized interface for file operations, build processes, and state management.

This document covers the setup, usage, and extension of the MCP server, including its integration with VS Code and AI agents.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Usage Guide](#usage-guide)
5. [VS Code Integration](#vs-code-integration)
6. [API Reference](#api-reference)
7. [Extending the MCP Server](#extending-the-mcp-server)
8. [Troubleshooting](#troubleshooting)

## Features

The MCP server offers the following capabilities:

- **File Operations**: Read, write, and list files in the workspace
- **Build Management**: Execute build scripts defined in package.json
- **State Management**: Store and retrieve conversation history and agent preferences
- **Security**: API key authentication for secure access
- **VS Code Integration**: Register and discover MCP servers from VS Code
- **Tool Discovery**: Browse available tools and their parameters
- **Agent Coordination**: Support for multiple agents working together

## Architecture

The MCP server follows a modular architecture:

- **Core Server**: Express.js-based HTTP server (TypeScript)
- **Tool Registry**: Pluggable system for registering and executing tools
- **State Management**: In-memory storage for conversations and preferences
- **Authentication**: API key validation middleware
- **VS Code Extension**: Integration with The New Fuse VS Code extension

## Setup Instructions

### Prerequisites

- Node.js v16+
- Yarn
- VS Code with The New Fuse extension installed

### Building and Starting the MCP Server

1. Build the MCP server:
   ```bash
   yarn build:mcp
   ```

2. Start the MCP server:
   ```bash
   yarn mcp:start
   ```

3. The server will be available at http://localhost:3000 with:
   - Default API key: `test-agent-key-123`
   - Available tools: `readFile`, `writeFile`, `listWorkspaceFiles`, `runBuild`

### Using The New Fuse MCP Server

The New Fuse MCP server is now included in the available MCP servers configuration. It provides the following capabilities:

- File operations: Read, write, and manage files in the workspace
- Build operations: Execute build scripts and manage build processes
- Agent coordination: Register, discover, and coordinate AI agents
- State management: Store and retrieve conversation history and agent state

The server is configured in `mcp_config.json` with the following settings:

```json
"the-new-fuse-mcp": {
  "command": "node",
  "args": ["./src/mcp/server.js"],
  "env": {
    "PORT": "3000",
    "WORKSPACE_ROOT": "./",
    "LOG_LEVEL": "info"
  },
  "description": "The New Fuse MCP Server with file, build, and agent coordination capabilities"
}
```

### VS Code Integration Setup

1. Start VS Code with The New Fuse extension
2. Run the "Initialize MCP Integration" task:
   - Open the Command Palette (Ctrl+Shift+P)
   - Search for "Tasks: Run Task"
   - Select "Initialize MCP Integration"
3. You should see a confirmation message and an MCP indicator in the status bar

## Usage Guide

### Using MCP Tools Directly

You can interact with the MCP server directly via HTTP:

```bash
# List available tools
curl -H "X-API-Key: test-agent-key-123" http://localhost:3000/mcp/tools

# Execute a tool
curl -X POST -H "X-API-Key: test-agent-key-123" -H "Content-Type: application/json" \
  -d '{"toolName":"listWorkspaceFiles","parameters":{"directoryPath":"src"}}' \
  http://localhost:3000/mcp/request
```

### Using MCP Tools from VS Code

1. **Browse Available Tools**:
   - Run the "Show MCP Tools" task
   - Browse and select tools to see their documentation

2. **Test a Tool**:
   - Run the "Test MCP Tool" task
   - Select a tool and provide parameters
   - View results directly in VS Code

3. **Ask an Agent**:
   - Run the "Ask Agent with MCP Tools" task
   - Type your question
   - The AI uses MCP tools to respond

## VS Code Integration

The VS Code integration provides:

- **Status Bar Indicator**: Shows MCP server status
- **Server Registration**: Automatic discovery and registration
- **Tool Browser**: UI for exploring available tools
- **Agent Interface**: Ask questions that use MCP tools

### Available Commands

- `thefuse.mcp.initialize`: Register and connect to MCP servers
- `thefuse.mcp.showTools`: Browse available tools
- `thefuse.mcp.testTool`: Test a specific tool
- `thefuse.mcp.askAgent`: Ask an AI agent with access to MCP tools

## API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/mcp/tools` | GET | List available tools |
| `/mcp/capabilities` | GET | List available capabilities |
| `/mcp/request` | POST | Execute a tool |
| `/mcp/discovery` | GET | Get server metadata |
| `/mcp/register` | POST | Register a client |
| `/mcp/conversation` | POST | Create a conversation |
| `/mcp/conversation/:id/message` | POST | Add a message to a conversation |
| `/mcp/conversation/:id/history` | GET | Get conversation history |
| `/mcp/agent/:id/state/:key` | GET | Get agent state |
| `/mcp/agent/:id/state` | POST | Set agent state |

### Authentication

All endpoints (except `/health` and `/mcp/discovery`) require the `X-API-Key` header with a valid API key.

## Extending the MCP Server

### Adding New Tools

1. Define the tool's parameters using Zod schemas in `tools.ts`
2. Implement the tool's functionality
3. Register the tool in `server.ts`

Example:

```typescript
// 1. Define schema
const RunTestSchema = z.object({
  testName: z.string().describe('Name of the test to run'),
  timeout: z.number().optional().describe('Test timeout in ms')
});

// 2. Implement functionality
export const testTools = {
  runTest: async (params: RunTestParams, context: ToolContext) => {
    // Implementation here
    return { success: true, output: 'Test results...' };
  }
};

// 3. Register in server.ts
mcpServer.registerTool('runTest', {
  description: 'Runs a specific test',
  parameters: z.object({
    testName: z.string().describe('Name of the test to run'),
    timeout: z.number().optional().describe('Test timeout in ms')
  }),
  execute: testTools.runTest,
});
```

### Adding New Capabilities

1. Define the capability in `server.ts` in the `MCP_SERVICE_INFO.capabilities` array
2. Add details in the `/mcp/capabilities/details` endpoint
3. Implement related tools

### Extending Authentication

The current implementation uses a simple API key system. To enhance security:

1. Modify `auth.ts` to support additional authentication methods
2. Update the middleware in `server.ts`
3. Update VS Code integration to provide necessary credentials

## Troubleshooting

### Common Issues

- **Server Won't Start**: Check if port 3000 is already in use
- **Authentication Failures**: Verify the API key is correct
- **Tool Execution Errors**: Check parameter types and validation
- **VS Code Integration Issues**: Ensure the MCP server is running before initializing

### Logs

- Server logs are stored in `./mcp/logs/mcp-server.log`
- VS Code extension logs can be viewed in the Output panel (View > Output)

## Further Resources

- [CONTRIBUTING.md](./CONTRIBUTING.md): Guidelines for contributing
- [ARCHITECTURE.md](./ARCHITECTURE.md): Detailed architecture documentation
- [API_SPECIFICATION.md](./API_SPECIFICATION.md): Detailed API documentation