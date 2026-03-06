# thenewfuse.com Remediation Matrix

Generated: 2026-03-03
Input audits:
- /path/to/output/playwright/thenewfuse-audit-20260303-030110/report.json
- /path/to/output/playwright/thenewfuse-viewport-audit-20260303-070620/report.json

## P0 (Release Blocking)

### 1) /observatory hard-fails due 301 redirect to port 3000
- Production symptom:
  - `https://thenewfuse.com/observatory` returns `301` to `http://thenewfuse.com:3000/observatory/` and times out in browser automation.
- Evidence:
  - `requests.get(..., allow_redirects=False)` => status 301, location header to `:3000`.
- Likely owner:
  - Edge routing / Railway ingress / nginx rewrite config.
- Fix:
  - Remove port-3000 canonical/redirect behavior for `/observatory`.
  - Ensure HTTPS canonical redirect remains on `https://thenewfuse.com/observatory`.
- Acceptance:
  - `curl -I https://thenewfuse.com/observatory` returns 200 or 30x to HTTPS same-host without port.
  - Playwright navigation to `/observatory` succeeds <5s on desktop and mobile.

### 2) /main runtime crash: `CardHeader is not defined`
- Production symptom:
  - `/main` logs `ReferenceError: CardHeader is not defined`.
- Root cause:
  - Component uses `CardHeader`, `CardTitle`, `CardContent` without imports.
- Code references:
  - `apps/frontend/src/components/AgentChatRoom.tsx:86`
  - `apps/frontend/src/components/AgentChatRoom.tsx:87`
  - `apps/frontend/src/components/AgentChatRoom.tsx:89`
- Fix:
  - Import missing card subcomponents from `@/components/ui/card` (or use equivalents consistently).
  - Keep `GlassCard` usage consistent or migrate entire card usage to one component family.
- Acceptance:
  - No console errors on `/main` in desktop/mobile Playwright run.

### 3) /workspace-settings/* runtime crash: `System is not defined`
- Production symptom:
  - `/workspace-settings/llm-selection` and `/workspace-settings/chat-model` throw runtime page error.
- Root cause:
  - Hook calls `System.customModels(provider)` but `System` is never imported in hook file.
- Code references:
  - `apps/frontend/src/hooks/useGetProvidersModels.ts:80`
- Fix:
  - Add `import System from '@/models/system';` in hook.
  - Ensure `System.customModels` actually exists on model class and is typed.
- Acceptance:
  - No runtime errors on both routes.
  - Model dropdown populates or fails gracefully with UI message.

## P1 (High Priority / Stability)

### 4) `/main` tries websocket `ws://localhost:3001` in production
- Production symptom:
  - CSP violation and failed connect attempts in browser console.
- Root cause:
  - Hardcoded fallback URL in websocket service.
- Code references:
  - `apps/frontend/src/services/websocket.ts:15`
- Fix:
  - Remove localhost fallback for production builds.
  - Use environment-specific secure URL (`wss://...`) and no-op/feature flag if unset.
- Acceptance:
  - No CSP websocket violation logs on `/main`.

### 5) Orphan/invalid route surface exposed by route catalog and bundle
- Production symptom:
  - `/api/admin/database` and `/api/admin/features` present in client route surface but return 404.
- Code references:
  - Route inventory includes many non-frontend paths; related catalog entries:
    - `apps/frontend/src/config/routeCatalog.ts:199`
    - `apps/frontend/src/config/routeCatalog.ts:376`
- Fix:
  - Keep API endpoints out of frontend route discovery/navigation surfaces.
  - Separate API contracts from UI route catalog.
- Acceptance:
  - Crawled route set contains only valid UI routes.
  - 404 count for auto-discovered frontend pages reduced to expected-only.

## P2 (Quality / SEO Hygiene)

### 6) Meta description too long site-wide
- Production symptom:
  - 154/157 audited routes flagged `Meta description too long (>160)`.
- Likely cause:
  - Global static meta description reused on SPA shell.
- Fix:
  - Use per-route SEO head updates; cap descriptions to ~150-160 chars.
- Acceptance:
  - Re-audit: 0 pages with overlong meta description.

### 7) Multiple H1 across many routes
- Production symptom:
  - 145/157 routes have >1 H1.
- Likely cause:
  - Layout-level heading plus page-level heading combinations.
- Fix:
  - Standardize one H1 per route; downgrade secondary headings to H2/H3.
- Acceptance:
  - Re-audit: one H1 on public pages.

## Execution Order
1. P0-1 `/observatory` redirect fix (infra).
2. P0-2 `/main` import crash fix.
3. P0-3 workspace settings `System` import + method parity.
4. P1-4 websocket production URL handling.
5. P1-5 route catalog hygiene.
6. P2 SEO cleanup at scale.

## Fast Regression Checklist
- `/observatory` loads over HTTPS without port rewrite.
- `/main` has zero console errors.
- `/workspace-settings/llm-selection` and `/workspace-settings/chat-model` have zero runtime errors.
- Route crawl no longer discovers API-only routes as frontend pages.
- Public pages pass H1/meta thresholds.
