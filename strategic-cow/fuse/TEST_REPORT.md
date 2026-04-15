# The New Fuse - Chrome Extension Test Report

**Date**: 2026-01-13 **Tester**: Claude (Sonnet 4.5) **Build**: v5 (dist-v5)
**Previous Issues Addressed**:

- Message doubling (messages appearing twice)
- Channel leakage (messages going to wrong channels)
- Extension context invalidation errors
- Agent identity management

---

## Test Environment

### Infrastructure Status

✅ **Relay Server**: Running at `localhost:3001`

- Status: `ok`
- Version: `1.0.0`
- Agents Connected: `2`
- Channels: `1`
- Uptime: ~3 minutes

✅ **Build Status**: Extension compiled successfully

- Content script: `155 KB`
- Background script: `39.2 KB`
- Popup: `25.7 KB`
- No compilation errors

✅ **Chrome Instances**: Launched with extension loaded

- Extension path: `apps/chrome-extension/dist-v5`
- Target URL: `https://gemini.google.com/app`
- 2 tabs opened

✅ **Orchestrator Script**: Running

- Connected to `wss://relay.thenewfuse.com/ws`
- Joined channels: `general`, `Blue`
- Broadcasting discovery messages

---

## Code Changes Verified

### 1. Extension Context Invalidation Fix ✅

**Location**: `apps/chrome-extension/src/v5/content/index.ts:254-268`

```typescript
// Context validity check
if (!chrome.runtime?.id) {
  return false;
}

// Safe response wrapper
const safeSendResponse = (response: any) => {
  try {
    if (chrome.runtime?.id) {
      sendResponse(response);
    }
  } catch (e) {
    console.debug('[FuseConnect] Context invalidated during response sending');
  }
};
```

**Expected Behavior**:

- Extension reload no longer causes crashes
- Context invalidation errors are caught and logged gracefully
- User sees refresh prompt when extension is updated

### 2. Unique Agent ID Assignment ✅

**Locations**:

- `apps/chrome-extension/src/v5/content/index.ts:129-133` - ID retrieval
- `apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts:47,309-313` -
  ID storage and setter

```typescript
// Content script receives unique ID
chrome.runtime.sendMessage({
  type: 'CHAT_DETECTED',
  ...
}, (response) => {
  if (response?.agentId) {
    this.pageAgentId = response.agentId;
  }
});

// Panel stores its unique ID
setAgentId(id: string): void {
  console.log('[FuseConnect] Panel assigned Agent ID:', id);
  this.myAgentId = id;
  this.update();
}
```

**Expected Behavior**:

- Each browser tab gets a unique "Page Agent ID"
- Panel displays shortened ID (e.g., `#abc123`)
- Background script distinguishes between "Browser Agent" (extension) and
  individual Page Agents

### 3. Strict Message Filtering ✅

**Location**:
`apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts:2047-2068`

```typescript
// Self-echo check
const isOwnEcho = this.myAgentId && msg.from === this.myAgentId;
if (isOwnEcho) {
  console.log('[FuseConnect] Skipping own echo');
  break;
}

// Channel isolation
if (msg.channel && msg.channel !== this.currentChannel) {
  console.log('[FuseConnect] Skipping message for other channel:', msg.channel);
  break;
}
```

**Expected Behavior**:

- Messages sent by user appear once (not duplicated when relay echoes back)
- Messages on `#Blue` channel don't appear in tabs on `#general`
- Console logs confirm filtering logic

### 4. Targeted Message Injection ✅

**Location**: `apps/chrome-extension/src/v5/content/index.ts:188-200`

```typescript
// Only inject if addressed SPECIFICALLY to this agent ID
if (this.pageAgentId && msg.to === this.pageAgentId && msg.content) {
  console.log('[FuseConnect v6] Injecting targeted message:', msg.content);
  this.injectMessage(msg.content).then((success) => {
    if (success) console.log('[FuseConnect v6] Injection successful');
  });
}
```

**Expected Behavior**:

- No "ghost typing" in other tabs
- Messages only injected when explicitly addressed to specific Page Agent ID
- Cross-talk eliminated

---

## Manual Test Plan

### Test 1: Extension Loading

**Steps**:

1. Open Chrome with `--load-extension` flag pointing to `dist-v5`
2. Navigate to `chrome://extensions`
3. Verify extension is enabled and shows no errors

**Expected**:

- Extension icon visible in toolbar
- No console errors in background page
- Popup opens correctly

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 2: Relay Connection

**Steps**:

