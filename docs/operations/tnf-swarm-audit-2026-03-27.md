# TNF Swarm Audit - 2026-03-27

## Scope

- Cloudflare workers:
  - `cloudflare-sharedstate`
  - `cloudflare-zeroclaw-relay`
  - `cloudflare-openclaw-runtime`
- Railway worker wrappers:
  - `railway-openclaw-gateway`
  - `railway-openclaw-sandbox`
- Frontend route crawl/audit tooling:
  - `apps/frontend/scripts/audit-all-routes-semantic.mjs`
  - `apps/frontend/scripts/audit-live-links.mjs`

## Policy Anchors

- `unified-ledger` is authoritative for task detail.
- Non-local worker runtimes must fail hard when required secrets are missing.
- Duplicate route groups (`86/56`) must be reviewed and classified.
- Frontend audit tooling must support authenticated crawling for multi-agent
  runs.

## Findings (Ordered by Severity)

### Critical

1. Non-local secret bypass risk in relay/runtime worker ingress paths

- Status: **fixed** in this pass.
- Evidence:
  - `cloudflare-zeroclaw-relay/src/index.ts`: missing-config hard gate and
    `/health` 503 on misconfiguration.
  - `cloudflare-openclaw-runtime/src/index.ts`: required-config hard gate and
    `/health` 503 on misconfiguration.

2. Railway gateway wrappers allowed insecure bootstrap

- Status: **fixed** in this pass.
- Evidence:
  - Removed `--allow-unconfigured` from:
    - `railway-openclaw-gateway/proxy.js`
    - `railway-openclaw-sandbox/proxy.js`
  - Non-local `OPENCLAW_GATEWAY_TOKEN` required (hard fail).
  - Token logging changed to local-only ephemeral generation without secret
    value exposure.

### High

3. Secret leakage via startup logs (`auth-profiles.json` printed)

- Status: **fixed** in this pass.
- Evidence:
  - Removed `cat "${AUTH_PROFILES_PATH}"` behavior and replaced with redacted
    readability check:
    - `railway-openclaw-gateway/entrypoint.sh`
    - `railway-openclaw-sandbox/entrypoint.sh`

4. Entry-point non-local secret requirement absent

- Status: **fixed** in this pass.
- Evidence:
  - Added non-local env detection and hard exit if `OPENCLAW_GATEWAY_TOKEN`
    missing in:
    - `railway-openclaw-gateway/entrypoint.sh`
    - `railway-openclaw-sandbox/entrypoint.sh`

### Medium

5. Frontend crawl tooling lacked authenticated session loading

- Status: **fixed** in this pass.
- Evidence:
  - Added storage-state and extra-header support in:
    - `apps/frontend/scripts/audit-all-routes-semantic.mjs`
    - `apps/frontend/scripts/audit-live-links.mjs`
  - Added crawl-auth flags in generated summary payloads for traceability.

6. Duplicate route groups (86/56) are auth-outcome clusters, not component
   duplicates

- Status: **reviewed**.
- Dataset used: `HEAD:apps/frontend/docs/audits/all-routes-semantic-audit.json`
  (generated `2026-03-26T10:59:43.383Z`).
- Group A: **86 routes** share one fingerprint and all resolve to `/auth/login`
  (status 200).
- Group B: **56 routes** share one fingerprint and all resolve to
  `/unauthorized` (status 200).
- Conclusion: these are route-protection outcome groups (expected from
  unauth/insufficient-role contexts), not direct duplicate-page implementation
  bugs.

## Unified-Ledger Authority Check

- Task detail view resolves core record from unified-ledger endpoints:
  - `apps/frontend/src/pages/Tasks/Detail.tsx` calls `getTask(id)` from
    `unifiedLedgerApi`.
  - `apps/frontend/src/services/unifiedLedgerApi.ts` maps `getTask` to
    `/api/unified-ledger/tasks/:id`.
- Compatibility endpoints exist server-side:
  - `apps/api/src/modules/unified-ledger/unified-ledger.controller.ts`
    (`/unified-ledger/tasks`, `/unified-ledger/tasks/:id`).

## Execution Constraints Observed During This Audit

- Browser-auth bridge exported zero cookies for `thenewfuse.com` from local
  Chrome profile (`/tmp/playwright_state_thenewfuse.json`).
- Playwright browser launch in this environment is unstable
  (`SIGTRAP`/`SIGABRT`), forcing HTTP fallback in semantic audit run.
- Crawl4AI import works in `.venv_crawler312`, but runtime crawl still blocked
  by browser launch failure in this environment.

## Current Risk Snapshot

- Secret-hardening risk: **reduced** (fixed in code paths above).
- Route-duplication risk: **interpreted as auth-state artifacts**; requires
  authenticated crawl run on a host where browser automation is stable.
- Unified-ledger authority for task detail: **aligned for core record
  retrieval**.

## Recommended Next Verification Run (Operational)

1. Run semantic/live-link audits on a host where Playwright browsers can launch.
2. Export a real authenticated storage state with cookies/session for the TNF
   app domain in active use.
3. Re-run route fingerprint analysis and verify 86/56 clusters collapse into
   expected protected surfaces.
