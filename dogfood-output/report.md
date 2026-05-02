# Dogfood QA Report

**Target:** All TNF Properties (app.thenewfuse.com, extreamix.com, api.thenewfuse.com, relay.thenewfuse.com)
**Date:** 2026-04-30 20:39 UTC
**Scope:** Full systematic exploratory QA — HTTP health checks, navigation link verification, SPA route testing, API endpoint testing, security header analysis, DNS verification
**Tester:** Hermes Agent (automated exploratory QA — TNF Dogfood Swarm)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟠 High | 7 |
| 🟡 Medium | 6 |
| 🔵 Low | 4 |
| **Total** | **22** |

**Overall Assessment:** TNF infrastructure remains in severely broken state. The main landing (thenewfuse.com) is completely offline (Cloudflare Error 1000), the SAAS app (app.thenewfuse.com) is serving a static landing page with 11 out of 12 internal navigation links broken (404), the relay subdomain has no DNS record, and the API gateway advertises non-existent documentation. Only extreamix.com and app.extreamix.com are fully healthy.

---

## Issues

### Issue #1: thenewfuse.com Returns Cloudflare Error 1000 (DNS Points to Prohibited IP)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | https://thenewfuse.com |

**Description:**
The main marketing domain thenewfuse.com returns a Cloudflare Error 1000 page: "DNS points to prohibited IP". The DNS A records point to Cloudflare's own proxy IPs (172.67.166.88, 104.21.33.201) rather than the actual origin server. This means the entire main domain is completely offline and inaccessible to all users.

**Steps to Reproduce:**
1. Navigate to https://thenewfuse.com
2. Observe Cloudflare Error 1000 page

**Expected Behavior:**
The main marketing/landing page should render with product information, pricing, features, etc.

**Actual Behavior:**
Cloudflare Error 1000 — "DNS points to prohibited IP" — entire domain unreachable.

**Console Errors:**
N/A — HTTP 403 returned with Cloudflare error page HTML.

---

### Issue #2: relay.thenewfuse.com Has No DNS Record (NXDOMAIN)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | https://relay.thenewfuse.com |

**Description:**
The relay subdomain has no DNS record at all. `dig +short relay.thenewfuse.com` returns empty. The subdomain was never created in Cloudflare DNS. The WebSocket relay status UI is completely inaccessible.

**Steps to Reproduce:**
1. Run `dig relay.thenewfuse.com` — returns NXDOMAIN
2. Attempt `curl https://relay.thenewfuse.com` — connection failure

**Expected Behavior:**
relay.thenewfuse.com should resolve to an IP and serve a WebSocket relay status UI.

**Actual Behavior:**
DNS does not resolve. Complete infrastructure absence.

---

### Issue #3: app.thenewfuse.com Auth Routes Return 404 — No SPA Fallback

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | https://app.thenewfuse.com/auth/login, /auth/register, /login, /register, /dashboard |

**Description:**
All auth and dashboard routes on the SAAS subdomain return HTTP 404. The deployed site serves a static HTML landing page, not the React SPA. The SPA build output (`app.html`) does not exist (HTTP 404). The Cloudflare Pages Worker fallback to `/app.html` always fails. Users cannot log in, register, or access the dashboard at all.

The /login and /register routes serve a redirect page that attempts to redirect back to `/index.html` on the app subdomain, creating a loop.

**Steps to Reproduce:**
1. Navigate to https://app.thenewfuse.com/login → HTTP 404
2. Navigate to https://app.thenewfuse.com/auth/login → HTTP 404
3. Navigate to https://app.thenewfuse.com/register → HTTP 404
4. Navigate to https://app.thenewfuse.com/dashboard → HTTP 404
5. Navigate to https://app.thenewfuse.com/app.html → HTTP 404

**Expected Behavior:**
React SPA should handle these routes client-side, rendering login/register/dashboard views.

**Actual Behavior:**
HTTP 404 on all SPA routes. No functional authentication or dashboard access.

---

### Issue #4: app.thenewfuse.com Landing Page Has 11/12 Internal Links Broken

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | https://app.thenewfuse.com |

**Description:**
The static landing page served at app.thenewfuse.com contains 12+ internal navigation links. Only 1 works (the visualizations dashboard). Every other link returns 404:

