# Chrome DevTools Network Analyzer

**Slash Command**: `/network-debug` or `/devtools-network`

**Category**: Network Debugging & Analysis

**Compatible With**: Claude Code, Gemini Antigravity, Any MCP-enabled AI
assistant

---

## Purpose

Comprehensive network traffic analysis using Chrome DevTools Network panel.
Monitor HTTP requests, analyze load times, debug API failures, inspect headers,
and optimize resource loading for web applications.

## Prerequisites

### MCP Server Configuration

Add to your MCP config file:

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

---

## Available Tools

### 1. List Network Requests

**Tool Name**: `list_network_requests`

**Purpose**: Retrieve all network requests made by the page since last
navigation

**Parameters**:

- `includePreservedRequests` (optional, boolean): Include requests from previous
  navigations
- `pageIdx` (optional, integer): Page index for pagination (default: 0)
- `pageSize` (optional, integer): Requests per page (default: 100)
- `resourceTypes` (optional, array): Filter by type:
  `["document", "stylesheet", "image", "script", "xhr", "fetch", "font", "media", "websocket", "other"]`

**Example Usage**:

```markdown
Agent: "List all failed network requests on this page"

Tool Call: { "name": "list_network_requests", "arguments": { "resourceTypes":
["xhr", "fetch"], "pageSize": 50 } }
```

**Use Cases**:

- Debug failed API calls (404, 500 errors)
- Find slow-loading resources
- Analyze third-party requests
- Monitor WebSocket connections
- Identify redundant requests

---

### 2. Get Network Request Details

**Tool Name**: `get_network_request`

**Purpose**: Retrieve detailed information about a specific network request

**Parameters**:

- `reqid` (optional, number): Request ID from `list_network_requests`. If
  omitted, returns currently selected request in DevTools.

**Returns**:

- **Request headers**: All sent headers
- **Response headers**: All received headers
- **Status code**: HTTP status
- **Timing breakdown**: DNS, Connect, SSL, Send, Wait, Receive
- **Request/Response bodies**: Full payloads
- **Initiator**: What triggered this request

**Example Usage**:

```markdown
Agent: "Get full details of request #42 including headers and response body"

Tool Call: { "name": "get_network_request", "arguments": { "reqid": 42 } }
```

**Use Cases**:

- Inspect API response payloads
- Debug CORS errors
- Analyze authentication headers
- Check cache control headers
- Investigate slow request timing

---

## Workflow Examples

### Example 1: Debug Failed API Calls

````markdown
**User Request**: "The login API is returning 401 errors. Find out why."

**Agent Workflow**:

1. Navigate to login page: Tool: navigate_page({ url:
   "http://localhost:3000/login" })

2. Clear previous network logs: Tool: evaluate_script({ function:
   "performance.clearResourceTimings()" })

3. Perform login action: Tool: fill({ uid: "#username", value:
   "test@example.com" }) Tool: fill({ uid: "#password", value: "password123" })
   Tool: click({ uid: "#login-btn" })

4. List all XHR/Fetch requests: Tool: list_network_requests({ resourceTypes:
   ["xhr", "fetch"] })

   Response: [ { id: 1, url: "/api/auth/login", status: 401, method: "POST",
   time: 245 }, { id: 2, url: "/api/user/profile", status: 0, method: "GET",
   time: 0 } ]

5. Get details of failed request: Tool: get_network_request({ reqid: 1 })

   Response: { url: "/api/auth/login", status: 401, method: "POST",
   requestHeaders: { "Content-Type": "application/json", "Authorization":
   "Bearer undefined" // ❌ Problem found! }, responseHeaders: {
   "WWW-Authenticate": "Bearer realm=\"api\"" }, requestBody: { "email":
   "test@example.com", "password": "password123" }, responseBody: { "error":
   "Invalid or missing authentication token" }, timing: { total: 245, dns: 2,
   connect: 12, ssl: 45, send: 1, wait: 180, receive: 5 } }

6. Check console for related errors: Tool: list_console_messages({ types:
   ["error"] })

**Agent Response**: "🔴 **Login Failure Root Cause Found**

**Issue**: 401 Unauthorized Error

**Problem**: The Authorization header is being sent as 'Bearer undefined'
instead of a valid token.

**Details**:

