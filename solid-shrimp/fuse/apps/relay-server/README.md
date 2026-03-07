# TNF Relay Complete Integration Package

## Overview

The TNF (The New Fuse) Relay is a comprehensive AI API interception and
management system that provides:

- **Complete API Interception**: HTTP/HTTPS proxy for any application
- **Claude Code Integration**: Terminal-based Claude Code interception
- **VS Code Support**: Extension integration and proxy configuration
- **Chrome Extension Bridge**: Browser automation and element selection
- **Real-time Dashboard**: React-based UI for system management
- **Claude Desktop Integration**: Direct message routing to Claude Desktop

## Features

### 🔍 API Interception Methods

1. **HTTP/HTTPS Proxy Server** - Intercepts all network requests
2. **Environment Variable Injection** - Configures Claude Code automatically
3. **VS Code Proxy Configuration** - Routes VS Code extension calls
4. **System-level Proxy** - macOS network configuration
5. **Network-level Monitoring** - Complete traffic analysis

### 🎯 Target Applications

- **Claude Code** (Terminal CLI)
- **VS Code Extensions** (Claude Code, GitHub Copilot, etc.)
- **Chrome Extensions** (Any AI-powered extensions)
- **Direct API Calls** (curl, Postman, custom apps)
- **Browser Applications** (Web-based AI tools)

### 📊 Management Dashboard

- **Real-time Monitoring** - Live view of intercepted requests
- **Agent Management** - Connect and manage AI agents
- **Intercept Rules** - Configure which APIs to intercept
- **System Control** - Start/stop/restart services
- **Environment Setup** - One-click configuration

## Installation

### From Monorepo Root (Recommended)

```bash
# Install all dependencies
pnpm install

# Build UI (optional)
pnpm --filter tnf-relay-complete run build-ui

# Start the relay server
pnpm --filter tnf-relay-complete start
```

### Standalone Setup (Advanced)

If you want to run relay-server standalone outside the monorepo:

```bash
cd apps/relay-server

# Run manual setup script
pnpm run manual-setup

# Start the system
pnpm start
```

## Usage

### 1. Start TNF Relay

```bash
npm start
# or
node src/comprehensive-tnf-relay.js start
```

### 2. Access Dashboard

Open: http://localhost:3002

### 3. Configure Applications

#### Claude Code Setup

```bash
./scripts/setup-claude-code.sh
# Restart terminal, then use claude normally
```

#### VS Code Setup

```bash
./scripts/setup-vscode.sh
# Follow instructions to add proxy settings
```

#### System Proxy

```bash
./scripts/system-proxy.sh enable  # Enable
./scripts/system-proxy.sh disable # Disable
```

## API Endpoints

### HTTP API (Port 3000)

- `GET /status` - System status
- `GET /agents` - Connected agents
- `GET /intercept-rules` - Intercept configuration
- `POST /intercept-rules` - Add intercept rule
- `GET /intercepted-messages` - View intercepted requests
- `POST /setup/claude-code-env` - Setup Claude Code
- `POST /setup/vscode-proxy` - Generate VS Code config
- `POST /setup/system-proxy` - Configure system proxy

### WebSocket API (Port 3001)

- Real-time agent communication
- Live message routing
- Status updates

### Dashboard UI (Port 3002)

- Complete system management
- Visual configuration
- Real-time monitoring

### Proxy Server (Port 8888)

- HTTP/HTTPS request interception
- Transparent proxying
- Request modification

## Configuration

### Intercept Rules

Add custom API endpoints to intercept:

```json
{
  "hostname": "api.example.com",
  "action": "intercept_and_route",
  "description": "Custom API",
  "enabled": true,
  "target": "claude_desktop"
}
```

### Environment Variables

```bash
export HTTP_PROXY="http://localhost:8888"
export HTTPS_PROXY="http://localhost:8888"
export TNF_INTERCEPT_ACTIVE=1
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │    │   VS Code Ext   │    │ Chrome Extension│
│   (Terminal)    │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ HTTP_PROXY           │ http.proxy           │ Network
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │     TNF Proxy Server       │
                    │        (Port 8888)         │
                    └─────────────┬──────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │   TNF Enhanced Relay       │
                    │  HTTP: 3000, WS: 3001      │
                    └─────────────┬──────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │  Claude Desktop Bridge     │
                    │   (Message Formatting)     │
                    └─────────────┬──────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │     Claude Desktop         │
                    │   (Final Destination)      │
                    └────────────────────────────┘
```

## License

MIT License - See LICENSE file for details
