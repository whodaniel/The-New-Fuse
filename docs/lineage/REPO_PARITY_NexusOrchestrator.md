# Repo Parity Audit: `whodaniel/NexusOrchestrator`

> Generated: 2026-06-22T17:59:06Z  
> Monorepo HEAD: `e888d0c0b7`  
> Target default branch: `af7f5ed`  
> **Verdict: PASS**

## Role

| Field | Value |
| ----- | ----- |
| Slug | `NexusOrchestrator` |
| Remote | `https://github.com/whodaniel/NexusOrchestrator.git` |
| Classification | `lineage-archive-candidate` |
| Tracked paths (monorepo) | 98282 |
| Tracked paths (target) | 26 |
| Remote tags | 0 |
| Remote branches | 1 |

## Notes

Content lives in monorepo apps/nexus-orchestrator (proprietary).

## Proprietary leakage (open-runtime gate)

```
(none detected in shallow clone)
```

## Archive gate checklist

- [ ] Unique tags exported to `docs/lineage/TAGS_BRANCHES_EXPORT.md`
- [ ] Git bundle created: `docs/lineage/bundles/NexusOrchestrator.bundle` (Phase 3)
- [ ] `ARCHIVED.md` committed on target repo default branch (Phase 3)
- [ ] GitHub repo marked archived (Phase 3, manual via `gh`)

## Parity criteria

| Criterion | Result |
| --------- | ------ |
| No proprietary paths in open-runtime | N/A |
| Legacy runtime captured in monorepo | REVIEW |
| Distribution sync path documented | N/A |

