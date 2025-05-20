# MCP Integration in The New Fuse

This document provides comprehensive information about the Model Context Protocol (MCP) integration in The New Fuse extension, including how it works, configuration options, and troubleshooting tips.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for AI models to access tools and capabilities. It enables:

- AI models to discover available tools and services
- Standardized communication between AI models and tools
- Secure execution of tools with appropriate permissions
- Sharing context between different AI systems
- Agent-to-agent communication through shared protocols

## How Copilot and Claude Access MCP

GitHub Copilot and Claude access MCP services according to the current protocol standards through:

1. **VS Code Extension Infrastructure**: Both AI assistants integrate with VS Code's extension ecosystem to access MCP tools. The extension itself handles the communication with MCP servers.

2. **Tool Calling Framework**: When an AI assistant needs to use an MCP capability, it uses a standardized tool calling framework that follows the MCP specification for requests and responses.

3. **Client-Server Architecture**: Both AI assistants act as MCP clients that make requests to MCP servers. These servers implement specific capabilities the AI assistants can invoke.

4. **JSON-RPC Based Communication**: The actual communication follows JSON-RPC patterns defined in the MCP specification, with requests containing:
   - A method name
   - Parameters specific to the method
   - A unique request ID

## MCP Configuration

The MCP configuration is defined in `mcp_config.json` and consists of two main sections:

1. **servers**: Defines the connection details for each MCP-enabled server
2. **mcpServers**: Defines the command-line arguments to start each MCP server

### Important Configuration Options

- **host**: The hostname where the MCP server is running
- **port**: The port number for the MCP server
- **protocol**: The communication protocol (usually HTTP or HTTPS)
- **type**: The server type (e.g., "mcp", "database", "agent")
- **capabilities**: An array of capabilities the server provides
- **enabled**: Whether the server is enabled or disabled

## Available MCP Servers

The New Fuse comes with several pre-configured MCP servers:

| Server | Type | Capabilities | Description |
|--------|------|--------------|-------------|
| the-new-fuse-mcp-server | mcp | file-operations, build-operations, agent-coordination, state-management | The primary MCP server for The New Fuse |
| filesystem | mcp | file operations | Provides access to the file system |
| brave-search-mcp | search | web search | Enables web searching through Brave |
| sqlite | database | SQLite operations | Provides SQLite database access |
| shell | system | command execution | Allows running specific shell commands |
| http | network | API requests | Enables HTTP requests to specified hosts |
| code-analysis | development | code analysis | Analyzes code in the workspace |
| postgres-mcp | database | PostgreSQL operations | Provides PostgreSQL database access |
| vector-db | database | vector operations | Enables vector database operations |
| context7-server | context | context management | Manages context across tools |
| applescript_execute | system | AppleScript execution | Executes AppleScript on macOS |
| mcp-config-manager | system | configuration management | Manages MCP configuration |
| browsermcp | browser | browser automation | Controls web browsers |
| MCP_DOCKER | system | Docker integration | Provides Docker container integration for MCP |

### MCP Server Details

#### The New Fuse MCP Server

- **Primary MCP server** with file operations, build operations, agent coordination, and state management capabilities
- Runs on localhost:3000
- Provides core functionality for the application

#### Filesystem MCP Server

- Provides file system operations
- Implemented using `@modelcontextprotocol/server-filesystem`
- Allows access to files in the ./data directory

#### Brave Search MCP

- Enables web searching through Brave
- Runs in a Docker container
- Requires a Brave API key

#### SQLite MCP Server

- Provides SQLite database access
- Runs in a Docker container
- Uses a database file at /data/mcp/sqlite/ai_data.db

#### Browser MCP

- Controls web browsers
- Runs on localhost:3772
- Implemented using `@browsermcp/mcp`

#### Context7 Server

- Manages context across tools
- Built into GitHub Copilot
- Automatically discovered when available

#### AppleScript Execute

- Executes AppleScript on macOS
- Implemented using `@peakmojo/applescript-mcp`

#### MCP Config Manager

- Manages MCP configuration
- Allows adding, removing, and updating MCP servers

#### Shell MCP Server

- Allows running specific shell commands
- Limited to safe commands like ls, cat, grep, find, echo, pwd

#### HTTP MCP Server

- Enables HTTP requests to specified hosts
- Restricted to specific allowed domains

#### Code Analysis MCP Server

- Analyzes code in the workspace
- Provides code understanding capabilities

#### Vector DB MCP Server

- Enables vector database operations
- Stores data in ./data/vector-db

#### Postgres MCP Server

- Provides PostgreSQL database access
- Connects to a PostgreSQL database

## Using MCP Tools

The New Fuse provides several commands and tasks for working with MCP tools:

### VS Code Commands

1. **Register MCP Commands**: Registers the MCP-related commands in VS Code
2. **Initialize MCP Integration**: Sets up the MCP integration
3. **Show MCP Tools**: Displays available MCP tools
4. **Test MCP Tool**: Tests a specific MCP tool
5. **Ask Agent with MCP Tools**: Asks an AI agent using available MCP tools