- Request: POST /api/auth/login
- Status: 401 Unauthorized
- Header Issue: Authorization: 'Bearer undefined'
- Response: 'Invalid or missing authentication token'

**Root Cause**: The client is trying to send an auth token before login
(chicken-egg problem). The login endpoint should NOT require authentication.

**Fix Recommendation**: Remove the Authorization header from the login request:

```javascript
// BEFORE (incorrect)
fetch('/api/auth/login', {
  headers: {
    Authorization: `Bearer ${token}`, // ❌ token is undefined
    'Content-Type': 'application/json',
  },
});

// AFTER (correct)
fetch('/api/auth/login', {
  headers: {
    'Content-Type': 'application/json', // ✅ No auth needed for login
  },
});
```
````

**File**: src/api/auth.js:23 **Priority**: Critical - blocks all logins"

````

### Example 2: Find Slow Loading Resources

```markdown
**User Request**: "Page takes forever to load. What's slow?"

**Agent Workflow**:

1. Start performance trace:
   Tool: performance_start_trace({ autoStop: true, reload: true })

2. Wait for trace to complete

3. List all network requests:
   Tool: list_network_requests({ pageSize: 200 })

4. Filter and sort by duration:
   Tool: evaluate_script({
     function: `
       performance.getEntriesByType('resource')
         .filter(r => r.duration > 1000)
         .sort((a, b) => b.duration - a.duration)
         .slice(0, 10)
         .map(r => ({
           url: r.name,
           duration: Math.round(r.duration),
           size: r.transferSize,
           type: r.initiatorType
         }))
     `
   })

   Response:
   [
     { url: "analytics.js", duration: 3421, size: 1245680, type: "script" },
     { url: "hero-image.jpg", duration: 2890, size: 2845120, type: "img" },
     { url: "video.mp4", duration: 2156, size: 8234567, type: "video" }
   ]

5. Get details of slowest request:
   Tool: get_network_request({ reqid: <analytics.js request id> })

   Response:
   {
     url: "https://cdn.analytics.com/analytics.js",
     timing: {
       dns: 245,      // Slow DNS lookup
       connect: 456,  // Slow connection
       ssl: 678,      // Slow SSL handshake
       wait: 1842,    // Slow server response (TTFB)
       receive: 200
     },
     size: 1245680,
     cached: false
   }

**Agent Response**:
"🐌 **Slow Loading Resources Identified**

**Top 3 Bottlenecks**:

1. **analytics.js** (3.4 seconds) 🔴
   - URL: https://cdn.analytics.com/analytics.js
   - Size: 1.2MB
   - Issues:
     * Slow DNS (245ms)
     * Slow TTFB (1.8s)
     * Not cached
   - **Fix**: Load async/defer, consider self-hosting

2. **hero-image.jpg** (2.9 seconds) 🔴
   - Size: 2.8MB (uncompressed)
   - **Fix**: Compress to WebP (~200KB), add lazy loading

3. **video.mp4** (2.2 seconds) ⚠️
   - Size: 8.2MB
   - **Fix**: Use poster image, load on user interaction

**Priority Fixes**:
```html
<!-- BEFORE -->
<script src="https://cdn.analytics.com/analytics.js"></script>
<img src="hero-image.jpg">
<video src="video.mp4" autoplay>

<!-- AFTER -->
<script defer src="/js/analytics.js"></script>  <!-- Self-hosted + defer -->
<img src="hero-image.webp" loading="lazy">      <!-- Compressed + lazy -->
<video src="video.mp4" preload="none">          <!-- No autoload -->
````

**Expected Improvement**:

- Page Load Time: 5.2s → 1.8s (65% faster)
- Data Transferred: 12.3MB → 2.1MB (83% less)"

````

### Example 3: Debug CORS Errors

