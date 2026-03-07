# Chrome Extension v5.0 - Complete Redesign Plan

## 🎯 Vision Statement

**Fuse Connect** is a Chrome extension that seamlessly bridges AI chat platforms
with The New Fuse agent network. It automatically detects AI interfaces, injects
a beautiful floating control panel, and enables real-time agent-to-agent
communication - all without manual configuration.

---

## 🚫 What We're Removing (Old Iteration)

- ❌ Manual element selection mode
- ❌ User-driven input/output field picking
- ❌ Complex multi-step setup wizards
- ❌ Element selection manager
- ❌ User-configured selectors
- ❌ Training mode for elements

---

## ✅ New Architecture

### Core Principles

1. **Zero Configuration** - Works instantly on supported AI platforms
2. **Automatic Detection** - AI-powered element recognition
3. **Always Present** - Injectable UI on every page
4. **Agent-First** - Designed for AI-to-AI communication
5. **Beautiful by Default** - Stunning neon cyberpunk aesthetic

---

## 📁 New File Structure

```
apps/chrome-extension/
├── manifest.json                    # MV3 manifest
├── src/
│   ├── background/
│   │   ├── index.ts                 # Service worker entry
│   │   ├── message-router.ts        # Message routing logic
│   │   ├── websocket-client.ts      # TNF Relay connection
│   │   └── agent-registry.ts        # Track connected agents
│   │
│   ├── content/
│   │   ├── index.ts                 # Content script entry
│   │   ├── injectable/
│   │   │   ├── FloatingPanel.ts     # Main injectable UI
│   │   │   ├── FloatingPanel.css    # Neon styles
│   │   │   └── components/
│   │   │       ├── StatusIndicator.ts
│   │   │       ├── AgentList.ts
│   │   │       ├── QuickActions.ts
│   │   │       └── MessageFeed.ts
│   │   └── adapters/
│   │       ├── BaseAdapter.ts       # Abstract adapter
│   │       ├── ChatGPTAdapter.ts    # chatgpt.com
│   │       ├── ClaudeAdapter.ts     # claude.ai
│   │       ├── GeminiAdapter.ts     # gemini.google.com
│   │       ├── PerplexityAdapter.ts # perplexity.ai
│   │       └── GenericAdapter.ts    # Any page fallback
│   │
│   ├── popup/
│   │   ├── index.html               # Popup HTML
│   │   ├── popup.ts                 # Popup logic
│   │   └── popup.css                # Neon popup styles
│   │
│   ├── shared/
│   │   ├── types.ts                 # All type definitions
│   │   ├── constants.ts             # Configuration
│   │   ├── protocol.ts              # Message protocol
│   │   └── theme.ts                 # Design tokens
│   │
│   └── utils/
│       ├── logger.ts                # Logging
│       ├── storage.ts               # Chrome storage wrapper
│       └── dom.ts                   # DOM utilities
│
├── assets/
│   ├── icons/                       # Extension icons
│   └── images/                      # UI assets
│
└── dist/                            # Build output
```

---

## 🧩 Feature Breakdown

### 1. Platform Adapters (Automatic Detection)

Each adapter knows how to:

- Detect if we're on that platform
- Find the input textarea
- Find the send button
- Find the output/response area
- Inject messages automatically
- Read responses automatically

```typescript
interface PlatformAdapter {
  name: string;
  hostPatterns: string[]; // e.g., ['chatgpt.com', 'chat.openai.com']

  detect(): boolean;
  getInputElement(): HTMLElement | null;
  getSendButton(): HTMLElement | null;
  getOutputContainer(): HTMLElement | null;

  sendMessage(text: string): Promise<void>;
  onResponse(callback: (text: string) => void): void;
}
```

### 2. Injectable Floating Panel

A beautiful floating panel that appears on every page:

```
┌─────────────────────────────────────┐
│ ⚡ FUSE CONNECT          ─ □ ✕     │
├─────────────────────────────────────┤
│  ● Connected to TNF Relay           │
│  Platform: Claude AI ✓ Detected     │
├─────────────────────────────────────┤
│ AGENTS ONLINE (3)                   │
│  🤖 Antigravity-Agent    ● active   │
│  🔷 VSCode-Agent         ● idle     │
│  🌐 This Browser         ● you      │
├─────────────────────────────────────┤
│ QUICK ACTIONS                       │
│  [⚡ Send to All] [📋 Copy Last]    │
│  [🔄 Sync Context] [⚙️ Settings]   │
├─────────────────────────────────────┤
│ RECENT MESSAGES                     │
│  → VSCode: "Analyzing codebase..."  │
│  ← Claude: "Found 3 issues..."      │
└─────────────────────────────────────┘
```

