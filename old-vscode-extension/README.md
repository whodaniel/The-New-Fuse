# The New Fuse VS Code Extension

## Overview

The New Fuse is a comprehensive VS Code extension for AI Agent Orchestration with features for monitoring, Model Context Protocol (MCP) integration, and AI Coder integration. It enables communication between AI agents, provides tools for monitoring LLM usage, and connects to external AI coding assistants.

## New in This Version

### 🔄 AI Coder Integration

The New Fuse now includes full integration with AI Coding tools:

- **Roo Monitoring**: Monitor Roo AI assistant's output directly from VS Code
- **AI Coder View**: New sidebar view for managing AI coding tools
- **WebSocket Communication**: Connect external tools to VS Code through secure WebSockets

### 🚀 Key Features

- **AI Agent Orchestration**: Coordinate multiple AI agents working together
- **MCP Integration**: Support for the Model Context Protocol
- **LLM Provider Management**: Easily switch between different LLM providers and models
- **Monitoring Dashboard**: Track LLM usage and performance
- **WebSocket Communication**: Connect to external AI tools and browsers
- **AI Code Assistance**: Get AI-powered code completions and explanations

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Configure your API keys in the extension settings
3. Access The New Fuse from the activity bar (look for the fusion icon)
4. Start using AI agent orchestration features

## Using AI Coder Features

To use the new AI Coder integration features:

1. Open the AI Coder view from the activity bar
2. Click "Start Monitoring" to begin monitoring Roo output
3. External tools can connect via WebSockets to ports 3710 (main) and 3711 (Roo)
4. Use the status bar indicators to check connection status

## Commands

The extension provides the following commands (accessible via Command Palette):

- `The New Fuse: Open Dashboard` - Open the main dashboard
- `The New Fuse: Open Monitoring Dashboard` - Open the monitoring interface
- `The New Fuse: Initialize MCP Integration` - Set up the Model Context Protocol
- `The New Fuse: Start Roo AI Code Monitoring` - Begin monitoring Roo output
- `The New Fuse: Stop Roo AI Code Monitoring` - Stop monitoring Roo output
- `The New Fuse: Show AI Coder Status` - Display status of AI coder connections

## Configuration

Configure the extension in VS Code settings:

- `theFuse.mcpEnabled`: Enable Model Context Protocol integration
- `theFuse.monitoring.enabled`: Enable monitoring of LLM usage
- `theFuse.aiCoder.enabled`: Enable AI Coder integration
- `theFuse.aiCoder.rooMonitoring`: Enable monitoring of Roo AI output
- `theFuse.aiCoder.port`: Port for AI Coder WebSocket server
- `theFuse.aiCoder.rooPort`: Port for Roo output monitoring

## Project Structure

The extension is organized with the following structure:

```plaintext
src/
├── core/                # Core functionality and shared components 
├── utils/               # Utility functions and helpers
│   ├── code-analyzer.ts # Code analysis functionality
│   ├── error-utils.ts   # Error handling utilities
│   ├── logging.ts       # Logging utilities
│   └── performance-utils.ts # Performance monitoring utilities
├── services/            # Service implementations
│   ├── chrome-websocket-service.ts # WebSocket service for Chrome extension
│   ├── rate-limiter.ts  # Rate limiting functionality 
│   └── relay-service.ts # Communication relay service
├── views/               # WebView providers
│   ├── communication-hub-provider.ts # Communication hub provider
│   ├── relay-panel-provider.js       # Relay panel provider
│   └── settings-view-provider.ts     # Settings view provider
├── mcp-integration/     # Model Context Protocol integration
├── anthropic-xml/       # Anthropic XML support
├── extension-discovery/ # Agent and extension discovery
├── commands/            # Command implementations
├── llm/                 # LLM provider integrations
├── monitoring/          # Monitoring and telemetry
└── types/               # TypeScript type definitions
```

**Note:** The project structure has been refactored to improve organization. Functionality from several utility files (fs-utils, webview-utils, uri-utils, vscode-utils) has been integrated directly into the relevant service and component classes for better cohesion.

## For Developers

If you're developing or extending The New Fuse:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Use `Launch Integrated Extension` task to test the extension
4. Check `EXTENSION-INTEGRATION.md` for details on the integration architecture

## Troubleshooting

If you encounter issues:

- Ensure your API keys are correctly configured
- Check that WebSocket ports (3710, 3711) are available
- Verify that Roo is installed if using Roo monitoring features
- Look for errors in the VS Code Developer Tools (Help > Toggle Developer Tools)

## License

[LICENSE](./LICENSE)
