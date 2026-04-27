# Message Flow Diagnosis - TNF Chrome Extension

**Date**: 2025-01-13 **Issues**: Message doubling + Channel distribution failure
**Method**: AI Contextual Prompting Pattern applied

---

## User-Reported Issues

1. **Message Doubling**: In browser window 1, the injectable UI showed the
   message twice:

   ```
   Test from browser window 1 on the Gold channel
   Test from browser window 1 on the Gold channel
   ```

2. **Channel Distribution Failure**: The AI response from browser window 1 was
   successfully returned to window 1's injectable UI, but was NOT distributed to
   other members of the Gold channel in their injectable UIs

---

## Phase 1: Query - Understanding Message Flow Architecture 🔍

### Complete Message Flow (User Message)

```
┌─────────────┐
│  Window 1   │
│ (Injectable)│
└──────┬──────┘
       │ User types message
       │
       ▼
   sendMessage() ────────────────────┐
   (FloatingPanel.ts:1497)            │
                                      │
   1. BROADCAST_MESSAGE →            │  3. Add to local messages
      Background (line 1505)          │     {from: 'You', content: '...'}
                                      │     (line 1524-1533)
   2. INJECT_MESSAGE →                │     ❌ THIS CAUSES ISSUE #1
      Background (line 1512)          │
                                      │
                                      │
       ┌──────────────────────────────┘
       │
       ▼
   update() renders UI
   ✅ Message appears ONCE (local copy)


┌──────────────────────────┐
│  Background Service      │
└────────┬─────────────────┘
         │
         │ BROADCAST_MESSAGE received (line 876)
         │
         ▼
     Converts to MESSAGE_SEND
     {
       type: 'MESSAGE_SEND',
       to: 'broadcast',
       channel: 'Gold',
       content: 'Test from...',
       source: this.agentId  // e.g., 'browser-agent-abc'
     }
         │
         │ Sends via WebSocket
         ▼
┌────────────────────┐
│   Relay Server     │
└────────┬───────────┘
         │
         │ Broadcasts to all channel members
         │ (including sender)
         ▼
     MESSAGE_RECEIVE
     {
       from: 'browser-agent-abc',  // ❌ NOT 'You'!
       channel: 'Gold',
       content: 'Test from...',
       ...
     }
         │
         ▼
┌──────────────────────────┐
│  Background Service      │
│  (receives echo)         │
└────────┬─────────────────┘
         │
         │ handleRelayMessage() (line 534)
         │
         ▼
     handleAgentMessage() (line 616)
         │
         ├─ Background deduplication (line 634-643)
         │  Hash: `browser-agent-abc:Test from...:timestamp`
         │  ✅ Passes (new hash, not seen before)
         │
         └─ broadcastToTabs() (line 656)
            Sends NEW_MESSAGE to ALL tabs
                │
                ▼
┌─────────────────────────────────┐
│  Window 1 Injectable            │
│  handleChromeMessage() (line 1704) │
└────────┬────────────────────────┘
         │
         │ NEW_MESSAGE received (line 1714)
         │
         ▼
     Deduplication checks:

     1. isOwnEcho check (line 1721):
        this.myAgentId && msg.from === this.myAgentId

        ❌ FAILS because:
        - msg.from = 'browser-agent-abc'
        - But local message has from: 'You'
        - Not detected as own echo!

     2. Channel filter (line 1731):
        if (msg.channel !== this.currentChannel) skip

        ✅ Passes (channel matches)

     3. Duplicate content check (line 1743):
        m.content === msg.content
        && m.from === msg.from
        && Date.now() - m.timestamp < 2000

        ❌ FAILS because:
        - content matches: 'Test from...' === 'Test from...' ✅
        - from DOESN'T match: 'You' !== 'browser-agent-abc' ❌
        - Duplicate not detected!
         │
         ▼
     ❌ Message added AGAIN (line 1753)
     ❌ update() renders UI
     ❌ Message appears TWICE
```

---

## Issue #1: Message Doubling - Root Cause

### The Problem

**Location**: `FloatingPanel.ts:1497-1534` (`sendMessage()`) and
`FloatingPanel.ts:1714-1755` (`NEW_MESSAGE` handler)

**Root Cause**: Inconsistent `from` field between local optimistic message and
relay echo

