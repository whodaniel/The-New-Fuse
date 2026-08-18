# Home Directory Consolidation Manifest

**Date:** 2026-06-22  
**Status:** Merged into monorepo (round 2 complete)

## Merged

- `apps/claim-tracker/` from `~/apps/claim-tracker`
- 20 skills → `.agent/skills/`
- Core operator docs → `docs/core/` (ENGINEERING_PRINCIPLES, SOUL, USER,
  IDENTITY, HEARTBEAT)
- Ops docs → `docs/operations/` (STALL_DEFENSE, POST_IMPLEMENTATION_VALIDATION,
  etc.)
- Evidence → `docs/release-readiness/evidence/`
- Swarm audit → `scripts/audit/swarm/`
- Archives → `docs/consolidation/archived-from-home/`

## Safe to delete after verification

```bash
rm -rf ~/app ~/apps/api-gateway ~/apps/api-server ~/apps/api ~/apps/frontend ~/tnf
rm -rf ~/.openclaw/workspace/apps ~/.openclaw/workspace/SkIDEancer
```

**Deleted 2026-06-22:** `~/apps/api-gateway`, `~/apps/api-server` (emergency login-fix stubs; canonical source is monorepo `apps/api` + `apps/api-gateway`).

**Deleted 2026-06-22:** `~/app` (Hermes `tnf-missing-pages-fixer` placeholders for docs/features/pricing + empty `apps/api-gateway` shell; canonical pages are `The-New-Fuse/apps/frontend/src/app/`).

## Keep as runtime

`~/.tnf/`, `~/.tnf-master-clock/`, `~/h17-webpilot/profile/`

See [PUBLIC_DISTRIBUTION_AND_PERSONAL_RUNTIME.md](./PUBLIC_DISTRIBUTION_AND_PERSONAL_RUNTIME.md) for
what to keep vs remove on your Mac while preparing `The-New-Fuse`.