### VS Code Tasks

1. **Show MCP Tools Direct**: Shows all configured MCP tools directly from config
2. **Run MCP Health Check**: Performs a comprehensive health check of all MCP servers
3. **MCP Complete Setup**: Runs the complete MCP setup process
4. **Initialize MCP Integration**: Initializes the MCP integration

### Command-line Scripts

1. `/scripts/show-mcp-tools.js`: Shows available MCP tools and performs config analysis
2. `/scripts/mcp-health-check.js`: Checks the health of all MCP servers
3. `/scripts/test-mcp-tools.sh`: Interactive script to test MCP tools
4. `/scripts/initialize-mcp-commands.js`: Registers MCP commands in VS Code

## Troubleshooting

### Common Issues

1. **Port conflicts**: If multiple servers try to use the same port, only one will work. Check for port conflicts in the configuration.
2. **Missing commands**: If VS Code commands are not found, use the "Register MCP Commands" task to register them.
3. **Server startup failures**: Check the log files for startup errors. Most common issues are related to missing dependencies or incorrect paths.

### Logs

Log files are stored in `./mcp/logs/` directory with the main log being `mcp-server.log`.

### Resolving Port Conflicts

Port conflicts are a common issue with MCP servers. Here's how to resolve them:

1. Run the MCP Health Check:
   ```bash
   node scripts/mcp-health-check.js
   ```

2. Identify conflicting ports in the output

3. Update the server configurations in `mcp_config.json`:
   ```json
   "my-server": {
     "host": "localhost",
     "port": 3002,  // Change to an unused port
     ...
   }
   ```

4. Common port ranges to use:
   - 3000-3999: Web services
   - 4000-4999: API services
   - 5000-5999: Database services
   - 8000-8999: Development services

5. Restart the MCP servers after changing the configuration

### Command Not Found Issues

If you encounter "command not found" errors when trying to use MCP commands:

1. Register the commands using:
   ```bash
   node scripts/initialize-mcp-commands.js
   ```

2. If the issue persists, use the direct script versions:
   ```bash
   node scripts/show-mcp-tools.js  # Instead of thefuse.mcp.showTools
   ```

3. For persistent issues, check the extension activation in the Output panel

## Advanced Configuration

### Adding a New MCP Server

To add a new MCP server:

1. Add a server definition to the `servers` section:

   ```json
   "my-new-server": {
     "host": "localhost",
     "port": 3002,
     "protocol": "http",
     "type": "custom",
     "capabilities": ["custom-capability1", "custom-capability2"],
     "description": "My custom MCP server",
     "enabled": true
   }
   ```

2. Add a server execution definition to the `mcpServers` section:

   ```json
   "my-new-server": {
     "command": "node",
     "args": ["./path/to/server.js"],
     "env": {
       "PORT": "3002",
       "WORKSPACE_ROOT": "./"
     },
     "description": "My custom MCP server"
   }
   ```

### Security Considerations

- Review the `security` section in the configuration file
- Ensure you're using a secure `jwt-secret`
- Configure CORS settings appropriately
- Set rate limits to prevent abuse

## MCP Server Management

The New Fuse provides several ways to manage MCP servers:

### VS Code Commands

The following commands are available for managing MCP servers:

- `thefuse.selectMCPServer`: Select an active MCP server
- `thefuse.addMCPServer`: Add a new MCP server
- `thefuse.removeMCPServer`: Remove an existing MCP server
- `thefuse.connectMCPServer`: Connect to an MCP server
- `thefuse.disconnectMCPServer`: Disconnect from an MCP server
- `thefuse.refreshMCPServer`: Refresh an MCP server's configuration
- `thefuse.executeMCPTool`: Execute a tool on an MCP server

### Configuration Files

MCP servers are configured in `mcp_config.json`. This file can be located in several places:

- In the root directory of The New Fuse project
- In the VS Code extension directory
- In a custom location specified in VS Code settings

### Importing MCP Servers

You can import MCP servers from JSON files in several ways:

1. **Using the MCP Config Manager**:
   - The MCP Config Manager tool can import server configurations from JSON files
   - Use the `mcp-config-manager` server to manage configurations

2. **Using the VS Code Settings**:
   - The VS Code extension has a settings view where you can specify the path to an MCP configuration file
   - Navigate to the settings view and set the `mcpConfigPath` option

3. **Using the MCP Wizard**:
   - Run the MCP wizard script to interactively manage MCP servers:

   ```bash
   ./scripts/run-mcp-wizard.sh
   ```

4. **Manually Editing Configuration Files**:
   - You can directly edit the `mcp_config.json` file to add or modify server configurations

## References

- [Model Context Protocol Specification](https://github.com/model-context-protocol/spec)
- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [MCP Configuration Manager Guide](./MCP-CONFIG-MANAGER-GUIDE.md)
