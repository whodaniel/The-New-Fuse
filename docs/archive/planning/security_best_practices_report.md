# Security Best Practices Report

**Date:** 2026-03-12  
**Scope:** JavaScript/TypeScript (NestJS backend, React frontend), build
tooling, scripts, and related docs  
**Method:** Targeted review for secret exposure and unsafe configuration

## Executive Summary

Critical secret exposure risk was identified in the frontend build pipeline: the
Vite config injected the full environment into the browser bundle. This has been
fixed by restricting exposure to `VITE_` variables only. However, existing build
artifacts still contain sensitive values and must be purged, and any exposed
secrets must be rotated immediately. Additional fixes remove hard-coded Supabase
keys and local absolute paths from scripts and frontend config.

## Findings

### CRITICAL-01: Full Environment Injection into Frontend Bundle

**Severity:** Critical  
**Rule:** REACT-CONFIG-001 (do not embed secrets in client bundle)  
**Locations:**

- `apps/frontend/vite.config.ts:167-182` (build-time env injection)
- `apps/frontend/dist/assets/js/app.BwseYXdW.js:128` (build artifact includes
  sensitive env keys)

**Evidence:**  
The Vite config was injecting `process.env` into the client bundle. This is now
constrained to `VITE_` variables only:

```ts
define: {
  __DEPLOYMENT_CONFIG__: JSON.stringify({ /* ... */ }),
  'process.env': JSON.stringify({
    NODE_ENV: mode,
    ...publicEnv,
  }),
},
```

The existing build artifact still contains non-public environment variables
(example key name redacted): `apps/frontend/dist/assets/js/app.BwseYXdW.js:128`

**Impact:**  
Any deployment or distribution of the existing bundle may expose secrets to end
users.

**Fix (Applied):**  
Restrict `loadEnv` to `VITE_` variables only, and only expose `publicEnv` to the
client bundle.

**Required Follow-up:**

1. Delete existing `apps/frontend/dist` artifacts.
2. Rotate any exposed secrets (example key names are in the artifact).
3. Rebuild frontend with the fixed config.

**Mitigation:**  
Add a CI check that fails if a bundle contains known secret key patterns.

---

### CRITICAL-02: Hard-coded Redis Credentials Embedded Across Code/Docs

**Severity:** Critical  
**Rule:** General secret handling – no credentials in code, configs, or docs  
**Locations (examples):**

- `config/database.ts:67-69` (runtime default)
- `apps/api/src/modules/agency-hub/services/a2a-message-broker.service.ts:690-692`
  (runtime default)
- `apps/backend/src/services/agent/trae-agent.ts:34` (runtime default)
- `docs/GETTING_STARTED.md:177` (setup example)

**Evidence (fixed):**

```ts
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
```

**Impact:**  
Embedding credentials in repository content exposes production infrastructure to
anyone with access to the repo history.

**Fix (Applied):**  
Replaced the hard-coded Redis URL credentials across code, scripts, and docs
with safe defaults or placeholders:

- Runtime code now defaults to `redis://localhost:6379` when `REDIS_URL` is not
  set.
- Docs/config examples now use
  `redis://default:<YOUR_REDIS_PASSWORD>@<REDIS_HOST>:<REDIS_PORT>`.

**Required Follow-up:**

1. Rotate the Redis credentials that were previously embedded.
2. Ensure `REDIS_URL` is set in Railway/production secrets.

**Mitigation:**  
Add a pre-commit/CI secret scan to block accidental credential commits.

---

### HIGH-01: Hard-coded Supabase Key in Sync Script

**Severity:** High  
**Rule:** EXPRESS (and general) secret handling – no secrets in code  
**Location:** `scripts/sync_to_supabase.cjs:4-14`

**Evidence (fixed):**

```js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
...
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment.');
  process.exit(1);
}
```

**Impact:**  
Previously hard-coded keys allow unauthorized access to Supabase.

**Fix (Applied):**  
Moved to environment variables.

**Required Follow-up:**  
Rotate the previously committed Supabase key.

---

### MEDIUM-01: Hard-coded Supabase Configuration in Frontend Library

**Severity:** Medium  
**Rule:** REACT-CONFIG-001 (no embedded secrets)  
**Location:** `self-prompting-dashboard/src/lib/supabase.ts:3-14`

**Evidence (fixed):**

```ts
const supabaseUrl =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  (globalThis as any).SUPABASE_URL ||
  '';
const supabaseAnonKey =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (globalThis as any).SUPABASE_ANON_KEY ||
  '';
```

**Impact:**  
If a non-anon key were ever embedded, it could grant elevated access to clients.

**Fix (Applied):**  
Use environment variables and fail fast when missing.

**Mitigation:**  
Ensure only Supabase **anon/public** keys are used in frontend builds.

---

### LOW-01: Hard-coded Local Codebase Paths in API Agent Services

**Severity:** Low  
**Rule:** Secure-by-default configuration hygiene  
**Locations:**

- `apps/api/src/agents/analyzer.service.ts`
- `apps/api/src/agents/implementer.service.ts`
- `apps/api/src/agents/reviewer.service.ts`
- `apps/api/src/agents/architect.service.ts`

**Impact:**  
Local absolute paths can break production deploys and leak local filesystem
structure.

**Fix (Applied):**  
Use `TNF_CODEBASE_ROOT` if set, otherwise auto-detect repo root via
`pnpm-workspace.yaml` / `turbo.json`.

---

## Remediation Checklist (Immediate)

1. **Rotate secrets** that were embedded in any frontend build artifacts.
2. **Purge** `apps/frontend/dist` artifacts and rebuild after secret rotation.
3. **Validate** that only `VITE_` variables are exposed in frontend builds.

## Notes

This report covers direct secret exposure and build configuration risks. A
broader security audit (auth, CSRF, SSRF, command injection, etc.) was not
performed in this pass.
