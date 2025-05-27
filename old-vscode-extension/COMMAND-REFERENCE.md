# The New Fuse Command Reference

## Available VS Code Commands

All commands can be accessed via the Command Palette (Cmd+Shift+P or Ctrl+Shift+P):

### Core Commands
- `thefuse.helloWorld` - Basic hello world test
- `thefuse.startAICollab` - Start AI Collaboration

### MCP Commands
- `thefuse.mcp.initialize` - Initialize MCP Integration
- `thefuse.mcp.showTools` - Show MCP Tools
- `thefuse.mcp.testTool` - Test a specific MCP Tool
- `thefuse.mcp.askAgent` - Ask Agent a question using MCP Tools

### Verification Commands
- `thefuse.verification.initialize` - Initialize a verification agent
- `thefuse.verification.verifyClaim` - Verify a claim using a verification agent
- `thefuse.verification.setLevel` - Change the verification level of a verification agent

The verification agent uses LLM-based fact-checking in production mode and simulated verification in development mode. It supports caching of verification results and event-based communication with other components.

## Quick Troubleshooting

If commands don't appear in the Command Palette:
1. Make sure the extension is running in development mode:

   ```bash
   ./launch-vscode.sh
   ```

2. Check the output panel for any errors:
   - View > Output
   - Select "The New Fuse" from the dropdown

3. Try reloading the window:
   - Command Palette > Developer: Reload Window
