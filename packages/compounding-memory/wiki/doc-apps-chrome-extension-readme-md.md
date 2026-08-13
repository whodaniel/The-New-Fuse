# Verified Doc: apps/chrome-extension/README.md

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1772007551.3881078

## Content

# The New Fuse - Chrome Extension

A comprehensive Chrome extension for AI automation, element detection, and
cross-platform communication. Features a modern React-based interface with the
original styling and enhanced functionality.

## ✨ Features

### 🎯 Element Detection

- **Auto-detection** of chat input fields, send buttons, and output areas
- **Manual element selection** with visual feedback
- **Real-time validation** of detected elements
- **Multi-platform support** (ChatGPT, Claude, Gemini, etc.)

### 🤖 AI Session Management

- **Start/Stop AI sessions** with visual status indicators
- **Real-time session monitoring**
- **URL-based context awareness**
- **Session state persistence**

### 🔌 WebSocket Communication

- **Real-time connection to local servers**
- **Configurable port settings**
- **Connection health monitoring**
- **Auto-reconnection capabilities**

### 🎛️ Floating Panel

- **Draggable mini-interface**
- **Quick access to common functions**
- **Real-time status display**
- **Minimalist design for minimal screen impact**

## 🏗️ Architecture

### Core Components

1. **NewFusePopup.tsx** - Main popup interface with tabs and controls
2. **EnhancedFloatingPanel.tsx** - Draggable floating panel
3. **Background script** - Handles WebSocket connections and message routing
4. **Content script** - Manages element detection and page interaction

### File Structure

```
src/
├── popup/
│   ├── NewFusePopup.tsx        # Main popup component
│   └── popup.html              # Popup HTML wrapper
├── floatingPanel/
│   ├── EnhancedFloatingPanel.tsx # Floating panel component
│   └── floatingPanel.html      # Panel HTML wrapper
├── background/
│   └── background.ts           # Service worker
├── content/
│   └── index.ts               # Content script
└── styles/
    ├── content.css            # Content script styles
    └── element-selection.css  # Element selection styles
```

## 🚀 Setup & Installation

## AIVI In TNF

The full original `ai-studio-automator` codebase is integrated in this app at:

`apps/chrome-extension/aivi`

Use it through TNF-wired scripts:

```bash
# from repo root
pnpm run tnf:aivi:inventory
pnpm run tnf:aivi:docs:index
pnpm run tnf:aivi:backend:install
pnpm run tnf:aivi:backend:start
pnpm run tnf:aivi:cli:status
```

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Chrome/Chromium browser
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chrome-extension
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Build the extension**

   ```bash
   pnpm run build
   # or
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🎨 Interface Design

### Popup Interface

The popup features a **purple gradient background** with multiple tabs:

- **Elements Tab**: Element detection and selection controls
- **AI Session Tab**: Session management and URL display
- **Connection Tab**: WebSocket connection settings
- **Settings Tab**: Configuration options

### Floating Panel

A **compact, draggable panel** that provides:

- Connection status indicator
- Element detection status
- Quick action buttons
- Session controls

## 🔧 Configuration

### WebSocket Settings

- **Default Port**: 3712
- **Protocols**: ws:// and wss://
- **Auto-reconnect**: Enabled by default

### Element Detection

- **Auto-detection**: Automatically finds common chat elements
- **Manual selection**: Click-to-select interface
- **Validation**: Confirms element accessibility

## 🛠️ Development

### Build Commands

```bash
# Development build with watch
pnpm run dev

# Production build
pnpm run build

# Clean build artifacts
./cleanup.sh

# Run tests
pnpm run test
```

### Code Quality

- **TypeScript** for type safety
- **React** for modern UI components
- **Webpack** for bundling
- **ESLint** for code linting

## 📡 Message Protocol

### Background ↔ Content Script

```typescript
// Element detection
{ type: 'AUTO_DETECT_ELEMENTS' }
{ type: 'START_ELEMENT_SELECTION', elementType: 'inputField' }
{ type: 'VALIDATE_ELEMENTS' }