```markdown
**User Request**: "API calls from localhost are failing with CORS errors"

**Agent Workflow**:

1. Navigate to app:
   Tool: navigate_page({ url: "http://localhost:3000" })

2. Trigger API call:
   Tool: click({ uid: "#fetch-data-btn" })

3. Check console for CORS errors:
   Tool: list_console_messages({ types: ["error"] })

   Response:
   "CORS error: Access to fetch at 'https://api.example.com/data' from origin
    'http://localhost:3000' has been blocked by CORS policy: No
    'Access-Control-Allow-Origin' header is present"

4. List network requests:
   Tool: list_network_requests({ resourceTypes: ["xhr", "fetch"] })

5. Get failed request details:
   Tool: get_network_request({ reqid: <failed request id> })

   Response:
   {
     url: "https://api.example.com/data",
     status: 0,  // Request failed (CORS preflight)
     method: "GET",
     requestHeaders: {
       "Origin": "http://localhost:3000",
       "Accept": "application/json"
     },
     responseHeaders: {
       // ❌ MISSING: "Access-Control-Allow-Origin"
     },
     timing: { total: 0 }  // Request never completed
   }

6. Check if preflight was sent:
   Tool: list_network_requests({})
   Filter for OPTIONS request to same URL

**Agent Response**:
"🚫 **CORS Error Diagnosis**

**Problem**: API request blocked by CORS policy

**Details**:
- Frontend: http://localhost:3000
- API: https://api.example.com/data
- Error: No 'Access-Control-Allow-Origin' header

**What's Happening**:
1. Browser sends OPTIONS preflight request
2. Server doesn't respond with CORS headers
3. Browser blocks the actual GET request

**Server-Side Fix** (add to API server):
```javascript
// Express.js example
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
````

**Temporary Dev Fix** (disable CORS in Chrome):

```bash
# Launch Chrome with CORS disabled (DEVELOPMENT ONLY)
chrome --disable-web-security --user-data-dir=/tmp/chrome-dev
```

**Alternative** (use proxy):

````javascript
// Add to vite.config.js / webpack.config.js
proxy: {
  '/api': {
    target: 'https://api.example.com',
    changeOrigin: true
  }
}
```"
````

---

## Advanced Network Analysis Patterns

### Pattern 1: Waterfall Analysis

```javascript
// Generate visual waterfall timeline
const waterfall = await evaluate_script({
  function: `
    performance.getEntriesByType('resource')
      .map(r => ({
        url: r.name.split('/').pop(),
        start: Math.round(r.startTime),
        duration: Math.round(r.duration),
        size: r.transferSize,
        type: r.initiatorType
      }))
      .sort((a, b) => a.start - b.start)
  `,
});

// Identify blocking chains
const blocking_resources = waterfall.filter(
  (r) => r.start < 1000 && r.type === 'script'
);
```

### Pattern 2: Cache Hit Rate Analysis

```javascript
// Analyze caching effectiveness
const cache_analysis = await evaluate_script({
  function: `
    const resources = performance.getEntriesByType('resource');
    const cached = resources.filter(r => r.transferSize === 0);
    const total = resources.length;

    return {
      total: total,
      cached: cached.length,
      hitRate: ((cached.length / total) * 100).toFixed(1) + '%',
      bytesSaved: cached.reduce((sum, r) => sum + r.decodedBodySize, 0),
      uncached: resources.filter(r => r.transferSize > 0)
        .map(r => ({ url: r.name, size: r.transferSize }))
    }
  `,
});
```

### Pattern 3: Third-Party Resource Audit

```javascript
// Identify and analyze third-party requests
const third_party = await evaluate_script({
  function: `
    const currentOrigin = window.location.origin;
    const resources = performance.getEntriesByType('resource');

    const thirdParty = resources.filter(r => {
      try {
        return new URL(r.name).origin !== currentOrigin;
      } catch {
        return false;
      }
    });

    // Group by domain
    const byDomain = thirdParty.reduce((acc, r) => {
      const domain = new URL(r.name).hostname;
      if (!acc[domain]) acc[domain] = { count: 0, size: 0, duration: 0 };
      acc[domain].count++;
      acc[domain].size += r.transferSize;
      acc[domain].duration += r.duration;
      return acc;
    }, {});

    return Object.entries(byDomain)
      .map(([domain, stats]) => ({ domain, ...stats }))
      .sort((a, b) => b.size - a.size);
  `,
});
```

### Pattern 4: API Performance Monitoring

```javascript
// Track API endpoint performance
const api_performance = await list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
});

