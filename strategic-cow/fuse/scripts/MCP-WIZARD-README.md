# Universal MCP Configuration Wizard

This improved wizard provides a streamlined approach to configuring MCP (Model Context Protocol) for multiple AI tools and registering agents.

## Features

- **Step-based workflow**: Clear progression through all configuration steps
- **Visual progress indicators**: Shows which step you're currently on
- **MCP Server status monitoring**: Checks if your MCP server is running
- **Tool configuration**: Set up MCP for tools like GitHub Copilot, VS Code, and Claude
- **Agent registration**: Create agent registrations with customizable capabilities
- **Improved error handling**: Better validation and error recovery

## Available Scripts

### setup-universal-mcp.sh

This is the main entry point that:
1. Checks if MCP server is running
2. Starts the server if needed
3. Launches the configuration wizard

```bash
./setup-universal-mcp.sh
```

### run-universal-mcp-wizard.sh

Runs just the configuration wizard with debugging output:

```bash
./run-universal-mcp-wizard.sh
```

### check-mcp-status.sh

Checks and reports on the status of your MCP configuration:

```bash
./check-mcp-status.sh
```

## Wizard Workflow

1. **Welcome**: Introduction to the wizard and its capabilities
2. **System Scan**: Scans for existing configurations and MCP server
3. **Tool Configuration**: Set up MCP for your preferred tools
4. **Agent Registration**: Register agents with selected capabilities
5. **Completion**: Summary of configuration and next steps

## Supported Tools

- GitHub Copilot
- Visual Studio Code
- Claude
- Custom configurations

## Supported Capabilities

The agent registration supports various capabilities including:
- text-generation
- code-generation
- image-generation
- tool-execution
- data-analysis
- Custom capabilities

## Configuration Locations

Default configuration paths:
- GitHub Copilot: `~/Library/Application Support/GitHub Copilot/mcp_config.json`
- VS Code: `~/Library/Application Support/Code/User/mcp_config.json`
- Claude: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Troubleshooting

If you encounter issues:

- Check the MCP server status: `./check-mcp-status.sh`
- Verify configuration files exist in expected locations
- Restart your AI tools after configuration
- Check logs in `/tmp/mcp-server-*.log` and `/tmp/mcp-wizard-error.log`
