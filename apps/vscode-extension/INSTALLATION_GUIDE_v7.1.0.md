# The New Fuse v7.1.0 - Installation & Quick Start Guide

## 📦 Installation

### Method 1: Command Line (Recommended)

```bash
# Navigate to the directory containing the VSIX file
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/src/vscode-extension-working

# Install the extension
code --install-extension the-new-fuse-7.1.0.vsix
```

### Method 2: VSCode UI

1. Open Visual Studio Code
2. Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux) to open Extensions
3. Click the "..." menu (three dots) in the top right
4. Select "Install from VSIX..."
5. Navigate to and select `the-new-fuse-7.1.0.vsix`
6. Click "Install"
7. Reload VSCode when prompted

---

## 🚀 First-Time Setup

### Step 1: Open The New Fuse

1. Look for the **robot icon** 🤖 in the Activity Bar (left sidebar)
2. Click it to open The New Fuse panel
3. You should see the AI Chat interface with 7 icon buttons at the top

### Step 2: Configure API Keys (Essential for AI Features)

1. Click the **👤 Profile** button
2. Select "Manage API Keys"
3. Choose your AI provider:
   - **OpenAI** (for GPT-4, GPT-3.5)
   - **Anthropic** (for Claude models)
   - **LiteLLM** (for unified API access)
4. Enter your API key (it will be stored securely with encryption)
5. Repeat for any additional providers you want to use

**Where to get API keys:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

### Step 3: Test the Chat

1. Type a message in the chat input: "Hello! Please tell me about your capabilities."
2. Press Enter or click "Send"
3. You should receive a response from the AI

---

## 🎯 Feature Tour

### 1. 🛒 Marketplace (AI Providers & MCP)

**Try this:**
1. Click **🛒 Marketplace** button
2. Select "View Provider Health"
3. See the status of your configured AI providers

**Connect an MCP Server:**
1. Click **🛒 Marketplace**
2. Select "Connect to MCP Server"
3. Enter a server URL (e.g., `wss://mcp-server.example.com`)

### 2. 📜 History (Conversations & Logs)

**Export a conversation:**
1. Have a chat conversation
2. Click **📜 History**
3. Select "Export Current Conversation"
4. Choose a location to save the JSON file

**View audit logs:**
1. Click **📜 History**
2. Select "View Audit Logs"
3. See security and usage statistics

### 3. 👤 Profile (Settings & Keys)

**Configure AI settings:**
1. Click **👤 Profile**
2. Select "Configure AI Settings"
3. Set your preferred context window size (default: 4000 tokens)

**View statistics:**
1. Click **👤 Profile**
2. Select "View User Statistics"
3. Monitor your API usage and rate limits

### 4. ⚙️ Settings (Security & System)

**Security Dashboard:**
1. Click **⚙️ Settings**
2. Select "Security Dashboard"
3. View comprehensive security status

**System Health:**
1. Click **⚙️ Settings**
2. Select "System Health Check"
3. See the status of all system components

### 5. 🔧 Tools (MCP Tools)

**Use MCP tools:**
1. First, connect to an MCP server (see Marketplace)
2. Click **🔧 Tools**
3. Select a tool from the list
4. Enter JSON parameters
5. View the tool's output

### 6. 📦 Resources (MCP Resources)

**Access MCP resources:**
1. Connect to an MCP server with resources
2. Click **📦 Resources**
3. Browse available resources
4. Select one to view its content

### 7. 🔐 Security (Quick Access)

**Quick security check:**
1. Click **🔐 Security**
2. See instant security status overview

---

## 💡 Quick Tips

### Keyboard Shortcuts
- `Cmd/Ctrl + Shift + A` - Send message
- `Cmd/Ctrl + K` - Clear chat
- `Cmd/Ctrl + I` - Inline suggestions (in editor)
- `Cmd/Ctrl + /` - Focus input
- `Shift + Enter` - New line in message

### Chat Features
- **Drag & Drop**: Drag files into chat to add them to context
- **@ Symbol**: Type @ to add code context
- **/ Commands**: Type / for command shortcuts
- **Mode Switching**: Use 💻 and 🗄️ buttons for Code/Database modes

