# 🚀 The New Fuse VSCode Extension - Quick Start

## ⚡ 60-Second Setup

### 1. **Install Dependencies** (15 seconds)
```bash
cd src/vscode-extension-working
bun install
```

### 2. **Set Environment** (10 seconds)
```bash
export TNF_DEV_MODE=true
```

### 3. **Launch in VSCode** (15 seconds)
1. Press `F5` to start debugging
2. New VSCode window opens with extension loaded

### 4. **Open The New Fuse** (10 seconds)
1. Click robot icon (🤖) in Activity Bar
2. OR press `Cmd+Shift+A` to open chat

### 5. **Test Integration** (10 seconds)
1. Run command: `The New Fuse: System Status`
2. Verify connections (some may show "disconnected" - that's OK!)

## 🎯 Essential Commands

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Cmd+Shift+A` | Send Message | Open chat and focus input |
| `Cmd+Shift+P` → "TNF" | Command Palette | Access all commands |

## 📋 Available Commands

### **Chat Commands**
- ✅ `The New Fuse: Send Message` - Open chat
- ✅ `The New Fuse: Clear Chat` - Clear conversation
- ✅ `The New Fuse: New Chat` - Start fresh conversation

### **Integration Commands** ⭐ NEW!
- ✅ `The New Fuse: System Status` - Check ecosystem connections
- ✅ `The New Fuse: Agent Federation` - View agent status
- ✅ `The New Fuse: Open Workflow Builder` - Create workflows

### **MCP Commands**
- ✅ `The New Fuse: Connect MCP Server` - Add MCP server
- ✅ `The New Fuse: MCP Status` - View MCP health

## 🔧 Configuration

### **Basic Setup**
No configuration required! Extension works out-of-the-box.

### **Advanced Configuration**
Add to VSCode `settings.json`:
```json
{
  "theNewFuse.ai.defaultProvider": "openai",
  "theNewFuse.security.requireAuthentication": true,
  "theNewFuse.mcp.autoConnect": true
}
```

## 🎨 UI Overview

### **Chat Panel**
- Message bubbles with avatars
- Typing indicators
- Code syntax highlighting
- Context pills for files

### **Status Bar**
- Connection status (green dot = connected)
- Current AI provider
- Quick actions

## 🐛 Troubleshooting

### **Extension not loading?**
1. Check VSCode Output panel: "The New Fuse"
2. Verify Node.js version: `node --version` (requires v18+)
3. Reinstall: `rm -rf node_modules && bun install`

### **API Gateway connection failed?**
- Start API Gateway: `cd apps/api-gateway && bun run start:dev`
- Check URL: Should be `http://localhost:3000`
- Set env: `export API_GATEWAY_URL=http://localhost:3000`

### **Browser Hub connection failed?**
- Start Browser Hub: `cd apps/browser-hub && bun start`
- Check URL: Should be `ws://localhost:8080`
- This is optional - extension works without it

## 📊 System Requirements

- **VSCode**: 1.100.0 or newer
- **Node.js**: 18.0.0 or newer
- **OS**: macOS, Linux, or Windows
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 500MB free space

## 🎓 Next Steps

1. ✅ Extension installed and running
2. 📖 Read [COMPREHENSIVE_UPGRADES.md](COMPREHENSIVE_UPGRADES.md) for full integration guide
3. 🔐 Review [IMPROVEMENTS_IMPLEMENTED.md](IMPROVEMENTS_IMPLEMENTED.md) for security details
4. 🎉 Start using The New Fuse!

## 💡 Pro Tips

### **Keyboard Shortcuts**
- `Cmd+Shift+A` - Quick chat
- `Enter` - Send message
- `Shift+Enter` - New line in message
- `Escape` - Blur input

### **Performance**
- Enable streaming: Responses appear in real-time
- Use rate limiting: Prevents API quota issues
- Clear old chats: Improves performance

### **Security**
- All data encrypted with AES-256-GCM
- API keys stored in VSCode Secrets API
- Rate limiting prevents abuse
- Audit logging tracks all actions

## 📞 Support

### **Need Help?**
1. Check VSCode Output: "The New Fuse" channel
2. Review logs: `~/.config/Code/logs/`
3. GitHub Issues: `https://github.com/The-New-Fuse/vscode-extension/issues`

### **Found a Bug?**
Please report with:
- VSCode version
- Extension version (7.0.0)
- Error message from Output panel
- Steps to reproduce

---

## ✅ Checklist

- [ ] Dependencies installed
- [ ] Extension loads in debug mode
- [ ] Chat panel opens
- [ ] Can send messages
- [ ] System status command works
- [ ] No errors in Output panel

**All checked? You're ready to go! 🎉**

---

*Quick Start Guide for The New Fuse VSCode Extension v7.0.0*