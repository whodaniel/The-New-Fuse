# Complete Integration & Setup Guide

This comprehensive guide consolidates all setup, installation, integration, and configuration documentation for The New Fuse ecosystem.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation Guide](#installation-guide)
3. [Development Setup](#development-setup)
4. [Docker Setup](#docker-setup)
5. [MCP Integration](#mcp-integration)
6. [WebSocket Configuration](#websocket-configuration)
7. [Agent Communication Setup](#agent-communication-setup)
8. [Migration Guide](#migration-guide)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before starting with The New Fuse, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **VS Code** (latest version)
- **Git** for version control
- **Docker** (optional, for containerized deployment)
- **Redis** (for agent communication)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/the-new-fuse.git
   cd the-new-fuse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Initialize MCP integration:**
   ```bash
   bash scripts/initialize-mcp.sh
   ```

4. **Start the development environment:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open VS Code with The New Fuse extension:**
   ```bash
   code . --install-extension ./src/vscode-extension
   ```

### Project Structure Overview

```
the-new-fuse/
├── src/
│   ├── vscode-extension/     # VS Code extension source
│   ├── chrome-extension/     # Chrome extension source  
│   ├── agents/              # AI agent implementations
│   └── shared/              # Shared libraries and utilities
├── scripts/                 # Setup and utility scripts
├── packages/               # Package components
├── docs/                   # Documentation
└── config/                 # Configuration files
```

## Installation Guide

### VS Code Extension Installation

#### Method 1: Development Installation
```bash
cd src/vscode-extension
npm install
npm run compile
code --install-extension .
```

#### Method 2: VSIX Package Installation
```bash
# Build the extension package
cd src/vscode-extension
vsce package

# Install the generated VSIX file
code --install-extension the-new-fuse-*.vsix
```

#### Method 3: Marketplace Installation
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "The New Fuse"
4. Click Install

### Chrome Extension Installation

#### Development Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `src/chrome-extension` directory
5. The extension will be loaded and ready to use

#### Production Installation
1. Download the extension from the Chrome Web Store
2. Click "Add to Chrome"
3. Grant necessary permissions

### System Dependencies

#### Redis Installation

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
```bash
# Using WSL or Docker
docker run -d -p 6379:6379 redis:alpine
```

#### Node.js and npm

**Using Node Version Manager (recommended):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Direct installation:**
- Download from [nodejs.org](https://nodejs.org/)
- Follow platform-specific installation instructions

## Development Setup

### Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   # .env file
   NODE_ENV=development
   REDIS_URL=redis://localhost:6379
   WEBSOCKET_PORT=3711
   API_PORT=3000
   LOG_LEVEL=debug
   ```

3. **Configure VS Code settings:**
   ```json
   {
     "typescript.preferences.includePackageJsonAutoImports": "auto",
     "eslint.workingDirectories": ["src"],
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

### Development Workflow

1. **Start the development environment:**
   ```bash
   npm run dev:all
   ```
   This starts:
   - WebSocket server on port 3711
   - API server on port 3000
   - File watchers for automatic rebuilding

2. **Launch VS Code with extension:**
   ```bash
   bash src/vscode-extension/launch-integrated-extension.sh
   ```

3. **Test agent communication:**
   ```bash
   npm run test:agents
   ```

### Building for Production

```bash
# Build all packages
npm run build:all

# Build specific components
npm run build:vscode
npm run build:chrome
npm run build:agents
```

## Docker Setup

### Using Docker Compose

1. **Basic setup with compose:**
   ```bash
   docker-compose up -d
   ```

2. **Custom configuration:**
   ```yaml
   # compose.yaml
   version: '3.8'
   services:
     the-new-fuse:
       build: .
       ports:
         - "3000:3000"
         - "3711:3711"
       environment:
         - NODE_ENV=production
         - REDIS_URL=redis://redis:6379
       depends_on:
         - redis
     
     redis:
       image: redis:alpine
       ports:
         - "6379:6379"
   ```

### Individual Container Setup

1. **Build the application image:**
   ```bash
   docker build -t the-new-fuse .
   ```

2. **Run Redis container:**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:alpine
   ```

3. **Run The New Fuse container:**
   ```bash
   docker run -d --name the-new-fuse \
     -p 3000:3000 -p 3711:3711 \
     --link redis:redis \
     -e REDIS_URL=redis://redis:6379 \
     the-new-fuse
   ```

### Docker Development Environment

```bash
# Start development environment with live reload
docker-compose -f docker-compose.dev.yml up

# Run specific services
docker-compose up redis websocket-server

# View logs
docker-compose logs -f the-new-fuse
```

## MCP Integration

### MCP Server Setup

1. **Initialize MCP configuration:**
   ```bash
   bash scripts/initialize-mcp.sh
   ```

2. **Configure MCP tools:**
   ```typescript
   // mcp-config.json
   {
     "mcpServers": {
       "the-new-fuse": {
         "command": "node",
         "args": ["dist/mcp-server.js"],
         "env": {
           "REDIS_URL": "redis://localhost:6379"
         }
       }
     }
   }
   ```

3. **Register custom MCP tools:**
   ```bash
   node scripts/register-mcp-tools.js
   ```

### Claude Desktop Integration

1. **Update Claude config:**
   ```json
   {
     "mcpServers": {
       "the-new-fuse": {
         "command": "node",
         "args": ["/path/to/the-new-fuse/dist/mcp-server.js"]
       }
     }
   }
   ```

2. **Restart Claude Desktop application**

3. **Test MCP connection:**
   ```bash
   node scripts/mcp-health-check.js
   ```

### MCP Tool Development

```typescript
// Example custom MCP tool
export const customTool = {
  name: 'analyze_code',
  description: 'Analyze code for issues and improvements',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      language: { type: 'string' },
      options: { type: 'object' }
    },
    required: ['code', 'language']
  },
  handler: async (params: any) => {
    // Implementation
    return {
      issues: [],
      suggestions: [],
      metrics: {}
    };
  }
};
```

## WebSocket Configuration

### Server Setup

1. **Start WebSocket server:**
   ```bash
   # Using npm script
   npm run start:websocket

   # Direct node execution
   node test-websocket-server-3711.cjs

   # Using VS Code task
   # Open Command Palette -> Tasks: Run Task -> Start WebSocket Server
   ```

2. **Configure WebSocket options:**
   ```typescript
   // websocket-config.ts
   export const websocketConfig = {
     port: 3711,
     host: 'localhost',
     pingTimeout: 60000,
     pingInterval: 25000,
     cors: {
       origin: "*",
       methods: ["GET", "POST"]
     }
   };
   ```

### Client Connection

#### Chrome Extension Connection
```javascript
// Chrome extension WebSocket client
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:3711');
      
      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        this.handleDisconnection();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.handleDisconnection();
    }
  }

  handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.connect();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }
}
```

#### VS Code Extension Connection
```typescript
// VS Code extension WebSocket integration
import * as vscode from 'vscode';
import WebSocket from 'ws';

export class VSCodeWebSocketClient {
  private ws: WebSocket | null = null;
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 100
    );
    this.statusBarItem.show();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:3711');
    
    this.ws.on('open', () => {
      this.statusBarItem.text = '$(plug) TNF Connected';
      this.statusBarItem.color = '#00ff00';
    });

    this.ws.on('close', () => {
      this.statusBarItem.text = '$(plug) TNF Disconnected';
      this.statusBarItem.color = '#ff0000';
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleVSCodeMessage(message);
    });
  }
}
```

### WebSocket Testing

```bash
# Test WebSocket connection
node scripts/test-websocket-connection.js

# Test message sending
curl -X POST http://localhost:3711/test \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": "Hello WebSocket"}'
```

## Agent Communication Setup

### TNF Agent Relay Setup

#### macOS Installation

1. **Automatic installation:**
   ```bash
   bash scripts/install-tnf-relay.sh
   ```

2. **Manual installation:**
   ```bash
   # Copy the AppleScript application
   cp -r TNF-Agent-Relay.app /Applications/

   # Make executable
   chmod +x /Applications/TNF-Agent-Relay.app/Contents/MacOS/applet
   ```

3. **Grant permissions:**
   - System Preferences → Security & Privacy → Accessibility
   - Add TNF-Agent-Relay.app to allowed applications

#### Configuration

```applescript
-- TNF Relay Configuration
property relayConfig : {
  agentDiscoveryInterval: 30,
  messageRetryAttempts: 3,
  logLevel: "info",
  enabledProtocols: {"websocket", "redis", "file"}
}
```

### Redis Agent Communication

1. **Configure Redis connection:**
   ```typescript
   // redis-config.ts
   export const redisConfig = {
     host: 'localhost',
     port: 6379,
     retryDelayOnFailover: 100,
     enableReadyCheck: true,
     maxRetriesPerRequest: 3
   };
   ```

2. **Start Redis agent bridge:**
   ```bash
   node scripts/start-redis-bridge.js
   ```

### Inter-Extension Communication

#### File-Based Protocol
```typescript
// File communication protocol
class FileProtocol {
  private messagePath = path.join(os.tmpdir(), 'tnf-messages');

  async sendMessage(message: any) {
    const messageFile = path.join(
      this.messagePath, 
      `${Date.now()}-${Math.random().toString(36)}.json`
    );
    
    await fs.promises.writeFile(
      messageFile, 
      JSON.stringify(message, null, 2)
    );
  }

  watchMessages(callback: (message: any) => void) {
    const watcher = chokidar.watch(this.messagePath, {
      ignoreInitial: true
    });

    watcher.on('add', async (filePath) => {
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const message = JSON.parse(content);
        callback(message);
        
        // Clean up message file
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.error('Error processing message file:', error);
      }
    });
  }
}
```

## Migration Guide

### From Legacy Systems

1. **Backup existing configuration:**
   ```bash
   cp -r ~/.vscode/extensions/old-extension ~/.vscode/extensions/old-extension.backup
   ```

2. **Migrate extension settings:**
   ```typescript
   // migration-script.ts
   const migrateSettings = async () => {
     const oldConfig = vscode.workspace.getConfiguration('oldExtension');
     const newConfig = vscode.workspace.getConfiguration('theNewFuse');
     
     // Transfer relevant settings
     await newConfig.update('agentCommunication.enabled', 
       oldConfig.get('communication.enabled'));
   };
   ```

3. **Update agent configurations:**
   ```bash
   node scripts/migrate-agent-configs.js
   ```

### Version Upgrades

#### From v1.x to v2.x
1. **Update dependencies:**
   ```bash
   npm update @the-new-fuse/core
   npm update @the-new-fuse/agents
   ```

2. **Run migration script:**
   ```bash
   node scripts/migrate-v1-to-v2.js
   ```

3. **Update configuration format:**
   ```json
   // Old format (v1.x)
   {
     "agents": ["agent1", "agent2"]
   }
   
   // New format (v2.x)
   {
     "agentConfig": {
       "enabled": ["agent1", "agent2"],
       "settings": {
         "agent1": { "capability": "code-analysis" },
         "agent2": { "capability": "documentation" }
       }
     }
   }
   ```

## Troubleshooting

### Common Issues

#### WebSocket Connection Failures
```bash
# Check if port 3711 is in use
lsof -i :3711