| Link | Target | Status |
|------|--------|--------|
| /auth/login | Login page | 404 |
| /auth/register | Registration | 404 |
| /dashboard | Dashboard | 404 |
| /workflows/builder | Workflow builder | 404 |
| /docs | Documentation | Redirects to thenewfuse.com/docs → 403 |
| /api/docs | API docs | 404 |
| /agents | Agents page | 404 |
| /about | About page | 404 |
| /blog | Blog page | 404 |
| /legal/privacy | Privacy policy | 404 |
| /legal/terms | Terms of service | 404 |
| GitHub (whodaniel/fuse) | Repo | 404 |

**Steps to Reproduce:**
1. Navigate to https://app.thenewfuse.com
2. Click any navigation link (e.g., "Sign In", "Get Started", "Docs", "About")
3. Observe 404 error page

**Expected Behavior:**
All navigation links should lead to valid pages.

**Actual Behavior:**
11 out of 12 internal links are broken. Users encounter dead ends everywhere.

---

### Issue #5: API Gateway Advertsises Non-Existent /docs Endpoint

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com |

**Description:**
The API root endpoint (`/`) returns JSON advertising `"documentation": "/docs"`, but navigating to `/docs` returns HTTP 404 with `"Cannot GET /docs"`. All API documentation routes are also 404: `/swagger`, `/openapi.json`, `/redoc`. There is zero accessible documentation for the API.

**Steps to Reproduce:**
1. `GET https://api.thenewfuse.com/` → Returns `{"documentation": "/docs", ...}`
2. `GET https://api.thenewfuse.com/docs` → HTTP 404 `Cannot GET /docs`
3. `GET https://api.thenewfuse.com/swagger` → HTTP 404
4. `GET https://api.thenewfuse.com/openapi.json` → HTTP 404

**Expected Behavior:**
The /docs endpoint should serve API documentation, or the root JSON should not advertise it.

**Actual Behavior:**
Documentation endpoint is advertised but does not exist. Zero API docs available.

---

### Issue #6: API CORS Preflight Returns 500 for Disallowed Origins

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/api/v1/health |

**Description:**
Sending an OPTIONS preflight request with an arbitrary origin (e.g., `Origin: https://evil.com`) returns HTTP 500 with `{"message": "CORS origin not allowed", "error": "INTERNAL_ERROR"}`. While the CORS restriction is correct (rejecting unknown origins), returning a 500 status code is incorrect. CORS preflight failures should return 200/204 with no `Access-Control-Allow-Origin` header, or 403 — never 500. A 500 error suggests an unhandled exception in CORS middleware and may leak stack traces in development mode.

**Steps to Reproduce:**
1. `OPTIONS https://api.thenewfuse.com/api/v1/health` with `Origin: https://evil.com`
2. Observe HTTP 500 response

**Expected Behavior:**
CORS preflight should return 200/204/403, not 500. The error should not be classified as INTERNAL_ERROR.

**Actual Behavior:**
HTTP 500 with INTERNAL_ERROR for a normal CORS rejection.

---

### Issue #7: API Missing Security Headers (CSP, X-Frame-Options, HSTS)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Accessibility |
| **URL** | https://api.thenewfuse.com (all endpoints) |

**Description:**
The API gateway responses lack critical security headers:
- No `Content-Security-Policy`
- No `X-Frame-Options` (only app.thenewfuse.com has this)
- No `Strict-Transport-Security` (HSTS)
- No `X-Content-Type-Options` (only app.thenewfuse.com has this)
- Exposes `X-Powered-By: Express` — server fingerprinting

**Steps to Reproduce:**
1. `curl -I https://api.thenewfuse.com/health`
2. Observe missing security headers and exposed `X-Powered-By: Express`

**Expected Behavior:**
Production API should include HSTS, CSP, X-Content-Type-Options, and should not expose server technology.

**Actual Behavior:**
No security headers present. Server technology fingerprinted via `X-Powered-By: Express`.

---

### Issue #8: API Auth Endpoints Return Generic 400/500 Errors Without Validation Details

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | UX |
| **URL** | https://api.thenewfuse.com/api/v1/auth/register, /api/v1/auth/login |

