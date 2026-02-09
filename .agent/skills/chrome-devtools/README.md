# Chrome DevTools MCP Skills - Complete Suite

**Master Slash Command**: `/devtools` or `/chrome-debug`

**Category**: Browser Development & Debugging

**Compatible With**: Claude Code, Gemini Antigravity, Any MCP-enabled AI assistant

---

## Overview

Complete Chrome DevTools integration for AI assistants, providing direct access to browser debugging, performance analysis, network monitoring, and automation capabilities through the Model Context Protocol (MCP).

This skill suite gives AI agents "superpowers" to:
- 👁️ **See** console errors, warnings, and logs
- ⚡ **Measure** performance metrics and Core Web Vitals
- 🌐 **Monitor** network requests and API calls
- 🤖 **Automate** browser interactions and testing
- 📊 **Analyze** page behavior and bottlenecks
- 🐛 **Debug** web applications like a human developer

---

## 🚀 Quick Start

### 1. Install MCP Server

Add to your MCP configuration file:

**For Gemini Antigravity**: `~/.gemini/antigravity/mcp_config.json`

**For Claude Code**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

### 2. Restart Your AI Assistant

- **Antigravity**: Restart the application
- **Claude Code**: Restart VS Code or Claude Desktop

### 3. Verify Installation

```markdown
Agent: "List all available Chrome DevTools tools"

Tool Call: list_pages()

Response: Should show available browser tabs
```

---

## 📚 Skill Modules

### 1. Console Debugger (`/console-debug`)

**File**: [`console-debugger.md`](console-debugger.md)

**Purpose**: Direct access to Chrome console for error analysis and JavaScript evaluation

**Key Tools**:
- `list_console_messages` - View all console logs, errors, warnings
- `get_console_message` - Deep-dive into specific messages
- `evaluate_script` - Execute JavaScript in the page context

**Best For**:
- Debugging JavaScript errors
- Monitoring application logs
- Testing JavaScript functions in real-time
- Verifying variable states
- Extracting data from the DOM

**Example Usage**:
```markdown
"Check the console for any CORS errors on the login page"
"Evaluate if React is loaded and what version"
"Run this script in the console and show me the result: window.myGlobalVar"
```

---

### 2. Performance Monitor (`/performance-trace`)

**File**: [`performance-monitor.md`](performance-monitor.md)

**Purpose**: Advanced performance profiling and Core Web Vitals analysis

**Key Tools**:
- `performance_start_trace` - Begin performance recording
- `performance_stop_trace` - Stop and analyze trace
- `performance_analyze_insight` - Deep-dive into specific performance issues
- `emulate` - Test under different CPU/network conditions

**Best For**:
- Measuring page load speed
- Analyzing Core Web Vitals (LCP, CLS, TBT)
- Identifying slow scripts and resources
- Finding layout shifts and rendering issues
- Performance regression testing

**Example Usage**:
```markdown
"Start a performance trace and tell me why this page is slow"
"Measure the LCP and CLS scores for the homepage"
"Emulate a slow 3G connection and test load time"
```

---

### 3. Network Analyzer (`/network-debug`)

**File**: [`network-analyzer.md`](network-analyzer.md)

**Purpose**: Comprehensive network traffic analysis and API debugging

**Key Tools**:
- `list_network_requests` - View all HTTP requests
- `get_network_request` - Inspect request/response details
- Network timing analysis
- Resource waterfall visualization

**Best For**:
- Debugging failed API calls
- Analyzing slow network requests
- Inspecting HTTP headers
- Investigating CORS errors
- Monitoring third-party resources
- Cache analysis

**Example Usage**:
```markdown
"Show me all failed network requests on this page"
"Why is the /api/login endpoint returning 401?"
"List all requests that took longer than 1 second"
```

---

### 4. Browser Automation (`/browser-automate`)

**File**: [`browser-automation.md`](browser-automation.md)

**Purpose**: Programmatic browser control and interaction testing

