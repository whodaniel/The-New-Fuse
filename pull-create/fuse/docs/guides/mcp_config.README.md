# MCP Configuration

This file configures the Model Context Protocol (MCP) servers used by The New Fuse.

## Available MCP Servers

The following MCP servers are configured:

### the-new-fuse-mcp
The core MCP server for The New Fuse platform. Provides file operations, build management, agent coordination, and state management capabilities. This server is the primary interface for AI agents to interact with The New Fuse development environment.

### filesystem
Provides file system access capabilities. The AI can read, write, and manage files in the `./data` directory.

### brave-search
Provides web search capabilities using the Brave Search API. Requires a Brave API key.

### sqlite
Provides SQLite database access. The database is stored in `./db/ai_data.db`.

### shell
Provides shell command execution capabilities. Limited to safe commands: `ls`, `cat`, `grep`, `find`, `echo`, `pwd`.

### http
Provides HTTP request capabilities. Limited to allowed hosts: `api.github.com`, `api.openai.com`.

### code-analysis
Provides code analysis capabilities. Can analyze code in the current directory.

### postgres
Provides PostgreSQL database access. Connects to the `fuse` database.

### vector-db
Provides vector database capabilities for semantic search and embeddings. Data is stored in `./data/vector-db`.

## Adding New MCP Servers

To add a new MCP server:

1. Add a new entry to the `mcpServers` object in `mcp_config.json`
2. Specify the command and arguments to run the server
3. Add any environment variables needed by the server
4. Create any necessary directories for the server's data

## Using MCP Servers

MCP servers are automatically loaded when The New Fuse extension initializes. You can view and test available tools through the VS Code command palette:

- `The New Fuse: Show MCP Tools` - View all available tools
- `The New Fuse: Test MCP Tool` - Test a specific tool
- `The New Fuse: Initialize MCP` - Manually initialize MCP if needed
