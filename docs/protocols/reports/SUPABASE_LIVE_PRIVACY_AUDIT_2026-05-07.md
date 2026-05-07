# Supabase Live Privacy Audit — 2026-05-07

## Scope

- Live database connectivity and policy posture verification using local authenticated environment.
- Cross-check against repo-side static SQL RLS audit.

## Live Checks Performed

1. Database connectivity test (`psql` with local `DATABASE_URL`) -> success.
2. Public schema table + RLS counts.
3. Public schema policy counts.
4. Detection of `public` tables with grants to `anon/authenticated` but no RLS.
5. Detection of risky policy patterns:
   - `raw_user_meta_data` references
   - `auth.jwt()` references

## Results

- `public_tables=80`
- `public_tables_rls_enabled=80`
- `public_policy_count=17`
- `public_rls_no_policy=72`
- `public tables with anon/auth SELECT and rowsecurity=false = 0`
- `policies using raw_user_meta_data = 0`
- `policies using auth.jwt() = 0`

## Interpretation

- All current `public` tables have RLS enabled.
- A large subset of `public` tables has RLS enabled without explicit policies; this is deny-by-default behavior for non-privileged roles.
- No live evidence was found of the specific high-risk policy anti-patterns checked above.

## Repo Gate Alignment

- Added strict baseline-aware static audit:
  - `scripts/security/supabase-rls-audit.cjs`
  - `scripts/security/supabase-rls-baseline.json`
- Added CI gate:
  - `.github/workflows/privacy-security-gate.yml`

This ensures new schema additions do not silently expand public access without review.