**Key Tools**:
- **Input**: `click`, `fill`, `fill_form`, `hover`, `press_key`, `drag`, `upload_file`
- **Navigation**: `navigate_page`, `new_page`, `list_pages`, `select_page`, `wait_for`
- **Debugging**: `take_screenshot`, `take_snapshot`
- **Emulation**: `emulate`, `resize_page`

**Best For**:
- Automated testing
- Form submission
- Multi-step user flows
- Responsive design testing
- E2E testing
- Screen recording scenarios

**Example Usage**:
```markdown
"Fill out and submit the contact form with test data"
"Open 3 tabs and verify all pages load correctly"
"Test the checkout flow from cart to confirmation"
```

---

## 🎯 Complete Workflow Examples

### Workflow 1: Full Page Diagnostic

**User Request**: "My page isn't working. Find all issues."

**Agent Approach**:

```markdown
1. **Start Performance Trace**
   Tool: performance_start_trace({ autoStop: true, reload: true })

2. **Monitor Console During Load**
   Tool: list_console_messages({ types: ["error", "warning"] })

3. **Analyze Network Requests**
   Tool: list_network_requests({})

4. **Stop Performance Trace**
   Tool: performance_stop_trace()

5. **Deep-Dive Into Issues**:

   **Console Errors Found**:
   - "Uncaught TypeError: Cannot read property 'map' of undefined"
     at dashboard.js:142

   Tool: get_console_message({ msgid: 1 })
   → Stack trace shows data fetch failed before rendering

   **Network Issues Found**:
   - GET /api/data → 404 Not Found
   - 2.8MB hero.jpg loading for 3.2 seconds

   Tool: get_network_request({ reqid: 5 })
   → API endpoint doesn't exist in backend

   **Performance Issues Found**:
   - LCP: 4.2s (threshold: 2.5s)
   - CLS: 0.25 (threshold: 0.1)
   - TBT: 890ms (threshold: 300ms)

   Tool: performance_analyze_insight({
     insightName: "LargestContentfulPaint",
     insightSetId: "trace-001"
   })
   → Large unoptimized hero image causing slow LCP

6. **Generate Diagnostic Report**

   Tool: take_screenshot({ fullPage: true, filePath: "/tmp/issues.png" })

**Agent Response**:

"🔍 **Complete Page Diagnostic**

**🔴 Critical Issues (3)**:

1. **API 404 Error**
   - Endpoint: GET /api/data
   - Error: "Uncaught TypeError: Cannot read property 'map' of undefined"
   - Location: dashboard.js:142
   - Fix: Check backend route configuration, endpoint may be /api/dashboard/data

2. **Slow Page Load (LCP: 4.2s)**
   - Cause: hero.jpg (2.8MB unoptimized image)
   - Loading time: 3.2 seconds
   - Fix: Compress to WebP format (~200KB), add lazy loading

3. **Layout Shift (CLS: 0.25)**
   - Cause: Images loading without dimensions
   - Fix: Add width/height attributes to <img> tags

**⚠️ Warnings (2)**:

1. **High Total Blocking Time (890ms)**
   - Cause: Large analytics.js bundle (450KB)
   - Fix: Load analytics async or defer

2. **Third-party resources (12 requests)**
   - Impact: 1.2s additional load time
   - Fix: Consider self-hosting or removing unused trackers

**Priority Actions**:
1. Fix API endpoint (blocks functionality) ← CRITICAL
2. Optimize hero.jpg (will improve LCP by 60%)
3. Add image dimensions (will eliminate layout shift)

Screenshot: /tmp/issues.png"
```

---

### Workflow 2: E2E Test with Validation

**User Request**: "Test the complete signup flow and verify it works"

**Agent Approach**:

