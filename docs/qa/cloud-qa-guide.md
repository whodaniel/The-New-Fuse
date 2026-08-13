# Cloud QA Guide

> **Replaces:** CLOUD_QA_GUIDE.md, CLOUD_QA_QUICKREF.md, CLOUD_QA_SETUP.md,
> README_CLOUD_QA.md (now archived). **Note:** CloudRuntime is no longer used.
> Backend runs on GCP Cloud Run (see `CLOUD_MIGRATION_BLUEPRINT.md`). All
> `*.thenewfuse.com` URLs replaced with `https://<your-cloud-run-backend-url>`.

## Quick Reference

```bash
./scripts/run-cloud-qa.sh                                                    # Trigger QA
curl https://<your-cloud-run-backend-url>/api/browser/devtools               # Check status
curl https://<your-cloud-run-backend-url>/api/qa/status                      # Get results
```

## Running QA Tests

**Launcher script** (recommended):

```bash
./scripts/run-cloud-qa.sh
```

**Via API:**

```bash
curl -X POST https://<your-cloud-run-backend-url>/api/qa/run \
  -H "Content-Type: application/json" \
  -d '{"target":"https://thenewfuse.com","config":{"maxDepth":3,"maxPagesPerLevel":10,"validateAll":true}}'
```

**Direct on Cloud Run** -- use `gcloud` CLI or SSH into the instance:

```bash
gcloud run jobs execute qa-job --region=us-central1
# or: node apps/cloud-sandbox/scripts/comprehensive_qa.js
```

## Test Scope

**Pages:** Homepage, all nav pages, linked pages (3 levels deep), dynamic
routes.

**Components:** Links (href, security), Buttons (clicks, visibility), Forms
(validation), Images (loading, alt text), Navigation (routing, breadcrumbs).

**Quality:** Console errors, Performance (LCP, CLS, TBT), Accessibility (ARIA,
alt text), Security (noopener, XSS), SEO (meta, headings).

**Coverage:** ~30 pages, 3 levels deep, 10 pages/level, 5--10 min duration.

## Configuration

Edit `apps/cloud-sandbox/scripts/comprehensive_qa.js`:

```javascript
const QA_CONFIG = {
  maxDepth: 3,
  maxPagesPerLevel: 10,
  testTimeout: 30000,
  screenshotInterval: 5000,
  validateForms: true,
  validateLinks: true,
  validateImages: true,
  validateButtons: true,
  validatePerformance: true,
};
```

Edit `scripts/run-cloud-qa.sh` to set `BACKEND_URL` and `TARGET_SITE`.

## Antigravity Monitoring

**Real-time:**

```markdown
"Show screenshot of the current page being tested" "What console errors exist?"
"List failed network requests" "What is the page performance?"
```

**Continuous:**

```markdown
"Monitor the cloud QA test and report every 30 seconds: current page,
screenshot, errors, performance, progress"
```

**Debugging:**

```markdown
"Navigate to the failed page and show me why" "Run in browser:
document.querySelectorAll('.error').length"
```

**Status:**

```markdown
"How many pages tested so far?" / "What issues found?" / "Which pages failed?"
```

## Results

1. **Real-time** via Antigravity (screenshots, console, network)
2. **JSON report** at `/tmp/qa_report_<timestamp>.json` on the Cloud Run
   instance
3. **API:** `curl https://<your-cloud-run-backend-url>/api/qa/status`

Report includes: `pagesTestedCount`, `totalIssues`, per-page `issues[]` and
`performance{}`, plus summary with `brokenLinks`, `missingImages`, `jsErrors`,
`slowPages`, `accessibilityIssues`, `formValidationIssues`.

## Troubleshooting

| Problem                      | Fix                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Cloud browser not accessible | `gcloud run services describe tnf-backend --region=us-central1`; check logs with `gcloud run services logs read`; verify env vars |
| Antigravity can't connect    | Verify CDP MCP server config; restart Antigravity; test: "List all Chrome DevTools tools"                                         |
| QA test not starting         | Check Cloud Run logs; verify `comprehensive_qa.js` is in the container image; test API endpoint with curl                         |

## See Also

- `ANTIGRAVITY_QA_INSTRUCTIONS.md` -- monitoring guide
- `ANTIGRAVITY_DEVTOOLS_SETUP.md` -- CDP integration
- `CLOUD_MIGRATION_BLUEPRINT.md` -- infrastructure reference
- `apps/cloud-sandbox/scripts/comprehensive_qa.js` -- QA implementation