**Description:**
The auth endpoints return unhelpful error messages for invalid input:
- `POST /api/v1/auth/register` with empty body → `{"message": "Bad Request", "error": "INTERNAL_ERROR"}` (HTTP 400)
- `POST /api/v1/auth/login` with empty body → `{"message": "Bad Request", "error": "INTERNAL_ERROR"}` (HTTP 400)
- `POST /api/v1/auth/register` with `{"email":"test@test.com","password":"test"}` → `{"message": "Bad Request", "error": "INTERNAL_ERROR"}` (HTTP 400)

The error classification as "INTERNAL_ERROR" for validation failures is incorrect. No field-level validation messages are returned. Users and client developers cannot determine what input was wrong.

**Steps to Reproduce:**
1. `POST /api/v1/auth/register` with `{}`
2. Observe generic `Bad Request / INTERNAL_ERROR` with no validation details

**Expected Behavior:**
400 response with specific field-level validation errors (e.g., "email is required", "password must be at least 8 characters").

**Actual Behavior:**
Generic `Bad Request / INTERNAL_ERROR` with no actionable information.

---

### Issue #9: app.thenewfuse.com CORS Header Allows All Origins

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Console |
| **URL** | https://app.thenewfuse.com (all responses) |

**Description:**
The Cloudflare Pages deployment for app.thenewfuse.com includes `Access-Control-Allow-Origin: *` in all HTTP responses. This is overly permissive for a production application and could allow malicious sites to make authenticated requests if credentials are also allowed.

**Steps to Reproduce:**
1. `curl -I https://app.thenewfuse.com/`
2. Observe `access-control-allow-origin: *` header

**Expected Behavior:**
CORS should be restricted to specific trusted origins, or not set at all for same-origin pages.

**Actual Behavior:**
Wildcard CORS origin allows any site to make cross-origin requests.

---

### Issue #10: app.thenewfuse.com /pricing and /features Redirect to thenewfuse.com (Which Is Offline)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | https://app.thenewfuse.com/pricing, /features |

**Description:**
The /pricing and /features routes on app.thenewfuse.com redirect (HTTP 403) to thenewfuse.com/#pricing and thenewfuse.com/#features respectively. However, thenewfuse.com is completely offline (Error 1000), so these redirects lead to a dead end.

**Steps to Reproduce:**
1. Navigate to https://app.thenewfuse.com/pricing
2. Observe redirect to https://thenewfuse.com/#pricing
3. Observe Cloudflare Error 1000

**Expected Behavior:**
Pricing and features pages should either be served from app.thenewfuse.com or the redirect target should be reachable.

**Actual Behavior:**
Redirect chain leads to offline domain (thenewfuse.com).

---

### Issue #11: app.thenewfuse.com/login Redirect Loop Risk

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | https://app.thenewfuse.com/login, /register |

**Description:**
The /login and /register routes serve a page with JavaScript that attempts three sequential redirects:
1. If on main domain: redirect to app.thenewfuse.com + path
2. If on app subdomain: redirect to app.thenewfuse.com/index.html
3. Default: redirect to thenewfuse.com/

When the user is already on app.thenewfuse.com, the redirect goes to `/index.html`, which serves the landing page (not a login form). This creates a confusing dead-end flow where users seeking login are dumped on the landing page with no login form visible.

**Steps to Reproduce:**
1. Navigate to https://app.thenewfuse.com/login
2. Page redirects to https://app.thenewfuse.com/index.html
3. Landing page has no login form (only "Sign In" link that links back to /auth/login → 404)

**Expected Behavior:**
/login should render the SPA login form.

**Actual Behavior:**
Redirect chain leads to landing page with no login form, and the "Sign In" link on that page leads to a 404.

---

### Issue #12: API /api/v1 Routes Return 404 for All Non-Auth Endpoints

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | https://api.thenewfuse.com/api/v1/* |

**Description:**
Despite the health endpoint reporting `agents`, `webhooks`, `sse`, and `mcp` services as "active", all corresponding API endpoints return 404:
- `GET /api/v1/agents` → 404
- `GET /api/v1/agents/list` → 404
- `GET /api/v1/webhooks` → 404
- `GET /api/v1/webhooks/list` → 404
- `GET /api/v1/sse` → 404
- `GET /api/v1/auth/profile` → 404
- `GET /api/v1/auth/logout` → 404
- `GET /api` → 404
- `GET /api/v1` → 404

