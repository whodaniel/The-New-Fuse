# TNF Relay Communication - Working Solution

## Status: ✅ FULLY FUNCTIONAL

**Date:** December 27, 2024  
**Solution:** File-based message queue with daemon listener

---

## Architecture

```
Claude (Antigravity) ←→ TNF Relay ←→ Gemini (Chrome Extension)
         ↓                                      ↓
    Send via script                    SimpleChatBridge
         ↓                                      ↓
    Check messages file            Auto-inject & capture
```

---

## Components

### 1. Relay Listener Daemon

**File:**
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/tools/relay-listener-daemon.js`

**Purpose:** Continuously listens to relay and writes messages to file

**Start:**

```bash
nohup node /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/tools/relay-listener-daemon.js > /tmp/relay-daemon.log 2>&1 &
```

**Check status:**

```bash
ps aux | grep relay-listener-daemon | grep -v grep
tail -f /tmp/relay-daemon.log
```

**Message file:** `~/.fuse/relay_messages.json`

### 2. Message Checker Script

**File:**
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/tools/check-relay-messages.sh`

**Purpose:** Check for new messages since last check

**Usage:**

```bash
# Check for new messages
./tools/check-relay-messages.sh

# Check and clear
./tools/check-relay-messages.sh --clear
```

### 3. Send Message Script

**Template:**

```bash
node -e "
const WebSocket = require('ws');
const CHANNEL_ID = 'channel-1766875328020'; // Yellow

const ws = new WebSocket('ws://localhost:3001/ws');
const agentId = 'claude-' + Date.now();

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'AGENT_REGISTER',
    source: agentId,
    payload: { agent: { id: agentId, name: 'Claude', platform: 'terminal', capabilities: ['text'], channels: [CHANNEL_ID] } }
  }));

  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'CHANNEL_JOIN', source: agentId, payload: { channelId: CHANNEL_ID } }));

    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'MESSAGE_SEND',
        source: agentId,
        channel: CHANNEL_ID,
        payload: { to: 'broadcast', content: 'YOUR MESSAGE HERE', messageType: 'text' }
      }));
      setTimeout(() => ws.close(), 1000);
    }, 300);
  }, 300);
});

ws.on('close', () => process.exit(0));
"
```

---

## Channels

| Name    | ID                      | Purpose              |
| ------- | ----------------------- | -------------------- |
| Yellow  | `channel-1766875328020` | Primary test channel |
| Green   | `channel-1766881307772` | Secondary channel    |
| General | `general`               | Default channel      |

---

## Workflow

### Sending a Message to Gemini

1. Use the send script template above
2. Replace `YOUR MESSAGE HERE` with your message
3. Run the script
4. Message will be injected into Gemini and sent automatically

### Receiving Gemini's Reply

1. Wait ~5-10 seconds for Gemini to respond
2. Run: `./tools/check-relay-messages.sh`
3. New messages will be displayed
4. Optionally add `--clear` to clear after reading

---

## Autonomous Operation

### Current State

- ✅ Daemon runs continuously
- ✅ Messages are captured reliably
- ✅ Can check messages on demand
- ⚠️ MCP server not loading in Antigravity (known issue)

### For Full Autonomy

**Option A: Periodic Polling** Add to workflow: Check messages after every
interaction

**Option B: System Service (launchd)** Create a LaunchAgent to:

- Start daemon on boot
- Restart if it crashes
- Optional: Trigger notification on new messages

**Option C: Continue MCP Troubleshooting** Work with Antigravity team or wait
for updates

---

## Troubleshooting

### Daemon not running

```bash
ps aux | grep relay-listener-daemon
# If not running:
nohup node tools/relay-listener-daemon.js > /tmp/relay-daemon.log 2>&1 &
```

### No messages appearing

1. Check daemon is running
2. Check relay is running: `curl http://localhost:3001/health`
3. Check Chrome extension is connected
4. Check daemon log: `tail -f /tmp/relay-daemon.log`

### Messages not clearing

```bash
# Manual clear:
echo "[]" > ~/.fuse/relay_messages.json
rm ~/.fuse/last_message_check
```

---

## Testing

### Full Round-Trip Test

1. **Start daemon** (if not running)
2. **Send test message:**
   ```bash
   # Use send script with: "Test message at [current time]"
   ```
3. **Wait 10 seconds**
4. **Check for reply:**
   ```bash
   ./tools/check-relay-messages.sh
   ```
5. **Verify:**
   - Your message appears
   - Gemini's response appears with `[AI → User]` prefix

---

## Known Issues

1. **MCP Server Not Loading**
   - Antigravity has strict requirements
   - File-based solution works as alternative
   - Continue investigating with Gemini's suggestions

2. **Daemon Stops Occasionally**
   - Relay disconnections
   - Solution: Monitor and restart as needed
   - Future: Set up as system service

3. **Message History**
   - Daemon only captures messages while running
   - Relay doesn't store history
   - Solution: Keep daemon running continuously

---

## Future Enhancements

1. **System Service Setup**
   - Create launchd plist
   - Auto-start on boot
   - Auto-restart on failure

2. **Notification System**
   - Desktop notifications for new messages
   - Integration with Antigravity notifications

3. **Message Persistence**
   - Database storage
   - Message search/filter
   - Conversation threading

4. **Multi-Agent Support**
   - Support multiple AI agents
   - Agent-specific channels
   - Message routing logic

---

**Last Updated:** December 27, 2024  
**Status:** Production Ready ✅
