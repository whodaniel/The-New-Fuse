# Archived: apps/claim-tracker (2026-08-09)

## Why archived

Personal “Live Sale AI” mini-monorepo (extension / web / worker / retrieval).
Product-specific, outside the TNF runtime; same class as `myphoneremote-api`.

## Unique capability check

| Capability | Status |
| --- | --- |
| ClaimTracker product code | This archive only |
| `skills/tnf-scaffold` copy | Canonical now `packages/claw-skills/tnf-scaffold` — do not merge this copy back |

## Prefer instead

- Own repo or private product lane (like MyPhoneRemote)
- TNF scaffold skill edits: `packages/claw-skills/`

## Restore

```bash
mv archive/apps/claim-tracker apps/claim-tracker
```

Re-add to `data/distribution/oss-app-boundary.json` (`nonOssOrPersonalApps`) and
`scripts/sync-repos.sh` `ALWAYS_EXCLUDE`.
