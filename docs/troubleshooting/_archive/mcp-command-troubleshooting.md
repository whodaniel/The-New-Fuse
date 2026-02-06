# MCP Command Troubleshooting Guide

This guide helps you resolve issues with MCP commands in The New Fuse extension.

## Common Command Issues

### "Command not found" Errors

If you see errors like `command 'thefuse.mcp.showTools' not found`, try these
solutions:

1. **Register the Commands**:

   ```bash
   node ./scripts/initialize-mcp-commands.js
   ```

2. **Restart VS Code**: Sometimes VS Code needs to be restarted to recognize
   newly registered commands.

3. **Check Extension Activation**: Ensure The New Fuse extension is properly
   activated. Check the Output panel for any activation errors.

### Command Registration Issues

The MCP commands are registered during extension activation in `extension.js`.
If the commands aren't properly registered:

1. **Check the extension initialization**: The extension should initialize the
   MCP integration with:

   ```javascript
   const mcpIntegration = new mcp_integration_1.MCPIntegration(context);
   await mcpIntegration.initialize();
   mcp_integration_1.registerMCPCommands(context, mcpIntegration);
   ```

2. **Verify import paths**: Make sure the import paths are correct:

   ```javascript
   const mcp_integration_1 = require('./src/mcp-integration');
   ```

3. **Manually register commands**: You can manually register commands using the
   script provided.

## MCP Command List

Here are all the MCP-related commands that should be available:

| Command                         | Description                   |
| ------------------------------- | ----------------------------- |
| `thefuse.mcp.showTools`         | Shows available MCP tools     |
| `thefuse.mcp.testTool`          | Tests a specific MCP tool     |
| `thefuse.mcp.browseMarketplace` | Opens the MCP marketplace     |
| `thefuse.mcp.addServer`         | Adds a new MCP server         |
| `thefuse.mcp.askAgent`          | Asks an agent using MCP tools |

## Debugging VSCode Commands

To see what commands are registered in VS Code:

1. Open the command palette (Cmd+Shift+P)
2. Type "Developer: Show Running Commands"

This will show all currently registered commands and can help diagnose if MCP
commands are properly registered.

## Manual Command Registration

If automatic registration fails, you can manually register commands in the
Developer Console:

1. Open the Developer Console (Help > Toggle Developer Tools)
2. In the Console tab, run:
   ```javascript
   vscode.commands.registerCommand('thefuse.mcp.showTools', () => {
     vscode.window.showInformationMessage('MCP tools command executed');
   });
   ```

## Extension Development

If you're developing the extension:

1. Use the "Launch Extension" VS Code task
2. Check the Debug Console for registration errors
3. Verify the extension activation events in `package.json`

## Last Resort Solution

If all else fails, you can create simple shell scripts that perform the desired
actions and bind them to tasks instead of commands:

```json
{
  "label": "Show MCP Tools Alternate",
  "type": "shell",
  "command": "node ${workspaceFolder}/scripts/show-mcp-tools.js",
  "presentation": {
    "reveal": "always",
    "panel": "new",
    "focus": true
  }
}
```
