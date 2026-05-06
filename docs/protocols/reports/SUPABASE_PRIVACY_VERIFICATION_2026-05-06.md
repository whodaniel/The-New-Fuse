# Supabase Privacy Verification (2026-05-06)

## Scope

- Project ref: `wslydgtgindrywldatbv`
- Verification date (UTC): 2026-05-06
- Data source: direct SQL (`psql` via `DATABASE_URL`) + REST API checks with
  `SUPABASE_ANON_KEY`
- Detailed private artifact:
  `data/private/protocols/supabase-privacy-verification.2026-05-06.private.json`

## Verified Controls

1. RLS enabled on all target librarian/session tables:

- `librarian.*` archive tables
- `librarian_ingest.*`
- `public.story_sessions`
- `public.timeline_events`

2. Schema usage isolation for archive schemas:

- `anon`: no `USAGE` on `librarian` or `librarian_ingest`
- `authenticated` and `service_role`: `USAGE = true`

3. Public schema baseline:

- `public_tables_without_rls = 0`
- `public_tables_no_rls_anon_select = 0`
- `public_tables_no_rls_authenticated_select = 0`

4. Data integrity spot checks:

- `librarian.timeline_event` rows: 1650, owner nulls: 0
- `librarian_ingest.ingestion_run` rows: 4, owner nulls: 0
- `public.story_sessions` rows: 3, owner nulls: 0
- `public.timeline_events` rows: 426

## Hardening Applied During This Pass

1. Reduced execute grants on `public.rls_auto_enable()`:

- revoked from: `PUBLIC`, `anon`, `authenticated`
- retained for: `postgres`, `service_role`

Migration file created:

- `apps/virtual-library-blueprints/supabase/migrations/20260506213800_harden_rls_auto_enable_execute_grants.sql`

## REST Behavior Validation

Using anon key:

1. `story_sessions` without owner header:

- HTTP 200, rows: 0

2. `story_sessions` with `x-owner-principal-id: daniel`:

- HTTP 200, rows: 3

3. `timeline_events` without owner header:

- HTTP 200, rows: 0

4. `timeline_events` with `x-owner-principal-id: daniel`:

- HTTP 200, rows: 3 (sampled)

## Critical Residual Risk

`public.current_owner_principal_id()` currently accepts `x-owner-principal-id`
directly when JWT lacks `owner_principal_id`.

Current function behavior allows owner-context access via anon key + spoofed
owner header. This means data isolation depends on secrecy of owner principal
identifiers, which is not a strong security boundary for a public endpoint.

## Required Next Hardening (Priority 0)

1. Remove or constrain header fallback in:

- `public.current_owner_principal_id()`
- `public.current_agent_id()`
- `public.has_collective_scope()`

2. Recommended policy target:

- Allow header-based fallback only for trusted server-side/service-role calls.
- Require JWT claims for browser/anon paths.

3. Re-run this verification report after policy/function update and confirm:

- anon + forged owner header returns 0 rows.

## Outcome

- Core RLS and schema-isolation posture is active.
- One high-severity authorization gap remains in header-based owner/agent scope
  fallback and should be remediated before treating timeline data as fully
  private from public clients.
