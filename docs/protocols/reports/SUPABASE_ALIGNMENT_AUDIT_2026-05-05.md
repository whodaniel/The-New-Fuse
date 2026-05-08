# Supabase Alignment Audit (The New Fuse)

`[CLASS:INTEL] [STATUS:SYNCHRONIZED] [DOC_TYPE:TECHNICAL_DOSSIER] [VISIBILITY:AGENT_SCOPE] [OWNER:DANIEL_GOLDBERG]`

Date: 2026-05-05

## Scope

Validate alignment between:

1. Live Supabase project schema/migrations
2. TNF monorepo references and protocol artifacts
3. Virtual Library canonical/mirror migration files

## Platform Change Watch (Verified 2026-05-06)

- Supabase changelog reviewed from `https://supabase.com/changelog.md`.
- Latest breaking change:
  - `2026-05-01`: OAuth token endpoint returns HTTP `200` instead of `201`.
- Continuing watch item:
  - `2026-04-28`: new `public` tables are not auto-exposed to Data/GraphQL API.
- Impact note for TNF:
  - `librarian` and `librarian_ingest` are custom schemas, so the `public` table exposure change does not directly alter archive tables.
  - Keep explicit grants + RLS policy design for any future API-exposed tables.

## Live Supabase Snapshot

- Public tables include TNF + Virtual Library surfaces:
  - `story_sessions`, `story_answers`, `note_cards`, `timeline_events`,
    `library_navigation`, `story_session_agent_access`, `empire_assets`.
- Librarian schema present and populated:
  - `librarian.artifact` rows: `1820`
  - `librarian.artifact_text` rows: `1787`
  - `librarian.text_chunk` rows: `657`
  - `librarian.timeline_event` rows: `1650`
  - `librarian_ingest.ingestion_run` rows: `4`
  - `librarian_ingest.ingestion_artifact_result` rows: `1953`
- Migration history table (`supabase_migrations.schema_migrations`) currently lists:
  - `001 virtual_library_schema`
  - `002 story_privacy_wall`
  - `20260504014949 librarian_archive_v1_20260504`
  - `20260504015905 librarian_archive_fk_indexes_v1_20260504`
  - `20260506021624 librarian_rls_stage_v1_20260506`

## Post-RLS Revalidation (2026-05-06 02:56 UTC)

- Connection context:
  - `current_database = postgres`
  - `current_schema = public`
- Librarian security state:
  - `0/9` `librarian` + `librarian_ingest` tables have RLS disabled.
  - `9/9` `librarian` + `librarian_ingest` tables have RLS enabled.
  - `9` owner-scoped policies exist across those schemas.
- Owner backfill checks:
  - `librarian.timeline_event.owner_principal_id` nulls: `0`
  - `librarian_ingest.ingestion_run.owner_principal_id` nulls: `0`
- Role-behavior checks on `librarian.artifact`:
  - `authenticated` + empty claims: `0` rows visible
  - `authenticated` + `owner_principal_id = daniel`: `1820` rows visible
  - `service_role`: `1820` rows visible
- Grant model checks:
  - `anon`: no `USAGE` on `librarian` / `librarian_ingest`, `0` table `SELECT` grants
  - `authenticated`: schema `USAGE` true, `9` table `SELECT` grants
  - `service_role`: schema `USAGE` true, `9` table `SELECT` grants

## Courseforge Addendum (2026-05-06)

- Source: `courseforge-manuscript-branches`
- Source ID: `0a232d41-5683-44ba-95e4-dfbae235284f`
- Ingestion run: `18988939-b9ae-49f1-9108-973dad9881d1` (`created = 166`)
- Chunk run: `f31ab9b6-2504-469d-8a9b-5aac14492f3c` (`chunks = 657`)
- Retrieval smoke tests (FTS on `librarian.text_chunk`) verified:
  - `google ecosystem cookbook` → `main/00-Front-Cover.md`
  - `chapter 23 constitutional ai principles policies transparency claude behavior` → `anthropic-cookbook/Chapter-23-Constitutional-AI.md`
  - `open source ai ecosystem cookbook` → `opensource-cookbook/README.md`

## Alignment Actions Applied

1. Corrected stale table naming in protocol/tooling:
  - Replaced `story_session_agent_grants` with `story_session_agent_access` in:
    - `docs/protocols/TNF_VIRTUAL_LIBRARY_CONSOLIDATION_PROTOCOL.md`
    - `scripts/autonomy/virtual_library_surface_audit.py`
2. Regenerated audit artifacts from corrected source:
  - `docs/protocols/storage/tnf-virtual-library-surface-map.json`
  - `docs/protocols/reports/TNF_VIRTUAL_LIBRARY_SURFACE_AUDIT.md`
3. Applied librarian RLS rollout SQL to live schema state:
  - `20260506021624_librarian_rls_stage_v1_20260506.sql`

## Drift Status

1. Virtual Library migration history drift: `CLOSED`
  - Live project now has five aligned migration-history entries, including `20260506021624`.
  - Missing archive migration files were added in both canonical and mirror codebases.
2. Librarian RLS rollout drift: `APPLIED_OUT_OF_BAND`
  - SQL is live in schema state with verified policy behavior.
  - Migration history reconciliation completed via metadata insert for version `20260506021624`.
3. TNF root `supabase/migrations` remains a separate migration lane and still contains:
  - `001_create_vector_embeddings.sql`

## Security/Operational Advisory (Live Supabase)

- Resolved:
  - `librarian`/`librarian_ingest` RLS-disabled critical advisory.
- Remaining signals to manage:
  - `72` `public` tables with RLS enabled but no policies.
  - `public.rls_auto_enable()` still executable by `anon`/`authenticated`.
  - `121` `public` functions without explicit `search_path`.
  - `58` unindexed foreign keys (`public` schema SQL-derived check).
  - `1` table-action group with overlapping permissive policies (`story_sessions`).

## Recommended Next Alignment Step

1. Keep canonical/mirror migration parity checks in release gates.
2. Use `data/protocols/librarian-supabase-post-rls-state.2026-05-06.json` as the machine evidence source for future checkpoint updates.
3. Continue reducing residual `public`-schema advisories (no-policy tables, search-path warnings, and unindexed FKs).
