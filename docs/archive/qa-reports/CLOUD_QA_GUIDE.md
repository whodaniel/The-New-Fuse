# Running QA Tests from the Cloud

## Overview

The comprehensive QA testing for **thenewfuse.com** runs entirely on CloudRuntime's
cloud infrastructure. You don't need to run anything locally - everything
happens in the cloud and you monitor it via Antigravity.

## 🚀 Quick Start (3 Steps)

### Step 1: Trigger the Cloud QA

You have **3 options** to start the QA test:

#### Option A: Use the Cloud QA Script (Recommended)

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
./scripts/run-cloud-qa.sh
```

This script will:

- ✅ Verify CloudRuntime cloud browser is running
- ✅ Trigger the comprehensive QA test
- ✅ Provide monitoring instructions

#### Option B: Install CloudRuntime CLI and Run Directly

```bash
# Install CloudRuntime CLI (one-time)
npm install -g @cloud_runtime/cli

# Login to CloudRuntime (one-time)
cloud_runtime login

# Link to your project (one-time)
cloud_runtime link

# Run the QA test
cloud_runtime run node apps/cloud-sandbox/scripts/comprehensive_qa.js
```

#### Option C: Trigger via API (Programmatic)

```bash
curl -X POST https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/qa/run \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://thenewfuse.com",
    "config": {
      "maxDepth": 3,
      "maxPagesPerLevel": 10,
      "validateAll": true
    }
  }'
```

### Step 2: Monitor with Antigravity

Once the test is running, open **Antigravity** and use these prompts:

```markdown
"Connect to the CloudRuntime browser and show me what the QA test is currently
viewing"
```

```markdown
"Show me all console errors from the current page being tested"
```

```markdown
"What's the performance of the page currently being tested?"
```

```markdown
"List all network requests from the last page test"
```

### Step 3: Get Auto-Updates

For continuous monitoring:

```markdown
"Monitor the cloud QA test and report updates every 30 seconds with:

- Current page being tested
- Screenshot of current view
- Any errors or issues found
- Performance metrics
- Progress status"
```

## 📋 What the Cloud QA Tests

The comprehensive QA suite automatically tests:

### Pages

- ✅ Homepage (/)
- ✅ All navigation pages
- ✅ All linked pages (up to 3 levels deep)
- ✅ Dynamic routes

### Components

- ✅ **Links** - Validates href, text, external link security
- ✅ **Buttons** - Tests clicks, visibility, accessibility
- ✅ **Forms** - Tests validation, required fields, submission
- ✅ **Images** - Checks loading, alt text, broken images
- ✅ **Navigation** - Verifies menu, breadcrumbs, routing

### Quality Checks

- ✅ **Console Errors** - JavaScript errors and warnings
- ✅ **Performance** - Load time, FCP, LCP, CLS, TBT
- ✅ **Accessibility** - Alt text, ARIA labels, semantic HTML
- ✅ **Security** - External link rel=noopener, XSS prevention
- ✅ **SEO** - Meta tags, headings, structured data

## 🎯 Monitoring Commands for Antigravity

### Real-Time Monitoring

```markdown
"Take a screenshot of what the CloudRuntime browser is viewing right now"
```

```markdown
"Show me the last 10 console messages from the browser"
```

```markdown
"What network requests failed in the last test?"
```

### Status Checks

```markdown
"How many pages have been tested so far?"
```

```markdown
"What issues have been found?"
```

```markdown
"Which pages failed the QA test?"
```

### Deep Debugging

```markdown
"Navigate the CloudRuntime browser to the page that failed and show me why"
```

```markdown
"Run this script in the browser: document.querySelectorAll('.error')"
```

```markdown
"Start a performance trace and analyze the slowest page"
```

## 📊 Understanding the Results

### Test Results are Available:

1. **In Real-Time via Antigravity**
   - Use Chrome DevTools MCP tools
   - Get screenshots, console logs, network data
   - Interactive debugging

2. **In JSON Report**
   - Saved to CloudRuntime at: `/tmp/qa_report_<timestamp>.json`
   - Contains all test details
   - Programmatically accessible

3. **Via API**
   ```bash
   curl https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/qa/status
   ```

### Report Structure

```json
{
  "startTime": "2026-01-11T...",
  "pagesTestedCount": 15,
  "totalIssues": 23,
  "pages": [
    {
      "url": "https://thenewfuse.com/about",
      "passed": false,
      "issues": [
        {
          "severity": "high",
          "type": "broken-image",
          "message": "Broken image: /assets/team.jpg"
        }
      ],
      "performance": {
        "loadTime": 2341,
        "firstPaint": 892
      }
    }
  ],
  "summary": {
    "brokenLinks": [],
    "missingImages": [...],
    "jsErrors": [...],
    "slowPages": [...]
  }
}
```

## 🎓 Example Monitoring Session

```markdown
You: "Start monitoring the cloud QA test for thenewfuse.com"

