# Email Narrative Discovery (2026-05-06)

## Scope
- Source: `~/Library/Mail/V9`
- File type processed: `.emlx` (excluding `.partial.emlx`)
- Process: full metadata pass + oldest-first content pass + dedupe

## Coverage
- Files discovered: `50,963`
- Files processed: `50,963`
- Unique messages classified: `40,104`
- Duplicate copies skipped: `10,859`
- Earliest dated message: `1999-02-16T20:12:14.000Z`
- Latest dated message: `2026-05-11T15:08:31.000Z`

## Classification Totals
- `marketing_newsletter`: `13,950`
- `transactional`: `5,199`
- `system_notification`: `4,759`
- `personal_interaction`: `3,288`
- `low_interaction_misc`: `7,411`
- `junk_irrelevant`: `5,497`

## Key Output Artifacts
- Summary: `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/email-discovery-summary.json`
- Full classified index (JSONL): `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/email-discovery-classified.jsonl`
- Narrative candidates (JSONL): `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/email-narrative-candidates.jsonl`
- Duplicate map (JSONL): `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/email-duplicate-copies.jsonl`
- Contact history: `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/email-contact-history.json`
- Timeline fact intake draft: `data/protocols/email-fact-intake.2026-05-06.json`
- Timeline synthesis summary: `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/timeline-synthesis/email-timeline-synthesis-summary.json`
- Perspective digest summary: `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/timeline-synthesis/email-perspective-digest.json`
- Curated chronology (JSON): `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/timeline-synthesis/email-chronology-curated.json`
- Curated chronology (Markdown): `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/timeline-synthesis/email-chronology-curated.md`
- Ambiguous review queue: `reports/personal-archaeology/email-discovery-full-2026-05-06-v2/timeline-synthesis/email-chronology-ambiguous.json`
- Fact candidate queue (pending human review): `data/protocols/email-fact-candidate-queue.2026-05-06.json`
- Ledger import rollup: `data/protocols/email-ledger-import-rollup.2026-05-06.json`
- Ledger exclusion review queue: `data/protocols/email-ledger-excluded-review.2026-05-06.json`
- Human exclusion review sheet: `docs/library/EMAIL_EXCLUSION_REVIEW_2026-05-06.md`
- Supabase sync payload: `data/protocols/email-supabase-timeline-sync-payload.2026-05-06.json`
- Supabase alignment checkpoint: `data/protocols/email-supabase-alignment.2026-05-06.json`
- Supabase validation report (JSON): `data/protocols/email-supabase-timeline-validation.2026-05-06.json`
- Supabase validation checkpoint (Markdown): `docs/library/EMAIL_SUPABASE_TIMELINE_VALIDATION_2026-05-06.md`
- Optional exclusion review queue: `data/protocols/email-exclusion-optional-review.2026-05-06.json`
- Weak-title rewrite queue: `data/protocols/email-supabase-weak-title-rewrite-queue.2026-05-06.json`
- Optional review decision log: `data/protocols/email-optional-review-decision.2026-05-06.json`
- Optional review import rollup: `data/protocols/email-optional-review-import-rollup.2026-05-06.json`
- Optional review resolution artifact: `data/protocols/email-optional-review-resolution.2026-05-06.json`
- Description enrichment queue: `data/protocols/email-supabase-description-enrichment-queue.2026-05-06.json`

## Notes
- Dedupe key priority: `Message-ID`, with fallback hash on date/from/to/subject.
- Candidate sorting is chronology-first; undated records are pushed to the end.
- Narrative candidate filters now exclude most spam/marketing-only records unless they carry strong timeline relevance.
- Inferred sender aliases include anonymized relay-style addresses from sent history (for example, marketplace reply aliases). Keep this for audit, but validate before identity modeling.

## Curation Phase (High-Signal Chronology)
- Curated chronology selected `438` high-signal milestones across `27` years (`1999` through `2026`).
- Selection rule emphasizes dated records, direct interaction weight, domain overlap, and evidence-bearing subjects (for example: approvals, invoices, receipts, registrations, support/install exchanges).
- Near-threshold/noisy events are not discarded; they are kept in a separate ambiguous queue for manual adjudication.

## Fact Queue Phase (Pending Review)
- Structured fact candidate queue generated from curated chronology: `438` candidate facts.
- Confidence distribution:
  - `high`: `216`
  - `medium`: `198`
  - `low`: `24`
- Every candidate includes evidence linkage (`eventId`, `mailboxPath`, sender, subject, `dateIso`, and scoring metadata).

## Ledger Import Phase (Applied Batches)
- Import script added: `scripts/timeline/import-email-facts-to-ledger.mjs`
- Applied windows (oldest-first):
  - `1999`-`2006`: `75` events imported
  - `2007`-`2012`: `103` events imported (`5` suspicious subjects excluded)
  - `2013`-`2016`: `70` events imported (`1` suspicious subject excluded)
  - `2017`-`2020`: `72` events imported
  - `2021`-`2026`: `102` events imported
