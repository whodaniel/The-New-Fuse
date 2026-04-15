# Cloud QA Setup - Complete Guide

## ✅ What's Been Set Up

I've created a complete cloud-based QA testing system for **thenewfuse.com**.
Everything runs on Railway - no local execution needed.

### Files Created:

1. **`scripts/run-cloud-qa.sh`** - Main cloud QA launcher script
2. **`apps/cloud-sandbox/scripts/qa-trigger-api.js`** - API endpoint for remote
   triggering
3. **`CLOUD_QA_GUIDE.md`** - Complete usage documentation

### Existing Infrastructure:

- ✅ `apps/cloud-sandbox/scripts/comprehensive_qa.js` - Full QA test suite
- ✅ `ANTIGRAVITY_QA_INSTRUCTIONS.md` - Monitoring instructions
- ✅ `ANTIGRAVITY_DEVTOOLS_SETUP.md` - Chrome DevTools integration guide

## 🚀 How to Use

### Option 1: Simple Command (When Railway is Running)

```bash
./scripts/run-cloud-qa.sh
```

This automatically:

1. Checks Railway cloud browser status
2. Triggers the comprehensive QA test
3. Provides monitoring instructions

### Option 2: Manual Railway Execution

If you have Railway CLI installed:

```bash
# Install Railway CLI (one-time setup)
npm install -g @railway/cli

# Login and link (one-time setup)
railway login
railway link

# Run QA test
railway run node apps/cloud-sandbox/scripts/comprehensive_qa.js
```

### Option 3: Monitor with Antigravity (Recommended)

Once a QA test is running, use **Antigravity** to monitor it:

```markdown
"Connect to the Railway browser and show me what the QA test is currently
testing"
```

```markdown
"Monitor the cloud QA test and report updates every 30 seconds"
```

```markdown
"Show me all issues found so far in the QA test"
```

## 📋 What the QA Tests

The cloud QA automatically validates:

### Every Page:

- ✅ Navigation and routing
- ✅ All links (internal & external)
- ✅ All buttons and interactive elements
- ✅ Form validation
- ✅ Image loading and alt text
- ✅ Console errors and warnings
- ✅ Performance metrics (LCP, CLS, TBT)
- ✅ Accessibility compliance
- ✅ Security (external links, XSS, etc.)

### Test Scope:

- **Max Depth**: 3 levels from homepage
- **Pages Per Level**: Up to 10 pages
- **Estimated Duration**: 5-10 minutes
- **Total Pages**: ~30 pages

## 🎯 Current Status

### ⚠️ Railway Service Status

The Railway cloud sandbox needs to be deployed and running for the QA tests to
work.

**Check if it's running**:

```bash
curl https://tnf-cloud-sandbox-v2-production.up.railway.app/api/browser/devtools
```

**Expected Response** (when working):

```json
{
  "success": true,
  "status": "Browser is running with Chrome DevTools Protocol enabled",
  "cdpPort": 9222,
  "capabilities": ["Console messages", "Network requests", "Screenshots", ...]
}
```

### If Railway Service is Not Running:

1. **Check Railway Dashboard**:
   - Visit: https://railway.app
   - Check project: The-New-Fuse
   - Find service: `tnf-cloud-sandbox-v2`
   - Verify deployment status

2. **Redeploy if Needed**:

   ```bash
   cd apps/cloud-sandbox
   railway up
   ```

3. **Check Logs**:
   ```bash
   railway logs
   ```

## 🔧 Configuration

### QA Test Configuration

Edit `apps/cloud-sandbox/scripts/comprehensive_qa.js`:

```javascript
const QA_CONFIG = {
  maxDepth: 3, // Crawl depth (3 levels)
  maxPagesPerLevel: 10, // Pages per level
  testTimeout: 30000, // 30 seconds per page
  screenshotInterval: 5000, // Screenshot every 5s
  validateForms: true, // Test forms
  validateLinks: true, // Test all links
  validateImages: true, // Check images
  validateButtons: true, // Test buttons
  validatePerformance: true, // Measure performance
};
```

### Cloud QA Script Configuration

