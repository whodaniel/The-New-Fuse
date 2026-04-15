# TNF Inter-LLM Communication System

## Complete Configuration Documentation

**Date:** December 27, 2024  
**Status:** ✅ WORKING - Full bidirectional communication between Claude
(VSCode/Antigravity) ↔ Gemini (Chrome Extension)

---

## 🎯 What We Built

A complete system for AI-to-AI communication:

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  Claude             │         │   TNF Relay      │         │  Gemini             │
│  (Antigravity/      │◄───────►│   (WebSocket)    │◄───────►│  (Chrome Extension) │
│   VSCode)           │         │   Port 3001      │         │                     │
└─────────────────────┘         └──────────────────┘         └─────────────────────┘
         │                              ▲                              │
         │ MCP Protocol                 │                              │ Content Script
         ▼                              │                              ▼
┌─────────────────────┐                 │                    ┌─────────────────────┐
│  Relay MCP Server   │─────────────────┘                    │  SimpleChatBridge   │
│  (relay-mcp-server) │                                      │  (DOM Injection)    │
└─────────────────────┘                                      └─────────────────────┘
```

---

## 📁 File Locations

### Core Files Created/Modified

| File                                                                | Purpose                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/chrome-extension/src/v5/content/adapters/SimpleChatBridge.ts` | **NEW** - Simplified Gemini chat injection and response capture          |
| `apps/chrome-extension/src/v5/content/index.ts`                     | **MODIFIED** - Uses SimpleChatBridge, handles NEW_MESSAGE auto-injection |
| `apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts`  | **MODIFIED** - Removed chatElements dependency for auto-injection        |
| `tools/relay-mcp-server/relay-mcp-server.js`                        | **NEW** - MCP server for Claude to access relay                          |
| `tools/relay-mcp-server/package.json`                               | **NEW** - Package config for MCP server                                  |

### Archived Files (Old Complex Approach)

| File                                                                              | Purpose                         |
| --------------------------------------------------------------------------------- | ------------------------------- |
| `apps/chrome-extension/src/v5/content/adapters/_archive/UniversalChatDetector.ts` | Old complex detector - archived |
| `apps/chrome-extension/src/v5/content/adapters/_archive/SiteConfigs.ts`           | Old site configs - archived     |

---

## 🔧 Key Technical Details

### Gemini DOM Selectors (Updated December 2024)

**Gemini has changed their DOM structure.** The old selectors no longer work.

| Element         | OLD (Broken)                         | NEW (Working)                                             |
| --------------- | ------------------------------------ | --------------------------------------------------------- |
| AI Responses    | `[data-message-author-role="model"]` | `model-response`                                          |
| AI Text Content | N/A                                  | `model-response .markdown`                                |
| User Messages   | `[data-message-author-role="user"]`  | `user-query`                                              |
| Chat Input      | `div.ql-editor`                      | `div.ql-editor.textarea` or `div[contenteditable="true"]` |
| Send Button     | Various                              | `button[aria-label*="Send" i]`                            |

### SimpleChatBridge Key Methods

```typescript
// Find chat elements
findElements(): ChatElements

// Send message to Gemini
sendMessage(text: string): Promise<boolean>

// Get latest AI response
getLastResponse(): string | null

// Count model responses (for polling)
countModelResponses(): number
```

### Message Flow

1. **Claude → Gemini:**
   - Claude uses MCP tool `send_relay_message(channel, content)`
   - Message goes through TNF Relay WebSocket
   - Chrome Extension receives `CHANNEL_MESSAGE`
   - Content script's `NEW_MESSAGE` handler auto-injects via
     `SimpleChatBridge.sendMessage()`
   - Gemini receives and processes the message

2. **Gemini → Claude:**
   - SimpleChatBridge polls for new `model-response` elements
   - When stable response detected, fires `onResponse` callback
   - Content script sends `RESPONSE_COMPLETE` to background
   - Background broadcasts to relay with prefix `[AI → User]`
   - Claude's MCP server receives and queues the message
   - Claude retrieves via `get_relay_messages()`

---

## 🔌 Relay Configuration

### Relay Server

- **URL:** `ws://localhost:3001/ws`
- **Package:** `@the-new-fuse/relay-core`
- **Location:** `packages/relay-core/src/standalone-relay.ts`

### Yellow Channel (Test Channel)

- **ID:** `channel-1766875328020`
- **Name:** Yellow

### Green Channel

- **ID:** `channel-1766881307772`
- **Name:** Green

---

## 📋 MCP Configuration

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
"tnf-relay": {
  "command": "node",
  "args": [
    "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/tools/relay-mcp-server/relay-mcp-server.js"
  ],
  "env": {
    "RELAY_URL": "ws://localhost:3001/ws"
  },
  "disabled": false
}
```

### Available MCP Tools

| Tool                  | Description                           |
| --------------------- | ------------------------------------- |
| `get_relay_messages`  | Get pending messages from relay queue |
| `send_relay_message`  | Send message to a channel             |
| `list_relay_channels` | List available channels               |
| `list_relay_agents`   | List connected agents                 |
| `join_relay_channel`  | Join a channel to receive messages    |

---

## 🚀 How to Start the System

### 1. Start the Relay Server

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
pnpm run relay
# Or: node packages/relay-core/src/standalone-relay.ts
```

