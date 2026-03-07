# Browser Hub Access Workflow

## Overview

This document describes how to access and control the TNF Browser Hub Electron
app for screenshots, navigation, and testing.

## CRITICAL: Local vs Production Viewing

### For Faster Development Iteration:

- **LOCAL**: `http://localhost:3000/` - See code changes IMMEDIATELY
- **PRODUCTION**: `https://thenewfuse.com/` - Takes several minutes to deploy
  after pushing to GitHub

### When to Use Each:

| Scenario                   | URL to Use                             |
| -------------------------- | -------------------------------------- |
| Testing new code changes   | `http://localhost:3000/` (LOCAL)       |
| Verifying deployed changes | `https://thenewfuse.com/` (PRODUCTION) |
| Debugging layout issues    | `http://localhost:3000/` (LOCAL)       |
| Final QA before release    | `https://thenewfuse.com/` (PRODUCTION) |

### Starting the Local Dev Server:

```bash
cd apps/frontend && pnpm dev
# Server runs at http://localhost:3000/
```

## Prerequisites

1. The Electron app must be running with remote debugging enabled on port 9222
2. The app is configured with `remote-debugging-port=9222` in
   `apps/electron-desktop/src/main/main.ts`

## Method 1: Browser Subagent (Preferred)

The browser_subagent can access the running Electron app by:

### ✅ Correct Approach

1. **List existing pages first**: Use `list_browser_pages` to find pages
2. **Capture screenshots of existing pages**: Use `capture_browser_screenshot`
   with the PageID
3. **Do NOT try to open new URLs**: The `open_browser_url` tool may fail with
   CDP conflicts

### ❌ Incorrect Approach

- Don't use `open_browser_url` as the first step - it may fail with "Protocol
  error: Target.createTarget: Not supported"

### Example Task Description for Subagent:

```
Take a screenshot of the current browser state. First list browser pages using
list_browser_pages, then find the TNF Browser Hub page, and use capture_browser_screenshot
with that PageID. Return after capturing the screenshot.
```

## Method 2: Direct CDP Script

If the subagent fails, use a direct Node.js script:

```javascript
const { chromium } = require('playwright');

async function screenshotBrowserHub() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();

  for (const context of contexts) {
    for (const page of context.pages()) {
      if (page.url().includes('browser-hub')) {
        await page.screenshot({ path: 'screenshot.png', fullPage: false });
        console.log('Screenshot saved');
        break;
      }
    }
  }
  await browser.close();
}
screenshotBrowserHub();
```

Run from: `/apps/electron-desktop/` directory with Playwright available.

## Browser Hub Structure

The Browser Hub uses:

- **iframe** (not webview) to display websites
- **#addressBar** input for URL navigation
- **Sidebar** with navigation controls

### Key Page IDs (may change on restart):

- Browser Hub: Look for URL containing `browser-hub`
- Loaded site: Check iframe's `src` attribute

## Troubleshooting

### "Target.createTarget: Not supported" Error

- This happens when trying to create new tabs in the Electron app
- Solution: Use existing pages instead of trying to create new ones
- Check: `curl http://localhost:9222/json/list` to see available pages

### CDP Connection Issues

- Ensure no other Chrome instances are competing for port 9222
- Restart the Electron app if needed
- Verify: `curl http://localhost:9222/json/version`

## Navigation in Browser Hub

To navigate the embedded iframe to a different URL:

1. Access the Browser Hub page
2. Modify the iframe src:
   `document.querySelector('iframe').src = 'https://example.com'`
3. Or use the address bar input element

---

_Last Updated: 2024-12-16_
