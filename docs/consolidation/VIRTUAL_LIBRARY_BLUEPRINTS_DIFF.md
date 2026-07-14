# virtual-library-blueprints: Projects vs Monorepo

> **Date:** 2026-06-22  
> **Projects:** `~/Projects/virtual-library-blueprints`  
> **Canonical (TNF):** `apps/virtual-library-blueprints` in The-New-Fuse

## Verdict: NOT a duplicate — diverged forks

| | Projects checkout | Monorepo copy |
| --- | --- | --- |
| Git HEAD | `8d84bd8` feat(story): timeline source jumps | `994f3d3` TNF multi-agent checkpoint |
| Shared history | **No** — `994f3d3` not in Projects repo | `8d84bd8` not in monorepo VLB git |
| Source files (excl node_modules) | 90 files | 103 files |
| pCloud backup | `Users_danielgoldberg_Projects_virtual-library-blueprints.tar.gz` | (in full monorepo) |

**Do not delete `~/Projects/virtual-library-blueprints` until story deltas are ported or explicitly abandoned.**

## Only in monorepo (keep — already canonical)

- `docs/LOCAL_RELAY_SETUP.md`, `docs/SECURE_BACKUP_PROTOCOL.md`
- `src/lib/identity.ts`, `src/lib/runtimeEndpoints.ts`
- `src/utils/` (monorepo)
- `packages/` (monorepo)
- Supabase migrations: RLS recursion fix, execute grants, header scope, story session backups

## Projects-ahead (content in shared files)

Not exclusive paths — same filenames, **Projects has more story/timeline work**:

| File | Projects | Monorepo | Notes |
| ---- | -------- | -------- | ----- |
| `TimelineWall.tsx` | 516 lines | 357 lines | Timeline source jumps, tag parsing |
| `StoryArchitectPanel.tsx` | 591 | 604 | Both differ |
| `usePersistence.ts` | 104 | 150 | Monorepo has more persistence logic |
| `ai-relay/server.mjs` | differs | differs | Relay integration |
| `cloudflare-virtual-library/` | differs | differs | Worker config + index |

Projects recent commits (story/relay line):

```
8d84bd8 feat(story): implement timeline source jumps and robust tag parsing
2a7a824 Add terminal-backed relay flow and fix AI guide integration
f0f9f11 Add owner-scoped story privacy wall and release gating
```

## Recommended next steps

1. **Work in monorepo only** for TNF (`apps/virtual-library-blueprints`).
2. **Port** Projects story commits (especially `TimelineWall.tsx` / `8d84bd8`) into monorepo via cherry-pick or manual merge.
3. **After port + test**, remove `~/Projects/virtual-library-blueprints` (pCloud backup already exists).
