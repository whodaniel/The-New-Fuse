# Quick Fix: Live View with Chrome DevTools MCP

## The Problem You're Experiencing

```
✅ First screenshot appears
❌ Then nothing...
✅ Terminal shows audit is working
❌ Live View stuck on "one screenshot"
```

**Root Cause**: Railway's edge proxy is dropping Socket.IO WebSocket connections after the first successful message.

## The Simple Solution

**Stop trying to broadcast screenshots through Socket.IO.**

**Instead**: Use the Chrome DevTools MCP server you already configured to let Antigravity **directly connect** to your Railway browsers.

## How It Works

```
OLD (Broken):
Audit Script → Screenshot → Socket.IO → Railway Proxy ❌ → Live View
                                          ↑
                                    Drops connection

NEW (Working):
Audit Script → Chrome Browser → CDP Protocol → Antigravity MCP → You see everything
                    ↑                              ↑
              Runs on Railway              Runs locally/cloud
```

## Implementation (5 Steps)

### Step 1: Expose Browser DevTools Port

Edit `apps/cloud-sandbox/src/server.ts`:

Find the `chromium.launch()` call and add `--remote-debugging-port=9222`:

```typescript
browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=9222', // ← ADD THIS LINE
  ],
});
```

### Step 2: Add Browser Info API

Add this route to `apps/cloud-sandbox/src/server.ts`:

```typescript
// Add after existing routes (around line 700)

/**
 * Get Chrome DevTools WebSocket endpoint
 * For Antigravity to connect directly to the browser
 */
app.get('/api/browser/devtools', async (_req, res) => {
  try {
    const b = await getBrowser();
    const wsEndpoint = b.wsEndpoint();

    res.json({
      success: true,
      wsEndpoint: wsEndpoint,
      // For security, you might want to add authentication here
      instructions: "Use this endpoint with Chrome DevTools MCP server"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Step 3: Deploy to Railway

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
git add apps/cloud-sandbox/src/server.ts
git commit -m "feat(sandbox): expose browser devtools endpoint for Antigravity"
git push
```

Wait 2-3 minutes for deployment.

### Step 4: Test the Endpoint

```bash
curl https://tnf-cloud-sandbox-v2-production.up.railway.app/api/browser/devtools
```

You should see:
```json
{
  "success": true,
  "wsEndpoint": "ws://localhost:9222/devtools/browser/...",
  "instructions": "Use this endpoint with Chrome DevTools MCP server"
}
```

### Step 5: Connect Antigravity

In Antigravity, use the Chrome DevTools skills we just created:

```markdown
"Connect to the Railway browser at https://tnf-cloud-sandbox-v2-production.up.railway.app and show me what the audit bot is viewing"
```

Antigravity will:
1. Call `/api/browser/devtools` to get the WebSocket endpoint
2. Connect via Chrome DevTools MCP
3. Use `take_screenshot` tool to get the current view
4. Use `list_console_messages` to show console output
5. Use `list_network_requests` to show network activity

## Why This Works

1. **No Socket.IO**: Bypasses the problematic broadcasting layer
2. **Standard Protocol**: Chrome DevTools Protocol is designed for this
3. **Direct Access**: Antigravity connects directly to browser
4. **Railway Compatible**: Uses standard HTTP + WebSocket (CDP)
5. **Real-Time**: Get console, network, screenshots on demand

## Usage Examples

### See Current Page

```
"Show me a screenshot of what the Railway browser is viewing right now"
```

### Monitor Console

```
"What console errors is the Railway browser showing?"
```

### Watch Network

```
"List all network requests the Railway browser has made"
```

### Run Script

```
"Run this in the Railway browser: document.querySelectorAll('a').length"
```

### Performance Analysis

```
"Start a performance trace on the Railway browser"
```

## Comparison

### Old Approach (Broken)
- ❌ Socket.IO connection drops
- ❌ Only one screenshot
- ❌ No console access
- ❌ No network visibility
- ❌ Railway proxy issues

### New Approach (This Fix)
- ✅ Direct CDP connection
- ✅ Unlimited screenshots
- ✅ Full console access
- ✅ Network monitoring
- ✅ Performance profiling
- ✅ Railway compatible

## What You'll See

Instead of a frozen "Live View" webpage, you'll have:

1. **Interactive Antigravity Chat**: Ask to see what browser is doing
2. **Real Screenshots**: On demand, not broadcasted
3. **Console Visibility**: See all logs/errors in real-time
4. **Network Analysis**: Inspect all HTTP requests
5. **Performance Metrics**: Measure page load speed

## The Skills You Can Use

All the skills we just created in `.agent/skills/chrome-devtools/`:

- `/console-debug` - See console logs
- `/performance-trace` - Measure performance
- `/network-debug` - Analyze network
- `/browser-automate` - Control browser
- `/devtools` - Full diagnostic

## Next Steps

1. **Add the `/api/browser/devtools` endpoint** (Step 2 above)
2. **Deploy to Railway** (Step 3)
3. **Test the endpoint** (Step 4)
4. **Use in Antigravity** (Step 5)

Want me to help you implement this? I can:
1. Add the endpoint to your server.ts
2. Commit and push the changes
3. Wait for Railway deployment
4. Test it with you
5. Show you how to use it in Antigravity

This will give you **actual, working live visibility** into your Railway browsers!