const api_analysis = api_performance
  .filter((req) => req.url.includes('/api/'))
  .map((req) => ({
    endpoint: req.url.split('/api/')[1],
    method: req.method,
    status: req.status,
    duration: req.time,
    size: req.size,
  }))
  .reduce((acc, req) => {
    const key = `${req.method} ${req.endpoint}`;
    if (!acc[key]) {
      acc[key] = { calls: 0, totalTime: 0, errors: 0, avgSize: 0 };
    }
    acc[key].calls++;
    acc[key].totalTime += req.duration;
    acc[key].avgSize += req.size;
    if (req.status >= 400) acc[key].errors++;
    return acc;
  }, {});
```

---

## Network Metrics Explained

### Timing Breakdown

```
Total Request Time = DNS + Connect + SSL + Send + Wait (TTFB) + Receive

DNS: Domain name resolution
Connect: TCP connection establishment
SSL: SSL/TLS handshake (HTTPS only)
Send: Time to send request
Wait: Time to first byte (TTFB) - server processing
Receive: Time to download response
```

### Key Metrics

**Time to First Byte (TTFB)**:

- **Good**: < 200ms
- **Needs Improvement**: 200-500ms
- **Poor**: > 500ms
- Measures server response time

**Resource Size**:

- **Images**: < 200KB (compressed)
- **Scripts**: < 100KB per bundle
- **Fonts**: < 100KB total
- **CSS**: < 50KB

**Number of Requests**:

- **Good**: < 50 requests
- **Acceptable**: 50-100 requests
- **Poor**: > 100 requests
- More requests = more overhead

---

## Common Network Issues

### Issue 1: Mixed Content Warnings

```markdown
**Symptom**: Resources fail to load on HTTPS pages

**Check**: Tool: list_console_messages({ types: ["warning"] })

Look for: "Mixed Content: The page at 'https://...' was loaded over HTTPS, but
requested an insecure resource 'http://...'."

**Fix**: Update all HTTP resources to HTTPS
```

### Issue 2: 304 Not Modified (Good!)

```markdown
**Symptom**: Many 304 responses

**Analysis**: Tool: list_network_requests({}) Filter: status === 304

**Interpretation**: This is GOOD! Resources are properly cached. 304 means "not
modified, use cached version"
```

### Issue 3: Redirect Chains

```markdown
**Symptom**: Multiple 301/302 redirects

**Check**: Tool: get_network_request({ reqid: X })

Look for: Request 1: http://site.com → 301 → https://site.com Request 2:
https://site.com → 302 → https://www.site.com Request 3: https://www.site.com →
200

**Impact**: Each redirect adds ~100-200ms latency

**Fix**: Update links to final destination directly
```

---

## Integration with Console & Performance

### Combined Workflow: Full Diagnostic

```markdown
1. **Performance Trace**: performance_start_trace({ autoStop: true, reload: true
   })

2. **Network Analysis**: list_network_requests({})

3. **Console Errors**: list_console_messages({ types: ["error", "warning"] })

4. **Correlate Issues**:
   - Performance: "Slow LCP (4.2s)"
   - Network: "hero.jpg loaded in 3.8s (2.8MB)"
   - Console: "Image loaded without dimensions"

   → Root cause: Large unoptimized image causing layout shift and slow LCP
```

---

## Best Practices

### 1. Clear Network Log Before Testing

```javascript
// Clear previous requests
navigate_page({ url: currentUrl, ignoreCache: true });
```

### 2. Filter by Resource Type

```javascript
// Only analyze specific types
list_network_requests({ resourceTypes: ['script', 'stylesheet'] });
```

### 3. Use Pagination for Large Sites

```javascript
// Get first 100 requests
list_network_requests({ pageSize: 100, pageIdx: 0 });

// Get next 100
list_network_requests({ pageSize: 100, pageIdx: 1 });
```

### 4. Check Request Headers for Auth Issues

```javascript
const request = await get_network_request({ reqid: X });

// Verify auth header
if (!request.requestHeaders.Authorization) {
  console.log('Missing authentication header!');
}
```

---

## Related Skills

- `/console-debug` - Console error analysis
- `/performance-trace` - Performance monitoring
- `/browser-automate` - Automated testing
- `/screenshot-debug` - Visual debugging

---

## References

- [Network Panel Documentation](https://developer.chrome.com/docs/devtools/network/)
- [Resource Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

---

## Version

- **Skill Version**: 1.0.0
- **MCP Server**: chrome-devtools-mcp@latest
- **Last Updated**: 2026-01-10
- **Maintainer**: The New Fuse Team
