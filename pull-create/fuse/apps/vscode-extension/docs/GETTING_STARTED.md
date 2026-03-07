# Getting Started with The New Fuse VS Code Extension

## Quick Install

### From VSIX Package

```bash
code --install-extension the-new-fuse-7.4.0.vsix
```

### From Source

```bash
cd apps/vscode-extension
npm install
# Press F5 in VS Code to launch Extension Development Host
```

### Via VS Code UI

1. Open Extensions panel (`Cmd/Ctrl + Shift + X`)
2. Click "..." menu → "Install from VSIX..."
3. Select the `.vsix` file
4. Reload VS Code when prompted

---

## First Steps

### 1. Open The New Fuse Panel

- Click the robot icon (🤖) in the Activity Bar
- Or press `Cmd/Ctrl + Shift + A`

### 2. Verify Installation

- Open Command Palette: `Cmd/Ctrl + Shift + P`
- Type: `The New Fuse: System Status`
- Check connections (some may show "disconnected" initially - that's OK)

### 3. Configure LiteLLM (Optional)

Open VS Code Settings (`Cmd/Ctrl + ,`) and search for `tnf litellm`:

```json
{
  "tnf.litellm.baseURL": "http://localhost:4000",
  "tnf.litellm.model": "gpt-3.5-turbo"
}
```

---

## Essential Commands

| Shortcut                   | Command      | Description                   |
| -------------------------- | ------------ | ----------------------------- |
| `Cmd/Ctrl+Shift+A`         | Send Message | Open chat and focus input     |
| `Cmd/Ctrl+Shift+P` → "TNF" | All Commands | Access all extension commands |

### Chat Commands

- **Send Message** - Open chat
- **Clear Chat** - Clear conversation
- **New Chat** - Start fresh conversation

### Integration Commands

- **System Status** - Check ecosystem connections
- **Agent Federation** - View agent status
- **Open Workflow Builder** - Create workflows

### MCP Commands

- **Connect MCP Server** - Add MCP server
- **MCP Status** - View MCP health

---

## Configuration

### Basic Settings (settings.json)

```json
{
  "tnf.litellm.baseURL": "http://localhost:4000",
  "tnf.litellm.model": "gpt-4",
  "tnf.litellm.maxRetries": 3,
  "tnf.litellm.enableCache": true,
  "tnf.litellm.enableFallback": true,
  "tnf.litellm.fallbackModels": ["gpt-3.5-turbo", "claude-3-haiku"]
}
```

### Redis Caching (for teams)

```json
{
  "tnf.litellm.cacheType": "redis",
  "tnf.litellm.redisHost": "localhost",
  "tnf.litellm.redisPort": 6379,
  "tnf.litellm.cacheTTL": 3600
}
```

---

## System Requirements

- **VS Code**: 1.100.0+
- **Node.js**: 18.0.0+
- **OS**: macOS, Linux, or Windows
- **RAM**: 4GB minimum, 8GB recommended

---

## Troubleshooting

### Extension not loading?

1. Check VS Code Output panel: "The New Fuse"
2. Verify Node.js version: `node --version` (requires v18+)
3. Reinstall: `rm -rf node_modules && npm install`

### API connection issues?

- Check your LiteLLM proxy is running
- Verify the `tnf.litellm.baseURL` setting
- Check network/firewall settings

### Command not found?

1. Reload VS Code: `Cmd/Ctrl + R`
2. Check extension is enabled
3. Try disabling/enabling the extension

---

## Keyboard Shortcuts

| Action       | Shortcut           |
| ------------ | ------------------ |
| Quick chat   | `Cmd/Ctrl+Shift+A` |
| Send message | `Enter`            |
| New line     | `Shift+Enter`      |
| Blur input   | `Escape`           |

---

## Security Notes

- All data encrypted with AES-256-GCM
- API keys stored in VS Code Secrets API
- Rate limiting prevents abuse
- Audit logging tracks all actions

---

## Next Steps

1. ✅ Extension installed
2. 📖 Read [MCP Guide](MCP_GUIDE.md) for MCP configuration
3. 🔧 Configure your AI provider settings
4. 🚀 Start chatting!

---

_The New Fuse VS Code Extension v7.4.0_