// Session management
{ type: 'START_AI_SESSION' }
{ type: 'END_AI_SESSION' }

// Status updates
{ type: 'ELEMENT_SELECTED', payload: { elementType, element } }
{ type: 'WEBSOCKET_STATUS_UPDATE', payload: { status, message } }
```

### WebSocket Communication

```typescript
// Connection management
{ type: 'WEBSOCKET_CONNECT', port: number }
{ type: 'WEBSOCKET_DISCONNECT' }
{ type: 'GET_STATUS' }

// Panel control
{ type: 'TOGGLE_FLOATING_PANEL' }
{ type: 'SET_FLOATING_PANEL_STATE', state: object }
```

## 🎯 Usage Guide

### Basic Workflow

1. **Open the extension** by clicking the icon
2. **Navigate to Elements tab** for element detection
3. **Click "Auto-Detect Elements"** or manually select elements
4. **Switch to AI Session tab** to start automation
5. **Use Connection tab** to configure WebSocket settings
6. **Toggle floating panel** for quick access

### Element Selection

- **Auto-detect**: Automatically finds common patterns
- **Manual selection**: Click the selection button, then click target element
- **Validation**: Ensures elements are accessible and functional

### Session Management

- **Start session**: Begins AI automation on current page
- **End session**: Stops automation and resets state
- **Status monitoring**: Real-time feedback on session state

## 🔍 Troubleshooting

### Common Issues

**Extension not loading**

- Check if all dependencies are installed
- Verify the build completed successfully
- Look for errors in Chrome's extension console

**Elements not detected**

- Try manual selection instead of auto-detect
- Check if the page has finished loading
- Verify the page contains chat-like interfaces

**WebSocket connection fails**

- Confirm the target server is running
- Check port configuration
- Verify firewall settings

### Debug Mode

Enable debug mode in the Settings tab for:

- Detailed console logging
- Enhanced error messages
- Performance monitoring

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow React best practices
- Maintain consistent formatting
- Add comments for complex logic

## 📄 License

MIT License - see LICENSE file for details.

## 🔄 Changelog

### v6.0.0 (December 25, 2024) - Latest

**🔴 Critical Bug Fixes:**

- Fixed missing `humanSimulator` import that caused runtime errors
- Fixed "dead-end" Agents tab with actionable navigation

**🆕 New Features:**

- 🤖 **CAPTCHA Detection & Bypass** - Auto-detects reCAPTCHA, hCaptcha,
  Cloudflare Turnstile
- 🔄 **Merged Network + Agents Tabs** - Reduced from 5 to 4 tabs for cleaner UX
- 📊 **Auto CAPTCHA Detection** - Automatically scans pages on load
- 👤 **Human Behavior Simulation** - Natural typing, clicking, scrolling
  patterns

**📋 API Additions:**

- `DETECT_CAPTCHA` - Check for CAPTCHA presence
- `BYPASS_CAPTCHA` - Attempt automatic bypass
- `WAIT_FOR_CAPTCHA` - Wait for manual/auto solution
- `CAPTCHA_DETECTED` - Background notification

**🔧 Improvements:**

- Better empty state messaging with actionable buttons
- Available agent types list in Network tab
- Consolidated popup with 4 tabs (Connect, Network, Services, Settings)

### v4.0.0

- 🔌 Universal Chat Detection
- 🌐 Multi-node connection support
- 🤖 Federation channels and multi-agent support
- 🎨 Neon cyberpunk styling

### v3.0.0

- ✨ Complete React-based rewrite
- 🎨 Modern purple gradient interface
- 🎛️ Enhanced floating panel
- 🔧 Improved element detection
- 🚀 Better performance and reliability

### Previous Versions

- v2.x: Vanilla JavaScript implementation
- v1.x: Initial prototype

---

**Fuse Connect** - The ultimate AI agent bridge for browser automation.

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
