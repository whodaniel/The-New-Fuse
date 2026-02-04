# Chrome DevTools MCP - Quick Start Guide

## 🚀 Installation (5 minutes)

### Step 1: Add MCP Server

Edit your MCP config file:

**Gemini Antigravity**: `~/.gemini/antigravity/mcp_config.json`

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

### Step 2: Restart AI Assistant

- **Antigravity**: Quit and relaunch
- **Claude Code**: Restart VS Code

### Step 3: Test It

```markdown
Agent: "Take a screenshot of the current page"

Tool Call: take_screenshot({ filePath: "/tmp/test.png" })
```

If it works, you're ready! 🎉

---

## 🎯 Most Common Commands

### Debug Console Errors

```markdown
"Check the console for any errors on this page" "List all console warnings and
errors" "Evaluate this JavaScript: window.myGlobalVar"
```

### Measure Performance

```markdown
"Run a performance trace and show me the Core Web Vitals" "Why is this page
loading so slowly?" "Test page speed with slow 3G network"
```

### Analyze Network

```markdown
"Show me all failed API requests" "Why is the /api/login endpoint returning
401?" "List all requests that took longer than 1 second"
```

### Automate Browser

```markdown
"Fill out and submit the contact form" "Click the login button and verify
success" "Test the signup flow from start to finish"
```

---

## 📊 Complete Diagnostic Flow

```markdown
Agent: "Run a complete diagnostic on this page"

The agent will:

1. ✅ Start performance trace
2. ✅ Monitor console errors
3. ✅ Analyze network requests
4. ✅ Check Core Web Vitals
5. ✅ Take screenshots
6. ✅ Generate comprehensive report

You get:

- Performance metrics (LCP, CLS, TBT)
- Console errors with stack traces
- Failed network requests
- Optimization recommendations
- Before/after comparisons
```

---

## 🛠️ All 26 Available Tools

### Console & Debugging

1. `list_console_messages` - View logs/errors/warnings
2. `get_console_message` - Get message details
3. `evaluate_script` - Run JavaScript

### Performance

4. `performance_start_trace` - Start recording
5. `performance_stop_trace` - Stop and analyze
6. `performance_analyze_insight` - Deep-dive
7. `emulate` - Test slow devices/networks

### Network

8. `list_network_requests` - List all requests
9. `get_network_request` - Inspect request details

### Browser Interaction

10. `click` - Click element
11. `fill` - Fill input
12. `fill_form` - Fill multiple fields
13. `hover` - Hover element
14. `press_key` - Press keyboard key
15. `drag` - Drag and drop
16. `upload_file` - Upload file
17. `handle_dialog` - Handle alert/confirm

### Navigation

18. `navigate_page` - Go to URL
19. `new_page` - Open new tab
20. `list_pages` - List tabs
21. `select_page` - Switch tab
22. `close_page` - Close tab
23. `wait_for` - Wait for text

### Visual

24. `take_screenshot` - Capture page/element
25. `take_snapshot` - Get element IDs
26. `resize_page` - Change viewport

---

## 💡 Pro Tips

### 1. Always Start with Snapshot

```javascript
// Get element IDs before clicking
take_snapshot() → Shows all interactive elements with UIDs
click({ uid: "#button-id-from-snapshot" })
```

### 2. Wait After Navigation

```javascript
navigate_page({ url: 'http://site.com' });
wait_for({ text: 'Page loaded' }); // ← Don't skip this!
```

### 3. Check Console After Actions

```javascript
click({ uid: '#submit' });
list_console_messages({ types: ['error'] }); // Check for errors
```

### 4. Use Full Page Screenshots

```javascript
take_screenshot({ fullPage: true, filePath: '/tmp/page.png' });
```

### 5. Run Multiple Performance Tests

```javascript
// Run 3-5 times for reliable metrics
for (let i = 0; i < 5; i++) {
  performance_start_trace({ autoStop: true, reload: true });
  // Median is more reliable than single run
}
```

---

## 🔥 Real-World Examples

### Example 1: Debug Login Issue

```markdown
User: "Login button isn't working"

Agent workflow:

1. navigate_page to login page
2. take_snapshot to get element IDs
3. fill username and password
4. click login button
5. list_console_messages to check errors
6. get_network_request to check API call

Result: "Found 401 error - Authorization header is 'Bearer undefined'"
```

### Example 2: Performance Report

```markdown
User: "Make my page faster"

Agent workflow:

1. performance_start_trace with reload
2. performance_stop_trace
3. performance_analyze_insight for each issue
4. list_network_requests to find slow resources

Result: "LCP is 4.2s due to 2.8MB unoptimized hero.jpg - compress to WebP"
```

### Example 3: E2E Test

```markdown
User: "Test the checkout flow"

Agent workflow:

1. navigate_page to product page
2. click "Add to Cart"
3. fill_form with shipping info
4. click "Checkout"
5. wait_for confirmation message
6. take_screenshot of success page

Result: "✅ Checkout flow working - order #12345 created"
```

---

## 🐛 Troubleshooting

### "Cannot connect to MCP server"

```bash
# Test manually
npx chrome-devtools-mcp@latest --version

# Check browser is running
# Check firewall isn't blocking port 9222
```

### "Element not found"

```javascript
// Solution: Take snapshot first
take_snapshot({ verbose: true });
// Use exact UIDs from snapshot
```

### "Trace times out"

```javascript
// Solution: Increase timeout or manual control
performance_start_trace({ autoStop: false, reload: true });
wait_for({ text: 'Loaded', timeout: 60000 });
performance_stop_trace();
```

---

## 📚 Documentation

- **Master Guide**: [README.md](README.md)
- **Console Debugging**: [console-debugger.md](console-debugger.md)
- **Performance**: [performance-monitor.md](performance-monitor.md)
- **Network**: [network-analyzer.md](network-analyzer.md)
- **Automation**: [browser-automation.md](browser-automation.md)

---

## 🎓 Learning Path

### Beginner (Week 1)

- Learn `take_screenshot` and `take_snapshot`
- Practice `list_console_messages`
- Try basic `click` and `fill` commands

### Intermediate (Week 2)

- Master `performance_start_trace` / `stop_trace`
- Learn `list_network_requests`
- Practice `fill_form` for multi-field forms

### Advanced (Week 3+)

- Performance optimization workflows
- Complex automation scenarios
- Network debugging with headers
- Multi-tab orchestration

---

## 🚀 Ready to Start?

Try this first command:

```markdown
"Navigate to google.com, take a snapshot, and screenshot the page"
```

If it works, you're all set! 🎉

For detailed documentation, see [README.md](README.md)

For specific features, check the individual skill files.

Happy debugging! 🐛➡️✨