Only `/api/v1/health`, `/api/v1/auth/login` (POST), and `/api/v1/auth/register` (POST) are functional.

**Steps to Reproduce:**
1. `GET https://api.thenewfuse.com/api/v1/agents` → 404
2. Health endpoint reports these services as "active"

**Expected Behavior:**
Service endpoints should be accessible if health check reports them as active.

**Actual Behavior:**
All service endpoints return 404 despite health check claiming they're active.

---

### Issue #13: app.thenewfuse.com Missing Page Title

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Content |
| **URL** | https://app.thenewfuse.com |

**Description:**
The landing page at app.thenewfuse.com has no `<title>` tag. Browser tabs show the URL instead of a readable page name. Also missing: meta description, Open Graph tags (og:title, og:description, og:image), and Twitter card meta tags.

**Steps to Reproduce:**
1. Inspect page source of https://app.thenewfuse.com
2. Search for `<title>` — not found
3. Search for `og:` — not found

**Expected Behavior:**
Page should have descriptive `<title>`, `<meta name="description">`, and OG tags for SEO and social sharing.

**Actual Behavior:**
No title, description, or social meta tags present.

---

### Issue #14: app.thenewfuse.com Missing favicon.ico

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Visual |
| **URL** | https://app.thenewfuse.com/favicon.ico |

**Description:**
The site's favicon.ico returns HTTP 404. Browser tabs show a generic globe icon instead of the TNF brand icon.

**Steps to Reproduce:**
1. `curl -I https://app.thenewfuse.com/favicon.ico` → HTTP 404

**Expected Behavior:**
favicon.ico should exist and display the TNF brand icon.

**Actual Behavior:**
404 — no favicon loaded.

---

### Issue #15: app.thenewfuse.com Static Landing Page — No JavaScript Bundle

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX |
| **URL** | https://app.thenewfuse.com |

**Description:**
The app.thenewfuse.com deployment serves only a static HTML page with inline CSS and two inline `<script>` blocks. There is no compiled JavaScript bundle (`<script src=...>`). The page has zero interactive JavaScript — no event handlers, no form submissions, no dynamic content. All "Sign In" and "Get Started" buttons are simple `<a>` links. This is a marketing page, not a functional SAAS application.

**Steps to Reproduce:**
1. Inspect page source
2. Note: no `<script src=...>` tags, only inline scripts
3. Click "Get Started" — plain link to /auth/register (which 404s)

**Expected Behavior:**
The SAAS app should serve a React SPA with interactive login, registration, and dashboard functionality.

**Actual Behavior:**
Only a static marketing page is deployed. No functional SAAS features exist.

---

### Issue #16: app.thenewfuse.com /docs Route Redirects to Offline thenewfuse.com

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Functional |
| **URL** | https://app.thenewfuse.com/docs |

**Description:**
The /docs link in the landing page footer redirects to thenewfuse.com/docs, which is offline (Error 1000). This is a cross-domain dependency on an unreachable domain.

**Steps to Reproduce:**
1. Click "Docs" in footer of https://app.thenewfuse.com
2. Observe redirect to https://thenewfuse.com/docs → Error 1000

**Expected Behavior:**
Documentation should be accessible.

**Actual Behavior:**
Redirect to offline domain.

---

### Issue #17: thenewfuse.com/pricing, /features, /docs All Return 403

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Functional |
| **URL** | https://thenewfuse.com/pricing, /features, /docs |

**Description:**
Even if thenewfuse.com were to come online, direct page routes (/pricing, /features, /docs) return HTTP 403. This suggests the Cloudflare configuration blocks these paths or the origin server doesn't serve them.

**Steps to Reproduce:**
1. `curl -sS -L -o /dev/null -w "%{http_code}" https://thenewfuse.com/pricing` → 403

**Expected Behavior:**
These pages should return 200 with content.

**Actual Behavior:**
HTTP 403 on all direct page routes.

---

### Issue #18: API Gateway Root URL Timeout (Direct Navigation)

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX |
| **URL** | https://api.thenewfuse.com (browser navigation) |

