# The New Fuse Chrome Extension - Complete Redesign Specification

## 🎯 Purpose & Scope

**Fuse Connect** is The New Fuse's browser bridge extension that enables:

1. AI chat platform integration (ChatGPT, Claude, Gemini, Perplexity, DeepSeek,
   Qwen)
2. Multi-agent federation across browser tabs
3. Redis agent network participation via WebSocket relay
4. Element detection and automation capabilities
5. Real-time agent-to-agent communication

## 🎨 Brand Identity

### Visual Theme

- **Primary Colors**: Cyan (#00D9FF) to Purple (#9D4EDD) neon gradient
- **Logo**: "TNF" Neon Monogram with circuit board aesthetic
- **Dark Theme**: Deep space black (#0a0a0f) with neon accents
- **Typography**: Modern, clean sans-serif

### Design Philosophy

- **Neon Cyberpunk**: High-tech, futuristic aesthetic
- **Minimal UI**: Clean, uncluttered interface
- **Glowing Effects**: Subtle neon glow on interactive elements
- **Circuit Patterns**: Subtle tech patterns in backgrounds

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   POPUP UI   │  │   FLOATING   │  │   CONTENT    │  │
│  │              │  │    PANEL     │  │   SCRIPT     │  │
│  │  Main Hub    │  │              │  │              │  │
│  │  4 Tabs:     │  │  Quick       │  │  Element     │  │
│  │  - Connect   │  │  Actions     │  │  Detection   │  │
│  │  - Agents    │  │              │  │              │  │
│  │  - Network   │  │  Draggable   │  │  AI Platform │  │
│  │  - Settings  │  │  Minimalist  │  │  Adapters    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                ┌───────────▼───────────┐                │
│                │  BACKGROUND SERVICE   │                │
│                │                       │                │
│                │  - WebSocket Manager  │                │
│                │  - Redis Bridge       │                │
│                │  - Federation Manager │                │
│                │  - Message Router     │                │
│                └───────────────────────┘                │
│                            │                            │
└────────────────────────────┼────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ TNF Relay    │     │ Redis Agent  │     │ Other Tabs   │
│ WebSocket    │     │ Network      │     │ (Federation) │
│ Server       │     │              │     │              │
│ (Port 3002)  │     │ (via WS)     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 📱 UI Components

### 1. Popup Interface (320x500px)

#### Tab 1: Connect

```
┌───────────────────────────────────────┐
│ [TNF Logo]  Fuse Connect    [⚙️] [✕] │
├───────────────────────────────────────┤
│ [Connect] [Agents] [Network] [Settings]
├───────────────────────────────────────┤
│                                       │
│  ⚡ Connection Status                 │
│  ┌─────────────────────────────────┐ │
│  │ ● TNF Relay     [CONNECTED]     │ │
│  │ ● Redis Network [CONNECTED]     │ │
│  │ ● AI Platform   [DETECTED]      │ │
│  └─────────────────────────────────┘ │
│                                       │
│  🤖 Detected AI Platform              │
│  ┌─────────────────────────────────┐ │
│  │ [Gemini Icon] Google Gemini     │ │
│  │ Platform: gemini.google.com     │ │
│  └─────────────────────────────────┘ │
│                                       │
│  🎯 Quick Actions                     │
│  [Auto-Detect Elements] [Start Sess] │
│  [Toggle Floating Panel]             │
│                                       │
└───────────────────────────────────────┘
```

#### Tab 2: Agents

```
┌───────────────────────────────────────┐
│ 🤖 Agent Network (12 Active)          │
├───────────────────────────────────────┤
│                                       │
│  📡 This Browser                      │
│  ┌─────────────────────────────────┐ │
│  │ chrome-abc123   [PARTICIPANT]   │ │
│  │ Gemini Tab • gemini.google.com  │ │
│  │ 🟢 Online • 2m ago              │ │
│  └─────────────────────────────────┘ │
│                                       │
│  🌐 Network Agents                    │
│  ┌─────────────────────────────────┐ │
│  │ ⚡ antigravity   [ORCHESTRATOR] │ │
│  │ 🤖 claude-cli   [BROKER]        │ │
│  │ 💎 gemini-cli   [WORKER]        │ │
│  │ 🚀 jules        [ASYNC WORKER]  │ │
│  └─────────────────────────────────┘ │
│                                       │
│  [Refresh Agents] [Join Conversation] │
│                                       │
└───────────────────────────────────────┘
```

#### Tab 3: Network

```
┌───────────────────────────────────────┐
│ 🔗 Federation Channels                │
├───────────────────────────────────────┤
│                                       │
│  Active Channels (3)                  │
│  ┌─────────────────────────────────┐ │
│  │ 📢 #general                     │ │
│  │ 8 members • broadcast mode      │ │
│  │ [Join] [View]                   │ │
│  ├─────────────────────────────────┤ │
│  │ 🔬 #research-team               │ │
│  │ 4 members • orchestrated        │ │
│  │ [Join] [View]                   │ │
│  ├─────────────────────────────────┤ │
│  │ 💡 #brainstorm                  │ │
│  │ 6 members • round-robin         │ │
│  │ [Join] [View]                   │ │
│  └─────────────────────────────────┘ │
│                                       │
│  [+ Create Channel]                   │
│                                       │
└───────────────────────────────────────┘
```

#### Tab 4: Settings

```
┌───────────────────────────────────────┐
│ ⚙️ Settings                            │
├───────────────────────────────────────┤
│                                       │
│  🌐 Connection                        │
│  ┌─────────────────────────────────┐ │
│  │ Relay URL: [localhost:3002]     │ │
│  │ Agent Name: [chrome-abc123]     │ │
│  │ Auto-reconnect: [✓]             │ │
│  └─────────────────────────────────┘ │
│                                       │
│  🎨 Appearance                        │
│  ┌─────────────────────────────────┐ │
│  │ Theme: [Dark] [Light]           │ │
│  │ Neon Effects: [✓]               │ │
│  │ Animations: [✓]                 │ │
│  └─────────────────────────────────┘ │
│                                       │
│  🔧 Advanced                          │
│  ┌─────────────────────────────────┐ │
│  │ Debug Mode: [ ]                 │ │
│  │ Performance: [Balanced]         │ │
│  └─────────────────────────────────┘ │
│                                       │
└───────────────────────────────────────┘
```

### 2. Floating Panel (Minimal, 240x160px collapsed)

```
┌────────────────────────┐
│ 🚀 TNF    [−] [✕]     │ ← Drag handle (neon gradient)
├────────────────────────┤
│ ● Relay     CONNECTED  │
│ ● Redis     CONNECTED  │
│ ● Platform  GEMINI     │
├────────────────────────┤
│ [⚡ Detect] [▶ Start]  │
└────────────────────────┘
```

Expanded (240x400px):

```
┌────────────────────────┐
│ 🚀 TNF    [−] [✕]     │
├────────────────────────┤
│ 🎯 Elements            │
│ ✓ Input Field          │
│ ✓ Send Button          │
│ ✓ Output Area          │
├────────────────────────┤
│ 📡 Network             │
│ 12 agents online       │
│ 3 active channels      │
├────────────────────────┤
│ [⚡ Detect] [▶ Start]  │
│ [📊 Stats] [💬 Chat]   │
└────────────────────────┘
```

## 🎨 Styling Guidelines

### Color Palette

```css
/* Neon Colors */
--neon-cyan: #00d9ff;
--neon-purple: #9d4edd;
--neon-pink: #ff006e;
--neon-green: #00f5a0;
--neon-blue: #3d5afe;

/* Dark Theme */
--bg-primary: #0a0a0f;
--bg-secondary: #141419;
--bg-tertiary: #1a1a24;
--text-primary: #ffffff;
--text-secondary: #a0a0b0;
--border-color: rgba(0, 217, 255, 0.2);

/* Status Colors */
--status-online: #00f5a0;
--status-busy: #ffb800;
--status-offline: #666;
--status-error: #ff006e;
```

### Typography

```css
--font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
--font-size-xs: 10px;
--font-size-sm: 12px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-size-xl: 20px;
```

### Effects

```css
/* Neon Glow */
.neon-glow {
  box-shadow:
    0 0 10px var(--neon-cyan),
    0 0 20px rgba(0, 217, 255, 0.5),
    inset 0 0 10px rgba(0, 217, 255, 0.1);
}

/* Gradient Background */
.gradient-bg {
  background: linear-gradient(
    135deg,
    var(--neon-cyan) 0%,
    var(--neon-purple) 100%
  );
}

/* Circuit Pattern */
.circuit-pattern {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 217, 255, 0.03) 2px,
    rgba(0, 217, 255, 0.03) 4px
  );
}
```

## 🔧 Technical Implementation

### File Structure

```
apps/chrome-extension/
├── manifest.json                     # Extension manifest (v3.1.0)
├── package.json                      # Dependencies
├── webpack.config.js                 # Build config
│
├── src/
│   ├── background/
│   │   ├── index.ts                  # Service worker entry
│   │   ├── websocket-manager.ts      # WebSocket connection
│   │   ├── redis-bridge.ts           # Redis network integration
│   │   ├── federation-manager.ts     # Tab federation
│   │   └── message-router.ts         # Message handling
│   │
│   ├── popup/
│   │   ├── index.tsx                 # Popup entry point
│   │   ├── Popup.tsx                 # Main popup component
│   │   ├── tabs/
│   │   │   ├── ConnectTab.tsx        # Connection status
│   │   │   ├── AgentsTab.tsx         # Agent network view
│   │   │   ├── NetworkTab.tsx        # Federation channels
│   │   │   └── SettingsTab.tsx       # Settings
│   │   └── styles/
│   │       └── popup.css             # Popup styles
│   │
│   ├── floating-panel/
│   │   ├── index.tsx                 # Panel entry point
│   │   ├── FloatingPanel.tsx         # Panel component
│   │   └── styles/
│   │       └── panel.css             # Panel styles
│   │
│   ├── content/
│   │   ├── index.ts                  # Content script entry
│   │   ├── element-detector.ts       # Auto element detection
│   │   ├── platform-adapters/
│   │   │   ├── base-adapter.ts       # Base adapter interface
│   │   │   ├── chatgpt.ts            # ChatGPT adapter
│   │   │   ├── claude.ts             # Claude adapter
│   │   │   ├── gemini.ts             # Gemini adapter
│   │   │   └── perplexity.ts         # Perplexity adapter
│   │   └── styles/
│   │       ├── content.css           # Content script styles
│   │       └── selection.css         # Element selection overlay
│   │
│   ├── shared/
│   │   ├── types.ts                  # Shared TypeScript types
│   │   ├── constants.ts              # Constants
│   │   └── utils.ts                  # Utility functions
│   │
│   └── styles/
│       ├── theme.css                 # Global theme variables
│       ├── animations.css            # Animations
│       └── neon-effects.css          # Neon glow effects
│
├── icons/                            # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── branded/                      # Status icons
│       ├── connected.png
│       ├── disconnected.png
│       └── error.png
│
└── dist/                             # Build output
```

### Key Features

#### 1. WebSocket Manager

- Auto-reconnection with exponential backoff
- Message queuing during disconnects
- Heartbeat monitoring
- Multi-relay support

#### 2. Redis Bridge

- WebSocket-to-Redis relay communication
- Agent registration and discovery
- Channel subscription management
- Message pub/sub handling

#### 3. Federation Manager

- Cross-tab communication
- Channel membership management
- Message routing (broadcast, round-robin, orchestrated)
- Tab synchronization

#### 4. Element Detection

- AI platform-specific selectors
- Visual overlay for selection
- Auto-detection algorithms
- Validation and error handling

#### 5. Platform Adapters

- Unified interface for all AI platforms
- Message injection
- Response monitoring
- URL-based platform detection

## 📦 Manifest.json (v3)

```json
{
  "manifest_version": 3,
  "name": "Fuse Connect - AI Bridge",
  "version": "4.0.0",
  "description": "Bridge your browser to The New Fuse AI agent network",

  "permissions": ["storage", "activeTab", "scripting", "tabs", "webNavigation"],

  "host_permissions": ["<all_urls>"],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_start"
    }
  ],

  "web_accessible_resources": [
    {
      "resources": [
        "floating-panel.html",
        "floating-panel.js",
        "icons/*.png",
        "styles/*.css"
      ],
      "matches": ["<all_urls>"]
    }
  ],

  "commands": {
    "toggle-floating-panel": {
      "suggested_key": { "default": "Ctrl+Shift+F" },
      "description": "Toggle floating panel"
    },
    "auto-detect-elements": {
      "suggested_key": { "default": "Ctrl+Shift+D" },
      "description": "Auto-detect AI elements"
    }
  }
}
```

## 🚀 Build Process

```bash
# Install dependencies
pnpm install

# Development build with watch
pnpm run dev

# Production build
pnpm run build

# Package for distribution
pnpm run package
```

## ✅ Success Criteria

1. **Visual Polish**: Matches TNF neon branding perfectly
2. **Functional Injectables**: Floating panel works flawlessly
3. **Federation Working**: Cross-tab communication functional
4. **Redis Integration**: Agent network participation active
5. **Element Detection**: Auto-detection for all major AI platforms
6. **Performance**: < 100ms injection time, < 50ms message routing
7. **Stability**: No memory leaks, proper cleanup on tab close

## 📝 Implementation Priority

1. ✅ Set up build system and file structure
2. ✅ Implement core background service worker
3. ✅ Build popup UI with 4 tabs
4. ✅ Create floating panel with drag support
5. ✅ Implement element detection system
6. ✅ Add platform adapters
7. ✅ Integrate WebSocket manager
8. ✅ Add Redis bridge functionality
9. ✅ Implement federation manager
10. ✅ Apply neon branding and styling
11. ✅ Test across all major AI platforms
12. ✅ Performance optimization

---

**The New Fuse** - Bridging browsers to the AI agent network with style 🚀
