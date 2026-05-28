# TNF Repository Separation — Antigravity Context

> **CRITICAL CONTEXT FOR ALL ANTIGRAVITY SESSIONS**
>
> This document explains the dual-repo architecture. Read this before making
> changes that touch proprietary boundaries.

## Architecture

TNF uses a **single combined monorepo for development** with two downstream
**read-only publication repos**:

```
whodaniel/fuse              ← DEVELOPMENT HAPPENS HERE
    ├──► fuse-open-runtime  ← 90% open-source (auto-synced, read-only)
    └──► fuse-control-plane ← 10% proprietary (auto-synced, read-only)
```

## Rules

1. **NEVER commit directly to `fuse-open-runtime` or `fuse-control-plane`.**
2. **ALL development happens in `whodaniel/fuse`.**
3. Proprietary boundary is defined in `scripts/sync-repos.sh` (`PROPRIETARY_*`
   arrays).
4. Run `pnpm run sync:repos` to push changes to both downstream repos.
5. `packages/control-plane-contracts/` is the PUBLIC API boundary.
6. See `docs/REPO_SEPARATION.md` for the full map (🟢 open / 🔴 proprietary).

## Quick Reference: What's Proprietary (🔴)

- `packages/relay-core/src/master-clock.ts` + `broker-agent.ts`
- `apps/backend/src/modules/orchestrator/`
- `apps/nexus-orchestrator/`
- `apps/picoclaw-overseer/`
- `cloudflare-sharedstate/`
- `packages/agent-coordination/`
- Top-level `orchestrate-*.js` / `tnf-orchestrator*.js` scripts

## Sync Commands

```bash
pnpm run sync:repos          # push to both repos
pnpm run sync:repos:dry-run  # preview without pushing
pnpm run sync:repos:open     # open-runtime only
pnpm run sync:repos:control  # control-plane only
```