Edit `scripts/run-cloud-qa.sh`:

```bash
RAILWAY_SANDBOX_URL="https://tnf-cloud-sandbox-v2-production.up.railway.app"
TARGET_SITE="https://thenewfuse.com"
```

## 📊 Monitoring with Antigravity

### Real-Time Commands:

```markdown
"Show me a screenshot of what the Railway browser is viewing"
```

```markdown
"What console errors are there in the current page?"
```

```markdown
"List all failed network requests"
```

```markdown
"What's the performance of the current page?"
```

### Continuous Monitoring:

```markdown
"Monitor the cloud QA test and give me updates every 30 seconds including:

- Current page being tested
- Screenshot
- Any errors found
- Performance metrics
- Progress status"
```

### Debugging Specific Issues:

```markdown
"Navigate the Railway browser to the page that failed and tell me why"
```

```markdown
"Take a full-page screenshot of the current page being tested"
```

```markdown
"Run this JavaScript in the browser and show results:
document.querySelectorAll('.error').length"
```

## 📈 Results

### Where to Find Results:

1. **Real-Time via Antigravity**:
   - Use Chrome DevTools MCP tools
   - Interactive debugging
   - Visual screenshots

2. **JSON Report on Railway**:
   - Saved to: `/tmp/qa_report_<timestamp>.json`
   - SSH into Railway to access
   - Or use Railway CLI: `railway run cat /tmp/qa_report_latest.json`

3. **Via API**:
   ```bash
   curl https://tnf-cloud-sandbox-v2-production.up.railway.app/api/qa/status
   ```

### Report Contains:

- Total pages tested
- All issues found (grouped by severity)
- Performance metrics for each page
- Broken links, images, buttons
- Console errors
- Form validation issues
- Accessibility problems

## 🚨 Troubleshooting

### "Cloud browser not accessible"

1. Check Railway service is running:

   ```bash
   railway status
   ```

2. Redeploy if needed:

   ```bash
   cd apps/cloud-sandbox
   railway up
   ```

3. Check environment variables are set

### "Antigravity can't connect"

1. Verify Chrome DevTools MCP server is configured
2. Restart Antigravity
3. Test: "List all available Chrome DevTools tools"

### "QA test not starting"

1. Check Railway logs:

   ```bash
   railway logs --tail
   ```

2. Verify `comprehensive_qa.js` is deployed
3. Check for Node.js errors

## 🎉 Next Steps

### When Railway Service is Running:

1. **Run the Cloud QA**:

   ```bash
   ./scripts/run-cloud-qa.sh
   ```

2. **Monitor with Antigravity**:

   ```markdown
   "Connect to Railway browser and monitor the QA test in real-time"
   ```

3. **Review Results**:
   ```markdown
   "Show me the QA test summary and all critical issues found"
   ```

### To Deploy Railway Service:

If the cloud sandbox isn't deployed yet:

```bash
cd apps/cloud-sandbox
railway login
railway link
railway up
```

Then verify it's working:

```bash
curl https://$(railway status --json | jq -r .url)/api/browser/devtools
```

## 📚 Documentation

- **`CLOUD_QA_GUIDE.md`** - Complete usage guide (this file)
- **`ANTIGRAVITY_QA_INSTRUCTIONS.md`** - Detailed monitoring instructions
- **`ANTIGRAVITY_DEVTOOLS_SETUP.md`** - DevTools integration setup
- **`apps/cloud-sandbox/README.md`** - Cloud sandbox documentation

## ✨ Summary

**You now have**:

- ✅ Comprehensive QA test suite (`comprehensive_qa.js`)
- ✅ Cloud launcher script (`run-cloud-qa.sh`)
- ✅ API trigger endpoint (`qa-trigger-api.js`)
- ✅ Complete documentation
- ✅ Antigravity monitoring integration
- ✅ Real-time debugging capabilities

**To use it**:

1. Ensure Railway service is running
2. Run `./scripts/run-cloud-qa.sh`
3. Monitor with Antigravity
4. Review results

Everything runs in the cloud. You just watch and guide! 🚀
