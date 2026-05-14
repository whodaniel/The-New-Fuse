# ⚡ Cloud QA - Quick Reference

## Run QA Test from Cloud

```bash
./scripts/run-cloud-qa.sh
```

## Monitor with Antigravity

### Start Monitoring

```markdown
"Connect to CloudRuntime browser and start monitoring the QA test"
```

### Real-Time Updates

```markdown
"Monitor the QA test and report every 30 seconds:

- Current page
- Screenshot
- Errors
- Performance
- Progress"
```

### Check Specific Things

```markdown
"Show screenshot of current page" "What console errors exist?" "List failed
network requests" "What's the page performance?"
```

## Verify CloudRuntime is Running

```bash
curl https://tnf-cloud-sandbox-v2-production.thenewfuse.com/api/browser/devtools
```

## Alternative: Run with CloudRuntime CLI

```bash
cloud_runtime run node apps/cloud-sandbox/scripts/comprehensive_qa.js
```

## Get Results

```markdown
"Show me the QA test results summary" "What critical issues were found?" "Which
pages failed the QA test?"
```

## Files

- **QA Script**: `apps/cloud-sandbox/scripts/comprehensive_qa.js`
- **Launcher**: `scripts/run-cloud-qa.sh`
- **Full Guide**: `CLOUD_QA_GUIDE.md`
- **Setup**: `CLOUD_QA_SETUP.md`
- **Monitoring**: `ANTIGRAVITY_QA_INSTRUCTIONS.md`

---

**That's it!** Run from cloud, monitor with Antigravity. 🚀
