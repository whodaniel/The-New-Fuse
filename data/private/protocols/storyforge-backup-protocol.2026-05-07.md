# Story Forge Backup Protocol (Private)

Generated: 2026-05-07

## Purpose
Create deterministic, restorable backups of private narrative data for owner + authorized agents only.

## Private Storage Locations
- Supabase event exports: `data/private/supabase-backups/`
- Backup manifests/checksums: `data/private/protocols/`
- Local private working ledgers: `data/private/` (preferred)

## Naming Convention
- Backup payload: `email-archaeology-events-owner-<owner>-YYYY-MM-DD-<phase>.json`
- Manifest: `supabase-email-archaeology-backup-manifest.YYYY-MM-DD-<phase>.json`
- Index bundle: `storyforge-private-backup-index.YYYY-MM-DD.json`

## Required Artifacts Per Backup Cycle
1. Supabase export JSON payload
2. Manifest with SHA-256 and date range
3. Workflow rollup report (review/import/sync counts)
4. Narrative draft snapshot (for composition continuity)

## Verification Checklist
1. Confirm row counts in Supabase match manifest `eventCount`.
2. Confirm story_key uniqueness (no duplicates).
3. Confirm session scope remains `visibility_scope=private` and `release_state=sealed`.
4. Confirm artifacts are in ignored/private paths and not tracked by git.

## Restore Procedure
1. Locate latest `storyforge-private-backup-index.*.json`.
2. Verify checksum of target payload against manifest.
3. Rehydrate to staging session first (never overwrite production directly).
4. Validate counts + key uniqueness + privacy scope.
5. Promote to active session only after successful validation.

## Minimum Retention
- Keep daily backups for 30 days.
- Keep weekly checkpoints for 6 months.
- Keep monthly checkpoints indefinitely.

## Public Safety Rule
Never push raw private narrative artifacts, ledgers, or personal account datasets to public remotes.
