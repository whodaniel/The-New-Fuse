# TNF Launch War Room - March 3, 2026

## Completed in this execution window

- Strict release gate passed locally (`node scripts/release-gate.cjs --strict`).
- Frontend production deployment succeeded on CloudRuntime:
  - Service: `TheNewFuse`
  - Deployment ID: `46c77068-4083-4f5c-a6ce-38efe62dac3e`
  - Status: `SUCCESS`
- Observatory route fixed at edge behavior level:
  - `GET /observatory` now returns `200` (no `:3000` redirect leak)
  - `GET /observatory/` returns `200`
- Core runtime checks passing:
  - `https://thenewfuse.com/health` -> `200`
  - `https://thenewfuse.com/main` -> `200`
  - `https://thenewfuse.com/api/health` -> `200`

## Code/config changes applied

- `.cloud_runtimeignore`
  - Added root-anchored exclusions to reduce upload payload and prevent CloudRuntime
    upload timeouts.
- `apps/frontend/nginx.conf`
  - Added `absolute_redirect off;` and `port_in_redirect off;`
  - Added exact `/observatory` and `/observatory/` SPA handlers
  - Updated SPA fallback to `try_files $uri /index.html;`

## Remaining hard blocker(s) for "fully real" external surface

1. API custom domain DNS is not resolving publicly:
   - `api.thenewfuse.com` currently does not resolve via public DNS checks.
   - CloudRuntime service has custom domain attached, but DNS appears not propagated
     or misconfigured.

## Immediate next actions (owner: platform ops)

1. In DNS provider, ensure `api.thenewfuse.com` is correctly pointed to CloudRuntime
   target for api-gateway.
2. Re-verify externally:
   - `https://api.thenewfuse.com/health` -> expect `200`
   - `https://api.thenewfuse.com/v1/health` -> expect `200/404` per gateway
     route policy
3. Re-run production smoke + UI-focused audit after DNS fix.

## Additional live verification (09:32 UTC)

- `https://thenewfuse.com/api` -> `200`
- `https://thenewfuse.com/api/health` -> `200`
- `https://thenewfuse.com/api/auth/session` -> `200` (`authenticated:false`
  expected when logged out)
- `https://thenewfuse.com/api/unified-ledger/records?kind=task` -> `200`

## Launch posture

- Platform is operational and active through primary domain + same-origin API
  (`thenewfuse.com/api/*`).
- Remaining external-domain blocker is isolated to DNS resolution for
  `api.thenewfuse.com` (NXDOMAIN).
