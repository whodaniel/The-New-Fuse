# TNF Library Registry Surface

`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:INDEX] [VISIBILITY:AGENT_SCOPE] [OWNER:DANIEL_GOLDBERG]`

## Purpose

Provide a deterministic, agent-readable home for manuscript discovery metadata
without forcing private narrative content into public/shared docs.

## Rules

1. All manuscript and story artifacts must be represented in
   `docs/library/REGISTRY.md`.
2. Manuscript docs must use `DOC_TYPE` values:
- `BOOK_MANUSCRIPT`
- `STORY_OUTLINE`
- `STORY_CHAPTER`
- `STORY_NOTE`
3. For manuscript doc types, include `[WORK_ID:<stable_slug>]`.
4. Private story content remains owner-scoped by default:
- `[VISIBILITY:PRIVATE]` or `[VISIBILITY:AGENT_SCOPE]`
- `[OWNER:<principal>]` required.

## Canonical Process

1. Register the work in `docs/library/REGISTRY.md` first.
2. Store private source content in owner-scoped Virtual Library storage
   (`story_sessions`, `story_answers`, related tables).
3. Promote to collective/public only via explicit release-state transition.

## Resume Anchors

For deterministic resumption of Librarian work and timeline/network/asset
mapping, use:

1. `data/protocols/librarian-master-index.json` (machine-first canonical index)
2. `docs/library/LIBRARIAN_INTEGRITY_CHECKPOINT_2026-05-05.md` (locked checkpoint)
3. `data/protocols/librarian-resume-manifest.json` (machine resume manifest)
4. `docs/library/LIBRARIAN_RESUME_MAP.md` (human-readable start point)
5. `docs/library/REGISTRY.md` (discovery ledger and status transitions)
6. `docs/library/COURSEFORGE_MANUSCRIPT_MAP_2026-05-05.md` (book branch-to-file map)
7. `data/protocols/courseforge-manuscript-inventory.2026-05-05.json` (machine inventory with blob SHAs)
8. `docs/library/EMAIL_NARRATIVE_DISCOVERY_2026-05-06.md` (email timeline archaeology + curated chronology/fact queue anchors)
9. `data/protocols/email-ledger-import-rollup.2026-05-06.json` (machine checkpoint of email chronology ingestion into unified timeline ledger)
10. `data/protocols/email-ledger-excluded-review.2026-05-06.json` (auditable queue of low-confidence and suspicious-subject facts not auto-imported)
11. `data/protocols/email-supabase-alignment.2026-05-06.json` (Supabase schema-aligned payload + applied sync execution checkpoint)
12. `docs/library/EMAIL_EXCLUSION_REVIEW_2026-05-06.md` (human-review checklist for excluded email facts)
13. `data/protocols/email-supabase-timeline-validation.2026-05-06.json` (machine validation report for synced Supabase timeline rows)
14. `docs/library/EMAIL_SUPABASE_TIMELINE_VALIDATION_2026-05-06.md` (human-readable validation + exclusion reconciliation checkpoint)
15. `data/protocols/email-supabase-weak-title-rewrite-queue.2026-05-06.json` (targeted rewrite queue for low-information timeline titles)
16. `data/protocols/email-optional-review-decision.2026-05-06.json` (deterministic decision record for optional low-confidence facts)
17. `data/protocols/email-optional-review-import-rollup.2026-05-06.json` (execution rollup for optional-fact import extension)
18. `data/protocols/email-supabase-description-enrichment-queue.2026-05-06.json` (staged queue for upgrading generic timeline descriptions)
19. `data/protocols/email-supabase-description-enrichment-rollup.2026-05-06.json` (batch execution progress for description quality upgrades)
20. `data/protocols/email-optional-review-resolution.2026-05-06.json` (final adjudication artifact closing remaining optional low-confidence hold)
