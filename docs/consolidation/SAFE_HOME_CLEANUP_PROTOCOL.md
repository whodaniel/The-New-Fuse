# Safe Home Cleanup Protocol

> **No unique data loss.** Backup off-machine first. Delete nothing until
> verified.

## Rules

1. **Never delete** `The-New-Fuse` or `~/.tnf` without a migration plan.
2. **Backup before touch** — any path not tier `RUNTIME` gets archived to cloud
   storage first.
3. **Verify duplicates** — use `diff` / checksums; monorepo must be the
   **superset** of home copies.
4. **Sensitive files** (`auth.txt`, `voice_bridge_cloud.env`, `.env*`) — backup
   encrypted; never push to public git.
5. **When in doubt** — classify as `UNIQUE` and keep.

## Tiers (see `home-cleanup-candidates.manifest`)

| Tier                  | Meaning                 | Action                                 |
| --------------------- | ----------------------- | -------------------------------------- |
| `RUNTIME`             | Active system           | **Do not delete**                      |
| `UNIQUE`              | Only copy or may differ | **Backup to cloud**, then review       |
| `DUPLICATE_CANDIDATE` | Likely copy of monorepo | **Backup**, diff, then optional remove |
| `UNKNOWN`             | Unclear                 | **Backup**, manual decision            |

## Backup workflow (cloud, not local-only)

```bash
cd $TNF_ROOT

# 1. Dry-run — see what would be archived
bash scripts/consolidation/backup-home-candidates.sh

# 2. Write archives to pCloud Drive or iCloud (synced off-machine)
bash scripts/consolidation/backup-home-candidates.sh --apply

# 3. Confirm upload/sync in pCloud or iCloud before any local delete
```

Default destination: `~/pCloud Drive/TNF-Home-Backups/<timestamp>/`  
Fallback: `~/Library/Mobile Documents/com~apple~CloudDocs/TNF-Home-Backups/<timestamp>/`

Each archive includes a `.sha256` sidecar and `manifest-summary.json`.

## What we already know (2026-06-22)

| Path                                        | Safe to delete without backup?                                    |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `~/apps/api-gateway/`                       | **No** — backup first (orphan stub; not in monorepo at same path) |
| `~/AGENTS.md`                               | **No** — differs from monorepo; monorepo is newer but keep backup |
| `~/Projects/virtual-library-blueprints/`    | **No** — separate git checkout; 620MB; diff before action         |
| `~/Projects/tnf-qa/`                        | **No** — unique QA project (Playwright specs)                     |
| `~/.local/share/The-New-Fuse/.voicebridge/` | **No** — old stream logs (`voice_stream_a/b.txt`) may be wanted   |
| `~/auth.txt`                                | **No** — sensitive; backup encrypted                              |

## After backup + verification only

Only then consider:

```bash
# Example — ONLY after cloud backup confirmed and diff shows duplicate:
# rm -rf ~/apps
```

Use `scripts/consolidation/personal-runtime-cleanup.sh` for **symlinks only**
(no deletes of unique data).

## Canonical working copy

```
$TNF_ROOT
```

Everything else is secondary until backed up and classified.
