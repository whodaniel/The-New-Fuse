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

2. Restricted header-based scope fallbacks to service-role requests only:

- `public.current_owner_principal_id()`
- `public.current_agent_id()`
- `public.has_collective_scope()`
- helper added: `public.current_request_role()`

Migration file created:

- `apps/virtual-library-blueprints/supabase/migrations/20260506215000_restrict_header_scope_fallbacks.sql`

## REST Behavior Validation

Using anon key:

1. `story_sessions` without owner header:

- HTTP 200, rows: 0

2. `story_sessions` with `x-owner-principal-id: daniel`:

- HTTP 200, rows: 0

3. `timeline_events` without owner header:

- HTTP 200, rows: 0

4. `timeline_events` with `x-owner-principal-id: daniel`:

- HTTP 200, rows: 0

## Residual Risk

- Browser/anon clients no longer gain owner-scoped access via forged owner
  header.
- Any workflow that previously depended on anon + owner header must now use
  authenticated JWT claims or trusted backend/service-role mediation.

## Outcome

- Core RLS and schema-isolation posture is active.
- Header-spoof owner access path is closed for anon/public requests.
