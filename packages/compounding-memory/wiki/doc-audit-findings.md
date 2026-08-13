# Verified Doc: Audit Findings

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1777320729.542004

## Content

# Security Audit Findings

Consolidated from: `SECURITY_AUDIT_FINDINGS.md` (Dec 2025) and
`security_best_practices_report.md` (Mar 2026).

## Audit 1: Codebase Secret Exposure (Dec 2025)

### 1. Hardcoded Password in Test File

- **Issue:** A test file contained a hardcoded password.
- **Status:** FIXED — Replaced with dynamically generated test credentials in
  `apps/api/src/security/security-testing.service.ts` and
  `test-suite/security/input-sanitization.test.ts`.

### 2. Default Secrets in Codebase

- **Issue:** Several files used default secrets when an environment variable was
  not set.
- **Status:** FIXED — Removed hardcoded fallbacks in
  `apps/backend/src/auth/agent-jwt.strategy.ts` and
  `packages/core/src/auth/auth.module.ts`. The application now throws an error
  if required secrets are not provided via environment variables.

### 3. Unencrypted API Keys in Database

- **File:** `packages/database/src/drizzle/schema/configuration.ts`
- **Issue:** The `providerApiKeys` table had fields that required encryption.
- **Status:** FIXED — The schema now uses `encrypted_key` and encryption is
  enforced in the repository layer.

### 4. Unencrypted Auth Token in Database

- **File:** `packages/database/src/drizzle/schema/agents.ts`
- **Issue:** The `agentRegistrations` table used a plaintext `authToken` field.
- **Status:** FIXED — Renamed to `encryptedAuthToken` and implemented
  deterministic hashing in `DrizzleAgentRepository`.

---

## Audit 2: Build Pipeline & Configuration (Mar 2026)

### CRITICAL-01: Full Environment Injection into Frontend Bundle

- **Severity:** Critical
- **Rule:** REACT-CONFIG-001 (do not embed secrets in client bundle)
- **Locations:** `apps/frontend/vite.config.ts:167-182` (build-time env
  injection)
- **Status:** FIXED — `loadEnv` restricted to `VITE_` variables only; only
  `publicEnv` exposed to client bundle.
- **Required Follow-up:**
  1. Delete existing `apps/frontend/dist` artifacts.
  2. Rotate any exposed secrets.
  3. Rebuild frontend with the fixed config.
- **Mitigation:** Add a CI check that fails if a bundle contains known secret
  key patterns.

### CRITICAL-02: Hard-coded Redis Credentials

- **Severity:** Critical
- **Locations:** `config/database.ts`,
  `apps/api/src/modules/agency-hub/services/a2a-message-broker.service.ts`,
  `apps/backend/src/services/agent/trae-agent.ts`, `docs/GETTING_STARTED.md`
- **Status:** FIXED — Replaced hard-coded Redis URL credentials with safe
  defaults or placeholders. Runtime code defaults to `redis://localhost:6379`.
- **Required Follow-up:** Rotate previously embedded Redis credentials. Ensure
  `REDIS_URL` is set in production secrets.

### HIGH-01: Hard-coded Supabase Key in Sync Script

- **Severity:** High
- **Location:** `scripts/sync_to_supabase.cjs:4-14`
- **Status:** FIXED — Moved to environment variables.
- **Required Follow-up:** Rotate the previously committed Supabase key.

### MEDIUM-01: Hard-coded Supabase Configuration in Frontend

- **Severity:** Medium
- **Location:** `self-prompting-dashboard/src/lib/supabase.ts:3-14`
- **Status:** FIXED — Use environment variables and fail fast when missing.
- **Mitigation:** Ensure only Supabase **anon/public** keys are used in frontend
  builds.

### LOW-01: Hard-coded Local Codebase Paths in API Agent Services

- **Severity:** Low
- **Locations:** `apps/api/src/agents/analyzer.service.ts`,
  `implementer.service.ts`, `reviewer.service.ts`, `architect.service.ts`
- **Status:** FIXED — Use `TNF_CODEBASE_ROOT` if set, otherwise auto-detect repo
  root.

---

## Remediation Checklist

1. **Rotate secrets** that were embedded in any frontend build artifacts.
2. **Purge** `apps/frontend/dist` artifacts and rebuild after secret rotation.
3. **Validate** that only `VITE_` variables are exposed in frontend builds.
4. Add pre-commit/CI secret scan to block accidental credential commits.

## Notes

These audits cover direct secret exposure and build configuration risks. A
broader security audit (auth, CSRF, SSRF, command injection, etc.) was not
performed in these passes. See also: `SECURITY_MIGRATION_GUIDE.md` (moved to
`docs/security/migration-guide.md`).

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
