# MCP Configuration Manager

This document explains how to use the MCP Configuration Manager tool to manage MCP capability providers in The New Fuse and Claude Desktop.

## Overview

The MCP Configuration Manager is a CLI tool that helps you manage MCP server configurations in JSON files. It can:

- List existing MCP capability providers
- Add new MCP capability providers 
- Update existing MCP capability providers
- Remove MCP capability providers

## Understanding MCP Capability Providers

MCP (Model Context Protocol) capability providers expose functionality to LLMs through a standardized protocol. They:

- Are **not** traditional servers that need to be started or run continuously
- Are accessed on-demand when an LLM needs to use their capabilities
- Expose specific functionalities like file access, web search, or AppleScript execution
- Are defined in configuration files that specify how to invoke them

## Using the MCP Configuration Manager

### Interactive Mode

For a user-friendly interface, run the wizard in interactive mode:

```bash
./scripts/run-mcp-wizard.sh
```

This will guide you through:
1. Selecting an action (add, list, remove)
2. Choosing a configuration file
3. Providing necessary details for the action

### Command-Line Mode

For scripting or direct access by AI agents:

#### List MCP Servers

```bash
./scripts/run-mcp-wizard.sh list
```

This shows all MCP servers in the default Claude Desktop configuration.

To specify a different configuration file:

```bash
./scripts/run-mcp-wizard.sh list --file=/path/to/config.json
```

#### Add/Update MCP Server

```bash
./scripts/run-mcp-wizard.sh add --name=server-name --command=cmd --args="arg1,arg2,arg3"
```

Example - adding a web search capability:

```bash
./scripts/run-mcp-wizard.sh add --name=web-search --command=npx --args="@modelcontextprotocol/server-websearch"
```

#### Remove MCP Server

```bash
./scripts/run-mcp-wizard.sh remove --name=server-name
```

## Configuration File Locations

The tool works with the following default configuration files:

- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **The New Fuse**: `~/Desktop/A1-Inter-LLM-Com/The New Fuse/mcp_config.json`

You can specify a custom file path with the `--file` option.

## Common MCP Capability Providers

| Name | Command | Args | Description |
|------|---------|------|-------------|
| `web-search` | `npx` | `@modelcontextprotocol/server-websearch` | Allows searching the web |
| `filesystem` | `npx` | `-y @modelcontextprotocol/server-filesystem --allow-dir ./data` | Provides file system access |
| `applescript_execute` | `npx` | `@peakmojo/applescript-mcp` | Enables AppleScript execution |
| `brave-search` | `docker` | `run --rm -i -e BRAVE_API_KEY modelcontextprotocol/brave-search` | Provides Brave search capability |

## Adding Custom MCP Capability Providers

You can create custom MCP capability providers by:

1. Creating a package that implements the MCP protocol
2. Publishing it to npm or hosting it locally
3. Adding it to your configuration using this tool

## Best Practices

- Use meaningful names for capability providers
- Use absolute paths for command executables when needed
- Keep configuration files in version control
- Document the capabilities provided by each MCP provider

## Troubleshooting

If you encounter issues:

- Ensure Node.js is installed
- Check if configuration files exist and are valid JSON
- Verify that the command specified in the configuration is available on the system
- Check permissions on configuration files