```markdown
1. **Setup Test Environment**
   Tool: emulate({ cpuThrottlingRate: 4, networkConditions: "Fast-3G" })
   Tool: resize_page({ width: 375, height: 667 })  // Mobile viewport

2. **Navigate to Signup**
   Tool: navigate_page({ type: "url", url: "http://localhost:3000/signup" })
   Tool: wait_for({ text: "Create Account", timeout: 5000 })

3. **Get Page Structure**
   Tool: take_snapshot({ verbose: true })

   Response shows:
   - #email-input
   - #password-input
   - #confirm-password-input
   - #terms-checkbox
   - #signup-btn

4. **Fill Signup Form**
   Tool: fill_form({
     elements: [
       { uid: "#email-input", value: "test@example.com" },
       { uid: "#password-input", value: "SecurePass123!" },
       { uid: "#confirm-password-input", value: "SecurePass123!" }
     ]
   })

5. **Accept Terms**
   Tool: click({ uid: "#terms-checkbox" })

6. **Start Monitoring**
   Tool: performance_start_trace({ autoStop: false, reload: false })

7. **Submit Form**
   Tool: click({ uid: "#signup-btn" })

8. **Verify Submission**
   Tool: wait_for({ text: "Welcome", timeout: 10000 })

9. **Check for Errors**
   Tool: list_console_messages({ types: ["error"] })
   Tool: list_network_requests({ resourceTypes: ["xhr", "fetch"] })

10. **Stop Performance Trace**
    Tool: performance_stop_trace()

11. **Verify API Call**
    Tool: get_network_request({ reqid: <signup request> })

    Should show:
    - POST /api/signup
    - Status: 201 Created
    - Response: { "userId": "123", "email": "test@example.com" }

12. **Take Success Screenshot**
    Tool: take_screenshot({ filePath: "/tmp/signup-success.png" })

**Agent Response**:

"✅ **Signup Flow Test - PASSED**

**Test Conditions**:
- Device: Mobile (375x667)
- Network: Fast-3G
- CPU: 4x throttled

**Steps Executed**:
1. ✅ Navigate to signup page
2. ✅ Fill email: test@example.com
3. ✅ Fill password: SecurePass123!
4. ✅ Confirm password match
5. ✅ Accept terms and conditions
6. ✅ Submit form
7. ✅ API call successful (POST /api/signup → 201)
8. ✅ Redirect to welcome page

**Performance Metrics**:
- Form submission time: 1.2s
- API response time: 340ms
- Page transition: 890ms

**Console**: 0 errors, 0 warnings

**Network**:
- POST /api/signup
  - Status: 201 Created
  - Response time: 340ms
  - Payload: { userId: 123, email: test@example.com }

Screenshot: /tmp/signup-success.png

**Verdict**: Signup flow fully functional on mobile with slow network ✅"
```

---

### Workflow 3: Performance Optimization Verification

**User Request**: "I optimized the app. Verify the improvements."

**Agent Approach**:

