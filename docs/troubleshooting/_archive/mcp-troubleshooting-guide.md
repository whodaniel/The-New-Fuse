# MCP Troubleshooting Guide

This guide provides detailed steps to diagnose and fix common issues with MCP (Model Context Protocol) in The New Fuse.

## New Diagnostics Tools

We've added several new diagnostic tools to help troubleshoot MCP issues:

1. **MCP Health Check**: Checks the health of all MCP servers
   - Run with: `node scripts/mcp-health-check.js`
   - Detects port conflicts
   - Verifies command availability
   - Tests server connectivity
   - Provides recommendations for fixes

2. **MCP Tools Viewer**: Shows all configured MCP tools
   - Run with: `node scripts/show-mcp-tools.js`
   - Lists servers and their configurations
   - Analyzes configuration for issues
   - Identifies mismatches between server sections

3. **MCP Test Script**: Interactive script to test individual MCP tools
   - Run with: `bash scripts/test-mcp-tools.sh`
   - Tests filesystem operations
   - Tests shell commands
   - Provides a menu-driven interface

4. **Command Registration Script**: Registers MCP commands in VS Code
   - Run with: `node scripts/initialize-mcp-commands.js`
   - Registers VS Code commands
   - Fixes "command not found" errors

## Common Issues and Solutions

### Port Conflicts

**Symptoms:**
- Multiple servers configured to use the same port
- Only one server works at a time
- Error messages about address already in use

**Solutions:**
1. Run MCP Health Check to identify conflicts
2. Edit `mcp_config.json` and change conflicting ports
3. Use different port ranges for different service types
4. Verify changes by running the health check again

### Command Not Found Errors

**Symptoms:**
- "Command 'thefuse.mcp.showTools' not found" messages
- MCP commands don't work in the command palette

**Solutions:**
1. Run the command registration script
2. Restart VS Code
3. Use direct script versions instead
4. Check extension activation in Output panel

### Server Connection Issues

**Symptoms:**
- Cannot connect to MCP servers
- Timeout errors
- Connection refused errors

**Solutions:**
1. Verify server is running with health check
2. Check for port conflicts
3. Ensure required commands are installed
4. Check environment variables in configuration
5. Look for error messages in logs

### Configuration Issues

**Symptoms:**
- Missing servers in tools list
- Duplicate server entries
- Inconsistent server naming

**Solutions:**
1. Run MCP Tools Viewer to analyze configuration
2. Fix duplicate entries in `mcp_config.json`
3. Ensure server names are consistent between sections
4. Use the naming pattern: base name in `servers`, base name + suffix in `mcpServers`

## Fixes Made

1. Fixed port conflict between `the-new-fuse-mcp` and `the-new-fuse-mcp-server`
2. Added diagnostic tools for MCP troubleshooting
3. Created command registration script
4. Added VS Code tasks for direct access to MCP tools
5. Updated documentation with detailed troubleshooting steps

## VS Code Tasks

These tasks are available in the VS Code command palette (Ctrl/Cmd+Shift+P, then "Tasks: Run Task"):

- **Register MCP Commands**: Register MCP commands in VS Code
- **Show MCP Tools Direct**: Show available MCP tools
- **Run MCP Health Check**: Check the health of all MCP servers
- **MCP Complete Setup**: Run the complete MCP setup process

## Next Steps

If you continue to encounter issues with MCP:

1. Check the logs in `./mcp/logs/mcp-server.log`
2. Run the health check for detailed diagnostics
3. Try using direct script versions of tools
4. Update configuration to resolve conflicts
5. Restart VS Code after making changes
