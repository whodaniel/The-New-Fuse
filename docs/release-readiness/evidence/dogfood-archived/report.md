# TNF Dogfood QA Report - Security Audit

**Date:** 2026-05-05T15:15:53.876725Z
**Scope:** Headless security audit across 4 TNF properties (app.thenewfuse.com, extreamix.com, api.thenewfuse.com, relay.thenewfuse.com)
**Tester:** Hermes Agent (automated headless security probes)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 12 |
| 🟡 Medium | 10 |
| 🔵 Low | 0 |
| **Total** | **24** |

**Overall Assessment:** 2 Critical and 12 High severity security issues detected across TNF properties, primarily CORS misconfigurations and missing security headers.

---

## Issues

### Issue #1: Wildcard CORS Misconfiguration (app.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Security |
| **URL** | https://app.thenewfuse.com/ |

**Description:**
The domain app.thenewfuse.com allows requests from any origin (access-control-allow-origin: *). This is a critical security vulnerability that could allow malicious websites to make authenticated requests to this API on behalf of users.

**Steps to Reproduce:**
- Send a request to https://app.thenewfuse.com/ with Origin: https://evil-test.com header
- Check the response headers for access-control-allow-origin

**Expected Behavior:**
Should either reject the request or only allow specific trusted origins

**Actual Behavior:**
Returns access-control-allow-origin: * allowing any origin

---

### Issue #2: Wildcard CORS Misconfiguration (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Security |
| **URL** | https://relay.thenewfuse.com/ |

**Description:**
The domain relay.thenewfuse.com allows requests from any origin (access-control-allow-origin: *). This is a critical security vulnerability that could allow malicious websites to make authenticated requests to this API on behalf of users.

**Steps to Reproduce:**
- Send a request to https://relay.thenewfuse.com/ with Origin: https://evil-test.com header
- Check the response headers for access-control-allow-origin

**Expected Behavior:**
Should either reject the request or only allow specific trusted origins

**Actual Behavior:**
Returns access-control-allow-origin: * allowing any origin

---

### Issue #3: CORS Rejection Returns 500 Error (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Security |
| **URL** | https://api.thenewfuse.com/ |

**Description:**
CORS preflight failures on api.thenewfuse.com return HTTP 500 instead of appropriate 403 status. This pollutes error tracking systems and leaks implementation details.

**Steps to Reproduce:**
- Send a request to https://api.thenewfuse.com/ with Origin: https://evil-test.com header
- Check the HTTP status code

**Expected Behavior:**
Should return 403 Forbidden or no CORS header

**Actual Behavior:**
Returns HTTP 500 Internal Server Error

---

### Issue #4: Route Returns 404 (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/login |

**Description:**
The route /login returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://api.thenewfuse.com/login

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #5: Route Returns 404 (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/register |

**Description:**
The route /register returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://api.thenewfuse.com/register

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #6: Route Returns 404 (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/dashboard |

**Description:**
The route /dashboard returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://api.thenewfuse.com/dashboard

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #7: Route Returns 404 (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/pricing |

**Description:**
The route /pricing returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://api.thenewfuse.com/pricing

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #8: Route Returns 404 (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/docs |

**Description:**
The route /docs returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://api.thenewfuse.com/docs

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #9: Route Returns 404 (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com/login |

**Description:**
The route /login returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://relay.thenewfuse.com/login

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #10: Route Returns 404 (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com/register |

**Description:**
The route /register returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://relay.thenewfuse.com/register

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #11: Route Returns 404 (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com/dashboard |

**Description:**
The route /dashboard returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://relay.thenewfuse.com/dashboard

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #12: Route Returns 404 (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com/pricing |

**Description:**
The route /pricing returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://relay.thenewfuse.com/pricing

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #13: Route Returns 404 (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com/docs |

**Description:**
The route /docs returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://relay.thenewfuse.com/docs

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #14: Route Returns 404 (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com/api/health |

**Description:**
The route /api/health returns 404. This may indicate broken routing or missing pages.

**Steps to Reproduce:**
- Navigate to https://relay.thenewfuse.com/api/health

**Expected Behavior:**
Route should be accessible

**Actual Behavior:**
Returns 404 Not Found

---

### Issue #15: Missing Security Headers (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://api.thenewfuse.com/ |

**Description:**
The following security headers are missing: x-frame-options, x-content-type-options, content-security-policy, strict-transport-security, referrer-policy, permissions-policy. These headers protect against common web vulnerabilities.

**Steps to Reproduce:**
- Fetch headers from https://api.thenewfuse.com/
- Check for presence of security headers

