# DevTools Integration for Live View

## Problem Statement

The current Live View system using Socket.IO screenshot broadcasting is unreliable on CloudRuntime due to:
1. WebSocket connection instability through CloudRuntime's edge proxy
2. Screenshots only showing once and then failing
3. No real-time console visibility
4. Complex polling/websocket fallback logic

## Solution: Chrome DevTools Protocol (CDP) Integration

Instead of broadcasting screenshots via Socket.IO, we'll expose CloudRuntime browsers via the Chrome DevTools Protocol,
allowing **Antigravity to connect directly using the Chrome DevTools MCP server**.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   Antigravity   │◄───────►│ DevTools Bridge  │◄───────►│ CloudRuntime Browser│
│  (Local/Cloud)  │  MCP    │  (CloudRuntime Cloud) │   CDP   │   (Playwright) │
└─────────────────┘         └──────────────────┘         └────────────────┘
        │                            │
        │                            │
        ▼                            ▼
  Chrome DevTools              Port 9223/HTTP
   MCP Server               REST API for discovery
```

## Benefits

1. **Native Chrome DevTools Access**: Antigravity gets full console, network, performance access
2. **No Screenshot Broadcasting**: Real-time visual updates via CDP
3. **Stable HTTP/REST**: Browser discovery via simple HTTP API
4. **CloudRuntime Compatible**: Uses standard HTTP + WebSocket (with proper CDP handling)
5. **Multiple Browsers**: Support for multiple concurrent browser instances

## Implementation Steps

### 1. Add DevTools Bridge Service

File: `apps/cloud-sandbox/src/services/devtools-bridge.ts` ✅ CREATED

This service:
- Manages multiple browser instances
- Connects to each via CDP
- Exposes WebSocket server for Antigravity
- Broadcasts console/network/page events
- Provides screenshot and script evaluation

### 2. Update server.ts

Add these sections:

#### A. Import DevTools Bridge

```typescript
import { DevToolsBridge } from './services/devtools-bridge';
```

#### B. Initialize DevTools Bridge

```typescript
// After Express app initialization
const devToolsBridge = new DevToolsBridge(9223);
console.log('[DevTools] Bridge initialized on port 9223');
```

#### C. Register browser when launched

```typescript
// In getBrowser() function, after browser.launch():
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    console.log('🌐 Launching headless Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--remote-debugging-port=9222', // ← Add this
      ],
    });

    // Register with DevTools Bridge
    const wsEndpoint = browser.wsEndpoint();
    await devToolsBridge.registerBrowser('main-browser', wsEndpoint, 'audit-bot');
    console.log('[DevTools] Browser registered:', wsEndpoint);
  }
  return browser;
}
```

#### D. Add API endpoints for browser discovery

```typescript
// Add after existing routes

/**
 * Get list of active browsers with their DevTools endpoints
 */
app.get('/api/devtools/browsers', (_req, res) => {
  const browsers = devToolsBridge.getBrowsers();
  res.json({
    success: true,
    browsers: browsers.map(b => ({
      id: b.id,
      status: b.status,
      agentType: b.agentType,
      lastActivity: b.lastActivity,
      // Don't expose full wsEndpoint for security
      available: b.status === 'active'
    }))
  });
});

/**
 * Get WebSocket endpoint for a specific browser (for Antigravity MCP)
 */
app.get('/api/devtools/browsers/:id/endpoint', (req, res) => {
  const { id } = req.params;
  const endpoint = devToolsBridge.getBrowserEndpoint(id);

  if (!endpoint) {
    return res.status(404).json({
      success: false,
      error: 'Browser not found'
    });
  }

  // For security, only return this to authenticated requests
  // TODO: Add JWT verification here

  res.json({
    success: true,
    browserId: id,
    wsEndpoint: endpoint,
    proxyEndpoint: `wss://${process.env.CLOUD_RUNTIME_PUBLIC_DOMAIN || 'localhost'}/devtools/browser/${id}`
  });
});

/**
 * WebSocket proxy for DevTools Protocol
 * Allows Antigravity to connect without direct CDP access
 */