Antigravity: "✅ Connected to CloudRuntime browser via Chrome DevTools Protocol

**Current Status**:

- Browser: Active
- Page: https://thenewfuse.com (Homepage)
- Test Progress: Page 1/15

**Screenshot**: [Shows homepage fully loaded]

**Console**: 0 errors, 2 info messages

**Network**: 24 requests, all successful

**Performance**:

- Load Time: 1.2s ✅
- LCP: 1.8s ✅
- CLS: 0.03 ✅

Test proceeding to /about page..."

[30 seconds later]

"📊 Update: Now testing /about

**Found 2 issues**:

1. ⚠️ Image missing alt text: hero-banner.jpg
2. ❌ Broken image: /assets/team-photo.jpg (404)

**Screenshot**: [Shows /about page with broken image icon]

**Recommendation**: Fix broken image path and add alt text"
```

## 🔧 Configuration

You can customize the QA test by modifying
`apps/cloud-sandbox/scripts/comprehensive_qa.js`:

```javascript
const QA_CONFIG = {
  maxDepth: 3, // How deep to crawl
  maxPagesPerLevel: 10, // Pages to test per level
  testTimeout: 30000, // Timeout per page
  validateForms: true, // Test form validation
  validateLinks: true, // Test all links
  validateImages: true, // Check image loading
  validateButtons: true, // Test button clicks
  validatePerformance: true, // Measure load times
};
```

## 🚨 Troubleshooting

### "Cloud browser not accessible"

**Check CloudRuntime deployment**:

```bash
curl https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/browser/devtools
```

If it fails:

1. Visit https://cloud_runtime.app
2. Check service: tnf-cloud-sandbox-v2
3. Verify it's running
4. Check logs for errors

### "CloudRuntime CLI not found"

Install it:

```bash
npm install -g @cloud_runtime/cli
cloud_runtime login
cloud_runtime link
```

### "Antigravity can't connect"

1. Verify Chrome DevTools MCP server is configured in Antigravity
2. Restart Antigravity to reload MCP servers
3. Test with: "List all Chrome DevTools tools"

## 📚 Related Documentation

- **QA Instructions**: `ANTIGRAVITY_QA_INSTRUCTIONS.md` - Complete monitoring
  guide
- **DevTools Setup**: `ANTIGRAVITY_DEVTOOLS_SETUP.md` - CDP integration details
- **QA Script**: `apps/cloud-sandbox/scripts/comprehensive_qa.js` - Test
  implementation

## ✅ Benefits of Cloud QA

1. **No Local Resources** - Runs entirely on CloudRuntime
2. **Real-Time Monitoring** - See exactly what's happening via Antigravity
3. **Comprehensive** - Tests everything automatically
4. **Repeatable** - Run anytime with one command
5. **Accessible** - Results available via API, Antigravity, or JSON
6. **Production-Like** - Tests in cloud environment similar to production

## 🎉 You're Ready!

Run the QA test and monitor it with Antigravity:

```bash
./scripts/run-cloud-qa.sh
```

Then in Antigravity:

```markdown
"Monitor the cloud QA test and keep me updated every 30 seconds"
```

That's it! The QA runs in the cloud, and you watch it work in real-time. 🚀
