# MCP Integration for The New Fuse

This module integrates the Model Context Protocol (MCP) with The New Fuse extension.

## What is MCP?

The Model Context Protocol (MCP) is a standard for providing external tools (like web search, file system access, database queries, etc.) to Large Language Models (LLMs) and AI agents. It promotes tool reusability and simplifies integration.

## Components

- **MCPClient**: Connects to MCP servers via stdio and handles JSON-RPC communication
- **MCPManager**: Manages MCP server processes and tool discovery in VS Code
- **MCPAgentIntegration**: Connects MCP tools with the AI agent system

## Configuration

MCP servers are configured in `mcp_config.json`. A default configuration is created automatically if none exists.

### Example Configuration

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
    },
    "brave-search": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "BRAVE_API_KEY",
        "modelcontextprotocol/brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "YOUR_ACTUAL_BRAVE_SEARCH_API_KEY"
      }
    }
  }
}
```

## Commands

The following VS Code commands are available:

- `thefuse.mcp.initialize`: Initialize MCP integration
- `thefuse.mcp.showTools`: Show available MCP tools
- `thefuse.mcp.testTool`: Test a specific MCP tool
- `thefuse.mcp.askAgent`: Ask the agent a question that might use MCP tools
- `thefuse.openMcpCommandPalette`: Open a quick pick menu with MCP commands

## Usage

1. Click the MCP icon in the status bar (`$(tools) MCP`) or run the `Open MCP Command Palette` command
2. Select `Initialize MCP` to start the integration
3. After initialization, select `Show MCP Tools` to see available tools
4. Use `Ask Agent with MCP Tools` to ask a question that might use tools

## Examples

- "List files in the data directory"
- "Search the web for TypeScript MCP implementation"
- "Run SQL query SELECT * FROM users LIMIT 10"

## Troubleshooting

If you encounter issues:

1. Check the "MCP Integration" output channel for logs
2. Verify MCP servers are properly configured in mcp_config.json
3. Ensure required dependencies (npx, docker) are installed
4. Try reinitializing with the `thefuse.mcp.initialize` command
