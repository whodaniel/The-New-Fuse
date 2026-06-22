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
rm -rf ~/apps/api-gateway ~/apps/api ~/apps/frontend ~/tnf
rm -rf ~/.openclaw/workspace/apps ~/.openclaw/workspace/SkIDEancer
```

## Keep as runtime

`~/.tnf/`, `~/.tnf-master-clock/`, `~/h17-webpilot/profile/`
