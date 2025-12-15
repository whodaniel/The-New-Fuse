# The New Fuse Chrome Extension

<div align="center">

**🚀 Enterprise AI Bridge for Browser Integration**

[![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)]()
[![Chrome](https://img.shields.io/badge/Chrome-MV3-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

</div>

---

## 🎯 Overview

The New Fuse Chrome Extension is an enterprise-grade browser extension that
bridges AI chat platforms with the TNF relay system. It enables:

- **AI-to-AI Communication** - Connect multiple AI agents across different
  platforms
- **Human-to-AI Bridge** - Seamlessly inject prompts and capture responses
- **Real-time Relay** - Instant message routing through the TNF backend
- **Multi-Platform Support** - Works with Gemini, ChatGPT, Claude, and more

## ✨ Features

### 🤖 AI Platform Integration

- **Google Gemini** - Full support for text injection and response capture
- **ChatGPT** - OpenAI's chat interface integration
- **Claude** - Anthropic's AI assistant integration
- **Perplexity** - Research-focused AI integration
- **Custom Platforms** - Extensible selector system

### 🔗 TNF Relay Connection

- HTTP REST API integration with `/relay` endpoints
- WebSocket support for real-time messaging
- Automatic agent registration
- Message queuing and routing
- Health monitoring and auto-reconnect

### 💉 Text Injection System

- Multiple injection strategies (ContentEditable, value setter, clipboard,
  simulated typing)
- AI platform-specific selectors
- Automatic send button detection
- Submit option for auto-sending

### 📸 Response Capture

- MutationObserver-based monitoring
- Intelligent content extraction
- Platform-specific output selectors
- Real-time capture notifications

### 🎨 Premium UI/UX

- "Deep Space" design system with purple/blue gradients
- Glassmorphism 2.0 effects
- Draggable floating panel
- 5-tab popup interface (Dashboard, Agents, Relay, AI Bridge, Settings)
- Dark theme optimized

## 📦 Installation

### From Source (Development)

```bash
# Navigate to extension directory
cd apps/chrome-extension

# Install dependencies (optional, for linting)
npm install

# Build the extension
npm run build

# The built extension is in the dist/ folder
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist` folder
5. The extension icon should appear in your toolbar

### Keyboard Shortcuts

| Shortcut                            | Action                |
| ----------------------------------- | --------------------- |
| `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) | Open popup            |
| `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) | Toggle floating panel |
| `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`) | Capture AI response   |

## 🔧 Configuration

### Relay Connection

By default, the extension connects to:

- **Development**: `http://localhost:3000/relay`
- **Production**: Configure in Settings tab

### Settings Options

| Setting        | Default                 | Description               |
| -------------- | ----------------------- | ------------------------- |
| Relay URL      | `http://localhost:3000` | TNF backend URL           |
| Auto-connect   | `true`                  | Connect on startup        |
| Auto-reconnect | `true`                  | Reconnect on disconnect   |
| Show badge     | `true`                  | Connection status on icon |
| Notifications  | `true`                  | Desktop notifications     |
| Log level      | `info`                  | Console logging verbosity |

## 🏗 Architecture

```
chrome-extension/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker - relay connection, routing
├── content.js          # Content script - AI detection, injection
├── popup.html/js/css   # Extension popup UI
├── options.html/js     # Settings page
├── icons/              # Extension icons (16, 32, 48, 128px)
├── create-icons.js     # Icon generation script
└── package.json        # Package configuration
```

### Message Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Popup     │────▶│  Background │────▶│  TNF Relay  │
│             │◀────│  (Service   │◀────│  Backend    │
│             │     │   Worker)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Content   │
                    │   Script    │
                    │ (AI Pages)  │
                    └─────────────┘
```

## 🔌 API Reference

### Background → Content Script Messages

```javascript
// Inject text into AI chat
{ type: 'INJECT_TEXT', payload: { text: 'Hello', submit: false } }

// Capture current response
{ type: 'CAPTURE_RESPONSE' }

// Toggle floating panel
{ type: 'INJECT_FLOATING_PANEL' }

// Start response monitoring
{ type: 'START_MONITORING' }
```

### Content Script → Background Messages

```javascript
// Content script ready
{ type: 'CONTENT_SCRIPT_READY', payload: { url, platform } }

// AI response captured
{ type: 'AI_RESPONSE_CAPTURED', payload: { content, platform, timestamp } }
```

### Relay REST API

```javascript
// Register as agent
POST /relay/agents
{ id, name, type: 'browser-bridge', capabilities: [...] }

// Send message
POST /relay/messages
{ type, source, target, payload }

// Broadcast message
POST /relay/broadcast
{ source, type, payload, filter: { type?, capability? } }
```

## 🧪 Testing

### Quick Test

1. Load extension in Chrome
2. Navigate to [google.com/gemini](https://gemini.google.com)
3. Click extension icon
4. Go to "AI Bridge" tab
5. Click "Detect AI Platform" - should show "Google Gemini detected"
6. Click "Inject UI" to show floating panel
7. Type a message and click "Inject Text"

### Full Integration Test

1. Start TNF backend: `pnpm --filter @the-new-fuse/backend-app dev`
2. Load extension
3. Connect to relay (Dashboard tab)
4. Register as agent (Agents tab)
5. Send messages through relay (Relay tab)

## 🔒 Permissions

The extension requests these permissions:

| Permission      | Purpose                                |
| --------------- | -------------------------------------- |
| `tabs`          | Access tab URLs for platform detection |
| `activeTab`     | Interact with active tab               |
| `storage`       | Persist settings                       |
| `notifications` | Desktop notifications                  |
| `scripting`     | Inject content scripts                 |
| `clipboard*`    | Text injection fallback                |
| `contextMenus`  | Right-click menu options               |
| `alarms`        | Periodic health checks                 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - The New Fuse Team

---

<div align="center">

**Part of [The New Fuse](https://thenewfuse.com) Framework**

[Documentation](https://thenewfuse.com/docs) •
[GitHub](https://github.com/whodaniel/fuse) •
[Support](https://thenewfuse.com/support)

</div>
