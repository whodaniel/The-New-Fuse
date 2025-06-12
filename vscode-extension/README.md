# The New Fuse - VS Code Extension

A powerful VS Code extension that integrates with The New Fuse platform to provide AI-powered chat participants directly in your development environment.

## Features

✨ **Multi-Agent Chat Integration** - Access multiple AI agents through VS Code's chat interface
🔄 **Real-time Streaming** - Get instant responses with streaming support
🏢 **Multi-tenant Support** - Isolated environments for different organizations
📊 **Performance Metrics** - Built-in analytics and monitoring
⚙️ **Easy Configuration** - Simple setup with workspace settings
🔧 **Developer Tools** - Debug logging and troubleshooting features

## Installation

### Prerequisites

1. **VS Code** version 1.85.0 or higher
2. **The New Fuse Backend** running and accessible
3. **Valid API credentials** for your tenant

### Install from VSIX

1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd vscode-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm run package
```

## Configuration

### Initial Setup

1. Open VS Code Settings (`Ctrl/Cmd + ,`)
2. Search for "New Fuse"
3. Configure the following settings:

| Setting | Description | Example |
|---------|-------------|---------|
| `newFuse.serverUrl` | The New Fuse server URL | `https://your-server.com` |
| `newFuse.tenantId` | Your tenant identifier | `my-company` |
| `newFuse.apiKey` | API authentication key | `your-api-key` |

### Quick Setup Command

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "New Fuse: Configure Tenant"
3. Follow the prompts to enter your credentials

### Advanced Settings

```json
{
  "newFuse.serverUrl": "https://your-new-fuse-server.com",
  "newFuse.tenantId": "your-tenant-id",
  "newFuse.apiKey": "your-api-key",
  "newFuse.enableDebugLogging": false,
  "newFuse.streamingEnabled": true,
  "newFuse.autoRefreshInterval": 300000
}
```

## Usage

### Chat Participants

Once configured, The New Fuse agents will appear as chat participants in VS Code:

1. Open the VS Code Chat panel (`Ctrl+Alt+I` or `View > Chat`)
2. Type `@fuse` to interact with New Fuse agents
3. Available participants will be dynamically loaded from your backend

### Commands

| Command | Description |
|---------|-------------|
| `@fuse <message>` | Send a message to the active agent |
| `@fuse /help` | Get help information |
| `@fuse /status` | Check agent status |

### Extension Commands

| Command | Description |
|---------|-------------|
| `New Fuse: Refresh Agents` | Reload agents from the backend |
| `New Fuse: Configure Tenant` | Set up tenant configuration |
| `New Fuse: View Metrics` | Open the metrics dashboard |

## Features in Detail

### 🤖 Dynamic Agent Loading

- Agents are automatically loaded from your New Fuse backend
- Only active agents appear as chat participants
- Real-time updates when agents are added/removed

### 💬 Rich Chat Experience

- **Streaming responses** for real-time interaction
- **Context awareness** including workspace and editor context
- **Command support** for specialized agent functions
- **Chat history** maintained across sessions

### 📊 Analytics Dashboard

Access comprehensive metrics:

- Request/response statistics
- Performance monitoring
- Error rates and debugging
- Per-agent analytics

### 🔧 Developer Experience

- **Debug logging** for troubleshooting
- **Configuration validation** with helpful error messages
- **Auto-refresh** to keep agents up to date
- **Health checks** for backend connectivity

## Troubleshooting

### Common Issues

#### "No chat participants found"

1. Check your server URL and credentials
2. Ensure The New Fuse backend is running
3. Verify your tenant has active agents
4. Run "New Fuse: Refresh Agents" command

#### "Authentication failed"

1. Verify your API key is correct
2. Check if your tenant ID matches your account
3. Ensure your API key has the necessary permissions

#### "Connection refused"

1. Check if the server URL is accessible
2. Verify the server is running on the specified port
3. Check firewall and network connectivity

### Debug Mode

Enable debug logging for detailed troubleshooting:

1. Open VS Code Settings
2. Search for "New Fuse"
3. Enable "Enable Debug Logging"
4. Check the "The New Fuse" output channel for detailed logs

### Log Analysis

View logs in VS Code:

1. Open the Output panel (`View > Output`)
2. Select "The New Fuse" from the dropdown
3. Review logs for errors or warnings

## Development

### Project Structure

```
src/
├── extension.ts                    # Main extension entry point
├── services/
│   ├── ApiClient.ts               # Backend API communication
│   ├── ChatParticipantManager.ts  # Chat participant management
│   ├── ConfigurationManager.ts    # Settings and configuration
│   ├── LoggingService.ts          # Logging and debugging
│   └── MetricsService.ts          # Performance analytics
└── types/                         # TypeScript type definitions
```

### Building

```bash
# Development build
npm run compile

# Watch mode for development
npm run watch

# Production build
npm run vscode:prepublish

# Package for distribution
npm run package
```

### Testing

```bash
# Run linting
npm run lint

# Run tests
npm test
```

## API Reference

### Backend Endpoints

The extension communicates with these New Fuse backend endpoints:

- `GET /api/copilot/participants` - List chat participants
- `POST /api/copilot/chat` - Send chat message
- `POST /api/copilot/chat/stream` - Streaming chat
- `GET /api/copilot/metrics` - Get analytics data
- `GET /api/copilot/health` - Health check

### Configuration Schema

```typescript
interface NewFuseConfiguration {
  serverUrl: string;          // Required: Backend server URL
  tenantId: string;          // Required: Tenant identifier
  apiKey: string;            // Required: API authentication key
  enableDebugLogging: boolean; // Optional: Debug mode
  streamingEnabled: boolean;   // Optional: Enable streaming
  autoRefreshInterval: number; // Optional: Auto-refresh interval
}
```

## Security

- **API keys** are stored securely in VS Code settings
- **HTTPS** is recommended for production deployments
- **Debug logs** may contain sensitive information - disable in production

## Support

- **Documentation**: Check The New Fuse platform documentation
- **Issues**: Report bugs in the project repository
- **Logs**: Enable debug logging for detailed troubleshooting

## License

This extension is part of The New Fuse platform. See the main project license for details.

---

**The New Fuse** - Empowering developers with AI-powered collaboration tools.