app.ws('/devtools/browser/:id', async (ws, req) => {
  const { id } = req.params;
  const browser = devToolsBridge.getBrowsers().find(b => b.id === id);

  if (!browser?.cdpClient) {
    ws.close(1008, 'Browser not found');
    return;
  }

  console.log(`[DevTools] Antigravity connected to browser: ${id}`);

  // Forward messages between Antigravity and CDP
  ws.on('message', async (msg) => {
    try {
      const command = JSON.parse(msg.toString());
      // Proxy CDP commands
      // Implementation depends on CDP client library
      console.log('[DevTools] CDP command:', command.method);
    } catch (error) {
      console.error('[DevTools] CDP proxy error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`[DevTools] Antigravity disconnected from browser: ${id}`);
  });
});

/**
 * Take screenshot of a specific browser
 */
app.post('/api/devtools/browsers/:id/screenshot', async (req, res) => {
  const { id } = req.params;

  try {
    const screenshot = await devToolsBridge.takeScreenshot(id);

    if (!screenshot) {
      return res.status(404).json({
        success: false,
        error: 'Browser not found or screenshot failed'
      });
    }

    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 3. Update Audit Script

Modify `apps/cloud-sandbox/scripts/audit_website.js` to notify DevTools Bridge of activity:

```javascript
// After each navigation or action
await fetch('https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/devtools/browsers/main-browser/screenshot', {
  method: 'POST'
});
```

### 4. Configure Antigravity MCP

Update `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "chrome-devtools-tnf": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {
        "BROWSER_WS_ENDPOINT": "https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/devtools/browsers/main-browser/endpoint"
      }
    }
  }
}
```

### 5. Create Helper Script for Endpoint Discovery

File: `~/.gemini/scripts/tnf-devtools-connect.sh`

```bash
#!/bin/bash

# Fetch current CloudRuntime browser endpoint
ENDPOINT_JSON=$(curl -s https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/devtools/browsers/main-browser/endpoint)
WS_ENDPOINT=$(echo "$ENDPOINT_JSON" | jq -r '.wsEndpoint')

if [ "$WS_ENDPOINT" = "null" ] || [ -z "$WS_ENDPOINT" ]; then
  echo "Error: Could not fetch browser endpoint"
  exit 1
fi

echo "Connecting to CloudRuntime browser: $WS_ENDPOINT"

# Export for MCP server
export BROWSER_WS_ENDPOINT="$WS_ENDPOINT"

# Launch MCP server
npx -y chrome-devtools-mcp@latest
```

Make executable:
```bash
chmod +x ~/.gemini/scripts/tnf-devtools-connect.sh
```

## Testing

### Test 1: Verify DevTools Bridge

```bash
curl https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/devtools/browsers
```

Expected response:
```json
{
  "success": true,
  "browsers": [
    {
      "id": "main-browser",
      "status": "active",
      "agentType": "audit-bot",
      "lastActivity": "2026-01-10T...",
      "available": true
    }
  ]
}
```

### Test 2: Get Browser Endpoint

```bash
curl https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/devtools/browsers/main-browser/endpoint
```

Expected response:
```json
{
  "success": true,
  "browserId": "main-browser",
  "wsEndpoint": "ws://localhost:9222/devtools/browser/...",
  "proxyEndpoint": "wss://tnf-cloud-sandbox-v2-production.thenewfuse.com/devtools/browser/main-browser"
}
```

### Test 3: Screenshot API

```bash
curl -X POST https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/devtools/browsers/main-browser/screenshot --output screenshot.png
```

Should download a PNG screenshot.

### Test 4: Antigravity Connection

In Antigravity, prompt:

```
"List all available Chrome DevTools browsers from The New Fuse"
```

Expected: Should see `main-browser` listed

```
"Connect to main-browser and show me the console messages"
```

Expected: Should see real-time console output from the CloudRuntime browser

## Usage in Antigravity

Once configured, you can use natural language:

```
"Show me what the audit bot is currently viewing"
→ Uses Chrome DevTools MCP to get screenshot

"What console errors is the browser showing?"
→ Uses list_console_messages tool

"Run this script in the browser: document.title"
→ Uses evaluate_script tool

"Start a performance trace of the current page"
→ Uses performance_start_trace tool
```

## Advantages Over Socket.IO Approach

1. **Reliability**: Uses standard CDP protocol, widely tested
2. **Visibility**: Full DevTools access, not just screenshots
3. **Debugging**: Can inspect console, network, performance in real-time
4. **Scalability**: Easy to add more browsers
5. **CloudRuntime Compatible**: HTTP REST + WebSocket (CDP is designed for this)

## Migration Path

1. Deploy DevTools Bridge (this update)
2. Test browser discovery APIs
3. Configure Antigravity MCP
4. Verify console/screenshot access works
5. Once verified, can remove old Socket.IO broadcasting code
6. Update Live View UI to use DevTools data instead

## Security Considerations

- Add JWT authentication to `/api/devtools/browsers/:id/endpoint`
- Rate limit screenshot API
- Consider IP whitelisting for DevTools connections
- Use HTTPS for all connections in production

## Files Modified

- ✅ `apps/cloud-sandbox/src/services/devtools-bridge.ts` (NEW)
- ⏳ `apps/cloud-sandbox/src/server.ts` (UPDATE - add routes and init)
- ⏳ `apps/cloud-sandbox/package.json` (UPDATE - add chrome-remote-interface)
- ⏳ `~/.gemini/antigravity/mcp_config.json` (UPDATE - add TNF DevTools server)
- ⏳ `~/.gemini/scripts/tnf-devtools-connect.sh` (NEW - helper script)

## Next Steps

Would you like me to:
1. Update `server.ts` with the integration code?
2. Create the helper connection script?
3. Test the browser discovery API?
4. Configure Antigravity to connect?

This approach will give you **real, working live view** with full DevTools capabilities!