**Description:**
When navigating to api.thenewfuse.com in a browser, the page appears to hang/timeout (10+ seconds) while API endpoints like `/health` respond in <3 seconds. The root URL returns JSON (HTTP 200), but the browser navigation experience is poor — possibly due to the initial DNS resolution or Cloudflare routing.

**Steps to Reproduce:**
1. Open https://api.thenewfuse.com in a browser
2. Observe slow loading (10+ seconds)

**Expected Behavior:**
Root URL should load quickly or redirect to docs.

**Actual Behavior:**
Slow/unresponsive browser experience on root URL navigation.

---

### Issue #19: extreamix.com Service Worker and WebSocket Interceptor in Production

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Console |
| **URL** | https://extreamix.com, https://app.extreamix.com |

**Description:**
Both extreamix.com and app.extreamix.com load a service worker (`_service-worker.js`) and a WebSocket interceptor (`_websocket-interceptor.js?v=1`). While functional, the service worker registration logs `console.log('Service Worker registered successfully...')` in production. These development-oriented console messages should be suppressed in production builds. The `?v=1` cache-busting parameter on the WebSocket interceptor suggests manual versioning rather than content-hash based caching.

**Steps to Reproduce:**
1. Open https://extreamix.com in browser with DevTools
2. Observe console.log output from service worker registration

**Expected Behavior:**
Production builds should not emit development console messages. Cache-busting should use content hashes.

**Actual Behavior:**
Console messages visible; manual cache-busting `?v=1` parameter.

---

### Issue #20: app.thenewfuse.com Missing robots.txt Proper Content

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Content |
| **URL** | https://app.thenewfuse.com/robots.txt |

**Description:**
robots.txt exists (HTTP 200) but needs verification that it properly guides search engine crawlers. Meanwhile thenewfuse.com is completely unreachable so any robots.txt there is moot.

**Steps to Reproduce:**
1. Navigate to https://app.thenewfuse.com/robots.txt

**Expected Behavior:**
robots.txt should properly allow/disallow crawling of the SAAS app.

**Actual Behavior:**
Needs content verification — may be allowing crawling of non-functional pages.

---

### Issue #21: API Gateway Exposes Internal Timestamp and Uptime

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Console |
| **URL** | https://api.thenewfuse.com/health, /api/v1/health |

**Description:**
The health endpoints expose detailed internal information: uptime in seconds, memory usage (rss, heapTotal, heapUsed, external, arrayBuffers), and precise server timestamps. While useful for monitoring, this information leakage in a public endpoint could aid attackers in timing attacks or infrastructure reconnaissance.

**Steps to Reproduce:**
1. `GET https://api.thenewfuse.com/health`
2. Observe detailed memory and uptime data in response

**Expected Behavior:**
Public health endpoint should return minimal status information (`{"status": "healthy"}`).

**Actual Behavior:**
Exposes uptime, memory heap statistics, and precise timestamps.

---

### Issue #22: extreamix.com Identical HTML Served on Both Domains

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Content |
| **URL** | https://extreamix.com, https://app.extreamix.com |

**Description:**
Both extreamix.com and app.extreamix.com serve identical HTML with the same title "EXTREAMIX" and same JS/CSS asset hashes. This means they are the same application on different domains, which could cause SEO duplicate content issues and user confusion about which URL to use.

**Steps to Reproduce:**
1. Compare HTML source of extreamix.com and app.extreamix.com
2. Observe identical content

**Expected Behavior:**
extreamix.com should be a marketing/landing page; app.extreamix.com should be the application. They should have distinct content.

