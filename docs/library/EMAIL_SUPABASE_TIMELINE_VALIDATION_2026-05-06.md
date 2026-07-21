`[CLASS:INTEL] [STATUS:VETTED] [DOC_TYPE:TECHNICAL_DOSSIER] [VISIBILITY:PRIVATE] [OWNER:TNF]`

``[CLASS:INTEL] [STATUS:VETTED] [DOC_TYPE:ANALYSIS_REPORT] [VISIBILITY:RESTRICTED] [OWNER:TNF]`

# Email Supabase Timeline Validation (2026-05-06)

## Scope
- Target table: `timeline_events`
- Session: `fcae5be6-333a-4999-86ce-933fe4590fb2`
- Owner principal header: `x-owner-principal-id: daniel`
- Validation script: `scripts/timeline/validate-email-supabase-timeline.mjs`
- Machine report: `data/protocols/email-supabase-timeline-validation.2026-05-06.json`

## Result Summary
- Imported rows validated: `425`
- Event date span: `1999-02-16` -> `2026-05-04`
- Source type distribution: `inferred = 425`
- Project lane distribution:
  - `daniel-adam-goldberg-life-story`: `304`
  - `daniel-who-s-media-empire`: `118`
  - `the-new-fuse-novel`: `3`
- Confidence distribution:
  - `hard`: `228`
  - `moderate`: `194`
  - `soft`: `3`

## Structural Integrity Checks
- Duplicate `story_key` tags: `0`
- Duplicate normalized `(event_date,title)` keys: `0`
- Missing `story_key` tags: `0`
- Era/year mismatches: `0`
- Future-dated events (relative to 2026-05-06): `0`
- Unsupported `source_type` values: `0`
- Weak/placeholder titles flagged: `0`

## Weak Title Queue (Needs Human Rewrite)
- Rewrite apply script: `scripts/timeline/apply-email-supabase-title-rewrites.mjs`
- Rewrites applied: `6`
- Pending weak-title rewrite queue size: `0`
- Queue artifact:
  - `data/protocols/email-supabase-weak-title-rewrite-queue.2026-05-06.json`

## Excluded Queue Reconciliation
- Source queue: `data/protocols/email-ledger-excluded-review.2026-05-06.json`
- Total excluded facts reviewed: `30`
- Resolution counts:
  - `keep_excluded_already_covered`: `10`
  - `keep_excluded_low_signal`: `14`
  - `keep_excluded_suspicious_subject`: `6`
  - `optional_review`: `0`

- Optional-review execution:
  - Imported into ledger + Supabase: `3` low-confidence facts (`2002-11-08`, `2002-11-18`, `2005-10-25`)
  - Initially held for manual adjudication: `1` fact (`1999-11-16 Welcome Aboard`)
  - Final adjudication: `0` remaining optional facts; held item resolved as already covered by exact evidence match.
  - Decision artifact: `data/protocols/email-optional-review-decision.2026-05-06.json`
  - Rollup artifact: `data/protocols/email-optional-review-import-rollup.2026-05-06.json`
  - Resolution artifact: `data/protocols/email-optional-review-resolution.2026-05-06.json`

### Optional Review Facts (Not Auto-Imported)
- None pending.
- Queue artifact (post-adjudication):
  - `data/protocols/email-exclusion-optional-review.2026-05-06.json`

## Notes
- Description template quality after enrichment completion: `0/425` descriptions remain in the generic template state.
- Description enrichment execution:
  - Queue apply script: `scripts/timeline/apply-email-supabase-description-enrichment.mjs`
  - Batch 001 applied: `50` rows updated (`offset=0`, `limit=50`)
  - Batch 002 applied: `50` rows updated (`offset=0`, `limit=50` on refreshed queue)
  - Batch 003 applied: `309` rows updated (`offset=0`, `limit=1000` on refreshed queue)
  - Progress rollup: `data/protocols/email-supabase-description-enrichment-rollup.2026-05-06.json`
- Description enrichment queue generated:
  - Script: `scripts/timeline/build-email-supabase-description-enrichment-queue.mjs`
  - Artifact: `data/protocols/email-supabase-description-enrichment-queue.2026-05-06.json`
- Validator logic now includes exact evidence overlap checks via unified ledger `evidenceRefs` (mailbox-path match), reducing false optional-review flags on renamed timeline events.
- Validation runs are read-only; row mutations referenced above came from separate title-rewrite and optional-import execution steps.
