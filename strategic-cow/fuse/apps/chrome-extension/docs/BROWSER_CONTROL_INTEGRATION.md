# TNF Browser Control Integration

## Overview

This integration enables **any local AI agent** to control websites through the
TNF Chrome Extension. The architecture provides a unified way for:

- **Tauri Desktop App**
- **VS Code Extension**
- **Any Local AI/LLM**

...to automate browser interactions including navigation, clicking, typing,
reading content, and interacting with AI chat interfaces like ChatGPT, Claude,
and Gemini.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOCAL AI AGENTS                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Tauri     │  │  VS Code    │  │  CLI Agent  │  │ Custom LLM  │   │
│  │   Desktop   │  │  Extension  │  │             │  │   Agent     │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │          │
│         └────────────────┴────────────────┴────────────────┘          │
│                                   │                                    │
│                          WebSocket Connection                          │
│                                   │                                    │
│                    ┌──────────────▼──────────────┐                     │
│                    │       TNF RELAY SERVER       │                    │
│                    │     (ws://localhost:3000)    │                    │
│                    │                              │                    │
│                    │  - Message routing           │                    │
│                    │  - Client registration       │                    │
│                    │  - Session management        │                    │
│                    └──────────────┬──────────────┘                     │
│                                   │                                    │
│                          Chrome Extension                              │
│                          Message Protocol                              │
│                                   │                                    │
│                    ┌──────────────▼──────────────┐                     │
│                    │   TNF CHROME EXTENSION       │                    │
│                    │                              │                    │
│                    │  ┌──────────────────────┐   │                    │
│                    │  │   Background Script   │   │                    │
│                    │  │  - BrowserControlHandler│ │                    │
│                    │  │  - TNFRelayConnection  │  │                    │
│                    │  └──────────┬───────────┘   │                    │
│                    │             │                │                    │
│                    │  ┌──────────▼───────────┐   │                    │
│                    │  │   Content Script      │   │                    │
│                    │  │  - DOM Manipulation   │   │                    │
│                    │  │  - Event Simulation   │   │                    │
│                    │  │  - Chat Detection     │   │                    │
│                    │  └──────────────────────┘   │                    │
│                    └─────────────────────────────┘                     │
│                                   │                                    │
│                          Actual Browser                                │
│                                   │                                    │
│                    ┌──────────────▼──────────────┐                     │
│                    │         WEBSITES            │                    │
│                    │  ChatGPT, Claude, GitHub,   │                    │
│                    │  Any Web Application        │                    │
│                    └─────────────────────────────┘                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Components Created

### 1. Browser Control Protocol (`packages/shared/src/browser-control/protocol.ts`)

Defines all message types for communication:

- **Navigation**: NAVIGATE, GO_BACK, GO_FORWARD, REFRESH
- **Page Analysis**: ANALYZE_PAGE, GET_PAGE_CONTENT, GET_DOM_SNAPSHOT,
  FIND_ELEMENTS
- **Element Interaction**: CLICK, TYPE, SCROLL, HOVER, FOCUS
- **Chat Interface**: DETECT_CHAT_ELEMENTS, SEND_CHAT_MESSAGE,
  GET_CHAT_MESSAGES, WAIT_FOR_RESPONSE
- **Screenshots**: TAKE_SCREENSHOT, START_RECORDING, STOP_RECORDING
- **Tab Management**: NEW_TAB, CLOSE_TAB, SWITCH_TAB, LIST_TABS
- **Cascade Actions**: CASCADE_START, CASCADE_CANCEL, CASCADE_STATUS
- **Session Control**: START_SESSION, END_SESSION
- **Overlay**: SHOW_OVERLAY, HIDE_OVERLAY, UPDATE_OVERLAY

### 2. Tauri Browser Control Service (`apps/tauri-desktop/src/services/BrowserControlService.ts`)

High-level API for controlling browsers from the Tauri app:

```typescript
import { BrowserControlService } from './services';

// Connect to TNF Relay
await BrowserControlService.connect('ws://localhost:3000');

// Navigate to a page
await BrowserControlService.navigate('https://chat.openai.com');

// Type in a chat input
await BrowserControlService.type('#prompt-textarea', 'Hello, world!');

// Click a button
await BrowserControlService.click('button[data-testid="send-button"]');

// Take a screenshot
const screenshot = await BrowserControlService.takeScreenshot();

// Auto-detect chat elements
const chatElements = await BrowserControlService.detectChatElements();

// Send a message to ChatGPT/Claude/Gemini
await BrowserControlService.sendChatMessage('What is 2+2?', {
  waitForResponse: true,
  responseTimeout: 30000,
});

// Execute a cascade of actions
await BrowserControlService.startCascade({
  cascadeId: 'my-cascade',
  steps: [
    { id: '1', action: 'NAVIGATE', payload: { url: 'https://example.com' } },
    { id: '2', action: 'CLICK', payload: { selector: '#login' } },
    {
      id: '3',
      action: 'TYPE',
      payload: { selector: '#email', text: 'user@example.com' },
    },
  ],
  options: { stopOnError: true, showOverlay: true },
});
```

### 3. Chrome Extension Browser Control Handler (`apps/chrome-extension/src/background/browser-control-handler.ts`)

Handles incoming commands in the background script:

- Routes commands to content scripts
- Manages tab operations
- Tracks cascade execution state
- Handles session management

### 4. Chrome Extension Content Script Handlers (`apps/chrome-extension/src/content/browser-control-handlers.ts`)

Executes commands in the page context:

- **Chat Platform Detection**: Auto-detects ChatGPT, Claude, Gemini, and generic
  chat interfaces
- **Realistic Event Simulation**: Dispatches proper mouse and keyboard events
- **DOM Analysis**: Generates selectors, XPaths, and page structure analysis
- **Overlay Display**: Shows progress overlays during automation

---

## Supported AI Chat Platforms

The extension auto-detects and can interact with:

| Platform | URL Pattern                      | Input Detection | Button Detection |
| -------- | -------------------------------- | --------------- | ---------------- |
| ChatGPT  | `chat.openai.com`, `chatgpt.com` | ✅              | ✅               |
| Claude   | `claude.ai`                      | ✅              | ✅               |
| Gemini   | `gemini.google.com`              | ✅              | ✅               |
| Generic  | Any site                         | 🟡 Best-effort  | 🟡 Best-effort   |

---

## Usage Examples

### Example 1: Navigate and Take Screenshot

```typescript
const BrowserControl = BrowserControlService;

await BrowserControl.connect();
await BrowserControl.navigate('https://github.com/whodaniel/fuse');
const screenshot = await BrowserControl.takeScreenshot({
  format: 'png',
  fullPage: true,
});
console.log('Screenshot captured:', screenshot.dataUrl.slice(0, 50) + '...');
```

### Example 2: Automate ChatGPT

```typescript
await BrowserControl.navigate('https://chat.openai.com');

// Wait for page to load
await new Promise((resolve) => setTimeout(resolve, 3000));

// Detect chat elements
const elements = await BrowserControl.detectChatElements();
console.log('Detected elements:', elements.mapping);

// Send a message and wait for response
const result = await BrowserControl.sendChatMessage(
  'Explain quantum computing in simple terms',
  { waitForResponse: true, responseTimeout: 60000 }
);
```

### Example 3: Cascade Automation

```typescript
await BrowserControl.startCascade({
  cascadeId: 'github-star-repo',
  steps: [
    {
      id: 'navigate',
      action: 'NAVIGATE',
      payload: { url: 'https://github.com/whodaniel/fuse', waitForLoad: true },
    },
    {
      id: 'find-star',
      action: 'FIND_ELEMENTS',
      payload: { selector: 'button[aria-label*="Star"]' },
    },
    {
      id: 'click-star',
      action: 'CLICK',
      payload: { selector: 'button[aria-label*="Star"]' },
      waitCondition: { type: 'delay', value: 1000 },
    },
  ],
  options: {
    showOverlay: true,
    stopOnError: false,
  },
});
```

---

## Setup Instructions

### 1. Start the TNF Relay Server

```bash
cd /path/to/The-New-Fuse
pnpm relay:start
# or
node packages/relay-core/src/server.ts
```

### 2. Load the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `/The-New-Fuse/apps/chrome-extension/dist`

### 3. Connect from Tauri

```typescript
import { BrowserControlService } from './services';

// Connect when app starts
await BrowserControlService.connect('ws://localhost:3000');

// You're ready to control browsers!
```

---

## Integration with Existing TNF Relay

The existing `TNFRelayConnection` class in `background.ts` already handles some
AI automation. The new `BrowserControlHandler` extends this with:

1. **Standardized Protocol** - Consistent message types across all clients
2. **Chat Interface Support** - Auto-detection of AI chat platforms
3. **Cascade Execution** - Multi-step automation sequences
4. **Overlay System** - Visual feedback during automation

To integrate:

```typescript
// In background.ts, import the new handler
import { browserControlHandler } from './background/browser-control-handler';

// In handleRelayMessage, add:
case 'BROWSER_CONTROL':
  const result = await browserControlHandler.handleMessage(message);
  this.sendRelayMessage(result.type || 'BROWSER_CONTROL_RESULT', result);
  break;
```

---

## Security Considerations

1. **Local Only**: The relay server runs locally (localhost:3000)
2. **No Remote Access**: No external network connections required
3. **CSP Compliant**: Works within Chrome's Content Security Policy
4. **User Consent**: Extension requires explicit installation

---

## Next Steps

1. [ ] Complete integration with existing TNFRelayConnection
2. [ ] Add content script handler initialization
3. [ ] Implement screen recording via chrome.tabCapture
4. [ ] Add rate limiting for automation actions
5. [ ] Create Tauri UI for browser control panel
6. [ ] Add AI agent example using the browser control API

---

## Files Created

| File                                                              | Description                             |
| ----------------------------------------------------------------- | --------------------------------------- |
| `packages/shared/src/browser-control/protocol.ts`                 | Message type definitions and interfaces |
| `apps/tauri-desktop/src/services/BrowserControlService.ts`        | Tauri-side browser control API          |
| `apps/chrome-extension/src/background/browser-control-handler.ts` | Background script command handler       |
| `apps/chrome-extension/src/content/browser-control-handlers.ts`   | Content script DOM manipulation         |
| `apps/tauri-desktop/EXTENSION_INTEGRATION_PLAN.md`                | Original integration planning document  |
| `apps/chrome-extension/docs/BROWSER_CONTROL_INTEGRATION.md`       | This document                           |
