# Librarian RLS Blueprint (Applied Out-of-Band)

`[CLASS:INTEL] [STATUS:APPLIED_OUT_OF_BAND] [DOC_TYPE:TECHNICAL_DOSSIER] [VISIBILITY:AGENT_SCOPE] [OWNER:DANIEL_GOLDBERG]`

Date: 2026-05-05

## Purpose

Define and verify a safe rollout pattern for Row Level Security (RLS) on
`librarian` and `librarian_ingest` without breaking owner workflows.

## Current Verified State (2026-05-06 02:56 UTC)

- RLS table state (`librarian` + `librarian_ingest`):
  - enabled: `9`
  - disabled: `0`
- Policy count across those schemas: `9`
- Live archive data snapshot:
  - `librarian.artifact`: `1820`
  - `librarian.artifact_text`: `1787`
  - `librarian.text_chunk`: `657`
  - `librarian.timeline_event`: `1650`
  - `librarian_ingest.ingestion_run`: `4`
  - `librarian_ingest.ingestion_artifact_result`: `1953`
- Owner backfill checks:
  - `librarian.timeline_event.owner_principal_id` nulls: `0`
  - `librarian_ingest.ingestion_run.owner_principal_id` nulls: `0`
- Role behavior checks on `librarian.artifact`:
  - `authenticated` with empty claims: `0` rows
  - `authenticated` with `owner_principal_id = daniel`: `1820` rows
  - `service_role`: `1820` rows

## Rollout Design Constraints

1. Preserve owner-scoped read/write for Daniel workflows.
2. Keep explicit grants compatible with Supabase Data API exposure semantics.
3. Keep `anon` blocked for archive schemas.
4. Avoid policy ambiguity; keep one owner policy per table.
5. Preserve backend `service_role` behavior.

## Applied SQL Artifacts

- Blueprint SQL (source):
  - `docs/protocols/reports/sql/librarian_rls_blueprint_2026-05-05.sql`
- Staged migration artifacts:
  - `apps/virtual-library-blueprints/supabase/migrations/20260506021624_librarian_rls_stage_v1_20260506.sql`
  - `~/Projects/virtual-library-blueprints/supabase/migrations/20260506021624_librarian_rls_stage_v1_20260506.sql`

## Provenance

- Rollback validation completed before live apply:
  - timestamp: `2026-05-06T02:13:44Z`
  - script: `scripts/library/validate-librarian-rls-blueprint.sh`
  - outcome: SQL executed cleanly and rolled back cleanly.
- 2026-05-06 SQL revisions retained in blueprint:
  - owner backfill ordering fix (defaults after backfill)
  - timeline backfill scope fix (`LATERAL` replacement)
  - explicit privilege model alignment

## Apply Mode and Reconciliation

- Apply mode: direct SQL apply to live schema state (out-of-band from migration-history insert path).
- Migration-history reconciliation:
  - `supabase_migrations.schema_migrations` now includes `20260506021624` as a reconciled metadata marker entry.
  - schema behavior remains verified and aligned with migration metadata.

## Policy Surface (Live)

- `librarian.owner_manage_source`
- `librarian.owner_manage_artifact`
- `librarian.owner_manage_artifact_blob`
- `librarian.owner_manage_artifact_text`
- `librarian.owner_manage_text_chunk`
- `librarian.owner_manage_timeline_event`
- `librarian.owner_manage_timeline_event_artifact`
- `librarian_ingest.owner_manage_ingestion_run`
- `librarian_ingest.owner_manage_ingestion_artifact_result`

## Source References

- Supabase RLS guide:
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase custom schema API exposure model:
  https://supabase.com/docs/guides/api/using-custom-schemas
- Supabase Data API behavior / explicit grants change:
  https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- Machine evidence snapshot:
  `data/protocols/librarian-supabase-post-rls-state.2026-05-06.json`
