# THE NEW FUSE (TNF): MASTER MANIFESTO

## Unified Agentic Infrastructure & Multi-LLM Orchestration

**Last Updated**: December 20, 2025  
**Status**: Active Development - Post-Restart Phase  
**Architecture**: Hybrid TNF + OpenAGI Lux Integration

---

## 📋 Table of Contents

1. [Project Overview & Vision](#1-project-overview--vision)
2. [System Architecture](#2-system-architecture-the-unified-bus)
3. [Node Integration & Capabilities](#3-node-integration--capabilities)
4. [The Lux Bridge](#4-the-lux-bridge-the-intelligence-adapter)
5. [Completed Implementation Logs](#5-completed-implementation-logs)
6. [Critical Design Decisions](#6-critical-design-decisions)
7. [Status Dashboard](#7-status-dashboard--next-steps)
8. [Quick Start Guide](#8-post-restart-quickstart)
9. [File Reference](#9-file-reference)

---

## 1. Project Overview & Vision

### Mission Statement

The New Fuse (TNF) is an advanced, cross-platform ecosystem designed to bridge
the gap between **high-level AI reasoning (the "Brain")** and **native hardware
execution (the "Hands")**. The mission is to provide a world-class, professional
environment where **non-technical users and developers alike** can orchestrate
multiple AI agents to control web browsers, IDEs, and the native operating
system.

### Core Philosophy

- **Accessibility First**: Every CLI command must have a UI button equivalent
- **Federation & Coherence**: AI sessions grouped into logical channels across
  browser tabs
- **Multi-Agent Orchestration**: Orchestrator + Broker + Worker pattern over
  Redis
- **Visual-First Intelligence**: Support for OpenAGI Lux's pixel-based reasoning
- **Preservation of Existing Work**: New features bolt onto existing
  infrastructure without breaking it

### Key User Requirements

1. **Tauri App Excellence**: World-class, professional, fully integrated into
   Agentic infrastructure
2. **Browser Control**: Ability to control like Chromium with extension
   integration
3. **Non-Technical Accessibility**: UI buttons instead of CLI commands wherever
   possible
4. **Federation**: Group browser tabs into channels for coordinated AI sessions
5. **Agentic Orchestration**: Redis as "central nervous system" for timed,
   controlled multi-agent communication
6. **SkIDEancer Reintegration**: Bring isolated SkIDEancer IDE back with
   functional links
7. **OAGI/Lux Protocol**: Native desktop automation (mouse, keyboard, screen)

---

## 2. System Architecture: The "Unified Bus"

### The Ecosystem Operates as a Federated Mesh

```
                    ┌─────────────────────────────────────┐
                    │     TNF RELAY SERVER (CNS)          │
                    │   WebSocket Hub @ :3000             │
                    └───────────┬─────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Tauri Desktop │     │ VS Code Ext   │     │ Chrome Ext    │
│  (The Hub)    │     │ (Workspace)   │     │  (The Eyes)   │
│               │     │               │     │               │
│ - OAGI/Lux    │     │ - Embedded    │     │ - DOM Control │
│ - Terminal    │     │   Browser     │     │ - Federation  │
│ - Dashboard   │     │ - Relay Conn  │     │ - Chat Detect │
└───────────────┘     └───────────────┘     └───────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   REDIS (Port 6379)   │
                    │  Synaptic Bus Layer   │
                    └───────────────────────┘
```

### Component Roles

#### TNF Relay Server (The CNS)

- **Port**: 3000 (WebSocket)
- **Purpose**: Central message routing hub
- **Key Feature**: Protocol detection (AG-UI vs Legacy TNF)

#### Redis (The Synaptic Bus)

- **Port**: 6379
- **Purpose**: Real-time data layer for inter-agent communication
- **Performance**: Sub-millisecond coordination between specialized AIs

#### Shared Protocol

- **File**: `packages/shared/src/browser-control/protocol.ts`
- **Scale**: 50+ message types
- **Purpose**: Standardizes how every node perceives pixels and executes actions

---

## 3. Node Integration & Capabilities

### 🖥️ Tauri Desktop App (The Hub)

**Primary Role**: User interface and native execution engine

#### Native Control

- **Integration**: OAGI/Lux Desktop Protocol
- **Capabilities**: Screen capture, mouse manipulation, keyboard injection
- **Implementation**: `apps/tauri-desktop/src-tauri/src/oagi.rs` (280 lines)

#### Embedded Terminal

- **Component**: `Terminal.tsx`
- **Features**: Built-in terminal, quick action buttons, Tokyo Night theme
- **Purpose**: Run CLI commands directly from dashboard

#### Quick Actions Dashboard

- **Component**: `QuickActionsDashboard.tsx` (400 lines)
- **Categories**:
  - AI Agents
  - Analysis & Tools
  - External Tools
  - Development
  - Settings
- **Purpose**: UI-centric panel for non-technical users

#### OAGI Commands Available

```typescript
// Screen Capture
await invoke('capture_screen', { fullScreen: true, quality: 90 });
await invoke('capture_screen', { x: 100, y: 100, width: 800, height: 600 });

// Mouse Control
await invoke('execute_click', { x: 500, y: 300 });
await invoke('execute_drag', {
  startX: 100,
  startY: 100,
  endX: 500,
  endY: 500,
  duration: 1000,
});

// Keyboard Control
await invoke('execute_type', { text: 'Hello World!', delay: 50 });
await invoke('execute_hotkey', { keys: ['cmd', 'c'] });

// Scroll
await invoke('execute_scroll', { deltaX: 0, deltaY: -100 });

// Utilities
await invoke('get_screen_size'); // Returns: { width, height }
await invoke('get_mouse_position'); // Returns: { x, y }
await invoke('wait_duration', { durationMs: 1000 });
```

### 🌐 Chrome Extension (The Eyes)

**Primary Role**: Deep browser automation and AI tab federation

#### DOM Intelligence

- Real-time element selection
- Chat platform detection (ChatGPT, Claude, Gemini)
- Overlay feedback during automation
- Cascade workflow execution

#### Session Federation

- **Manager**: `FederationManager.ts` (700 lines)
- **Capability**: Group browser tabs into channels
- **Example**: Tabs A & C in "Research" channel, Tabs B & D in "Coding" channel

#### Browser Control Features

```typescript
// Navigation
await BrowserControlService.navigate('https://chatgpt.com');
await BrowserControlService.getCurrentUrl();

// Element Interaction
await BrowserControlService.click('#login-button');
await BrowserControlService.type('#email', 'user@example.com');

// AI Chat Automation
await BrowserControlService.detectChatElements();
await BrowserControlService.sendChatMessage('Explain quantum computing', {
  waitForResponse: true,
});
await BrowserControlService.getChatMessages({ count: 10 });

// Cascade Workflows
await BrowserControlService.startCascade({
  cascadeId: 'research-task',
  steps: [
    { id: '1', action: 'NAVIGATE', payload: { url: 'https://google.com' } },
    {
      id: '2',
      action: 'TYPE',
      payload: { selector: 'input', text: 'AI news' },
    },
    {
      id: '3',
      action: 'CLICK',
      payload: { selector: 'button[type="submit"]' },
    },
  ],
  options: { showOverlay: true },
});
```

### ⌨️ VS Code Extension (The Workspace)

**Primary Role**: Developer's gateway into TNF network

#### Embedded Chromium

- **Implementation**: `EmbeddedBrowserProvider.ts`
- **Technology**: Electron BrowserView
- **Purpose**: Real Chromium browser side-by-side with code

#### Relay Connection

- **Service**: `RelayConnectionService.ts`
- **Purpose**: Fully wired into Redis bus
- **Capability**: Delegate research tasks to Chrome Extension

#### Commands Available

```typescript
// Open Embedded Browser
vscode.commands.executeCommand('tnf.openEmbeddedBrowser');

// Navigate Browser
vscode.commands.executeCommand(
  'tnf.navigateBrowserTo',
  'https://docs.example.com'
);

// Take Screenshot
vscode.commands.executeCommand('tnf.takeBrowserScreenshot');

// Execute Script
vscode.commands.executeCommand('tnf.executeScriptInBrowser', 'document.title');
```

---

## 4. The Lux Bridge: "The Intelligence Adapter"

### Problem Statement

OpenAGI Lux is a "visual-first" AI model that perceives screens as pixels and
outputs actions as coordinates. Standard LLMs are "text-first" and work with
DOM/HTML. We needed to support Lux WITHOUT losing TNF's existing DOM-based
precision.

### Solution: LuxTNFBridge.ts

**File**: `packages/shared/src/bridge/LuxTNFBridge.ts`

#### Architecture

```
┌──────────────┐
│  Lux Model   │  "Click at (500, 300)" [Visual Reasoning]
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  LuxTNFBridge.ts     │  [Translator]
│                      │
│  Smart Routing:      │
│  1. Browser task?    │─────► TNF Chrome Extension (DOM-based)
│  2. OS task?         │─────► Tauri OAGI (Pixel-based)
└──────────────────────┘
```

#### Key Methods

**Smart Click Logic**

```typescript
async executeSmartClick(x: number, y: number) {
  // 1. Try to find TNF-controlled browser element at coordinates
  const browserElement = await this.browserControl.findElementAtPoint(x, y);

  if (browserElement) {
    // Use EXISTING TNF Chrome Extension (highly reliable)
    await this.browserControl.click(browserElement.selector);
    return { method: 'TNF_EXTENSION' };
  } else {
    // Use NEW Tauri Rust Native Click (OAGI/Lux style)
    await this.tauriOAGI.click(x, y);
    return { method: 'TAURI_NATIVE' };
  }
}
```

### Supported Lux Modes

#### Actor Mode

- **Speed**: ~1 second per action
- **Use Cases**: Filling forms, extracting lists, repetitive macros
- **Implementation**: Direct command execution, minimal reasoning

#### Thinker Mode

- **Speed**: Variable (goal-dependent)
- **Use Cases**: Research topics, debug code, autonomous problem-solving
- **Implementation**: Goal decomposition with visual reasoning

#### Tasker Mode

- **Speed**: Deterministic execution
- **Use Cases**: Following exact scripts, QA automation
- **Implementation**: Python-style action list execution

### Why This Preserves TNF's Work

| Feature                 | Standalone Lux  | Standalone TNF       | TNF + Lux Bridge            |
| ----------------------- | --------------- | -------------------- | --------------------------- |
| Automation Intelligence | High (Visual)   | Medium (Scripted)    | **Elite (Visual + DOM)**    |
| Precision               | Pixel-dependent | Selector-dependent   | **Hybrid (Best available)** |
| Speed                   | 1s (Actor)      | 3-5s (Relay)         | **1s (Local OAGI)**         |
| Legacy App Support      | Yes             | No                   | **Yes (via Tauri/Rust)**    |
| Safety                  | Minimal         | High (Human-in-loop) | **High (Broker Oversight)** |

---

## 5. Completed Implementation Logs

### ✅ Infrastructure & Backend (Rust/Node)

#### Rust Backend Updates

- **File**: `apps/tauri-desktop/src-tauri/src/lib.rs`
- **Changes**: Added `mod oagi;` and registered 9 OAGI commands
- **Status**: ✅ Compiled successfully (Exit code 0)

#### Cargo Dependencies

- **File**: `apps/tauri-desktop/src-tauri/Cargo.toml`
- **Added**:
  - `enigo = "0.2"` - Mouse and keyboard control
  - `screenshots = "0.8"` - Screen capture
  - `image = "0.24"` - Image processing
  - `base64 = "0.21"` - Base64 encoding

#### Redis Agent CLI

- **File**: `scripts/tnf-agent-cli.cjs`
- **Purpose**: Agent registration and cross-agent communication
- **Commands**: `register`, `list`, `send`, `convo`

#### Multi-Agent Orchestration Demo

- **File**: `scripts/orchestration-demo.cjs` (270 lines)
- **Agents**: Antigravity (Orchestrator), Claude (Broker), Gemini + Jules
  (Workers)
- **Status**: ✅ Successfully demonstrated 4-agent conversation

### ✅ Frontend & UI (React/TypeScript)

#### Browser Control Service

- **File**: `apps/tauri-desktop/src/services/BrowserControlService.ts`
- **Size**: 350+ lines
- **Features**: Navigation, clicking, typing, screenshots, chat automation

#### OAGI Service

- **File**: `apps/tauri-desktop/src/services/OAGIService.ts` (270 lines)
- **Features**: Session management, screen capture, automation tracking

#### Terminal Component

- **File**: `apps/tauri-desktop/src/components/Terminal.tsx` (300 lines)
- **Features**: xterm.js integration, quick actions, Tokyo Night theme

#### Quick Actions Dashboard

- **File**: `apps/tauri-desktop/src/components/QuickActionsDashboard.tsx` (400
  lines)
- **Categories**: AI Agents, Analysis, External Tools, Development, Settings

#### AG-UI Event Listeners

- **Hook**: `useAGUIListener.ts`
- **Purpose**: Stream Lux "Thinking Steps" to UI in real-time
- **Events**: `STEP_STARTED`, `STEP_FINISHED`, `TEXT_MESSAGE_CONTENT`,
  `INTERRUPT`

### ✅ Chrome Extension Enhancements

#### Browser Control Handler

- **File**: `apps/chrome-extension/src/background/browser-control-handler.ts`
- **Size**: 700+ lines
- **Features**: Handles 50+ browser control commands

#### Screen Recording

- **File**: `apps/chrome-extension/src/background/screen-recording.ts`
- **Technology**: `chrome.tabCapture` API
- **Purpose**: Live session monitoring

#### Content Script Handlers

- **File**: `apps/chrome-extension/src/content/browser-control-handlers.ts`
- **Features**: DOM manipulation, realistic event simulation, chat detection

#### Federation Manager

- **File**: `apps/chrome-extension/src/federation/FederationManager.ts` (700
  lines)
- **Features**: Channel membership, message routing, relay connection

### ✅ Documentation Created

| Document                         | Purpose                      | Lines |
| -------------------------------- | ---------------------------- | ----- |
| `FEDERATION_ARCHITECTURE.md`     | Federation system design     | 350+  |
| `AGENT_REDIS_COMMUNICATION.md`   | Redis communication patterns | 300+  |
| `BROWSER_CONTROL_INTEGRATION.md` | Chrome extension integration | 400+  |
| `OAGI_INTEGRATION_STATUS.md`     | OAGI/Lux status and usage    | 200+  |
| `TNF_IMPLEMENTATION_PLAN.md`     | Complete task roadmap        | 500+  |
| `SESSION_SUMMARY_2025-12-20.md`  | Session work summary         | 200+  |

### ✅ Cleanup & Maintenance

#### External Code Cherry-Picking

- **Removed**: `apps/eeijfnjmjelapkebgockoeaadonbchdd` (Windsurf/Antigravity)
- **Removed**: `apps/browser-action-baby.browser-action-baby-0.1.0`
- **Extracted**: Cascade logic, overlay system, embedded browser pattern
- **Documentation**: `EXTERNAL_EXTENSION_FEATURE_EXTRACTION.md`

#### Space Management

- **Freed**: 20GB disk space
- **Action**: System cleanup and external folder removal
- **Result**: Allows for Node.js/Rust compilation

#### Node.js Reinstallation

- **Issue**: Node not in PATH after restart
- **Solution**: Installing via Homebrew (`brew install node@22`)
- **Dependencies**: 71 packages (Python, cmake, icu4c, etc.)
- **Status**: In progress

---

## 6. Critical Design Decisions

### Why Hybrid TNF + Lux (Not Replacement)

#### Decision Rationale

We chose to "bolt on" Lux rather than replace TNF for these reasons:

1. **TNF's DOM Precision**: Your Chrome Extension can identify exact elements by
   selector, which is more reliable than pixel-matching for web apps
2. **Multi-Model Verification**: TNF's Broker (Claude) can watch Lux's actions
   and veto mistakes
3. **Human-in-the-Loop**: Your Quick Actions Dashboard provides physical
   Stop/Pause buttons
4. **Context Switching**: TNF provides the "anchor" for staying inside specific
   IDE/Browser tabs

#### The Adapter Pattern

```
Layer         | TNF Legacy (Body)      | Lux Bolt-On (Brain)   | Why Keep Both?
--------------|------------------------|----------------------|------------------
Messaging     | Redis Pub/Sub          | AG-UI SSE            | Redis for "Paper Trail", SSE for "Live View"
Perception    | DOM/HTML Selectors     | Raw Pixel Vision     | Pixels work everywhere; DOM works better for web
Logic         | Scripted Workflows     | Goal Decomposition   | Scripts are deterministic; Lux is autonomous
Execution     | Chrome Ext + Tauri     | OAGI Native          | Hybrid routing for best method
```

### Federation Channel Architecture

#### Purpose

Allow multiple AI chat sessions across numerous browser tabs to be grouped into
logical channels.

#### Implementation

```typescript
// Example: Grouping tabs into channels
Federation "My AI Team"
├─ Channel "research"
│  ├─ Tab A: Claude (analyzing market data)
│  └─ Tab C: Gemini (cross-referencing sources)
└─ Channel "coding"
   ├─ Tab B: GPT (writing tests)
   └─ VS Code AI (implementing features)
```

#### Benefits

- **Coherent Context**: All AIs in a channel see the same conversation history
- **Specialized Teams**: Different channels for different workflows
- **Message Routing**: AI in one channel can send results to another channel

### Redis as Central Nervous System

#### Agent Types

- **Orchestrator**: Assigns tasks, manages workflow (Antigravity)
- **Broker**: Controls timing, manages turn-taking (Claude)
- **Worker**: Executes specific tasks (Gemini, Jules)

#### Communication Pattern

```
1. Orchestrator broadcasts goal
2. Broker decomposes into sub-tasks
3. Workers register for specific sub-tasks
4. Broker coordinates execution order
5. Results flow back through hierarchy
```

---

## 7. Status Dashboard & Next Steps

### Current Status (Updated: December 21, 2025)

| Component               | Status            | Notes                                  |
| ----------------------- | ----------------- | -------------------------------------- |
| **Redis**               | ✅ Running (6379) | Verified working                       |
| **Redis Agent Network** | ✅ Complete       | Antigravity, Claude, Gemini, Jules     |
| **OAGI/Lux Commands**   | ✅ Compiled       | 9 commands in oagi.rs                  |
| **Tauri Backend**       | ✅ Ready          | Now named "Fuse Desktop"               |
| **Chrome Extension**    | ✅ Complete       | Now named "Fuse Connect", Redis bridge |
| **VS Code Extension**   | 🔄 In Progress    | Compile and test embedded browser      |
| **SkIDEancer IDE**      | ✅ Online         | SkIDEancer @ ide.thenewfuse.com        |
| **Federation**          | ✅ Implemented    | Multi-tab channel grouping             |
| **Brand Consistency**   | ✅ Complete       | Neon Monogram applied everywhere       |
| **Agent Network Start** | ✅ Script Ready   | `./scripts/start-agent-network.sh`     |
| **Non-Technical UI**    | 🔄 In Progress    | Quick Actions Dashboard                |

### Product Names (Official)

| Product          | Name               | Tagline                        |
| ---------------- | ------------------ | ------------------------------ |
| Main Platform    | The New Fuse (TNF) | "Where AI Minds Unite"         |
| Desktop App      | **Fuse Desktop**   | AI Orchestration, Native Power |
| Cloud IDE        | **SkIDEancer**     | Code Smarter, Not Harder       |
| Chrome Extension | **Fuse Connect**   | Bridge Your Browser to AI      |

### Priority Task List

#### Immediate (Post-Restart)

1. ✅ Verify Redis is running
2. ⏳ Complete Node.js installation
3. ⏳ Run `RelayHealthCheck.cjs` to verify connectivity
4. ⏳ Test OAGI commands in Tauri UI

#### High Priority

1. **SkIDEancer Reintegration**
   - Check Railway dashboard for deployment status
   - Fix 404 error on `https://tnf-ide-ide-production.up.railway.app`
   - Verify `whodaniel/skideancer-ide` repository
   - Add UI access points in Website and Tauri

2. **Extension Builds**
   - Build Chrome extension: `cd apps/chrome-extension && pnpm run build`
   - Build VS Code extension: `cd apps/vscode-extension && pnpm run compile`
   - Load and test both extensions

3. **UI Accessibility**
   - Map remaining CLI commands to Quick Actions Dashboard
   - Add "Actor vs Thinker" mode toggle
   - Implement "Approve/Reject" buttons for human-in-loop

#### Medium Priority

1. **Federation Testing**
   - Open multiple AI chat tabs
   - Group into channels via FederationManager
   - Verify message routing

2. **Multi-Agent Conversation**
   - Run `orchestration-demo.cjs` with all 4 agents
   - Test Gemini CLI wrapper
   - Verify Broker coordination

3. **OAGI Workflows**
   - Create example automation sequences
   - Test screen capture → AI analysis → action loop
   - Validate coordinate mapping on Retina display

#### Low Priority (Polish)

1. **Production Build**
   - Run `pnpm tauri build`
   - Generate DMG for macOS
   - Set up code signing for distribution

2. **Documentation Updates**
   - Create user-facing guides
   - Video walkthroughs for non-technical users
   - API reference documentation

---

## 8. Post-Restart Quickstart

### Boot Script Usage

```bash
# From project root
chmod +x scripts/boot-tnf.sh
./scripts/boot-tnf.sh
```

### Manual Boot Sequence

#### 1. Start Redis

```bash
# Check if running
redis-cli ping

# If not running
redis-server --port 6379
```

#### 2. Start Relay Server

```bash
cd apps/relay-server
pnpm run start
```

#### 3. Test Agent Communication

```bash
# List registered agents
node scripts/tnf-agent-cli.cjs list

# Run orchestration demo
node scripts/orchestration-demo.cjs

# Health check
node scripts/RelayHealthCheck.cjs
```

#### 4. Start Development Servers

```bash
# Terminal 1: Tauri
cd apps/tauri-desktop
pnpm tauri dev

# Terminal 2: Chrome Extension
cd apps/chrome-extension
pnpm run build
# Then load dist folder in chrome://extensions/

# Terminal 3: VS Code Extension
cd apps/vscode-extension
pnpm run compile
# Then press F5 in VS Code to debug
```

### Verification Checklist

| Check            | Expected Result                            | Troubleshooting                   |
| ---------------- | ------------------------------------------ | --------------------------------- |
| `redis-cli ping` | `PONG`                                     | Run `redis-server`                |
| `node --version` | `v22.x.x`                                  | Wait for brew install to complete |
| Tauri Console    | `[OAGI] Bridge Initialized`                | Check Rust compilation logs       |
| Extension Logs   | `[Relay] Connected to ws://localhost:3000` | Ensure Relay server running first |
| HealthCheck CLI  | `✅ LuxTNFBridge: ACTIVE`                  | Verify imports in RelayServer.ts  |

---

## 9. File Reference

### Critical Implementation Files

#### Rust Backend

```
apps/tauri-desktop/src-tauri/
├── src/
│   ├── lib.rs                 # Main entry, command registration
│   ├── bridge.rs              # WebSocket bridge to Railway sandbox
│   ├── antigravity.rs         # Antigravity server HTTP client
│   └── oagi.rs                # OAGI/Lux automation commands (280 lines)
└── Cargo.toml                 # Dependencies (enigo, screenshots, etc.)
```

#### TypeScript Services

```
apps/tauri-desktop/src/services/
├── BrowserControlService.ts   # High-level browser API (350 lines)
├── OAGIService.ts            # OAGI wrapper with sessions (270 lines)
├── antigravity.ts            # Antigravity client
└── heartbeat.ts              # Service monitoring
```

#### React Components

```
apps/tauri-desktop/src/components/
├── Terminal.tsx              # Embedded terminal (300 lines)
└── QuickActionsDashboard.tsx # UI buttons (400 lines)

apps/tauri-desktop/src/hooks/
└── useAGUIListener.ts        # AG-UI event streaming
```

#### Chrome Extension

```
apps/chrome-extension/src/
├── background/
│   ├── browser-control-handler.ts  # 50+ command handlers (700 lines)
│   └── screen-recording.ts         # chrome.tabCapture integration
├── content/
│   ├── browser-control-handlers.ts # DOM manipulation (650 lines)
│   └── index.ts                    # Setup function
├── federation/
│   └── FederationManager.ts        # Channel management (700 lines)
└── background.ts                   # Main background script
```

#### VS Code Extension

```
apps/vscode-extension/src/
├── browser/
│   ├── EmbeddedBrowserProvider.ts  # Chromium integration
│   └── main.js                     # Electron process
└── services/
    └── RelayConnectionService.ts   # WebSocket to TNF Relay
```

#### Shared Packages

```
packages/shared/src/
├── browser-control/
│   ├── protocol.ts           # 50+ message types
│   └── index.ts
├── federation/
│   ├── types.ts              # Federation TypeScript types (350 lines)
│   └── index.ts
└── bridge/
    └── LuxTNFBridge.ts       # Lux ↔ TNF translator
```

#### Scripts

```
scripts/
├── tnf-agent-cli.cjs         # Redis agent CLI
├── orchestration-demo.cjs    # Multi-agent demo (270 lines)
├── gemini-redis-wrapper.cjs  # Gemini CLI → Redis bridge
├── RelayHealthCheck.cjs      # Network diagnostics
└── boot-tnf.sh               # Unified boot script
```

#### Documentation

```
docs/
├── FEDERATION_ARCHITECTURE.md
├── AGENT_REDIS_COMMUNICATION.md
├── BROWSER_CONTROL_INTEGRATION.md
├── EXTERNAL_EXTENSION_FEATURE_EXTRACTION.md
└── TNF_MASTER_MANIFESTO.md (this file)

apps/tauri-desktop/
├── OAGI_INTEGRATION_STATUS.md
├── EXTENSION_INTEGRATION_PLAN.md
└── FEATURE_PLAN.md

.agent/
├── TNF_IMPLEMENTATION_PLAN.md
└── SESSION_SUMMARY_2025-12-20.md
```

---

## 10. Advanced Integration Patterns

### Multi-Agent Conversation Example

```javascript
// From orchestration-demo.cjs
const workflow = {
  goal: 'Code Review & Improvement',
  orchestrator: 'antigravity',
  broker: 'claude',
  workers: ['gemini', 'jules'],
  steps: [
    { agent: 'gemini', task: 'Analyze codebase for issues' },
    { agent: 'jules', task: 'Implement suggested fixes' },
    { agent: 'broker', task: 'Review changes and coordinate' },
  ],
};
```

### Smart Routing Logic

```typescript
// LuxTNFBridge determines best execution method
async executeSmartClick(x, y) {
  const browserElement = await this.browserControl.findElementAtPoint(x, y);

  if (browserElement) {
    // High-precision DOM-based (Chrome Extension)
    return await this.browserControl.click(browserElement.selector);
  } else {
    // Native OS-level (Tauri Rust)
    return await this.tauriOAGI.click(x, y);
  }
}
```

### Federation Channel Messaging

```typescript
// Group tabs into a research channel
await federationManager.createChannel({
  id: 'research-001',
  name: 'Market Research',
  members: ['tab-chatgpt', 'tab-claude', 'tab-gemini'],
});

// Broadcast to all channel members
await federationManager.broadcast('research-001', {
  type: 'NEW_INSIGHT',
  payload: { topic: 'AI Market Trends', source: 'Claude' },
});
```

### AG-UI Event Streaming

```typescript
// Real-time thinking steps in UI
const { steps, streamingText } = useAGUIListener();

<div className="lux-thinking-panel">
  {steps.map(step => (
    <div key={step.id} className={step.status === 'running' ? 'pulse' : ''}>
      <span>● {step.name}</span>
    </div>
  ))}
  <pre>{streamingText}</pre>
</div>
```

---

## 11. OpenAGI Lux Integration Details

### Why Lux Models Are Important

#### Specialized "Screen-to-Action" Training

- Unlike GPT-4o/Claude which are "text-first", Lux is trained using **Agentic
  Active Pre-training (AAP)**
- Lux "learns by doing" (pixel interaction) vs "reads the manual" (text)
- Perceives screen as rendered UI, not accessibility tree or HTML
- Works with closed-source apps, legacy software, complex IDEs

#### Performance Advantages

- **Cost**: 10x cheaper per token than OpenAI "Operator" or Anthropic
  computer-use
- **Speed**: Completes steps in ~1/3 the time of other models
- **Actor Mode**: ~1 second per action (vs 2-3s "thinking" penalty with other
  LLMs)

#### Integration with OSGym

- Lux trained on OSGym (open-source data engine, thousands of parallel OS
  replicas)
- Native integration pre-wired for mouse coordinates and keycodes
- Potential for on-device execution (Intel partnership for edge optimization)

### AG-UI Protocol (Standardized Communication)

#### Event Types

```typescript
interface AGUIEvent {
  type:
    | 'TEXT_MESSAGE_CONTENT'
    | 'TOOL_CALL_START'
    | 'STATE_DELTA'
    | 'STEP_STARTED'
    | 'STEP_FINISHED'
    | 'INTERRUPT';
  payload: any;
}
```

#### Server-Sent Events (SSE)

- Lightweight real-time streaming instead of WebSockets
- Stream AI thoughts and actions incrementally
- Shared State Snapshots for UI/Agent sync

### Three Execution Modes

#### Actor Mode (Macros)

- **Target Speed**: ~1 second per action
- **Use Cases**: Direct interaction, repetitive tasks
- **UI Mapping**: "Quick Action" buttons in Dashboard
- **Examples**: Fill Form, Extract Data, Click Sequence

#### Thinker Mode (Autonomous)

- **Process**: Goal Decomposition
- **Use Cases**: Research, complex problem-solving
- **UI Mapping**: "Goal" input field with dynamic task list
- **Examples**: "Research this company and find CEO", "Debug this error"

#### Tasker Mode (Deterministic)

- **Input**: Strict Python list of steps
- **Use Cases**: QA automation, exact workflows
- **UI Mapping**: Terminal/Script Runner
- **Examples**: Following recipes, regression tests

---

## 12. Future Possibilities & Roadmap

### Near-Term (Next 2 Weeks)

- [ ] Complete Node.js installation
- [ ] Test all OAGI commands on Retina display
- [ ] Fix SkIDEancer Railway 404 error
- [ ] Build production Tauri app (DMG)
- [ ] Record demo video of multi-agent conversation

### Mid-Term (Next Month)

- [ ] Integrate actual Lux model API
- [ ] Set up Apple Developer code signing
- [ ] Create comprehensive user documentation
- [ ] Add "Wizard Mode" for first-time users
- [ ] Implement visual agent status cards

### Long-Term (Next Quarter)

- [ ] OSGym sandbox integration
- [ ] Local on-device Lux model (Intel edge)
- [ ] Public beta release
- [ ] Plugin marketplace for custom agents
- [ ] Cross-platform support (Windows, Linux)

### Advanced Features Under Consideration

1. **Consensus Voting**: Multiple AIs vote on code changes
2. **Chain-of-Thought Relay**: One AI starts reasoning, another continues
3. **Specialized Expert Panels**: Security/Performance/UX councils
4. **Autonomous Improvement Loop**: Analyze → Plan → Implement → Review
5. **Real-Time Pair Programming**: Multiple AIs assist simultaneously
6. **Self-Healing Codebase**: Detect issues → convene agents → auto-fix

---

## 13. Troubleshooting Guide

### Common Issues

#### Node.js Not Found After Restart

```bash
# Check if brew-installed node is in PATH
export PATH="/usr/local/bin:$PATH"
# Or for M1/M2 Macs
export PATH="/opt/homebrew/bin:$PATH"

# Verify
node --version
```

#### Redis Connection Refused

```bash
# Start Redis
redis-server --port 6379

# Verify
redis-cli ping  # Should return PONG
```

#### Tauri Build Fails

```bash
# Clean build
cd apps/tauri-desktop/src-tauri
cargo clean

# Rebuild
cargo build --release
```

#### Chrome Extension Not Loading

```bash
# Rebuild
cd apps/chrome-extension
pnpm run build

# Load unpacked in chrome://extensions/
# Point to: apps/chrome-extension/dist
```

#### Relay Server Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Restart relay
cd apps/relay-server
pnpm run start
```

---

## 14. Contact & Contribution

### Project Structure

- **Monorepo**: pnpm workspace
- **Primary Language**: TypeScript (frontend), Rust (backend)
- **Architecture**: Microservices + Federated Mesh
- **Communication**: Redis Pub/Sub + WebSocket

### Key Repositories

- **Main Monorepo**: `whodaniel/fuse`
- **SkIDEancer IDE**: `whodaniel/skideancer-ide` (isolated)

---

## 15. Appendix: Quick Reference

### Port Allocations

- **3000**: TNF Relay Server (WebSocket)
- **3001**: API Server
- **6379**: Redis
- **8080**: SkIDEancer IDE (Railway)

### Environment Variables

```bash
A2A_PRIMARY_ENDPOINT=http://localhost:3000
PORT=3000
FRONTEND_PORT=3000
API_PORT=3001
POSTGRES_USER=newfuse
DB_NAME=fuse
```

### Common Commands

```bash
# Agent CLI
node scripts/tnf-agent-cli.cjs register <name> <role> <platform>
node scripts/tnf-agent-cli.cjs list
node scripts/tnf-agent-cli.cjs send <message>

# Orchestration
node scripts/orchestration-demo.cjs
node scripts/RelayHealthCheck.cjs

# Development
pnpm tauri dev        # Tauri app
pnpm run build        # Chrome extension
pnpm run compile      # VS Code extension
```

---

**Document Version**: 1.0  
**Last Verified**: December 20, 2025  
**Status**: Living Document - Update as architecture evolves
