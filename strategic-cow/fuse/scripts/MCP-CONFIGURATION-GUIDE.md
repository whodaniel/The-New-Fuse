# Universal MCP Configuration System

## Overview

The Model Context Protocol (MCP) allows AI agents to access tools, share context, and communicate with each other. This configuration system provides a streamlined approach to setting up MCP for various AI tools and registering agents.

## Components

This system includes several components:

1. **Universal MCP Configuration Wizard** (`universal-mcp-wizard-fixed.applescript`): A step-by-step interactive wizard for configuring MCP
2. **MCP Setup Script** (`mcp-setup.sh`): All-in-one menu-driven setup script
3. **Launch Script** (`launch-mcp-wizard.sh`): Simple launcher for the wizard
4. **Status Checker** (`check-mcp-status.sh`): Script to verify MCP configuration status
5. **VS Code Tasks**: Integrated tasks for running these tools from within VS Code

## Features

- **Intuitive Step-Based Workflow**: Clear navigation through all steps
- **Visual Progress Indicators**: Shows your current step in the process
- **Server Status Monitoring**: Verifies if your MCP server is running
- **Multiple Tool Support**: Configure GitHub Copilot, VS Code, Claude, and custom tools
- **Agent Registration**: Register AI agents with customizable capabilities
- **Comprehensive Error Handling**: Validates inputs and recovers from errors
- **Terminal & VS Code Integration**: Run from terminal or VS Code tasks

## Getting Started

### Method 1: All-in-One Setup

The easiest way to get started is using the all-in-one setup script:

```bash
./scripts/mcp-setup.sh
```

This interactive menu allows you to:
- Check MCP status
- Start the MCP server
- Launch the configuration wizard
- Perform complete setup (server + wizard)

### Method 2: VS Code Tasks

Use the integrated VS Code tasks:

1. Open the Command Palette (`Cmd+Shift+P`)
2. Type "Tasks: Run Task"
3. Select one of:
   - "Launch Universal MCP Wizard"
   - "MCP Complete Setup"

### Method 3: Individual Scripts

Run the individual scripts as needed:

```bash
# Launch just the wizard
./scripts/launch-mcp-wizard.sh

# Check configuration status
./scripts/check-mcp-status.sh
```

## Wizard Workflow

The MCP Configuration Wizard guides you through these steps:

1. **Welcome**: Introduction to the wizard's capabilities
2. **System Scan**: Checks for existing configurations and server status
3. **Tool Configuration**: Set up MCP for your preferred tools
4. **Agent Registration**: Register agents with selected capabilities
5. **Completion**: Summary of configuration and next steps

## Configuration Details

### Supported Tools

- GitHub Copilot
- Visual Studio Code
- Claude
- Custom paths

### Configuration Paths

Default configuration locations:
- GitHub Copilot: `~/Library/Application Support/GitHub Copilot/mcp_config.json`
- VS Code: `~/Library/Application Support/Code/User/mcp_config.json`
- Claude: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Agent Capabilities

The system supports various agent capabilities including:
- text-generation
- code-generation
- image-generation
- tool-execution
- data-analysis
- Custom capabilities

## Troubleshooting

If you encounter issues:

1. **Check server status**: Run `./scripts/check-mcp-status.sh` to verify server status
2. **Verify configuration files**: Check if config files exist in expected locations
3. **Review logs**: Check `/tmp/mcp-server-*.log` and `/tmp/mcp-wizard-error.log`
4. **Restart tools**: Restart your AI tools after configuring MCP
5. **Manual server start**: Run `node scripts/mcp-config-manager-server.js` if the server isn't running

## Advanced Usage

### Custom Endpoints

You can configure custom endpoints by selecting "Custom endpoint..." when prompted for an endpoint URL during tool configuration.

### Agent Registration

When registering agents, you can:
- Generate a random ID or specify your own
- Select from predefined capabilities or add custom ones
- Choose custom file locations for agent registration files
