# VS Code Extension Integration Documentation

## Overview

This document describes how we've integrated two VS Code extensions:

1. **The New Fuse** - A comprehensive extension for AI Agent Orchestration with
   MCP integration
2. **VSCode AI Coder Connector** - A specialized extension for connecting to a
   Chrome extension and monitoring Roo output

The integration combines the functionality of both extensions into a single
comprehensive VS Code extension that preserves all original features while
adding new capabilities.

## Integration Architecture

### Key Components Added

1. **Roo Integration** (`roo-integration.tsx`)
   - Monitors Roo's output channel via the VS Code API
   - Broadcasts the output via WebSockets on port 3711
   - Enables external tools to receive and process Roo's output

2. **Roo Output Monitor** (`roo-output-monitor.tsx`)
   - Manages the lifecycle of Roo monitoring
   - Provides an API for starting/stopping monitoring
   - Broadcasts status updates to connected clients

3. **AI Coder View** (`web-ui/ai-coder-view.tsx`)
   - Adds a new view to the VS Code sidebar
   - Shows status of Roo monitoring and connected clients
   - Provides UI controls for managing the monitoring

4. **Extension Integration** (`extension.ts` updates)
   - Initializes both sets of functionality
   - Registers new commands for AI Coder features
   - Sets up the WebSocket servers needed for communication

### Configuration Updates

The `package.json` file has been updated with:

- New commands for AI Coder integration
- New configuration settings for ports and feature toggles
- Additional sidebar view for AI Coder functionality

## Testing the Integration

### Method 1: Using the Integration Script

```bash
# Run the integration script
chmod +x ./integrate-extensions.sh
./integrate-extensions.sh
```

This script:

- Creates a backup of the current development directory
- Verifies all required integration files are present
- Checks package.json for required entries
- Copies any additional beta-specific files
- Updates script permissions
- Builds the integrated extension

### Method 2: Manual Testing

1. Navigate to the extension directory:

   ```bash
   cd ./src/vscode-extension
   ```

2. Run the test script:

   ```bash
   ./test-integrated-extension.sh
   ```

3. This will:
   - Build the extension
   - Create a test workspace
   - Launch VS Code with the extension loaded
   - Show instructions for testing the integrated features

### Method 3: Using VS Code Tasks

The "Launch VS Code with Extension" task can be used from the VS Code Command
Palette:

1. Open Command Palette (Cmd+Shift+P)
2. Select "Tasks: Run Task"
3. Choose "Launch VS Code with Extension"

## Known Issues

1. **Extension Development Path**  
   If the VS Code launch fails, verify that the `launch-vscode.sh` script points
   to the correct extension directory.

2. **WebSocket Port Conflicts**  
   The extension uses ports 3710 and 3711. If another application is using these
   ports, the extension may fail to start properly.

3. **Roo Output Channel**  
   The Roo output monitoring depends on the existence of Roo's output channel.
   If Roo is not installed, this feature will not work properly.

## Next Steps

1. **Automated Testing**
   - Create automated tests to verify integration functionality
   - Test with different VS Code versions

2. **Package for Distribution**
   - Use `vsce package` to create a VSIX file
   - Test installation from the VSIX file

3. **Documentation Updates**
   - Update the README.md with the new integrated features
   - Create user documentation for the AI Coder features

## Troubleshooting

If you encounter issues with the integration:

1. Check the VS Code Developer Tools (Help > Toggle Developer Tools)
2. Look for errors in the VS Code logs
3. Verify that both WebSocket servers can be started (no port conflicts)
4. Ensure all permissions are set correctly on the scripts