```typescript
// Step 1: Local message added immediately (line 1524-1533)
this.messages.push({
  id: Date.now().toString(),
  from: 'You', // ❌ PROBLEM: Hardcoded 'You'
  to: 'AI',
  content,
  timestamp: Date.now(),
  type: 'text',
});
this.update(); // Message appears once

// Step 2: Relay echo comes back with ACTUAL agent ID
// msg.from = 'browser-agent-abc'  // ❌ PROBLEM: Not 'You'!
// msg.content = 'Test from browser window 1 on the Gold channel'

// Step 3: Dedup check (line 1743)
const isDuplicate = this.messages.some(
  (m) =>
    m.content === msg.content && // ✅ Matches
    m.from === msg.from && // ❌ 'You' !== 'browser-agent-abc'
    Date.now() - m.timestamp < 2000
);
// isDuplicate = false ❌

// Step 4: Message added again
this.messages.push(msg); // ❌ DUPLICATE!
```

### Why Previous Fix Didn't Work

The previous fix added `isOwnEcho` check (line 1721):

```typescript
const isOwnEcho = this.myAgentId && msg.from === this.myAgentId;
```

**Problem**: This checks if `msg.from === this.myAgentId` (e.g.,
`msg.from === 'browser-agent-abc'`), which is TRUE for the relay echo.

**BUT**: The check has a flaw - it's checking if the message is from our agent
ID, but it's NOT checking if we already added a local copy with `from: 'You'`!

The `isOwnPlaceholder` check (line 1722-1725) tries to handle this:

```typescript
const isOwnPlaceholder =
  msg.from === 'You' ||
  msg.from === 'Browser Agent' ||
  msg.from?.includes('Browser Agent');
```

But this checks if `msg.from` (the ECHO) is 'You', which it's NOT - the echo has
`from: 'browser-agent-abc'`.

---

## Issue #2: Channel Distribution - Multiple Possible Causes

### Diagnosis Questions

1. **Are both windows on the same channel?**
   - Each window must have `this.currentChannel = 'Gold'` (or same channel ID)
   - Check: Channel selector in each window's panel

2. **Is the channel field preserved in relay echo?**
   - Message sent with `channel: 'Gold'`
   - Does relay echo include `channel: 'Gold'`?
   - Check: Background console logs "Received from relay: MESSAGE_RECEIVE"

3. **Are the windows in the same Chrome instance?**
   - If YES: `broadcastToTabs()` sends to all tabs automatically
   - If NO: Each Chrome instance connects to relay independently

### Channel Message Flow

```
Window 1 sends message
    ↓
Background converts to MESSAGE_SEND
{
  channel: 'Gold',  // ✅ Channel included
  ...
}
    ↓
Relay receives and broadcasts to channel members
    ↓
Background receives MESSAGE_RECEIVE
    ↓
handleAgentMessage() checks (line 625-632):
    if (message.from === this.agentId) {
      if (!message.channel) {
        return; // Skip self-message WITHOUT channel
      }
      // ✅ If HAS channel, continue to broadcastToTabs
    }
    ↓
broadcastToTabs() sends NEW_MESSAGE to ALL tabs
    ↓
Window 2 receives NEW_MESSAGE
    ↓
Channel filter (line 1731-1734):
    if (msg.channel && msg.channel !== this.currentChannel) {
      skip; // ❌ FILTER OUT if not on same channel
    }
```

### Most Likely Cause

**Channel mismatch or channel not selected in receiving window**

If Window 2's panel shows:

- "Sync to: -- None (local only) --"
- OR "Sync to: General" (different channel)

Then the message will be filtered out at line 1731-1734:

```typescript
if (msg.channel && msg.channel !== this.currentChannel) {
  console.log('[FuseConnect] Skipping message for other channel:', msg.channel);
  break; // ❌ Message not displayed in Window 2
}
```

**Verification**:

- Check channel selector in Window 2's panel
- Ensure it shows "Sync to: Gold" (matching Window 1)
- Check browser console for "Skipping message for other channel" logs

---

## Fixes Required

### Fix #1: Message Doubling

**Option A: Use agent ID in local optimistic message**

```typescript
// FloatingPanel.ts:1524-1533
// BEFORE:
this.messages.push({
  id: Date.now().toString(),
  from: 'You', // ❌ Problem
  to: 'AI',
  content,
  timestamp: Date.now(),
  type: 'text',
});

// AFTER:
this.messages.push({
  id: Date.now().toString(),
  from: this.myAgentId || 'You', // ✅ Use actual agent ID
  to: 'AI',
  content,
  timestamp: Date.now(),
  type: 'text',
});
```

