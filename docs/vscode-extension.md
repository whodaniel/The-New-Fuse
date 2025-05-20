# VS Code Extension Documentation

This document provides comprehensive documentation for The New Fuse VS Code extension.

## Overview

The New Fuse VS Code extension enables AI agent coordination and workflow automation directly within your development environment. It provides a seamless interface for interacting with AI agents, managing workflows, and automating common development tasks.

## Architecture

The extension follows a modular architecture with the following key components:

### Core Components

1. **Extension Entry Point** (`extension.ts`)
   - Manages activation and deactivation
   - Registers commands and event handlers
   - Initializes other components

2. **Agent Communication Manager** (`agent-communication.ts`)
   - Handles WebSocket communication with AI agents
   - Manages connection state and reconnection
   - Provides message sending and receiving capabilities

3. **Protocol Registry** (`protocol-registry.ts`)
   - Registers protocol handlers for different message types
   - Routes messages to appropriate handlers
   - Provides a standardized communication protocol

4. **Webview Manager** (`webview-manager.ts`)
   - Creates and manages webview panels
   - Handles communication between extension and webviews
   - Provides UI for interacting with AI agents

5. **Command Registry** (`command-registry.ts`)
   - Registers and executes commands
   - Provides a centralized command management system
   - Handles command arguments and results

6. **AI Collaboration Manager** (`ai-collaboration.ts`)
   - Manages collaboration sessions with AI agents
   - Handles task descriptions and session state
   - Provides collaboration-specific functionality

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "The New Fuse"
4. Click Install

### From VSIX File

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded file

## Usage

### Getting Started

1. Open a project in VS Code
2. Click the "The New Fuse" icon in the activity bar
3. Connect to an AI agent server using the status bar item
4. Start AI collaboration by describing your task

### Commands

The extension provides the following commands:

- `The New Fuse: Hello World` - Display a simple greeting message
- `The New Fuse: Start AI Collaboration` - Start a collaborative coding session with AI agents
- `The New Fuse: Activate AI Agent` - Connect to the AI agent server

### Status Bar Items

The extension adds the following status bar items:

- **AI Connection Status**: Shows the connection status to the AI agent server
- **AI Collaboration Status**: Shows the status of the current collaboration session

### Views

The extension adds the following views:

- **The New Fuse**: Main view for interacting with AI agents

## Configuration

The extension can be configured through VS Code settings:

```json
{
  "thefuse.agentServerUrl": "ws://localhost:3002",
  "thefuse.enableAutoConnect": false,
  "thefuse.logLevel": "info"
}
```

### Available Settings

- `thefuse.agentServerUrl`: URL of the AI agent server (default: `ws://localhost:3002`)
- `thefuse.enableAutoConnect`: Automatically connect to the agent server on startup (default: `false`)
- `thefuse.logLevel`: Log level for the extension (default: `info`)

## Development

### Prerequisites

- Node.js 18 or higher
- VS Code 1.80.0 or higher
- TypeScript 5.1.3 or higher

### Setup

1. Clone the repository
2. Navigate to the extension directory: `cd vscode-extension`
3. Install dependencies: `npm install`
4. Compile the extension: `npm run compile`

### Running the Extension

1. Open the project in VS Code
2. Press F5 to start debugging
3. A new VS Code window will open with the extension loaded

### Building the Extension

To build a VSIX package:

```bash
npm run package
```

This will create a `.vsix` file that can be installed in VS Code.

### Testing

To run tests:

```bash
npm test
```

## Protocol Documentation

The extension uses a message-based protocol for communication with AI agents:

### Message Format

```typescript
interface AgentMessage {
    id: string;
    sender: string;
    recipient: string;
    action: string;
    payload: any;
    timestamp: number;
}
```

### Actions

- `handshake`: Initial connection handshake
- `collaboration:start`: Start a collaboration session
- `collaboration:end`: End a collaboration session
- `collaboration:message`: Send a message in a collaboration session
- `collaboration:response`: Respond to a collaboration message

## Troubleshooting

### Common Issues

#### Connection Failed

If the extension fails to connect to the AI agent server:

1. Check that the server is running
2. Verify the server URL in settings
3. Check for network issues or firewalls

#### Commands Not Working

If commands are not working:

1. Check the VS Code Developer Console for errors
2. Ensure the extension is properly activated
3. Try reloading the window

## Conclusion

The New Fuse VS Code extension provides powerful AI agent coordination and workflow automation capabilities directly within your development environment. By following this documentation, you can effectively use and extend the functionality of the extension.