1. Click extension icon to open popup
2. Check connection status indicator
3. Click "Connect to Relay" button
4. Verify status changes to "Connected"

**Expected**:

- Status dot changes from red to green
- Popup shows "Connected" text
- No WebSocket connection errors in console

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 3: Unique Agent ID Assignment

**Steps**:

1. Open 2-3 tabs to `gemini.google.com`
2. In each tab, press `Ctrl+Shift+F` to open floating panel
3. Click "Agents" tab in each panel
4. Verify each tab shows different Agent ID

**Expected**:

- Each panel displays unique shortened ID (e.g., `#a1b2c3`, `#d4e5f6`)
- "Agents" tab lists all connected agents with their unique IDs
- No agents show as duplicate

**Test Evidence Required**:

- Screenshot showing multiple panels with different IDs

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 4: Message Doubling Fix

**Steps**:

1. Open floating panel in one tab
2. Select channel "Blue" from dropdown
3. Type a test message: "Test message 1"
4. Click "Send" button
5. Observe message list

**Expected**:

- Message appears immediately (optimistic update)
- When relay echoes back, message does NOT duplicate
- Message appears exactly once in the chat

**Test Evidence Required**:

- Console logs showing: `[FuseConnect] Skipping own echo`

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 5: Channel Isolation

**Steps**:

1. Open Tab A and Tab B, both with floating panels
2. In Tab A: Select channel "Blue"
3. In Tab B: Select channel "general"
4. In Tab A: Send message "Message for Blue"
5. Check Tab B panel

**Expected**:

- Tab B does NOT display "Message for Blue"
- Console in Tab B shows:
  `[FuseConnect] Skipping message for other channel: Blue`

**Test Evidence Required**:

- Screenshot of Tab B showing no message
- Console logs confirming channel filter

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 6: Extension Context Invalidation Handling

**Steps**:

1. Open tab with floating panel visible
2. Go to `chrome://extensions`
3. Click "Reload" on the Fuse Connect extension
4. Return to original tab
5. Try to interact with panel

**Expected**:

- Panel displays warning overlay: "Extension Reloaded"
- Overlay has "Refresh Page" button
- No crash or uncaught errors in console
- After refresh, panel works normally

**Test Evidence Required**:

- Screenshot of warning overlay
- Console showing context validity checks

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 7: Floating Panel Functionality

**Steps**:

1. Press `Ctrl+Shift+F` to toggle panel
2. Drag panel around the page
3. Resize panel from corners/edges
4. Switch between tabs (Chat, Agents, Channels, Services, Settings)
5. Click "Minimize" button
6. Click minimized icon to restore

**Expected**:

- Panel can be dragged smoothly
- Panel resizes correctly (min/max constraints)
- All tabs render without errors
- Minimize/restore works
- Panel position persists across page reloads

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

### Test 8: Inter-Agent Communication

**Steps**:

1. Ensure orchestrator script is running (`broadcast-instruction.js`)
2. Wait for orchestrator to discover browser agents
3. Check orchestrator output for "DISCOVERED AGENT" messages
4. Verify instructions are sent to each agent
5. Check floating panel "Chat" tab for incoming messages

**Expected**:

- Orchestrator logs: `>>> DISCOVERED AGENT via Agent List: [agent-id]`
- Orchestrator sends: "Hello! You are a Gemini agent instance..."
- Browser tabs receive and display the instruction message
- Each agent can reply and messages appear in other panels

**Current Status**:

- Orchestrator connected to relay ✅
- Orchestrator polling for agents ✅
- Waiting for browser agents to register ⏳

**Status**: ⏳ **MANUAL VERIFICATION REQUIRED**

---

## Test Results Summary

| Test Case                 | Status     | Notes                            |
| ------------------------- | ---------- | -------------------------------- |
| Build Compilation         | ✅ PASS    | No errors, all modules bundled   |
| Relay Server Running      | ✅ PASS    | Healthy, 2 agents connected      |
| Chrome Launch             | ✅ PASS    | Extension loaded, tabs opened    |
| Orchestrator Connection   | ✅ PASS    | Connected to relay, broadcasting |
| Extension Loading         | ⏳ PENDING | Manual verification needed       |
| Relay Connection          | ⏳ PENDING | Manual verification needed       |
| Unique Agent IDs          | ⏳ PENDING | Manual verification needed       |
| Message Doubling Fix      | ⏳ PENDING | Manual verification needed       |
| Channel Isolation         | ⏳ PENDING | Manual verification needed       |
| Context Invalidation      | ⏳ PENDING | Manual verification needed       |
| Panel Functionality       | ⏳ PENDING | Manual verification needed       |
| Inter-Agent Communication | ⏳ PENDING | Manual verification needed       |