### Context Management
- Attach multiple files by dragging them into the chat
- Click the × button on attached files to remove them
- Context is preserved across conversations

---

## 🔧 Advanced Configuration

### Switch AI Providers
1. Click **🛒 Marketplace**
2. Select "Switch AI Provider"
3. Choose from available providers
4. Current provider is marked

### Export/Import Conversations
**Export:**
1. Click **📜 History** → "Export Current Conversation"
2. Save JSON file

**Import:**
1. Click **📜 History** → "Import Conversation"
2. Select previously exported JSON file

### Emergency Mode (Use with Caution)
1. Click **⚙️ Settings** → "Emergency Mode"
2. Confirm to enable/disable
3. This temporarily reduces security checks for troubleshooting

---

## 🐛 Troubleshooting

### Extension Not Loading
1. Check VSCode version (need 1.100.0+)
2. Reload VSCode: `Cmd/Ctrl + R`
3. Check Output panel: View → Output → "The New Fuse"

### AI Not Responding
1. Verify API key is set (👤 Profile → Manage API Keys)
2. Check provider health (🛒 Marketplace → View Provider Health)
3. Try switching providers (🛒 Marketplace → Switch AI Provider)

### MCP Connection Issues
1. Verify server URL is correct (must start with wss:// or https://)
2. Check MCP status (⚙️ Settings → MCP Connection Status)
3. Review circuit breaker state

### Rate Limiting
1. View rate limit status (👤 Profile → View User Statistics)
2. Wait for rate limit window to reset
3. Consider switching to another provider

---

## 📊 System Requirements

### Minimum
- VSCode 1.100.0+
- 4GB RAM
- 100MB disk space

### Recommended
- VSCode 1.100.0+
- 8GB RAM
- 200MB disk space
- Active internet connection
- API keys for at least one AI provider

---

## 🔒 Security & Privacy

### Data Storage
- API keys are encrypted using VSCode's SecretStorage
- Conversation history is stored locally
- Audit logs are kept locally for security monitoring

### Network Connections
- Only connects to configured AI providers and MCP servers
- All connections use HTTPS/WSS encryption
- No telemetry or tracking

### Best Practices
1. Never share your API keys
2. Regularly export conversation backups
3. Review audit logs periodically
4. Keep extension updated
5. Use strong workspace permissions

---

## 📚 Additional Resources

### Documentation Files
- `RELEASE_NOTES_v7.1.0.md` - Complete release notes
- `QUICK_START.md` - Quick start guide
- `COMPLETE_INTEGRATION_STATUS.md` - Technical integration details

### Command Palette
Press `Cmd/Ctrl + Shift + P` and type "The New Fuse" to see all available commands:
- The New Fuse: Send Message
- The New Fuse: Clear Chat
- The New Fuse: New Chat
- The New Fuse: Connect MCP Server
- The New Fuse: Security Dashboard
- And 35+ more commands!

---

## 🎓 Learning Path

### Beginner (First 5 Minutes)
1. ✅ Install extension
2. ✅ Set up API key
3. ✅ Send first message
4. ✅ Explore icon buttons

### Intermediate (First 30 Minutes)
1. ✅ Export a conversation
2. ✅ Switch AI providers
3. ✅ View security dashboard
4. ✅ Try Code mode

### Advanced (First Hour)
1. ✅ Connect to MCP server
2. ✅ Use MCP tools
3. ✅ Configure custom AI settings
4. ✅ Export audit logs

---

## 🆘 Getting Help

### In-App Help
- Click any button to see available actions
- Hover over buttons for tooltips
- Error messages provide actionable guidance

### Community Support
- GitHub Issues: Report bugs
- Documentation: Comprehensive guides included
- Command Palette: Access all features

---

## ✅ Installation Checklist

- [ ] VSCode 1.100.0+ installed
- [ ] Extension installed from VSIX
- [ ] Robot icon visible in Activity Bar
- [ ] At least one API key configured
- [ ] First test message sent successfully
- [ ] Explored all 7 icon buttons
- [ ] Reviewed security dashboard
- [ ] Tested conversation export

---

**Congratulations! You're ready to use The New Fuse v7.1.0!** 🎉

Start chatting, explore the features, and unleash the power of AI-assisted development with complete backend integration!