**Expected Behavior:**
Should have x-frame-options, x-content-type-options, content-security-policy, etc.

**Actual Behavior:**
Missing: x-frame-options, x-content-type-options, content-security-policy, strict-transport-security, referrer-policy, permissions-policy

---

### Issue #16: Technology Stack Disclosure via x-powered-by (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://api.thenewfuse.com/ |

**Description:**
The x-powered-by header is present, revealing technology stack information that could be used by attackers.

**Steps to Reproduce:**
- Fetch headers from https://api.thenewfuse.com/
- Check for x-powered-by header

**Expected Behavior:**
x-powered-by header should be disabled

**Actual Behavior:**
x-powered-by header is present

---

### Issue #17: Version Information Disclosure (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://api.thenewfuse.com/ |

**Description:**
Version/build information is exposed in the HTML response: ['version']

**Steps to Reproduce:**
- Fetch https://api.thenewfuse.com/
- Inspect HTML for version/build meta tags

**Expected Behavior:**
Version information should not be exposed in production

**Actual Behavior:**
Found: ['version']

---

### Issue #18: JSON Information Disclosure (api.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://api.thenewfuse.com/ |

**Description:**
The root endpoint returns JSON data that may expose internal information. Keys found: ['name', 'version', 'status', 'timestamp', 'uptime']

**Steps to Reproduce:**
- Fetch https://api.thenewfuse.com/
- Inspect response for JSON structure

**Expected Behavior:**
Root endpoint should return HTML or minimal data

**Actual Behavior:**
Returns JSON with keys: ['name', 'version', 'status', 'timestamp', 'uptime']

---

### Issue #19: Missing Security Headers (app.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://app.thenewfuse.com/ |

**Description:**
The following security headers are missing: content-security-policy, strict-transport-security, permissions-policy. These headers protect against common web vulnerabilities.

**Steps to Reproduce:**
- Fetch headers from https://app.thenewfuse.com/
- Check for presence of security headers

**Expected Behavior:**
Should have x-frame-options, x-content-type-options, content-security-policy, etc.

**Actual Behavior:**
Missing: content-security-policy, strict-transport-security, permissions-policy

---

### Issue #20: Version Information Disclosure (app.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://app.thenewfuse.com/ |

**Description:**
Version/build information is exposed in the HTML response: ['build', 'api-version', 'Build']

**Steps to Reproduce:**
- Fetch https://app.thenewfuse.com/
- Inspect HTML for version/build meta tags

**Expected Behavior:**
Version information should not be exposed in production

**Actual Behavior:**
Found: ['build', 'api-version', 'Build']

---

### Issue #21: Missing Security Headers (extreamix.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://extreamix.com/ |

**Description:**
The following security headers are missing: x-frame-options, x-content-type-options, content-security-policy, strict-transport-security, referrer-policy, permissions-policy. These headers protect against common web vulnerabilities.

**Steps to Reproduce:**
- Fetch headers from https://extreamix.com/
- Check for presence of security headers

**Expected Behavior:**
Should have x-frame-options, x-content-type-options, content-security-policy, etc.

**Actual Behavior:**
Missing: x-frame-options, x-content-type-options, content-security-policy, strict-transport-security, referrer-policy, permissions-policy

---

### Issue #22: Technology Stack Disclosure via x-powered-by (extreamix.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://extreamix.com/ |

**Description:**
The x-powered-by header is present, revealing technology stack information that could be used by attackers.

**Steps to Reproduce:**
- Fetch headers from https://extreamix.com/
- Check for x-powered-by header

**Expected Behavior:**
x-powered-by header should be disabled

**Actual Behavior:**
x-powered-by header is present

---

### Issue #23: Missing Security Headers (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://relay.thenewfuse.com/ |

**Description:**
The following security headers are missing: x-frame-options, strict-transport-security, referrer-policy, permissions-policy. These headers protect against common web vulnerabilities.

**Steps to Reproduce:**
- Fetch headers from https://relay.thenewfuse.com/
- Check for presence of security headers

**Expected Behavior:**
Should have x-frame-options, x-content-type-options, content-security-policy, etc.

**Actual Behavior:**
Missing: x-frame-options, strict-transport-security, referrer-policy, permissions-policy

---

### Issue #24: Technology Stack Disclosure via x-powered-by (relay.thenewfuse.com)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Security |
| **URL** | https://relay.thenewfuse.com/ |

**Description:**
The x-powered-by header is present, revealing technology stack information that could be used by attackers.

**Steps to Reproduce:**
- Fetch headers from https://relay.thenewfuse.com/
- Check for x-powered-by header

**Expected Behavior:**
x-powered-by header should be disabled

