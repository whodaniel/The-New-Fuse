# TNF Development Journey Reconstruction

Date: 2026-03-19  
Status: Seeded

## Objective

Use existing TNF timeline-capable surfaces and durable project evidence to
reconstruct as much of the TNF development journey as can be defended from
primary artifacts.

This is not just a narrative exercise. The goal is to build an evidence-backed
timeline that can later be ingested into TNF-native timeline and unified-ledger
surfaces.

## Verified Anchor Dates

1. `whodaniel/fuse` GitHub repository created: `2025-04-11T20:44:10Z`
   - Source: GitHub repository metadata for `whodaniel/fuse`
   - URL: `https://github.com/whodaniel/fuse`
2. Original `clawdbot/clawdbot` GitHub path permanently redirects to
   `openclaw/openclaw`
   - Interpretation: the original ClawdBot repo path was renamed rather than
     replaced by a separate repository
   - Source: GitHub API redirect from `repos/clawdbot/clawdbot` to the current
     repository identity
3. `openclaw/openclaw` repository created: `2025-11-24T10:16:47Z`
   - Source: GitHub repository metadata for `openclaw/openclaw`
   - URL: `https://github.com/openclaw/openclaw`
4. Verified precedence:
   - `whodaniel/fuse` predates the original ClawdBot/OpenClaw repository by
     `226 days, 13 hours, 32 minutes, 37 seconds`
5. Earliest currently visible commit dates in the local TNF git history:
   - `2025-05-20T14:11:42-04:00` `fddd7556409bc64501cd70769810f80f7f519330`
   - `2025-05-20T14:16:42-04:00` `a9633d89b38f168adbf1c95c83fcbb4e2e0626ed`
   - `2025-05-20T14:21:33-04:00` `a97ede43e86879d5b654b9e6f1c5aaefa57ccffe`
   - Important caveat: the current git history is not proof of conceptual
     origin. Imported history, cleanup, repo restarts, and retcons can all make
     the visible git root later than the true development origin.

## Strongest Evidence Sources

### Hard evidence

1. GitHub repository creation metadata
2. Local git commit history
3. File-scoped git history for milestone documents
4. Dated strategy, migration, release, QA, and session summary documents
5. Timestamped trajectory logs and audit artifacts

### Strong secondary evidence

1. Handoff and memory artifacts
2. Mirror plans and migration plans
3. Deployment logs and rollout reports
4. Protocol reports with embedded dates in file names

### Inference-only material

1. Retrospective summaries without primary timestamps
2. High-level phase narratives reconstructed from clusters of documents
3. Personal recollection that is not yet anchored to a durable artifact

## Existing TNF Surfaces To Reuse

1. Unified ledger timeline event storage and filtering
   - `apps/api/src/modules/unified-ledger/unified-ledger.service.ts`
   - `apps/api/src/modules/unified-ledger/unified-ledger.types.ts`
2. Timeline event API and record lifecycle hooks
   - `apps/api/src/modules/unified-ledger/unified-ledger.controller.ts`
3. Timeline UI module and D3 timeline rendering
   - `apps/frontend/src/features/timeline/TimelineModule.tsx`
   - `apps/frontend/src/features/timeline/components/EnhancedTimelineView.tsx`
4. Activity and audit history surfaces
   - `apps/frontend/src/components/ActivityFeed.tsx`
   - `apps/frontend/src/components/AdminPanel/AuditLogs.tsx`

## Seed Evidence Inventory

1. Session summaries
   - `FINAL-SESSION-SUMMARY.md`
   - `SESSION-SUMMARY.md`
   - `SESSION_SUMMARY_2025-12-28.md`
2. Release and QA artifacts
   - `RELEASE_WAR_ROOM_2026-03-03.md`
   - `QA_REPORT_2026-01-11.md`
   - `QA_BUG_REPORT_2026-01-11.md`
3. Protocol report stream
   - `docs/protocols/reports/`
4. Playwright audit outputs
   - `output/playwright/`
5. Trajectory logs
   - `logs/trajectories/`
6. Migration and mirror strategy documents
   - `docs/migration/`
   - `docs/database/MIGRATION_PROGRESS_REPORT.md`
   - `docs/database/MIGRATION_COMPLETE_SUMMARY.md`
   - `TNF_OPENCLAW_CLOUDFLARE_MIRROR_PLAN.md`

## Recommended Reconstruction Model

Each timeline event should be normalized into a record with:

1. Exact timestamp if available
2. Event category
3. Short label
4. Summary
5. Confidence tier: `hard`, `strong`, `moderate`, or `inferred`
6. Evidence references
7. Optional phase grouping for larger eras of development

Proposed event categories:

1. `repo_created`
2. `commit_milestone`
3. `strategy_doc`
4. `migration`
5. `qa`
6. `execution`
7. `inference`

## Reconstruction Rules

1. Never mix hard evidence and inferred narrative without an explicit confidence
   marker.
2. If two dates disagree, record the dispute rather than collapsing them into a
   single claim.
3. Treat repo restarts, tech-stack resets, and architectural pivots as first
   class events rather than timeline noise.
4. Keep provenance attached to every reconstructed event so the timeline can be
   challenged and improved later.

## Immediate Next Steps

1. Export a normalized evidence ledger from git history, GitHub metadata, and
   dated artifacts.
2. Separate hard-evidence events from inferred phase summaries.
3. Ingest the hard-evidence batch into TNF as `historical_event` entries.
4. Render the reconstructed history in the existing TNF timeline surfaces.
5. Backfill pre-repo and multi-restart phases only when durable evidence can be
   attached.

## Conclusion

The evidence already supports a defensible claim that TNF and `whodaniel/fuse`
were in active development well before the original ClawdBot/OpenClaw repository
appeared on GitHub. The next stage is to convert that proof into a
machine-readable TNF-native timeline rather than leaving it scattered across git
history, reports, and memory artifacts.