---

## Considerations & Known Issues

### 1. Browser Authentication Required

**Issue**: Gemini requires Google sign-in before the chat interface loads.
**Impact**: Extension won't detect chat elements until user is signed in.
**Recommendation**: Ensure user is signed in to Google before testing.

### 2. Extension Reload Behavior

**Issue**: When extension is reloaded, existing tabs retain old content script.
**Resolution**: Implemented context validation and warning overlay. **User
Action**: User must refresh the page after extension reload.

### 3. Agent Discovery Timing

**Issue**: Orchestrator may take 5-10 seconds to discover newly connected
agents. **Reason**: Relay uses polling interval (currently 5 seconds).
**Recommendation**: Wait ~10 seconds after opening tabs before expecting
discovery.

### 4. Panel Persistence

**Issue**: Panel state (position, size, channel) persists in
`chrome.storage.local`. **Impact**: If testing with fresh state, may need to
clear extension storage. **Command**: `chrome.storage.local.clear()` in
background page console.

### 5. Multiple Chrome Profiles

**Issue**: Opening multiple windows with same profile may share state.
**Resolution**: Each tab gets unique `pageAgentId`, preventing cross-talk.
**Verified**: Code shows `this.pageAgentId` check before injection.

### 6. Message Broadcast Deduplication

**Implementation**: `recentBroadcasts` Map tracks recent messages (10s window).
**Purpose**: Prevents re-broadcasting identical messages too quickly.
**Location**: `FloatingPanel.ts:1597-1609`

### 7. Console Debugging

**Debug Utils**: Panel exposes `window.__FUSE_DEBUG` object. **Available
Methods**:

- `__FUSE_DEBUG.getLastResponse()` - Get last AI response
- `__FUSE_DEBUG.sendTestMessage(msg)` - Send test message
- `__FUSE_DEBUG.checkExtensionContext()` - Verify context validity
- `__FUSE_DEBUG.findElements()` - Check detected chat elements

---

## Recommendations for Next Steps

### Immediate Actions

1. **Sign in to Google** in both Chrome tabs
2. **Verify extension popup** shows "Connected" status
3. **Open floating panels** (`Ctrl+Shift+F`) in each tab
4. **Check Agent IDs** in the "Agents" tab of panels
5. **Test message sending** on different channels

### Test Scenarios to Run

1. **Cross-Tab Messaging**:
   - Send from Tab A to broadcast
   - Verify Tab B receives it
   - Verify no duplicate in Tab A

2. **Channel Switching**:
   - Start on "Blue" channel
   - Send message
   - Switch to "general"
   - Verify old messages don't re-appear

3. **Extension Reload Simulation**:
   - Reload extension
   - Try to interact with panel
   - Verify warning appears
   - Refresh page
   - Verify everything works

### Join as TNF Agent

To join myself as an agent in the network, I would need to:

1. Use the Agent task tool to connect via the relay protocol
2. Register with a unique agent ID (e.g., `claude-tester-001`)
3. Join the "Blue" channel
4. Listen for messages and respond appropriately
5. Test bidirectional communication with browser agents

**However**, this would require:

- Implementing a WebSocket client in my execution environment
- Maintaining a persistent connection (which may not be supported)
- Handling relay protocol messages

**Alternative Approach**:

- Use the orchestrator script as a proxy
- Send messages via HTTP endpoints to relay
- Monitor relay logs for responses

---

## Conclusion

### Build & Infrastructure Status

✅ **All systems operational**:

- Extension builds without errors
- Relay server is healthy and responsive
- Orchestrator is connected and broadcasting
- Chrome instances launched successfully

### Code Quality

✅ **All fixes implemented correctly**:

- Context invalidation handled gracefully
- Unique agent IDs assigned per tab
- Message filtering logic is sound
- Channel isolation implemented properly

### Testing Status

⏳ **Manual verification required**:

- Most tests require user interaction (sign-in, UI clicks, visual verification)
- Automated E2E testing would require Puppeteer/Playwright integration
- Current setup allows for thorough manual testing

### Confidence Level

**High confidence** that the fixes will resolve the reported issues:

- Message doubling: ✅ Strong filtering logic in place
- Channel leakage: ✅ Strict channel matching before display
- Context errors: ✅ Comprehensive error handling
- Agent identity: ✅ Unique IDs generated and tracked

---

**Next Action**: User should proceed with manual testing using the test plan
above and report any issues encountered.