**Actual Behavior:**
x-powered-by header is present

---

## Issues Summary Table

| # | Title | Severity | Category | Domain |
|---|-------|----------|----------|--------|
| 1 | Wildcard CORS Misconfiguration (app.thenewfus... | Critical | Security | app.thenewfuse.com |
| 2 | Wildcard CORS Misconfiguration (relay.thenewf... | Critical | Security | relay.thenewfuse.com |
| 3 | CORS Rejection Returns 500 Error (api.thenewf... | High | Security | api.thenewfuse.com |
| 4 | Route Returns 404 (api.thenewfuse.com) | High | Functional | api.thenewfuse.com |
| 5 | Route Returns 404 (api.thenewfuse.com) | High | Functional | api.thenewfuse.com |
| 6 | Route Returns 404 (api.thenewfuse.com) | High | Functional | api.thenewfuse.com |
| 7 | Route Returns 404 (api.thenewfuse.com) | High | Functional | api.thenewfuse.com |
| 8 | Route Returns 404 (api.thenewfuse.com) | High | Functional | api.thenewfuse.com |
| 9 | Route Returns 404 (relay.thenewfuse.com) | High | Functional | relay.thenewfuse.com |
| 10 | Route Returns 404 (relay.thenewfuse.com) | High | Functional | relay.thenewfuse.com |
| 11 | Route Returns 404 (relay.thenewfuse.com) | High | Functional | relay.thenewfuse.com |
| 12 | Route Returns 404 (relay.thenewfuse.com) | High | Functional | relay.thenewfuse.com |
| 13 | Route Returns 404 (relay.thenewfuse.com) | High | Functional | relay.thenewfuse.com |
| 14 | Route Returns 404 (relay.thenewfuse.com) | High | Functional | relay.thenewfuse.com |
| 15 | Missing Security Headers (api.thenewfuse.com) | Medium | Security | api.thenewfuse.com |
| 16 | Technology Stack Disclosure via x-powered-by ... | Medium | Security | api.thenewfuse.com |
| 17 | Version Information Disclosure (api.thenewfus... | Medium | Security | api.thenewfuse.com |
| 18 | JSON Information Disclosure (api.thenewfuse.com) | Medium | Security | api.thenewfuse.com |
| 19 | Missing Security Headers (app.thenewfuse.com) | Medium | Security | app.thenewfuse.com |
| 20 | Version Information Disclosure (app.thenewfus... | Medium | Security | app.thenewfuse.com |
| 21 | Missing Security Headers (extreamix.com) | Medium | Security | extreamix.com |
| 22 | Technology Stack Disclosure via x-powered-by ... | Medium | Security | extreamix.com |
| 23 | Missing Security Headers (relay.thenewfuse.com) | Medium | Security | relay.thenewfuse.com |
| 24 | Technology Stack Disclosure via x-powered-by ... | Medium | Security | relay.thenewfuse.com |

## Testing Coverage

### Pages/Endpoints Tested
- Root endpoint (/)
- /login
- /register  
- /dashboard
- /pricing
- /docs
- /api/health

### Security Probes Run
- DNS resolution check
- Security headers audit (7 headers)
- CORS misconfiguration test (malicious origin)
- Route availability check
- Information disclosure scan

### Not Tested / Out of Scope
- Browser-based interactive testing (headless-only mode)
- Form validation testing
- Authentication flow testing
- Performance testing
- Accessibility testing

---

## Critical Findings Summary

- **app.thenewfuse.com:** Wildcard CORS Misconfiguration (app.thenewfuse.com)
- **relay.thenewfuse.com:** Wildcard CORS Misconfiguration (relay.thenewfuse.com)

## Recommendations

1. **Immediate (Critical):**
   - Fix wildcard CORS on app.thenewfuse.com and relay.thenewfuse.com
   - Review CORS policy to only allow trusted origins

2. **Short-term (High):**
   - Fix CORS 500 error on api.thenewfuse.com to return proper 403
   - Add missing security headers across all properties

3. **Medium-term (Medium):**
   - Disable x-powered-by headers
   - Remove version information from HTML meta tags
   - Implement Content Security Policy

---

## Notes

This audit was run in headless mode (Phase 1.5 of dogfood skill) as part of automated cron job execution. Browser-based interactive testing (Phases 2-4) was not performed. For a complete assessment, follow up with browser-based exploratory testing on app.thenewfuse.com to check login flows, dashboard functionality, and form validation.

All findings have been saved to `~/dogfood-output/security-audit-results.json` for further processing.

---

*Report generated by Hermes Agent TNF Dogfood Swarm*