```markdown
1. **Run BEFORE Baseline** (using git to checkout previous version)

   Tool: performance_start_trace({ autoStop: true, reload: true })

   BEFORE Metrics:
   - LCP: 4.2s
   - CLS: 0.25
   - TBT: 890ms
   - Total Load: 5.8s

2. **Deploy Optimized Version** (user deploys changes)

3. **Run AFTER Test**

   Tool: navigate_page({ type: "reload", ignoreCache: true })
   Tool: performance_start_trace({ autoStop: true, reload: true })

   AFTER Metrics:
   - LCP: 1.6s
   - CLS: 0.06
   - TBT: 180ms
   - Total Load: 2.1s

4. **Analyze Specific Improvements**

   Tool: performance_analyze_insight({
     insightName: "LargestContentfulPaint",
     insightSetId: "after-trace"
   })

   → LCP element now loads in 1.6s (was 4.2s)
   → Image size reduced from 2.8MB to 185KB

5. **Verify Network Changes**

   Tool: list_network_requests({})

   → hero.jpg: 2.8MB → 185KB (93% smaller)
   → analytics.js: Now loaded with defer attribute
   → Reduced total requests: 87 → 42

6. **Check Console for New Issues**

   Tool: list_console_messages({ types: ["error", "warning"] })

   → 0 new errors introduced

**Agent Response**:

"🎉 **Performance Optimization - VERIFIED SUCCESS**

**📊 Metrics Comparison**:

| Metric | Before | After | Improvement | Status |
|--------|--------|-------|-------------|--------|
| **LCP** | 4.2s | 1.6s | **62% faster** | ✅ Now passing |
| **CLS** | 0.25 | 0.06 | **76% better** | ✅ Now passing |
| **TBT** | 890ms | 180ms | **80% faster** | ✅ Now passing |
| **Load Time** | 5.8s | 2.1s | **64% faster** | ✅ Excellent |

**🏆 Core Web Vitals Score**:
- **Before**: 0/3 passing ❌
- **After**: 3/3 passing ✅

**✨ Key Improvements Detected**:

1. **Image Optimization**
   - hero.jpg: 2.8MB → 185KB (93% reduction)
   - Format: JPEG → WebP
   - Impact: -2.6s LCP improvement

2. **JavaScript Optimization**
   - analytics.js now loads with defer
   - Reduced blocking time by 710ms
   - Impact: -80% TBT improvement

3. **Request Optimization**
   - Total requests: 87 → 42 (52% fewer)
   - Total bytes: 4.2MB → 890KB (79% less data)

4. **Layout Stability**
   - All images now have dimensions
   - No layout shift detected
   - Impact: CLS improved from 0.25 to 0.06

**🚀 Performance Grade**: A+ (was F)

**No new errors or warnings introduced** ✅

The optimizations are highly effective and ready for production deployment!"
```

---

## 🛠️ Tool Reference

### Console & Debugging (3 tools)
- `list_console_messages` - View console logs/errors/warnings
- `get_console_message` - Get message details by ID
- `evaluate_script` - Execute JavaScript in page context

### Performance (4 tools)
- `performance_start_trace` - Begin performance recording
- `performance_stop_trace` - Stop recording and get metrics
- `performance_analyze_insight` - Analyze specific performance issues
- `emulate` - Emulate CPU/network conditions

### Network (2 tools)
- `list_network_requests` - List all HTTP requests
- `get_network_request` - Get request details by ID

### Browser Interaction (8 tools)
- `click` - Click element
- `fill` - Fill input field
- `fill_form` - Fill multiple fields
- `hover` - Hover over element
- `press_key` - Press keyboard key
- `drag` - Drag and drop
- `upload_file` - Upload file
- `handle_dialog` - Handle alert/confirm/prompt

### Navigation (6 tools)
- `navigate_page` - Navigate to URL or use browser controls
- `new_page` - Open new tab
- `list_pages` - List all open tabs
- `select_page` - Switch to tab
- `close_page` - Close tab
- `wait_for` - Wait for text to appear

### Snapshots & Screenshots (2 tools)
- `take_screenshot` - Capture page or element screenshot
- `take_snapshot` - Get accessibility tree with element UIDs
- `resize_page` - Resize browser window

**Total**: 26 tools across all categories

---

## 💡 Common Use Cases

### For Developers

- **Debug Production Issues**: See console errors in production environments
- **Performance Tuning**: Measure and optimize Core Web Vitals
- **API Integration**: Debug failed API calls with full request/response inspection
- **Responsive Testing**: Test layouts across different viewport sizes

### For QA Engineers

- **Automated Testing**: Create comprehensive E2E test scenarios
- **Bug Reproduction**: Capture exact state when bugs occur
- **Visual Regression**: Screenshot comparison across deployments
- **Cross-browser Testing**: Verify functionality in different environments

### For Product Managers

- **Performance Reports**: Get objective metrics on user experience
- **Feature Verification**: Confirm features work as expected
- **User Flow Analysis**: Understand actual user interaction patterns
- **Before/After Comparisons**: Validate improvements objectively

---

## 🔧 Configuration Options

### Emulation Profiles

```javascript
// Low-end mobile
{
  cpuThrottlingRate: 6,
  networkConditions: "Slow-3G"
}

// Mid-range mobile
{
  cpuThrottlingRate: 4,
  networkConditions: "Fast-3G"
}

// Desktop
{
  cpuThrottlingRate: 1,
  networkConditions: "Fast-4G"
}
```

