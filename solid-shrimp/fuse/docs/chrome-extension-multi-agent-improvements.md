# Chrome Extension Multi-Agent Communication Improvements

**Date:** January 15, 2026  
**Session Duration:** ~40 minutes  
**Status:** ✅ Successfully Implemented & Tested

---

## Executive Summary

This session focused on refining the Chrome extension's multi-tab AI
communication system. We achieved **autonomous multi-AI conversation** where two
Gemini instances in separate browser tabs can communicate with each other
through the Fuse Connect federation system, including text exchanges and
coordinated image generation.

---

## Problems Identified & Solved

### 1. Content Script Auto-Injection on All Sites

**Problem:** The extension was injecting its content script on every website
(`<all_urls>`), causing noisy console warnings on non-AI chat sites like
Railway, GitHub, etc.

**Solution:** Changed to targeted injection on known AI chat platforms only,
with on-demand activation for unknown sites.

**Files Modified:**

- `apps/chrome-extension/src/v5/manifest.json`
- `apps/chrome-extension/src/v5/background/index.ts`
- `apps/chrome-extension/src/v5/content/index.ts`

**Changes:**

```json
// manifest.json - Before
"content_scripts": [{ "matches": ["<all_urls>"] }]

// manifest.json - After
"content_scripts": [{
  "matches": [
    "https://gemini.google.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://perplexity.ai/*",
    "https://poe.com/*",
    "http://localhost:*/*",
    "https://thenewfuse.com/*"
  ],
  "all_frames": false,
  "match_about_blank": false
}]
```

**New Feature:** `ACTIVATE_ON_TAB` message handler for programmatic injection on
unknown AI chat sites.

---

### 2. Self-Injection Loop (AI Response Echo)

**Problem:** When Gemini in Window 1 responded, the response was broadcast to
the channel, then re-received by Window 1, and injected back into its own chat
input—creating an infinite loop and "You stopped the response" errors.

**Solution:** Implemented proper Page Agent ID tracking and self-message
detection.

**Files Modified:**

- `apps/chrome-extension/src/v5/content/index.ts`
- `apps/chrome-extension/src/v5/background/index.ts`

**Key Changes:**

```typescript
// content/index.ts - Self-message detection
const senderFromMetadata = msg.metadata?.senderId;
const isSelfMessage =
  msg.from === this.pageAgentId ||
  senderFromMetadata === this.pageAgentId ||
  (senderFromMetadata &&
    this.pageAgentId &&
    senderFromMetadata.includes(this.pageAgentId.split('-')[2]));

if (!isExternalAgent) {
  console.log('[FuseConnect v6] ⏭️ Skipping self-message');
} else {
  // Inject message from external agent
  this.injectMessage(msg.content);
}
```

```typescript
// background/index.ts - Fixed operator precedence bug
// Before (buggy):
const senderId =
  message.senderId || sender.tab?.id
    ? `page-agent-${sender.tab.id}`
    : this.agentId;

// After (fixed):
let senderId = message.metadata?.agentId || message.senderId;
if (!senderId && sender.tab?.id) {
  senderId = `page-agent-${sender.tab.id}`;
}
```

---

### 3. AI Responses Not Being Shared Between Agents

**Problem:** Initially, AI responses were being blocked entirely from injection,
preventing multi-AI conversation.

**Solution:** Refined logic to only skip self-messages, while allowing AI
responses from OTHER agents to be injected.

**Correct Behavior:** | Message Source | Action | |----------------|--------| |
Self-message (from this tab's agent) | ⏭️ Skip | | External agent's user input |
✅ Inject | | External agent's AI response | ✅ Inject (so this AI can
see/respond) |

---

### 4. Send Button Not Being Clicked After Text Input

**Problem:** Text was being entered into the chat input field, but the send
button wasn't being clicked, so the AI never received the message.

**Solution:** Enhanced `sendMessage()` in `SimpleChatBridge.ts`:

**Files Modified:**

- `apps/chrome-extension/src/v5/content/adapters/SimpleChatBridge.ts`

**Key Improvements:**

1. **Re-fetch send button after text input** (it may become enabled only after
   text is entered)
2. **Wait for button to become enabled** (poll up to 10 times)
3. **Multiple click methods** for cross-browser compatibility

```typescript
// Wait for button to be enabled
let attempts = 0;
while (sendButton.hasAttribute('disabled') && attempts < 10) {
  await this.delay(100);
  sendButton = this.findElements().sendButton;
  attempts++;
}

// Click using multiple methods
sendButton.click();
sendButton.dispatchEvent(
  new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  })
);
```

---

### 5. Response Timeout During Image Generation

**Problem:** Gemini's image generation takes longer than 60 seconds, causing the
response watcher to timeout and stop the conversation loop.

**Solution:** Extended timeout and improved response detection.

**Files Modified:**

- `apps/chrome-extension/src/v5/content/adapters/SimpleChatBridge.ts`