# Kill processes using the port
kill -9 $(lsof -t -i:3711)

# Restart WebSocket server
npm run start:websocket
```

#### Extension Not Loading
1. **Check VS Code logs:**
   ```bash
   # Open VS Code Developer Console
   # Help → Toggle Developer Tools → Console
   ```

2. **Verify extension installation:**
   ```bash
   code --list-extensions | grep the-new-fuse
   ```

3. **Reinstall extension:**
   ```bash
   code --uninstall-extension the-new-fuse
   code --install-extension ./the-new-fuse.vsix
   ```

#### Agent Communication Issues
1. **Verify Redis connection:**
   ```bash
   redis-cli ping
   ```

2. **Check agent registry:**
   ```bash
   node scripts/check-agent-status.js
   ```

3. **Test message routing:**
   ```bash
   node scripts/test-agent-communication.js
   ```

#### Performance Issues
1. **Monitor resource usage:**
   ```bash
   # Check memory usage
   ps aux | grep node

   # Check port usage
   netstat -tulpn | grep :3711
   ```

2. **Optimize configuration:**
   ```typescript
   // Reduce message frequency
   const optimizedConfig = {
     messageProcessingInterval: 1000,
     maxConcurrentConnections: 10,
     enableMessageBatching: true
   };
   ```

### Debug Mode

1. **Enable debug logging:**
   ```bash
   export DEBUG=the-new-fuse:*
   npm run dev
   ```

2. **VS Code debug configuration:**
   ```json
   {
     "name": "Debug Extension",
     "type": "extensionHost",
     "request": "launch",
     "runtimeExecutable": "${execPath}",
     "args": ["--extensionDevelopmentPath=${workspaceRoot}"],
     "env": {
       "DEBUG": "the-new-fuse:*"
     }
   }
   ```

### Support and Community

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-org/the-new-fuse/issues)
- **Discord**: Join our community for real-time support
- **Documentation**: [Comprehensive docs](https://docs.the-new-fuse.com)
- **Stack Overflow**: Tag questions with `the-new-fuse`

This complete integration and setup guide consolidates all installation, configuration, and troubleshooting information for The New Fuse ecosystem. All technical procedures and setup steps have been preserved and enhanced with additional context and examples.