### Common Viewport Sizes

```javascript
// Mobile (iPhone SE)
{ width: 375, height: 667 }

// Mobile (iPhone Pro)
{ width: 390, height: 844 }

// Tablet (iPad)
{ width: 768, height: 1024 }

// Desktop
{ width: 1920, height: 1080 }
```

---

## 📖 Best Practices

### 1. Always Start with Snapshot

```javascript
// ✅ Get element IDs before interacting
const snapshot = await take_snapshot();
await click({ uid: "#button-from-snapshot" });
```

### 2. Use wait_for After Navigation

```javascript
// ✅ Ensure page loaded
await navigate_page({ url: "http://site.com" });
await wait_for({ text: "Welcome" });
```

### 3. Monitor Console During Automation

```javascript
// ✅ Check for errors after actions
await click({ uid: "#submit" });
const errors = await list_console_messages({ types: ["error"] });
```

### 4. Take Screenshots for Debugging

```javascript
// ✅ Capture state for later analysis
await take_screenshot({ filePath: "/tmp/state.png" });
```

### 5. Run Multiple Performance Tests

```javascript
// ✅ Get median of 3-5 runs for reliable data
for (let i = 0; i < 5; i++) {
  await performance_start_trace({ autoStop: true, reload: true });
  traces.push(await performance_stop_trace());
}
```

---

## 🐛 Troubleshooting

### MCP Server Not Connecting

```bash
# Test MCP server manually
npx chrome-devtools-mcp@latest --version

# Check browser connection
# Should show active Chrome instance with DevTools port
```

### "Cannot find element" Errors

```javascript
// Solution: Take snapshot first to get correct UIDs
const snapshot = await take_snapshot({ verbose: true });
// Then use UIDs from snapshot
```

### Performance Trace Timeouts

```javascript
// Solution: Increase timeout or use manual control
performance_start_trace({ autoStop: false, reload: true });
wait_for({ text: "Loaded", timeout: 60000 });
performance_stop_trace();
```

### Network Requests Not Captured

```javascript
// Solution: Start monitoring before navigation
navigate_page({ url: "http://site.com", ignoreCache: true });
// Network panel auto-clears on navigation
```

---

## 🔗 Related Resources

### Documentation
- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Web Vitals](https://web.dev/vitals/)

### Individual Skill Guides
- [Console Debugger](console-debugger.md) - `/console-debug`
- [Performance Monitor](performance-monitor.md) - `/performance-trace`
- [Network Analyzer](network-analyzer.md) - `/network-debug`
- [Browser Automation](browser-automation.md) - `/browser-automate`

---

## 📝 Version Information

- **Skill Suite Version**: 1.0.0
- **MCP Server**: chrome-devtools-mcp@latest
- **Supported Browsers**: Chrome, Chromium, Edge
- **Last Updated**: 2026-01-10
- **Maintained By**: The New Fuse Team

---

## 🆘 Support

For issues, questions, or feature requests:

1. Check individual skill documentation files
2. Review the [Chrome DevTools MCP GitHub Issues](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues)
3. Test with `npx chrome-devtools-mcp@latest --help`

---

## 🎯 Quick Command Reference

```markdown
# Console Debugging
/console-debug "Check for JavaScript errors"
/console-debug "Evaluate if jQuery is loaded"

# Performance Analysis
/performance-trace "Measure page load speed"
/performance-trace "Run performance test with slow 3G"

# Network Debugging
/network-debug "Show all failed API calls"
/network-debug "Why is this endpoint returning 404?"

# Browser Automation
/browser-automate "Fill out the contact form"
/browser-automate "Test the login flow"

# Combined Analysis
/devtools "Full diagnostic - check everything"
```

---

**🚀 Ready to give your AI assistant superpowers? Add the Chrome DevTools MCP server and start debugging like never before!**
