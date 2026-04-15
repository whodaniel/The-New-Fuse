# Fuse Connect v6 - UX Improvement Plan

**Created:** December 25, 2024 **Status:** In Progress

---

## Current State Analysis

### What Works ✅

1. Panel injection on command (popup button or Ctrl+Shift+F)
2. WebSocket connection to relay
3. Agent discovery and display
4. Universal chat detection
5. Service control via native host
6. Terminal launch for relay startup
7. **NEW: Inject to Chat button** - sends messages directly to page chat
8. **NEW: Chat detection indicator** in input area
9. **NEW: Ctrl+Shift+I shortcut** to inject clipboard content to chat

### What Needs Improvement ⚠️

---

## Priority 1: Auto-Send to Chat ✅ COMPLETED

### Problem

The injectable panel has a chat input, but typing a message there should:

1. Auto-paste into the detected AI chat input
2. Click the send button
3. Wait for response
4. Display the response in the panel

### Solution ✅

Connected FloatingPanel's input to UniversalChatDetector.sendMessage()

### Implementation ✅

- Added 💬 Inject button in input area
- Connected to content script's INJECT_MESSAGE handler
- Shows detection indicator when chat found

---

## Priority 2: Panel Tab Review ✅ COMPLETED

### Current Tabs (Now 6)

1. **Chat** - Messages + Detection status ✅
2. **Agents** - Connected agents ✅
3. **Channels** - Federation channels ✅
4. **Services** - Service management ✅ NEW
5. **Notifications** - Alerts ✅
6. **Settings** - Configuration ✅ NEW

### Services Tab Features ✅

- Service cards with status indicators
- Start/Stop/Restart buttons per service
- "Start All Services" button
- "Open Terminal" button

### Settings Tab Features ✅

- Relay URL configuration
- Auto-reconnect toggle
- Panel opacity slider
- Always on Top toggle
- Debug mode toggle
- Save/Reset buttons

---

## Priority 3: Popup UX Improvements

### Current Issues

1. "Quick Start Helper" only shows when relay offline
2. No indication if panel is open on current page
3. Service tab not prominent enough

### Proposed Changes

#### Header

- [x] Open Panel button (🪟)
- [ ] **ADD: Panel open indicator (green dot when panel is visible)**
- [ ] **ADD: Connection animation during connecting state**

#### Connect Tab

- [x] Connection status
- [x] Quick start helper
- [ ] **ADD: Current page detection status**
- [ ] **ADD: "Send test message" button**

#### Services Tab

- [ ] **ADD: More prominent placement**
- [ ] **ADD: Service logs viewer**
- [ ] **ADD: Auto-start option**

---

## Priority 4: Integration Opportunities from Antigravity

### Features to Integrate

1. **Page Registration System**
   - Track page instances across tabs
   - Assign unique target IDs

2. **WebRequest Monitoring**
   - Track page MIME types
   - Detect SPA navigation

3. **Offscreen Document for Screen Recording**
   - Capture agent actions
   - Record debugging sessions

4. **External Message Handler**
   - Allow other extensions to communicate
   - Enable web page integration

---

## Priority 5: Missing Core Functionality

### What's Missing

1. **Response Capture**
   - When AI responds, capture the response
   - Send to relay for processing
   - Allow agents to see what AI said

2. **Agent Action Execution**
   - When an agent sends a message through relay
   - Inject into current page's chat
   - Execute and capture response

3. **Bidirectional Communication**
   - Extension → AI Chat (inject message)
   - AI Chat → Extension (capture response)
   - Extension → Relay (send captured data)
   - Relay → Extension (receive commands)

---

## Implementation Order

### Phase 1: Core Chat Integration

1. ~~Panel show/hide controls~~ ✅
2. Connect panel input to sendMessage()
3. Display chat responses in panel
4. Add "Inject" button to send to page

### Phase 2: Service Management

1. Add Services tab to panel
2. Mirror popup service controls
3. Add quick-start from panel

### Phase 3: Enhanced Detection

1. Show detection confidence prominently
2. Add manual element selection
3. Support for more AI platforms

### Phase 4: Agent Orchestration

1. Full bidirectional message flow
2. Agent action queue
3. Response confirmation UI

---

## Technical Notes

### Cannot Do (Chrome Extension Limitations)

- ❌ Run Playwright (requires Node.js)
- ❌ Spawn external processes directly (needs native messaging)
- ❌ Access filesystem (needs native messaging)
- ❌ Execute arbitrary code on pages (CSP restrictions)

### Can Do

- ✅ DOM manipulation via content scripts
- ✅ Keyboard/mouse event simulation
- ✅ WebSocket connections
- ✅ Page navigation
- ✅ Chrome API access (tabs, storage, etc.)
- ✅ Native messaging to local host

---

## Next Steps

1. Implement "Send to Chat" in FloatingPanel
2. Add Services tab to panel
3. Improve connection flow UX
4. Test across AI platforms