**Pros**: Dedup check will work correctly (same `from` value) **Cons**: UI shows
agent ID instead of "You" (less friendly)

**Option B: Improve duplicate detection logic**

```typescript
// FloatingPanel.ts:1743-1750
// BEFORE:
const isDuplicate = this.messages.some(
  (m) =>
    m.content === msg.content &&
    m.from === msg.from && // ❌ Too strict
    Date.now() - m.timestamp < 2000
);

// AFTER:
const isDuplicate = this.messages.some((m) => {
  const contentMatches = m.content === msg.content;
  const timeRecent = Date.now() - m.timestamp < 2000;

  // Check if this is our own echo
  const isOurMessage =
    (m.from === 'You' && msg.from === this.myAgentId) || // Local vs Echo
    m.from === msg.from; // Both same

  return contentMatches && timeRecent && isOurMessage;
});
```

**Pros**: Works with friendly "You" label **Cons**: More complex logic

### Fix #2: Channel Distribution

**Fix A: Ensure channel selection consistency**

```typescript
// When creating/joining a channel, broadcast to all tabs in THIS browser
chrome.storage.local.set({ fuse_current_channel: channelId });

// All tabs should sync their channel selection from storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.fuse_current_channel) {
    this.currentChannel = changes.fuse_current_channel.newValue;
    this.update();
  }
});
```

**Fix B: Add better logging for debugging**

```typescript
// FloatingPanel.ts:1731-1734
if (msg.channel && msg.channel !== this.currentChannel) {
  console.log('[FuseConnect] Skipping message for other channel:', {
    messageChannel: msg.channel,
    myChannel: this.currentChannel,
    panelId: this.panelId,
    content: msg.content.substring(0, 50),
  });
  break;
}
```

**Fix C: Handle case where channel isn't set on echo**

```typescript
// Background/index.ts - when sending MESSAGE_SEND
// Ensure channel is ALWAYS included
if (data.type === 'MESSAGE_SEND') {
  message = {
    id: crypto.randomUUID(),
    type: 'MESSAGE_SEND',
    timestamp: Date.now(),
    source: this.agentId,
    channel: data.channel || 'general', // ✅ Default to 'general' if not specified
    payload: {
      to: data.to,
      content: data.content,
      messageType: data.messageType || 'text',
    },
  };
}
```

---

## Testing Protocol

### Test #1: Verify Message Doubling Fix

1. Open Window 1, connect to relay, join "Gold" channel
2. Send message: "Test 1"
3. **Expected**: Message appears ONCE in Window 1's injectable
4. **Check**: Browser console for dedup logs
5. **Verify**: `this.messages.length` increases by 1, not 2

### Test #2: Verify Channel Distribution

1. Open Window 1, join "Gold" channel
2. Open Window 2 (new tab), join "Gold" channel
3. **Verify**: Both show "Sync to: Gold" in channel selector
4. Send message from Window 1: "Test from W1"
5. **Expected**: Message appears in BOTH Window 1 AND Window 2
6. **Check**: Window 2 console for "NEW_MESSAGE" log
7. **Check**: Window 2 console should NOT show "Skipping message for other
   channel"

### Test #3: Channel Isolation

1. Window 1 on "Gold" channel
2. Window 2 on "General" channel
3. Send message from Window 1
4. **Expected**: Message appears in Window 1 only
5. **Expected**: Window 2 console shows "Skipping message for other channel:
   Gold"
6. This is CORRECT behavior (channel isolation working)

---

## Recommended Implementation Order

1. **Fix #1A**: Use `this.myAgentId` in local optimistic message
   - Simple, immediate fix for doubling
   - Update UI to show "You" as display name but use agent ID internally

2. **Fix #2B**: Add comprehensive logging
   - Helps diagnose channel distribution issues
   - No risk, pure observability

3. **Test both fixes** with 2 browser windows

4. **If distribution still fails**: Implement Fix #2C (default channel)

5. **Polish**: Implement Fix #1B (improved dedup logic) for better UX

---

## Evidence Files

- Source code analysis: `FloatingPanel.ts` lines 1497-1534, 1714-1755
- Background service: `background/index.ts` lines 616-674, 770-782
- User report: "Message doubled" + "Response not distributed to channel members"
- Pattern applied: AI Contextual Prompting (Query → Plan → Execute → Verify →
  Adapt)

---

**Status**: ✅ Root causes identified, fixes designed, ready for implementation