**Actual Behavior:**
Identical HTML served from both domains.

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | thenewfuse.com Cloudflare Error 1000 | 🔴 Critical | Functional | https://thenewfuse.com |
| 2 | relay.thenewfuse.com No DNS Record | 🔴 Critical | Functional | https://relay.thenewfuse.com |
| 3 | app.thenewfuse.com Auth Routes 404 | 🔴 Critical | Functional | https://app.thenewfuse.com/auth/login |
| 4 | app.thenewfuse.com 11/12 Nav Links Broken | 🔴 Critical | Functional | https://app.thenewfuse.com |
| 5 | API /docs Advertised But Missing | 🔴 Critical | Functional | https://api.thenewfuse.com/docs |
| 6 | API CORS Preflight Returns 500 | 🟠 High | Functional | https://api.thenewfuse.com/api/v1/health |
| 7 | API Missing Security Headers | 🟠 High | Accessibility | https://api.thenewfuse.com |
| 8 | API Auth Endpoints Generic Errors | 🟠 High | UX | https://api.thenewfuse.com/api/v1/auth/register |
| 9 | app.thenewfuse.com Wildcard CORS | 🟠 High | Console | https://app.thenewfuse.com |
| 10 | /pricing, /features Redirect to Offline Domain | 🟠 High | Functional | https://app.thenewfuse.com/pricing |
| 11 | /login Redirect Loop Risk | 🟠 High | Functional | https://app.thenewfuse.com/login |
| 12 | API Service Endpoints All 404 | 🟠 High | Functional | https://api.thenewfuse.com/api/v1/agents |
| 13 | app.thenewfuse.com Missing Page Title | 🟡 Medium | Content | https://app.thenewfuse.com |
| 14 | app.thenewfuse.com Missing Favicon | 🟡 Medium | Visual | https://app.thenewfuse.com |
| 15 | Static Landing Page — No JS Bundle | 🟡 Medium | UX | https://app.thenewfuse.com |
| 16 | /docs Redirects to Offline Domain | 🟡 Medium | Functional | https://app.thenewfuse.com/docs |
| 17 | thenewfuse.com Sub-Routes 403 | 🟡 Medium | Functional | https://thenewfuse.com/pricing |
| 18 | API Root URL Browser Timeout | 🟡 Medium | UX | https://api.thenewfuse.com |
| 19 | Extreamix Dev Console Messages | 🔵 Low | Console | https://extreamix.com |
| 20 | robots.txt Content Verification | 🔵 Low | Content | https://app.thenewfuse.com |
| 21 | API Health Exposes Internals | 🔵 Low | Console | https://api.thenewfuse.com/health |
| 22 | Extreamix Duplicate Domain Content | 🔵 Low | Content | https://extreamix.com |

## Testing Coverage

### Pages Tested
- https://app.thenewfuse.com/ (landing page)
- https://app.thenewfuse.com/login (404 redirect page)
- https://app.thenewfuse.com/register (404 redirect page)
- https://app.thenewfuse.com/auth/login (404)
- https://app.thenewfuse.com/auth/register (404)
- https://app.thenewfuse.com/dashboard (404)
- https://app.thenewfuse.com/pricing (redirect to offline domain)
- https://app.thenewfuse.com/features (redirect to offline domain)
- https://app.thenewfuse.com/docs (redirect to offline domain)
- https://app.thenewfuse.com/agents (404)
- https://app.thenewfuse.com/about (404)
- https://app.thenewfuse.com/blog (404)
- https://app.thenewfuse.com/workflows/builder (404)
- https://app.thenewfuse.com/api/docs (404)
- https://app.thenewfuse.com/legal/privacy (404)
- https://app.thenewfuse.com/legal/terms (404)
- https://app.thenewfuse.com/visualizations/dashboard (200 — working)
- https://app.thenewfuse.com/app.html (404)
- https://thenewfuse.com/ (Cloudflare Error 1000)
- https://thenewfuse.com/pricing (403)
- https://thenewfuse.com/features (403)
- https://thenewfuse.com/docs (403)
- https://extreamix.com/ (200 — healthy)
- https://extreamix.com/pricing (200)
- https://extreamix.com/features (200)
- https://extreamix.com/login (200)
- https://extreamix.com/docs (200)
- https://app.extreamix.com/ (200 — healthy)
- https://app.extreamix.com/login (200)
- https://app.extreamix.com/dashboard (200)
- https://api.thenewfuse.com/ (200 — JSON root)
- https://api.thenewfuse.com/health (200)
- https://api.thenewfuse.com/api/v1/health (200)
- https://api.thenewfuse.com/docs (404)
- https://api.thenewfuse.com/swagger (404)
- https://api.thenewfuse.com/openapi.json (404)
- https://api.thenewfuse.com/redoc (404)
- https://api.thenewfuse.com/api/v1/auth/login (POST — 400/401)
- https://api.thenewfuse.com/api/v1/auth/register (POST — 400)
- https://api.thenewfuse.com/api/v1/agents (404)
- https://api.thenewfuse.com/api/v1/webhooks (404)
- https://relay.thenewfuse.com/ (DNS failure)

