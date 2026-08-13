# Verified Doc: Antigravity DevTools Setup

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1777320503.3656876

## Content

# Antigravity Chrome DevTools Protocol Setup

> **Replaces** the following historical root-level files:
>
> - `QUICK_FIX_LIVE_VIEW.md`
> - `ANTIGRAVITY_DEVTOOLS_SETUP.md`
> - `SETUP_COMPLETE.md`
>
> **Infrastructure note**: The original deployment targeted CloudRuntime
> (`*.thenewfuse.com`). TNF has since migrated to **GCP Cloud Run + Cloudflare +
> Supabase + Upstash**. Replace all `https://<your-cloud-run-backend-url>`
> placeholders with the current Cloud Run endpoint (see
> `CLOUD_MIGRATION_BLUEPRINT.md`).

---

## Problem

Socket.IO broadcasting showed one screenshot then froze — CloudRuntime's edge proxy
dropped WebSocket connections after the first message. No console access, no
network visibility, no performance data.

## Solution

Bypass Socket.IO entirely. Expose Chrome DevTools Protocol (CDP) on port 9222
and let Antigravity connect directly to the browser via the Chrome DevTools MCP
server.

```
OLD (Broken):
Audit Bot → Screenshot → Socket.IO → Edge Proxy ❌ → Live View stuck

NEW (Working):
Audit Bot → Chrome Browser → CDP (Port 9222) → Antigravity MCP → Real-time access
```

---

## Implementation

### 1. Expose Browser DevTools Port

In `apps/cloud-sandbox/src/server.ts`, add `--remote-debugging-port=9222` to the
Chromium launch args:

```typescript
browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=9222',
  ],
});
```

### 2. Add Browser Info API Endpoint

Add to `apps/cloud-sandbox/src/server.ts`:

```typescript
app.get('/api/browser/devtools', async (_req, res) => {
  try {
    const b = await getBrowser();
    const wsEndpoint = b.wsEndpoint();
    res.json({
      success: true,
      status: 'Browser is running with Chrome DevTools Protocol enabled',
      cdpPort: 9222,
      wsEndpoint,
      capabilities: [
        'Console messages',
        'Network requests',
        'Screenshots',
        'Performance traces',
        'Script evaluation',
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 3. Deploy and Verify

```bash
git add apps/cloud-sandbox/src/server.ts
git commit -m "feat(sandbox): expose Chrome DevTools Protocol for Antigravity integration"
git push
```

After deployment completes, verify:

```bash
curl https://<your-cloud-run-backend-url>/api/browser/devtools
```

Expected response:

```json
{
  "success": true,
  "status": "Browser is running with Chrome DevTools Protocol enabled",
  "cdpPort": 9222,
  "capabilities": [
    "Console messages",
    "Network requests",
    "Screenshots",
    "Performance traces",
    "Script evaluation"
  ]
}
```

### 4. Configure Antigravity MCP

In `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Restart Antigravity to load the MCP server.

### 5. Connect

```
"Connect to the browser at https://<your-cloud-run-backend-url> and show me what it's viewing"
```

---

## Skills

All skills are in `.agent/skills/chrome-devtools/`.

| Skill               | Command              | Description                                          | Tools                                                                                         |
| ------------------- | -------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Console Debugger    | `/console-debug`     | View logs/errors/warnings; run JS                    | `list_console_messages`, `get_console_message`, `evaluate_script`                             |
| Performance Monitor | `/performance-trace` | Record traces; Core Web Vitals; emulate slow devices | `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `emulate` |
| Network Analyzer    | `/network-debug`     | Inspect HTTP requests, headers, timing               | `list_network_requests`, `get_network_request`                                                |
| Browser Automation  | `/browser-automate`  | Click, fill, navigate, screenshot                    | `click`, `fill`, `hover`, `press_key`, `navigate_page`, `take_screenshot`, etc.               |
| Master Diagnostic   | `/devtools`          | Full diagnostic combining all features               | All of the above                                                                              |

---

## Available Tools (26)

| Category                | Tools                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Console & Debugging (3) | `list_console_messages`, `get_console_message`, `evaluate_script`                             |
| Performance (4)         | `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `emulate` |
| Network (2)             | `list_network_requests`, `get_network_request`                                                |
| Browser Interaction (8) | `click`, `fill`, `fill_form`, `hover`, `press_key`, `drag`, `upload_file`, `handle_dialog`    |
| Navigation (6)          | `navigate_page`, `new_page`, `list_pages`, `select_page`, `close_page`, `wait_for`            |
| Visual (3)              | `take_screenshot`, `take_snapshot`, `resize_page`                                             |

---

## Workflow Examples

### Monitor an Audit in Real-Time

```bash
node apps/cloud-sandbox/scripts/audit_website.js
```

Then in Antigravity:

```
"Show me what the audit bot is viewing right now"
```

Antigravity will list pages, take a screenshot, check console messages, and list
network requests.

### Debug a Specific Page

```
"Navigate the browser to thenewfuse.com/about and tell me if there are any errors"
```

### Performance Analysis

```
"Start a performance trace and show me Core Web Vitals for the current page"
```

### Script Evaluation

```
"Evaluate in the browser: document.querySelectorAll('a').length"
```

---

## Comparison: Socket.IO vs CDP

| Feature                  | Socket.IO Broadcast (Old) | Chrome DevTools CDP (New)     |
| ------------------------ | ------------------------- | ----------------------------- |
| Screenshots              | 1 only                    | Unlimited on demand           |
| Console Access           | None                      | Full (logs/errors/warnings)   |
| Network Monitoring       | None                      | All requests with timing      |
| Performance Profiling    | None                      | Full traces + Core Web Vitals |
| Script Evaluation        | None                      | Run JS in browser             |
| Edge Proxy Compatibility | Drops after 1 message     | Standard HTTP/WS — reliable   |
| Browser Automation       | None                      | Click, type, navigate         |

---

## Troubleshooting

**"Cannot connect to browser"** Verify the endpoint is responding:

```bash
curl https://<your-cloud-run-backend-url>/api/browser/devtools
```

If 500, the browser isn't initialized yet — run the audit script or navigate to
a page first.

**"No tools available"** Restart Antigravity to load the Chrome DevTools MCP
server from config.

**"Screenshots not working"** Prompt explicitly: "Use the `take_screenshot` tool
to capture the current page."

---

## Testing Checklist

- [ ] Endpoint responds:
      `curl https://<your-cloud-run-backend-url>/api/browser/devtools`
- [ ] Antigravity restarted
- [ ] Connection works: "Connect to the browser and show me what it's viewing"
- [ ] Screenshot works: "Take a screenshot"
- [ ] Console works: "Show me console messages"
- [ ] Audit monitored in real-time from Antigravity

## Skill Documentation

- `.agent/skills/chrome-devtools/QUICK_START.md` — 5-minute quick start
- `.agent/skills/chrome-devtools/console-debugger.md` — Console access
- `.agent/skills/chrome-devtools/performance-monitor.md` — Performance profiling
- `.agent/skills/chrome-devtools/network-analyzer.md` — Network debugging
- `.agent/skills/chrome-devtools/browser-automation.md` — Browser control
- `.agent/skills/chrome-devtools/README.md` — Master guide

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
