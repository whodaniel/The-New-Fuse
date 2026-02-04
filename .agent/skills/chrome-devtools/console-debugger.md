# Chrome DevTools Console Debugger

**Slash Command**: `/console-debug` or `/devtools-console`

**Category**: Browser Debugging & Analysis

**Compatible With**: Claude Code, Gemini Antigravity, Any MCP-enabled AI
assistant

---

## Purpose

Provides direct access to Chrome DevTools Console for real-time debugging, error
analysis, and JavaScript evaluation. This skill gives AI agents "vision" into
the browser's console logs, errors, warnings, and the ability to execute
JavaScript directly in the page context.

## Prerequisites

### MCP Server Configuration

Add to your MCP config file (`~/.gemini/antigravity/mcp_config.json` or Claude
Desktop config):

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

### Browser Extension (for Antigravity)

Install the [Antigravity Browser Extension](https://chrome.google.com/webstore)
to enable agent interaction with Chrome.

---

## Available Tools

### 1. List Console Messages

**Tool Name**: `list_console_messages`

**Purpose**: Retrieve complete history of console logs, errors, and warnings

**Parameters**:

- `includePreservedMessages` (optional, boolean): Include messages from previous
  page loads
- `pageIdx` (optional, integer): Page index for pagination (default: 0)
- `pageSize` (optional, integer): Number of messages per page (default: 100)
- `types` (optional, array): Filter by message types:
  `["log", "info", "warning", "error", "debug", "trace"]`

**Example Usage**:

```markdown
Agent: "Use the Chrome DevTools MCP to list all console errors on the current
page"

Tool Call: { "name": "list_console_messages", "arguments": { "types": ["error"],
"pageSize": 50 } }
```

**Use Cases**:

- Debug JavaScript errors after page interaction
- Monitor real-time logging during automated testing
- Capture error stack traces for analysis
- Verify that fixes eliminate console warnings

---

### 2. Get Console Message Details

**Tool Name**: `get_console_message`

**Purpose**: Deep-dive analysis of a specific console message by its ID

**Parameters**:

- `msgid` (required, number): The message ID from `list_console_messages`

**Example Usage**:

```markdown
Agent: "Get the full details of console message #42 including stack trace"

Tool Call: { "name": "get_console_message", "arguments": { "msgid": 42 } }
```

**Use Cases**:

- Extract complete stack traces for debugging
- Analyze error context and source locations
- Deep-dive into warning details
- Investigate logged objects and their properties

---

### 3. Evaluate JavaScript in Console

**Tool Name**: `evaluate_script`

**Purpose**: Execute JavaScript code in the browser console and retrieve results

**Parameters**:

- `function` (required, string): JavaScript code to execute
- `args` (optional, array): Arguments to pass to the function

**Example Usage**:

```markdown
Agent: "Check if jQuery is loaded on this page"

Tool Call: { "name": "evaluate_script", "arguments": { "function": "typeof
jQuery !== 'undefined' ? jQuery.fn.jquery : 'not loaded'" } }
```

```markdown
Agent: "Get all event listeners attached to the submit button"

Tool Call: { "name": "evaluate_script", "arguments": { "function":
"getEventListeners(document.querySelector('#submit-btn'))" } }
```

**Advanced Use Cases**:

- Inject debugging code into running applications
- Extract data from the DOM programmatically
- Test JavaScript functions in real-time
- Verify state of application variables
- Trigger custom events for testing

---

## Workflow Examples

### Example 1: Debug Console Errors

```markdown
**User Request**: "The login button isn't working. Check the console for
errors."

**Agent Workflow**:

1. Navigate to the page:
   - Tool: `navigate_page` with URL

2. Attempt the login action:
   - Tool: `fill` (username field)
   - Tool: `fill` (password field)
   - Tool: `click` (login button)

3. Check console for errors:
   - Tool: `list_console_messages` with types: ["error", "warning"]

4. Analyze specific error:
   - Tool: `get_console_message` with msgid from step 3

5. Investigate root cause:
   - Tool: `evaluate_script` to check if required libraries are loaded
   - Tool: `evaluate_script` to verify form validation logic

**Agent Response**: "I found a JavaScript error:
`Uncaught TypeError: Cannot read property 'validate' of undefined` at
login.js:45. The issue is that the validation library failed to load. The script
tag in the HTML has a 404 error for `validator.min.js`."
```

### Example 2: Performance Debugging

```markdown
**User Request**: "Why is my page so slow? Check for performance issues."

**Agent Workflow**:

1. Start performance trace:
   - Tool: `performance_start_trace` with reload: true

2. Wait for page to fully load:
   - Tool: `wait_for` with text: "Dashboard"

3. Stop performance trace:
   - Tool: `performance_stop_trace`

4. Check console for performance warnings:
   - Tool: `list_console_messages` with types: ["warning"]

5. Analyze specific warnings:
   - Tool: `get_console_message` for each warning

6. Run diagnostic scripts:
   - Tool: `evaluate_script`: "performance.getEntriesByType('resource').filter(r
     => r.duration > 1000)"
   - Tool: `evaluate_script`: "document.querySelectorAll('img').length"

**Agent Response**: "The page has 3 performance issues:

1. 47 unoptimized images are being loaded (found via console warning)
2. A 3.2MB JavaScript bundle is blocking render (found via network trace)
3. 12 third-party analytics scripts are running (found via evaluate_script)

Console shows: 'Layout shift detected: CLS score 0.42' which is above
recommended 0.1."
```

### Example 3: Verify Bug Fix

```markdown
**User Request**: "I fixed the cart calculation bug. Verify it's working."

**Agent Workflow**:

1. Navigate to shopping cart:
   - Tool: `navigate_page`

2. Clear previous console messages:
   - Tool: `evaluate_script`: "console.clear()"

3. Add items to cart:
   - Tool: `click` (add to cart buttons)

4. Monitor console during interaction:
   - Tool: `list_console_messages`

5. Verify calculation logic:
   - Tool: `evaluate_script`: "window.cartTotal"
   - Tool: `evaluate_script`: "document.querySelector('.cart-total').innerText"

6. Check for any errors:
   - Tool: `list_console_messages` with types: ["error"]

**Agent Response**: "✅ Bug fix verified! No console errors detected. Cart
calculation is correct:

- Added 3 items: $25.99, $12.50, $8.75
- Subtotal: $47.24 (correct)
- Tax (8%): $3.78 (correct)
- Total: $51.02 (correct)
- Console shows: 'Cart updated successfully' with no errors."
```

---

## Prompting Patterns

### For Claude Code Users

```markdown
"Open the browser agent and check console logs for 404 errors on the dashboard
page"

"Use DevTools to evaluate if React is loaded and what version"

"List all console warnings and errors from the last page navigation"

"Debug why the submit button shows 'undefined' - check console and run
diagnostic scripts"
```

### For Gemini Antigravity Users

```markdown
"Launch browser surface, navigate to localhost:3000, and show me all console
errors"

"Use the Chrome DevTools MCP to evaluate:
document.querySelectorAll('[data-testid]')"

"Check the console messages and tell me if there are any CORS errors"

"Run a script in the console to verify all API endpoints are responding"
```

---

## Integration with Other DevTools Features

### Combined with Network Analysis

```markdown
"Check both console errors AND network 404s to find why images aren't loading"

Uses:

1. list_console_messages (for client-side errors)
2. list_network_requests (for HTTP errors)
```

### Combined with Performance Tracing

```markdown
"Start a performance trace, check console warnings, and identify slow scripts"

Uses:

1. performance_start_trace
2. list_console_messages (types: ["warning"])
3. performance_stop_trace
4. evaluate_script (to analyze performance.timing)
```

### Combined with DOM Inspection

```markdown
"Take a page snapshot, check console, and verify all data-testid attributes
exist"

Uses:

1. take_snapshot
2. list_console_messages
3. evaluate_script (to query DOM)
```

---

## Common Console Patterns

### Pattern 1: Error Stack Trace Analysis

```javascript
// Evaluate this to get detailed error info
evaluate_script({
  function: `
    window.onerror = function(msg, url, line, col, error) {
      return JSON.stringify({
        message: msg,
        source: url,
        line: line,
        column: col,
        stack: error?.stack
      });
    }
  `,
});
```

### Pattern 2: Monitor XHR/Fetch Requests

```javascript
// Inject monitoring code
evaluate_script({
  function: `
    const originalFetch = window.fetch;
    window.fetchLog = [];
    window.fetch = function(...args) {
      window.fetchLog.push({url: args[0], time: Date.now()});
      return originalFetch.apply(this, args);
    }
  `,
});

// Later, retrieve logs
evaluate_script({
  function: 'window.fetchLog',
});
```

### Pattern 3: Check for Memory Leaks

```javascript
evaluate_script({
  function: `
    performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : 'Memory API not available'
  `,
});
```

### Pattern 4: Verify Feature Flags

```javascript
evaluate_script({
  function: `
    Object.keys(window).filter(key =>
      key.includes('feature') ||
      key.includes('flag') ||
      key.includes('config')
    )
  `,
});
```

---

## Best Practices

### 1. Clear Console Before Testing

```javascript
evaluate_script({ function: 'console.clear()' });
```

### 2. Use Pagination for Large Logs

```javascript
list_console_messages({
  pageSize: 50,
  pageIdx: 0, // First 50
});

list_console_messages({
  pageSize: 50,
  pageIdx: 1, // Next 50
});
```

### 3. Filter by Error Types

```javascript
// Only critical errors
list_console_messages({
  types: ['error'],
});

// Development warnings
list_console_messages({
  types: ['warning', 'debug'],
});
```

### 4. Preserve Messages Across Navigation

```javascript
list_console_messages({
  includePreservedMessages: true,
});
```

---

## Troubleshooting

### Issue: "Cannot read console messages"

**Solution**: Ensure Chrome DevTools MCP server is running and connected:

```bash
# Test the MCP server
npx chrome-devtools-mcp@latest --version

# Check if browser is connected
# The tool should show an active Chrome instance
```

### Issue: "evaluate_script returns undefined"

**Solution**: The script may be executing before the page is ready. Use
`wait_for` first:

```javascript
// Wait for page element
wait_for({ text: 'Dashboard' });

// Then evaluate
evaluate_script({ function: 'window.myGlobalVar' });
```

### Issue: "Too many console messages"

**Solution**: Use type filtering and pagination:

```javascript
list_console_messages({
  types: ['error'], // Only errors
  pageSize: 20, // Limit results
});
```

---

## Security Considerations

### Safe Script Execution

- Always validate user input before passing to `evaluate_script`
- Avoid executing code from untrusted sources
- Use JSON.stringify for safe data extraction
- Never expose sensitive data through console logging

### Example: Safe Data Extraction

```javascript
// SAFE: Extract data without executing user code
evaluate_script({
  function: 'JSON.stringify(document.title)',
});

// UNSAFE: Don't do this
evaluate_script({
  function: userProvidedCode, // ❌ Security risk
});
```

---

## Related Skills

- `/performance-trace` - Performance monitoring and analysis
- `/network-debug` - Network request debugging
- `/browser-automate` - Browser automation and interaction
- `/screenshot-debug` - Visual debugging with screenshots

---

## References

- [Chrome DevTools MCP Documentation](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Console API Reference](https://developer.chrome.com/docs/devtools/console/api/)

---

## Version

- **Skill Version**: 1.0.0
- **MCP Server**: chrome-devtools-mcp@latest
- **Last Updated**: 2026-01-10
- **Maintainer**: The New Fuse Team