### Features Tested
- HTTP status codes for all major routes across all properties
- Navigation link verification (all links on app.thenewfuse.com landing page)
- DNS resolution for all subdomains
- API endpoint availability (health, auth, agents, webhooks, SSE, MCP)
- API CORS behavior (preflight with arbitrary origin)
- Security header analysis (CSP, HSTS, X-Frame-Options, X-Powered-By)
- SPA vs static page detection (JS bundle presence)
- Favicon and robots.txt availability
- Meta tag and SEO analysis (title, description, OG tags)
- Asset availability (CSS, JS, images, service workers)

### Not Tested / Out of Scope
- Visual rendering QA (screenshots) — browser-based visual testing timed out; findings based on HTML source analysis and HTTP status codes
- Interactive form testing — no functional forms found on app.thenewfuse.com; extreamix.com SPA requires JavaScript execution
- Extreamix SPA internal functionality — only verified route accessibility, not feature completeness
- API authenticated endpoints — no valid credentials available
- WebSocket relay functionality — relay.thenewfuse.com has no DNS

### Blockers
- thenewfuse.com completely offline — blocks all testing of main domain pages
- relay.thenewfuse.com DNS failure — blocks all relay testing
- app.thenewfuse.com no SPA — blocks all SAAS feature testing
- No authentication credentials — blocks API testing beyond unauthenticated endpoints

---

## Priority Fix Recommendations

### Critical (Must Fix Immediately)
1. **DNS Fix for thenewfuse.com** — Update Cloudflare DNS A records to point to origin server, not Cloudflare proxy IPs. This unblocks the entire main domain.
2. **Create DNS record for relay.thenewfuse.com** — Add A or CNAME record in Cloudflare DNS pointing to the relay service.
3. **Deploy React SPA build to app.thenewfuse.com** — The SAAS application needs its compiled React assets deployed to Cloudflare Pages, with proper SPA fallback (all routes serve index.html with client-side routing).
4. **Fix or remove /docs link from API root** — Either deploy API documentation or remove the `"documentation": "/docs"` claim from the root endpoint response.

### High (Fix This Sprint)
5. **Fix CORS middleware on API** — Return 200/204 for rejected preflight, not 500. Add proper `Access-Control-Allow-Origin` allowlist.
6. **Add security headers to API** — HSTS, X-Content-Type-Options, remove X-Powered-By.
7. **Improve auth endpoint error messages** — Return field-level validation errors, not generic "Bad Request / INTERNAL_ERROR".
8. **Fix navigation links on app.thenewfuse.com** — Remove or update broken links until SPA is deployed.
9. **Remove wildcard CORS from app.thenewfuse.com** — Restrict to specific origins.

### Medium (Fix Soon)
10. Add page title, meta description, and OG tags to app.thenewfuse.com.
11. Add favicon.ico to app.thenewfuse.com deployment.
12. Fix thenewfuse.com sub-route 403 errors.

---

## Notes

**Change Detection (vs 2026-04-30 baseline):**
- thenewfuse.com Error 1000: **PERSISTENT** (no change)
- relay.thenewfuse.com NXDOMAIN: **PERSISTENT** (no change)
- app.thenewfuse.com SPA not deployed: **PERSISTENT** (no change)
- API /docs 404: **PERSISTENT** (no change)
- extreamix.com health: **PERSISTENT** (still healthy)
- API CORS 500 on rejected preflight: **NEW FINDING** this sweep
- app.thenewfuse.com wildcard CORS: **NEW FINDING** this sweep
- API auth generic error messages: **NEW FINDING** this sweep
- API service endpoints 404 despite health reporting "active": **NEW FINDING** this sweep
- app.thenewfuse.com missing title/meta/OG: **NEW FINDING** this sweep
- GitHub link (whodaniel/fuse) returns 404: **NEW FINDING** this sweep

**Overall Pattern:** Core infrastructure issues (DNS, SPA deployment, missing docs) remain unresolved across multiple sweeps. New findings this sweep focused on security and UX issues that become visible upon deeper inspection. The extreamix properties continue to be the only fully healthy TNF assets.
