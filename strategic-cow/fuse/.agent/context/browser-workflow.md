# Browser Workflow Context

## Complete Browser Operation Workflow

### Phase 1: Pre-Flight Verification

1. **Check Chrome Status**

   ```bash
   python3 .agent/skills/browser-automation/check_browser.py
   ```

   - Exit 0: Chrome running ✅
   - Exit 1: Chrome not running ❌ → Need to open

2. **Open Chrome (if needed)**
   - Use `browser_subagent` tool
   - Task: "Open Chrome and navigate to [URL]"
   - Wait for page load confirmation

### Phase 2: Extension Verification

3. **Confirm Fuse Connect Extension**
   - Check for `BROWSER-MCP-CONTAINER` element in DOM
   - Verify console log: `[SimpleChatBridge] isReady: true`

### Phase 3: Panel Activation

4. **Open Injectable UI**
   - **DO NOT** type into native inputs
   - **Keyboard Shortcut**:
     - Windows/Linux: `Ctrl+Shift+F`
     - Mac: `Command+Shift+F`
   - Wait for floating panel to appear

### Phase 4: Message Injection

5. **Send Message via Panel**
   - Type in the PANEL input (not Gemini's native input)
   - Click Send button in the PANEL
   - Message is auto-injected into Gemini's chat

### Phase 5: Response Capture

6. **Wait for Response**
   - Fuse Connect captures Gemini's response
   - Response is broadcast to relay
   - Check relay messages using MCP tools

## Common Failure Points

### ❌ Mistake #1: Not Checking Chrome Status

**Symptom**: "Cannot connect to browser" errors  
**Fix**: Always run `check_browser.py` first

### ❌ Mistake #2: Typing Directly

**Symptom**: Message not captured by relay  
**Fix**: Use `Ctrl+Shift+F` to open panel

### ❌ Mistake #3: Wrong Browser

**Symptom**: Extension not found  
**Fix**: Ensure Chrome (not Safari/Firefox)

### ❌ Mistake #4: Extension Not Installed

**Symptom**: No `BROWSER-MCP-CONTAINER` in DOM  
**Fix**: Install Fuse Connect extension

## Key Reminders

1. **Always check Chrome first** - Don't assume it's running
2. **Use keyboard shortcut** - `Ctrl+Shift+F` (Windows) / `Cmd+Shift+F` (Mac)
3. **Panel over native** - Injectable UI, not direct typing
4. **Verify extension** - Check for bridge readiness
5. **Wait for responses** - Relay captures take time

## Target URLs

- **Gemini**: `https://gemini.google.com/app`
- **ChatGPT**: `https://chat.openai.com`
- **Claude**: `https://claude.ai`

## Relay Integration

After successful message injection:

- Message is sent to relay channel
- Gemini responds
- Response captured by extension
- Broadcast to relay subscribers
- Check with: `mcp_tnf-relay_get_relay_messages`