- Optional-review extension import (targeted low-confidence queue): `3` events imported (initially `1` optional fact held, later resolved as already covered)
- Total imported timeline events from email archaeology: `425`
- Total confidence mix imported: `228 hard`, `194 moderate`, `3 soft`
- Imported date range: `1999-02-16T00:00:00.000Z` -> `2026-05-04T13:00:36.000Z`
- Project mix imported:
  - `Personal Life Story (Private)`: `304`
  - `Media Empire Story (Private)`: `118`
  - `The New Fuse Novel`: `3`
- Queue coverage snapshot:
  - Candidate facts: `438`
  - Medium/high facts: `414`
  - Low-only facts not imported: `21`
  - Suspicious-subject facts excluded by default filter: `6`
- Import audit artifacts:
  - `data/protocols/email-ledger-import-batch-1999-2006.2026-05-06.json`
  - `data/protocols/email-ledger-import-rollup.2026-05-06.json`
  - `data/protocols/email-ledger-excluded-review.2026-05-06.json`
  - `data/protocols/email-optional-review-import-rollup.2026-05-06.json`
- Idempotency verified:
  - Replay dry-run for `--min-confidence medium` returns `importedEvents=0` with all remaining records either already imported or excluded by suspicious-subject filter.

## Supabase Alignment Phase
- Supabase payload builder script added: `scripts/timeline/build-supabase-email-timeline-sync-payload.mjs`
- Supabase sync script added: `scripts/timeline/sync-email-facts-to-supabase.mjs`
- Timeline sync payload built from imported ledger events:
  - Facts in payload: `425`
  - Date range: `1999-02-16` -> `2026-05-04`
- Sync execution state (2026-05-06):
  - Credentials resolved from `apps/api/.env` and used through `node --env-file=apps/api/.env ...`.
  - Dry-run verification: `selectedFacts=422`, `pendingInserts=422`, `skippedInvalid=0`.
  - Apply run completed: `inserted=422`.
  - Post-apply verification dry-run: `existingTimelineRowsScanned=422`, `pendingInserts=0`, `skippedExisting=422`.
  - Optional-review extension sync: `selectedFacts=425`, `pendingInserts=3`, `inserted=3`, post-apply `pendingInserts=0`.
  - Sync script hardened for schema compliance: unsupported `sourceType` values now map to `inferred`, with original value preserved in tags as `source_type_raw:<value>`.
  - Supabase MCP direct SQL path remains authentication-gated in this session; `supabase` CLI fallback is still not installed.
  - Alignment checkpoint updated in `data/protocols/email-supabase-alignment.2026-05-06.json`.

## Supabase Validation & Exclusion Reconciliation Phase
- Validation script added: `scripts/timeline/validate-email-supabase-timeline.mjs`
- Title rewrite apply script added: `scripts/timeline/apply-email-supabase-title-rewrites.mjs`
- Description enrichment queue scripts added:
  - `scripts/timeline/build-email-supabase-description-enrichment-queue.mjs`
  - `scripts/timeline/apply-email-supabase-description-enrichment.mjs`
- Supabase validation pass completed on session `fcae5be6-333a-4999-86ce-933fe4590fb2`:
  - `425` rows validated
  - `0` duplicate story keys
  - `0` duplicate `(date,title)` normalized pairs
  - `0` era mismatches
  - `0` missing story keys
  - `0` weak/placeholder titles pending after rewrite apply (`6` rewrites applied)
  - Description enrichment progress: `409` rows updated across batches 001-003; `0` generic descriptions remain queued
- Excluded queue reconciliation completed (`30` facts):
  - `10` retained as already covered by existing timeline entries
  - `14` retained as low-signal
  - `6` retained as suspicious-subject
  - `0` remains in optional human review after evidence-based adjudication (post import of 3 targeted optional facts)
- Validation artifacts:
  - `data/protocols/email-supabase-timeline-validation.2026-05-06.json`
  - `docs/library/EMAIL_SUPABASE_TIMELINE_VALIDATION_2026-05-06.md`
  - `data/protocols/email-exclusion-optional-review.2026-05-06.json`
  - `data/protocols/email-supabase-weak-title-rewrite-queue.2026-05-06.json`
  - `data/protocols/email-optional-review-decision.2026-05-06.json`
  - `data/protocols/email-optional-review-import-rollup.2026-05-06.json`
  - `data/protocols/email-optional-review-resolution.2026-05-06.json`
  - `data/protocols/email-supabase-description-enrichment-queue.2026-05-06.json`
  - `data/protocols/email-supabase-description-enrichment-rollup.2026-05-06.json`
