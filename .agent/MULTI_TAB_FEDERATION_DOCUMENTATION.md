# Multi-Tab Federation System - Complete Documentation

**Last Updated:** 2026-01-16 **Status:** ✅ WORKING

---

## Overview

The Fuse Connect Chrome extension enables **multi-tab AI agent federation** -
allowing multiple browser tabs running AI chat interfaces (like Gemini) to
communicate with each other via a central relay server. Each tab becomes an
independent "Page Agent" that can send/receive messages to/from other agents.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (User's Chrome)                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │              Background Service Worker                          ││
│  │              (ONE per browser profile)                          ││
│  │              ID: browser-XXXXX                                  ││
│  │              • Maintains WebSocket to Relay                     ││
│  │              • Routes messages between tabs and relay           ││
│  └───────────────────┬────────────────────┬───────────────────────┘│
│                      │                    │                         │
│  ┌───────────────────▼────┐   ┌──────────▼───────────────────┐    │
│  │      TAB 1 (Gemini)     │   │      TAB 2 (Gemini)          │    │
│  │  Content Script         │   │  Content Script              │    │
│  │  Page Agent ID:         │   │  Page Agent ID:              │    │
│  │  page-agent-XXXXX-abc   │   │  page-agent-YYYYY-def        │    │
│  │                         │   │                              │    │
│  │  ┌───────────────────┐  │   │  ┌───────────────────┐       │    │
│  │  │  FloatingPanel    │  │   │  │  FloatingPanel    │       │    │
│  │  │  (UI + Chat)      │  │   │  │  (UI + Chat)      │       │    │
│  │  └───────────────────┘  │   │  └───────────────────┘       │    │
│  │  ┌───────────────────┐  │   │  ┌───────────────────┐       │    │
│  │  │ SimpleChatBridge  │  │   │  │ SimpleChatBridge  │       │    │
│  │  │ (Gemini DOM ops)  │  │   │  │ (Gemini DOM ops)  │       │    │
│  │  └───────────────────┘  │   │  └───────────────────┘       │    │
│  └─────────────────────────┘   └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket
                                    ▼
                    ┌───────────────────────────────┐
                    │        RELAY SERVER           │
                    │     ws://localhost:3001/ws    │
                    │                               │
                    │  • Message routing            │
                    │  • Channel management         │
                    │  • Agent registry             │
                    └───────────────────────────────┘
```

### Key IDs

| ID Type              | Format                         | Purpose                                                                      |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| **Browser Agent ID** | `browser-{timestamp}-{random}` | Identifies the background service worker's WebSocket connection to the relay |
| **Page Agent ID**    | `page-agent-{tabId}-{random}`  | Identifies each individual tab's content script as a unique agent            |

**CRITICAL:** The `metadata.senderId` in messages must contain the **Page Agent
ID**, not the Browser Agent ID, for correct self-detection.

---

## Message Flow

### Sending a Message (Tab 1 → Tab 2)

1. **User types message** in FloatingPanel (Tab 1)
2. **FloatingPanel.sendUnifiedMessage()** is called
   - Sets `metadata.senderId = this.myAgentId` (Page Agent ID)
   - Sends `BROADCAST_MESSAGE` to background script (for relay sync)
   - Sends `INJECT_MESSAGE` to content script (for local Gemini injection)
3. **Background script** receives `BROADCAST_MESSAGE`
   - Forwards to relay via WebSocket
4. **Relay server** broadcasts message to all connected agents
5. **Background script** receives message back
   - Calls `broadcastToTabs()` to send `NEW_MESSAGE` to ALL tabs
6. **Tab 2's content script** receives `NEW_MESSAGE`
   - Checks: `msg.metadata.senderId !== this.pageAgentId` → TRUE (external)
   - Calls `SimpleChatBridge.sendMessage()` to inject into Gemini
7. **Tab 1's content script** receives `NEW_MESSAGE`
   - Checks: `msg.metadata.senderId !== this.pageAgentId` → FALSE (self)
   - **SKIPS injection** (prevents self-injection loop)

### Self-Detection Logic

```typescript
// In content/index.ts - NEW_MESSAGE handler
const senderFromMetadata = msg.metadata?.senderId;

// Primary check: metadata.senderId matches our page agent ID
const isSelfMessage = senderFromMetadata === this.pageAgentId;

if (isSelfMessage) {
  console.log('⏭️ Skipping message: same-agent');
  return; // Don't inject our own message
}

// If not self, inject the message
this.injectMessage(msg.content);
```

---

## Critical Files

| File                                                                | Purpose                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/chrome-extension/src/v5/background/index.ts`                  | Background service worker, WebSocket management, message routing |
| `apps/chrome-extension/src/v5/content/index.ts`                     | Content script, handles injection, self-detection                |
| `apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts`  | UI panel, message sending, state management                      |
| `apps/chrome-extension/src/v5/content/adapters/SimpleChatBridge.ts` | DOM operations for injecting text into Gemini chat               |
| `packages/relay-core/src/standalone-relay.ts`                       | Relay server implementation                                      |

---

## Bugs Fixed (2026-01-16)

### 1. Multi-Send Bug in SimpleChatBridge

**Problem:** `sendMessage()` executed 4 send methods (Enter key, button.click,
MouseEvent, document Enter) regardless of whether the first one worked, causing
messages to be sent multiple times.

**Fix:** Added `inputWasCleared()` check after each method and return early on
success.

**File:** `SimpleChatBridge.ts` lines 555-615

### 2. Self-Injection Loop

**Problem:** Messages sent from a tab were being re-injected into the same tab
when they came back from the relay.

**Root Cause:** `FloatingPanel.myAgentId` was being overwritten with the Browser
Agent ID instead of the Page Agent ID.

**Fix:** Modified `requestConnectionState()` to not overwrite `myAgentId` if
it's already set correctly:

```typescript
// Only use response.agentId as fallback if we don't have one yet
if (!this.myAgentId && response.agentId?.startsWith('page-agent-')) {
  this.myAgentId = response.agentId;
}
```

**File:** `FloatingPanel.ts` lines 151-173

### 3. sendUnifiedMessage Validation

**Problem:** Messages could be sent before `myAgentId` was properly set, causing
missing/wrong `senderId`.

**Fix:** Added validation to block sending if `myAgentId` isn't a valid Page
Agent ID:

```typescript
if (!this.myAgentId || !this.myAgentId.startsWith('page-agent-')) {
  console.error('[FuseConnect] Cannot send message: myAgentId not set!');
  alert('Connection not ready. Please wait and try again.');
  return;
}
```

**File:** `FloatingPanel.ts` lines 1592-1603

### 4. isExternalAgent Logic

**Problem:** The previous check `!msg.from.includes(this.pageAgentId)` used
partial string matching which incorrectly blocked legitimate messages.

**Fix:** Changed to use exact match on `metadata.senderId`:

```typescript
const isSelfMessage = senderFromMetadata === this.pageAgentId;
const isExternalAgent = !isSelfMessage;
```

**File:** `content/index.ts` lines 519-538

---

## Startup Checklist

**Before testing multi-tab federation:**

1. ✅ **Start the Relay Server**

   ```bash
   cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse
   pnpm relay:start
   ```

   Should show: `[Relay] Server started on ws://localhost:3001/ws`

2. ✅ **Reload the Extension**
   - Go to `chrome://extensions`
   - Find "Fuse Connect"
   - Click the refresh/reload button

3. ✅ **Close ALL Gemini tabs** (start fresh)

4. ✅ **Open Tab 1** (Gemini)
   - Navigate to `https://gemini.google.com/app`
   - Press `Ctrl+Shift+F` to open Fuse Connect panel
   - Verify: Panel shows "✓ Syncing" or "✓ Connected"
   - Verify: Console shows `Assigned Page Agent ID: page-agent-XXXXX`

5. ✅ **Open Tab 2** (Gemini)
   - Press `Ctrl+T`, navigate to `https://gemini.google.com/app`
   - Press `Ctrl+Shift+F` to open Fuse Connect panel
   - Verify: Panel shows "✓ Syncing" or "✓ Connected"
   - Verify: Console shows DIFFERENT `Page Agent ID`

6. ✅ **Join same channel** in both tabs (e.g., "Red")

7. ✅ **Test messaging**
   - Type message in Tab 2's Fuse panel
   - Verify: Message appears in Tab 1's Gemini chat AND/OR Fuse panel

---

## Console Log Reference

### Success Indicators

```
[FuseConnect v6] Assigned Page Agent ID: page-agent-XXXXX
[FuseConnect] Panel assigned Agent ID: page-agent-XXXXX
[FuseConnect v6] ⏭️ Skipping message: {reason: 'same-agent'}  ← Self-detection working!
[SimpleChatBridge] Message sent via Enter key  ← Single send, not multiple!
```

### Error Indicators

```
[FuseConnect] Cannot send message: myAgentId is not set correctly!  ← Page agent not registered yet
[SimpleChatBridge] All send methods attempted, input may not have cleared  ← Gemini UI issue
[FuseConnect v6] ✅ Injecting message from external agent  ← If you see this for YOUR message, self-detection failed!
```

---

## Troubleshooting

### Messages not being received by other tabs

1. Check relay is running: `pnpm relay:start`
2. Check both tabs are on same channel
3. Check console for `BROADCAST_MESSAGE` being sent
4. Check background script console for WebSocket activity

### Self-injection loop (same message appears multiple times)

1. Check `metadata.senderId` in console logs
2. Verify it's a Page Agent ID (`page-agent-XXXXX`), NOT Browser Agent ID
   (`browser-XXXXX`)
3. If wrong, rebuild extension and reload

### "You stopped this response" error

1. This means a message was sent while Gemini was responding
2. Check if message is being sent multiple times (multi-send bug)
3. Check console for multiple `Dispatched Enter keydown` or
   `Clicked send button` logs

---

## Extension Build Commands

```bash
# Navigate to extension directory
cd apps/chrome-extension

# Build v5 (production)
npm run build:v5

# Then reload in chrome://extensions
```

---

## Architecture Consideration (Future)

The current architecture uses **Browser Agent ID** at the relay level, with
**Page Agent IDs** tracked via metadata. This works but is fragile.

**Better Architecture:**

- Each Page Agent should register directly with the relay as a first-class agent
- Relay should track Page Agents, not just Browser Agents
- `source` field in protocol messages should be the Page Agent ID

This would eliminate the need for metadata-based self-detection and make the
system more robust.

---

## Known Issues / Future Work

### YouTube Link Issue (2026-01-16)

When a message contains a YouTube video link, the conversation may halt. Needs
investigation:

- Gemini may create an `<iframe>` for YouTube embed
- `checkForMediaContent()` in SimpleChatBridge detects iframes
- This may interfere with response detection

**Status:** Under investigation
