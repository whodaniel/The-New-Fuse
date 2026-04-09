# The New Fuse - VS Code Extension

**AI Assistant with Multi-Agent Orchestration, MCP Configuration & LiteLLM
Integration**

![Version](https://img.shields.io/badge/version-7.4.0-blue)
![VS Code](https://img.shields.io/badge/vscode-%5E1.100.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

The New Fuse VS Code extension is the IDE integration point for The New Fuse
Multi-Agent Orchestration Platform. It enables seamless AI assistance, MCP
server management, and integration with the TNF ecosystem directly within your
development environment.

## Features

### 🤖 AI Chat Interface

- Multi-provider support (OpenAI, Anthropic, LiteLLM)
- Streaming responses with real-time updates
- Conversation history and export
- Context-aware code assistance

### 🔗 MCP (Model Context Protocol) Integration

- Rich configuration UI with dropdown menus
- Multi-tenant user preferences
- Per-agent MCP server configuration
- Workflow builder integration
- 10+ pre-configured MCP servers

### 🔐 Security Features

- Security Orchestrator with dashboard
- API key management (encrypted storage)
- Audit logging and export
- Vulnerability scanning
- Emergency mode

### 💻 Code Actions

- Explain Code
- Fix Code
- Improve Code
- Add to Context
- Generate Commit Message
- Inline Suggestions

### ⚡ Workflow & Automation

- Terminal Orchestration
- Plan Manager
- Agent Federation
- Auto-Approve Mode

## Installation

### From VSIX

```bash
code --install-extension the-new-fuse-7.4.0.vsix
```

### From Source

```bash
cd apps/vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

## Quick Start

1. **Open The New Fuse Panel**: Click the robot icon (🤖) in the activity bar
2. **Start Chatting**: Type your message and press Enter
3. **Access Features**: Use the toolbar buttons:
   - 🛒 Marketplace (MCP Configuration)
   - 📚 History (Conversations & Audit)
   - 👤 Profile (API Keys & Settings)
   - ⚙️ Settings (Security & System)

## Configuration

### LiteLLM Settings

Configure via VS Code Settings (`Ctrl/Cmd + ,`):

| Setting                      | Default                 | Description             |
| ---------------------------- | ----------------------- | ----------------------- |
| `tnf.litellm.baseURL`        | `http://localhost:4000` | LiteLLM proxy URL       |
| `tnf.litellm.model`          | `gpt-3.5-turbo`         | Default model           |
| `tnf.litellm.apiKey`         | `""`                    | API key (optional)      |
| `tnf.litellm.enableCache`    | `true`                  | Enable response caching |
| `tnf.litellm.enableFallback` | `true`                  | Enable model fallback   |

### MCP Server Configuration

The extension reads from `/data/mcp_config.json` for global MCP server
configuration. User preferences are stored in VS Code's encrypted global state.

## Commands

All commands are prefixed with `The New Fuse`:

| Command            | Keybinding         | Description                 |
| ------------------ | ------------------ | --------------------------- |
| Send Message       | `Ctrl/Cmd+Shift+A` | Send message to chat        |
| Inline Suggestions | `Ctrl/Cmd+I`       | Get inline code suggestions |
| Clear Chat         | -                  | Clear current conversation  |
| New Chat           | -                  | Start new conversation      |
| MCP Connect        | -                  | Connect to MCP server       |

## Architecture

```
src/
├── extension.ts           # Extension entry point
├── ChatViewProvider.ts    # Main webview provider
├── types.ts               # TypeScript definitions
├── ai/
│   ├── AIServiceManager.ts     # Multi-provider AI management
│   └── LLMProviderManager.ts   # LiteLLM integration
├── mcp/
│   ├── MCPConfigurationManager.ts  # MCP config management
│   ├── MCPConnectionManager.ts     # Server connections
│   └── MCPUIManager.ts             # Rich UI menus
├── security/
│   ├── SecurityOrchestrator.ts    # Security coordination
│   ├── AuditLogger.ts             # Audit logging
│   └── VulnerabilityScanner.ts    # Security scanning
├── commands/
│   └── handlers/              # Command implementations
└── views/
    ├── LLMProviderPanel.ts    # Provider configuration UI
    └── LiteLLMConfigPanel.ts  # LiteLLM settings UI
```

## Integration with TNF Platform

The extension connects to The New Fuse backend services:

- **Orchestrator API**: Agent registration and heartbeat
- **MCP Servers**: Tool and resource access
- **Auth Service**: User authentication
- **@the-new-fuse/tnf-core**: Shared types and utilities

## Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [Installation Guide](docs/INSTALLATION_GUIDE.md)
- [MCP Configuration Guide](docs/MCP_CONFIGURATION_GUIDE.md)
- [MCP Quick Reference](docs/MCP_QUICK_REFERENCE.md)
- [Changelog](CHANGELOG.md)

## Development

### Building

```bash
npm run compile
```

### Watching

```bash
npm run watch
```

### Packaging

```bash
npx vsce package
```

### Linting

```bash
npm run lint
```

## Dependencies

- `openai` - OpenAI SDK
- `@anthropic-ai/sdk` - Anthropic SDK
- `@modelcontextprotocol/sdk` - MCP SDK
- `ws` - WebSocket support

## Contributing

Contributions are welcome! Please see the main repository guidelines.

## License

MIT License - See LICENSE file for details.

---

**Part of [The New Fuse](https://github.com/whodaniel/fuse) Multi-Agent
Orchestration Platform**