### 2. Build and Load Chrome Extension

```bash
cd apps/chrome-extension
pnpm run build:v5
```

Then load `dist-v5` folder in Chrome at `chrome://extensions/`

### 3. Open Gemini & Panel

- Navigate to https://gemini.google.com
- Press `Ctrl+Shift+F` to open Fuse Connect panel
- Join a channel (e.g., Yellow)

### 4. Restart Antigravity

After updating MCP config, restart Antigravity to load the relay MCP server.

---

## 🎮 Testing Commands

### Send message from terminal to Gemini:

```javascript
// Save as test-send.js and run with: node test-send.js
const WebSocket = require('ws');
const YELLOW_CHANNEL_ID = 'channel-1766875328020';

const ws = new WebSocket('ws://localhost:3001/ws');
const agentId = 'test-agent-' + Date.now();

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: agentId,
      payload: {
        agent: {
          id: agentId,
          name: 'Test Agent',
          platform: 'terminal',
          capabilities: ['text'],
          channels: [YELLOW_CHANNEL_ID],
        },
      },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: agentId,
        payload: { channelId: YELLOW_CHANNEL_ID },
      })
    );

    setTimeout(() => {
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: agentId,
          channel: YELLOW_CHANNEL_ID,
          payload: {
            to: 'broadcast',
            content: 'Hello Gemini!',
            messageType: 'text',
          },
        })
      );
      setTimeout(() => ws.close(), 1000);
    }, 300);
  }, 300);
});
```

---

## 🔮 Future Options to Explore

### Option 1: VSCode Extension Direct Integration

**Description:** Modify the existing TNF VSCode extension to listen to the relay
and inject messages directly into the chat input.

**Pros:**

- Most seamless integration
- Messages appear as if user typed them
- No polling required (event-driven)

**Cons:**

- Requires VSCode extension development
- More complex implementation
- May need to understand VSCode Language Model API

**Files to modify:**

- Potential new file in VSCode extension for relay listener
- Would use `vscode.window.showInputBox` or similar to inject

### Option 2: File-Based Message Queue

**Description:** A daemon writes incoming relay messages to a JSON file that
Claude can read.

**Location:** `~/.fuse/incoming_messages.json`

**Pros:**

- Very simple implementation
- Persistent across restarts
- Easy debugging (just view the file)

**Cons:**

- Requires polling
- Disk I/O overhead
- Manual cleanup needed

**Implementation:**

```javascript
// Daemon writes:
fs.writeFileSync('~/.fuse/incoming_messages.json', JSON.stringify(messages));

// Claude reads via file read tool
```

### Option 3: HTTP Webhook to VSCode

**Description:** Use a local HTTP server that VSCode listens to, receiving
webhooks when relay messages arrive.

**Pros:**

- Event-driven (no polling)
- Standard REST API
- Easy to integrate with any tool

**Cons:**

- Requires another server
- Port management

### Option 4: Redis Pub/Sub Integration

**Description:** Use your existing Redis MCP server to receive relay messages.

**Pros:**

- Already have Redis MCP server configured
- Pub/sub is efficient
- Cross-platform

**Cons:**

- Requires relay → Redis bridge
- Additional dependency

---

## 🐛 Troubleshooting

### Messages not appearing in panel

1. Check Chrome extension is loaded (refresh `chrome://extensions/`)
2. Verify relay is running: `curl http://localhost:3001/health`
3. Check browser console for `[FuseConnect]` logs

### Gemini responses not captured

1. Verify Gemini DOM hasn't changed again
2. Check for `model-response` elements in DevTools
3. Look for `[SimpleChatBridge] Response complete!` in console

### Relay connection issues

1. Ensure relay is running on port 3001
2. Check for WebSocket errors in background script console
3. Verify panel shows "connected" status

### MCP server not loading

1. Check path in mcp_config.json is correct
2. Run server manually to test:
   `node tools/relay-mcp-server/relay-mcp-server.js`
3. Check Antigravity logs for MCP errors

---

## 📊 Architecture Summary

```
CURRENT WORKING FLOW:
=====================

1. Claude/Antigravity
   └─► MCP: send_relay_message("channel-xxx", "Hello")
       └─► relay-mcp-server.js
           └─► WebSocket MESSAGE_SEND
               └─► TNF Relay (port 3001)
                   └─► CHANNEL_MESSAGE broadcast
                       └─► Chrome Extension (background.js)
                           └─► Content Script (index.ts)
                               └─► SimpleChatBridge.sendMessage()
                                   └─► Gemini chat input → SEND
                                       └─► Gemini AI Response
                                           └─► SimpleChatBridge polling
                                               └─► onResponse callback
                                                   └─► RESPONSE_COMPLETE
                                                       └─► Background → Relay
                                                           └─► MCP server queue
                                                               └─► Claude: get_relay_messages()
```

---

**Last Updated:** December 27, 2024  
**Author:** Claude (with Daniel Goldberg)