Features:

- Draggable (remembers position)
- Collapsible to mini-mode
- Keyboard shortcut: `Ctrl+Shift+F`
- Neon glow effects
- Real-time agent status

### 3. Popup UI (4 Tabs)

**Tab 1: Connect**

- Connection status with animation
- Platform detection status
- Quick connect/disconnect

**Tab 2: Agents**

- List all agents in network
- Agent status indicators
- Direct message to agent

**Tab 3: Network**

- Federation channels
- Message flow visualization
- Network health

**Tab 4: Settings**

- Relay URL configuration
- Theme toggle
- Notification preferences
- Debug mode

---

## 🎨 Design System

### Colors (Neon Cyberpunk)

```css
:root {
  /* Primary Neon */
  --neon-cyan: #00d9ff;
  --neon-purple: #9d4edd;
  --neon-pink: #ff006e;
  --neon-green: #00ff88;

  /* Backgrounds */
  --bg-deep: #0a0a0f;
  --bg-card: #12121a;
  --bg-elevated: #1a1a25;

  /* Glows */
  --glow-cyan: 0 0 20px rgba(0, 217, 255, 0.5);
  --glow-purple: 0 0 20px rgba(157, 78, 221, 0.5);
}
```

### Typography

- Font: Inter (from Google Fonts)
- Sizes: 11px (small), 13px (body), 16px (heading), 20px (title)

### Effects

- Glassmorphism backgrounds
- Neon glow on interactive elements
- Subtle pulse animations
- Smooth transitions (200-300ms)

---

## 📋 Implementation Tasks

### Phase 1: Foundation (Day 1)

- [x] Create new file structure
- [ ] Define all TypeScript types
- [ ] Create constants and configuration
- [ ] Set up build system

### Phase 2: Platform Adapters (Day 1-2)

- [ ] BaseAdapter abstract class
- [ ] ChatGPT adapter
- [ ] Claude adapter
- [ ] Gemini adapter
- [ ] Generic fallback adapter
- [ ] Auto-detection system

### Phase 3: Injectable UI (Day 2-3)

- [ ] Floating panel core
- [ ] Status indicator component
- [ ] Agent list component
- [ ] Quick actions component
- [ ] Message feed component
- [ ] Drag & drop functionality
- [ ] Collapse/expand modes

### Phase 4: Background Service (Day 3)

- [ ] Service worker setup
- [ ] WebSocket client to TNF Relay
- [ ] Message routing
- [ ] Agent registry
- [ ] Storage sync

### Phase 5: Popup UI (Day 3-4)

- [ ] HTML structure with tabs
- [ ] Connect tab
- [ ] Agents tab
- [ ] Network tab
- [ ] Settings tab

### Phase 6: Polish & QA (Day 4-5)

- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Error handling
- [ ] Documentation

---

## 🔌 Integration Points

### TNF Relay Connection

```typescript
// Connect to TNF Relay via WebSocket
const relay = new WebSocket('ws://localhost:3001/ws');

// Register as browser agent
relay.send(
  JSON.stringify({
    type: 'AGENT_REGISTER',
    agent: {
      id: 'chrome-ext-' + uuid(),
      name: 'Browser Agent',
      platform: 'chrome-extension',
      capabilities: ['chat-injection', 'dom-reading'],
    },
  })
);
```

### Message Flow

```
User types in popup
       ↓
Background service
       ↓
WebSocket → TNF Relay
       ↓
Target agent (e.g., VSCode)
       ↓
Response flows back
       ↓
Injectable shows notification
```

---

## 🚀 Success Criteria

1. **Zero Setup** - Install → works immediately
2. **3 Platforms** - ChatGPT, Claude, Gemini working
3. **Real-time** - < 100ms message latency
4. **Beautiful** - WOW factor on first impression
5. **Reliable** - No crashes, graceful degradation
6. **Accessible** - Keyboard navigable, screen reader friendly

---

## 📊 Metrics to Track

- Time to first connection
- Platform detection accuracy
- Message delivery success rate
- UI render performance
- User engagement (clicks, time open)

---

_Last Updated: December 25, 2024_ _Version: 5.0 (Complete Redesign)_