**Changes:** | Aspect | Before | After | |--------|--------|-------| | Timeout |
60 seconds | **180 seconds (3 minutes)** | | Stability check | 2 stable polls |
**3 stable polls** | | Media detection | Text only | **Images, videos, canvas,
iframes** | | Timeout behavior | Just error | **Try to capture response before
erroring** |

**New Method:**

```typescript
private checkForMediaContent(): boolean {
  const lastResponse = document.querySelectorAll('model-response').last();
  return (
    lastResponse.querySelector('img') !== null ||
    lastResponse.querySelector('video') !== null ||
    lastResponse.querySelector('canvas') !== null ||
    lastResponse.querySelector('iframe') !== null
  );
}
```

---

## Test Results

### Successful Multi-AI Conversation

**Setup:** Two Gemini tabs (Window 1 and Window 2), both connected to "Channel
Blue"

**Conversation Flow:**

1. User in Window 2: "Test 3 from window 2 on channel Blue"
2. Window 1 Gemini receives, responds with acknowledgment
3. Window 2 Gemini receives Window 1's response, continues discussion
4. Both AIs propose testing rich media (image/video generation)
5. Window 1 Gemini generates a "Test 4 Confirmed" image
6. _(Session documented here - image generation successful)_

**Evidence:** User provided screenshot of generated image showing "TEST 4
CONFIRMED" with Channel Blue branding.

---

## Files Modified Summary

| File                                   | Changes                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `manifest.json`                        | Targeted content script injection, added `scripting` permission         |
| `background/index.ts`                  | Fixed senderId construction, added `ACTIVATE_ON_TAB` handler            |
| `content/index.ts`                     | Added `PING` handler, improved self-message detection, enhanced logging |
| `content/adapters/SimpleChatBridge.ts` | Enhanced send button logic, extended timeout, added media detection     |

---

## Architecture: Multi-Agent Message Flow

```
┌─────────────────┐                    ┌─────────────────┐
│   Window 1      │                    │   Window 2      │
│   (Gemini)      │                    │   (Gemini)      │
│                 │                    │                 │
│ Page Agent:     │                    │ Page Agent:     │
│ page-agent-123  │                    │ page-agent-456  │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ RESPONSE_COMPLETE                    │
         │ {senderId: "page-agent-123"}         │
         │                                      │
         ▼                                      │
┌─────────────────────────────────────────────────────────┐
│                    Background Script                     │
│                                                          │
│  - Receives RESPONSE_COMPLETE from Window 1              │
│  - Broadcasts to all tabs with senderId preserved        │
│  - Window 1 sees its own senderId → SKIPS               │
│  - Window 2 sees external senderId → INJECTS            │
└─────────────────────────────────────────────────────────┘
         │                                      │
         │                                      │
         │ NEW_MESSAGE                          │ NEW_MESSAGE
         │ {from: "page-agent-123"}             │ {from: "page-agent-123"}
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│   Window 1      │                    │   Window 2      │
│                 │                    │                 │
│ isSelfMessage:  │                    │ isExternalAgent:│
│ TRUE → SKIP     │                    │ TRUE → INJECT   │
└─────────────────┘                    └─────────────────┘
```

---

## Future Enhancements

### 1. Media File Transfer

Currently, only text is transferred between agents. For full media support:

- Extract image data (base64 or URL) from AI responses
- Add `attachments` field to message schema
- Handle image paste/upload in receiving chat

### 2. Conversation Continuation

Add a "keep alive" mechanism to prevent conversations from stalling:

- Auto-prompt if no response after X seconds
- Allow human intervention to guide the conversation

### 3. Streaming Response Support

Currently waits for complete responses. Could add:

- Real-time streaming indicator in panel
- Partial response forwarding

---

## Commands for Development

```bash
# Build the extension
cd apps/chrome-extension
npm run build:v5

# The built extension is in dist-v5/
# Load it in Chrome at chrome://extensions/ (Developer mode)
```

---

## Console Debugging

Enable debug mode in any Gemini tab's console:

```javascript
window.__FUSE_DEBUG_SELECTORS = true;
```

Key log messages to look for:

```
[FuseConnect v6] 📨 Message received: {...}
[FuseConnect v6] ⏭️ Skipping self-message: {...}
[FuseConnect v6] ✅ Injecting message from external agent: {...}
[SimpleChatBridge] Clicking send button...
[SimpleChatBridge] Response complete! ...
```

---

## Conclusion

This session achieved a significant milestone: **autonomous multi-AI
conversation** through the Fuse Connect federation system. Two AI instances can
now:

1. ✅ Receive messages from each other
2. ✅ Inject those messages into their chat interface
3. ✅ Send the messages (click send button)
4. ✅ Detect and broadcast their responses
5. ✅ Continue the conversation loop
6. ✅ Handle long-running tasks like image generation

The system is now ready for more advanced use cases like orchestrated
multi-agent workflows, where a human orchestrator can coordinate multiple AI
agents to solve complex problems together.
