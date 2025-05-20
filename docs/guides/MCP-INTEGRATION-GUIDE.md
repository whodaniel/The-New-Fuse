# MCP Integration Guide and Conversation Summary

This document provides a comprehensive guide to integrating and using the Model Context Protocol (MCP) in The New Fuse VS Code extension, based on our implementation conversation.

## Problem and Solution Overview

### Initial Problem
Running MCP commands directly in the terminal (`thefuse.mcp.initialize`) doesn't work because these are VS Code commands that need to be executed within the Command Palette.

### Implemented Solutions

#### 1. Setup Scripts
- **setup-extension.sh**: Complete VS Code extension setup with MCP support
- **fix-permissions.sh**: Fixes permission issues with shell scripts
- **easy-setup.sh**: Streamlined setup process for quicker deployment

#### 2. Sample Files
- **create-sample-files.sh**: Creates test files in the data directory
- Sample files include: `example.txt`, `config.json`, and `README.md`

#### 3. Documentation
- **MCP-USAGE.md**: Basic guide to using MCP commands
- **MCP-COMMANDS-GUIDE.md**: Detailed command reference
- **MCP-NEXT-STEPS.md**: What to do after initializing MCP
- **COMMAND-REFERENCE.md**: Examples for MCP tool usage

#### 4. VS Code Integration
- **tasks.json**: Added tasks for common MCP operations:
  - Initializing MCP
  - Showing MCP tools
  - Testing MCP tools
  - Asking agent questions
  - Running setup operations
  - Quick-start sequence for all steps

## Using MCP in VS Code

### Command Palette Access
1. Open Command Palette: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type any of these commands:
   - `thefuse.mcp.initialize` - Initialize MCP Integration
   - `thefuse.mcp.showTools` - Show available MCP tools
   - `thefuse.mcp.testTool` - Test a specific MCP tool
   - `thefuse.mcp.askAgent` - Ask agent a question that might use tools

### Available MCP Tools
After initialization, The New Fuse provides access to these tools:
- **list_files**: Lists files in a directory
- **read_file**: Reads file contents
- **brave_search**: Searches the web (if configured)
- **query**: Executes SQL queries (if configured)
- **component-analysis**: Analyzes React/TypeScript components in the codebase

For detailed information about the component analysis tool, see [Component Analysis MCP Integration](MCP-INTEGRATION-GUIDE-component-analysis.md).

### Using MCP Tools
There are two ways to use these tools:
1. **Direct Testing**: Use `thefuse.mcp.testTool` to select a tool and provide parameters
2. **AI Agent Assistance**: Use `thefuse.mcp.askAgent` to ask questions that the agent will resolve using appropriate tools

## Example Workflows

### File Operations Workflow
1. Initialize MCP: `thefuse.mcp.initialize`
2. Ask agent: "List files in the data directory"
3. Ask agent: "What's in example.txt?"

### Search Workflow
1. Initialize MCP: `thefuse.mcp.initialize`
2. Ask agent: "Search for information about Model Context Protocol"
3. Review the search results provided by the agent

## Troubleshooting
If commands don't appear or don't work:
1. Ensure the extension is properly loaded (look for the rocket icon in status bar)
2. Check the "MCP Integration" output channel for logs
3. Verify MCP servers are configured properly in mcp_config.json
4. Try reloading the VS Code window
5. Re-run `./fix-permissions.sh` followed by `./setup-extension.sh`

## Automation with Tasks
For easier access, use the provided VS Code tasks:
1. Open Command Palette
2. Type "Tasks: Run Task"
3. Select "MCP Quick Start (All Steps)" for complete setup and launch
