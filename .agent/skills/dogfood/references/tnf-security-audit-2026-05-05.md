# TNF Security Audit Findings - Session 2026-05-05

## Summary

Headless security audit performed on 4 TNF properties using `dogfood` skill in
cron/CI mode. **Total Issues:** 24 (2 Critical, 12 High, 10 Medium, 0 Low)

## Critical Findings

### 1. Wildcard CORS on app.thenewfuse.com

- **Severity:** Critical
- **Finding:** `access-control-allow-origin: *` allows any origin
- **Impact:** Malicious sites can make authenticated requests on behalf of users
- **Fix:** Configure CORS to only allow `https://thenewfuse.com` and
  `https://app.thenewfuse.com`

### 2. Wildcard CORS on relay.thenewfuse.com

- **Severity:** Critical
- **Finding:** `access-control-allow-origin: *` allows any origin
- **Impact:** Same as above
- **Fix:** Configure CORS to only allow trusted origins

## High Severity Findings

### 3. CORS 500 Error on api.thenewfuse.com

- **Severity:** High
- **Finding:** CORS rejection returns HTTP 500 instead of 403
- **Impact:** Pollutes error tracking, leaks implementation details
- **Fix:** Return 403 Forbidden for rejected origins, not 500

### 4-14. Route 404s on api.thenewfuse.com and relay.thenewfuse.com

- **Severity:** High
- **Finding:** Multiple routes return 404: `/login`, `/register`, `/dashboard`,
  `/pricing`, `/docs`, `/api/health`
- **Impact:** Broken user flows, missing functionality
- **Note:** These may be expected for API-only domains (api.thenewfuse.com) but
  critical for relay.thenewfuse.com

## Medium Severity Findings

### Missing Security Headers

- **Domains:** api.thenewfuse.com, extreamix.com, relay.thenewfuse.com,
  app.thenewfuse.com
- **Missing:** CSP, HSTS, permissions-policy (varies by domain)
- **Impact:** Reduced protection against XSS, clickjacking, etc.

### Technology Stack Disclosure

- **Domains:** api.thenewfuse.com, extreamix.com, relay.thenewfuse.com
- **Finding:** `x-powered-by` header present
- **Impact:** Reveals technology stack to attackers

### Information Disclosure

- **Domains:** app.thenewfuse.com, api.thenewfuse.com
- **Finding:** Version/build info in HTML meta tags; JSON endpoint on
  api.thenewfuse.com
- **Impact:** Exposes internal versioning and status data

## Technical Notes

### Headless Mode Capabilities

The headless security audit (Phase 1.5) successfully detected:

- CORS misconfigurations via `Origin` header probing
- Missing security headers via `curl -sI`
- Route availability via status code checks
- Information disclosure via body inspection

### Limitations

- Cannot detect UI/UX issues
- Cannot test form validation
- Cannot verify authentication flows
- Cannot assess accessibility

## Files Generated

- `~/dogfood-output/report.md` - Full 652-line report
- `~/dogfood-output/security-audit-results.json` - Raw JSON data
- `~/dogfood-output/critical_high_issues.json` - Structured issues for fix
  agents

## Recommended Actions

1. **Immediate:** Fix wildcard CORS on app.thenewfuse.com and
   relay.thenewfuse.com
2. **Short-term:** Fix CORS 500 error on api.thenewfuse.com
3. **Medium-term:** Add missing security headers across all properties
4. **Follow-up:** Run browser-based dogfood on app.thenewfuse.com for UI/UX
   testing
