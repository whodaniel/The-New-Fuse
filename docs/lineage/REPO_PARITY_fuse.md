# Repo Parity Audit: `whodaniel/fuse`

> Generated: 2026-06-22T17:43:10Z  
> Monorepo HEAD: `e888d0c0b7`  
> Target default branch: `d4c4af00`  
> **Verdict: PASS**

## Role

| Field                    | Value                                   |
| ------------------------ | --------------------------------------- |
| Slug                     | `fuse`                                  |
| Remote                   | `https://github.com/whodaniel/fuse.git` |
| Classification           | `lineage-archive-candidate`             |
| Tracked paths (monorepo) | 98282                                   |
| Tracked paths (target)   | 30537                                   |
| Remote tags              | 15                                      |
| Remote branches          | 364                                     |

## Notes

Public legacy monorepo. Unique tags/branches preserved in
TAGS_BRANCHES_EXPORT.md; runtime surface merged into The-New-Fuse.

## Proprietary leakage (open-runtime gate)

```
packages/relay-core/src/master-clock.ts
packages/relay-core/src/broker-agent.ts
packages/relay-core/dist/master-clock.js
packages/relay-core/dist/master-clock.js.map
packages/relay-core/dist/broker-agent.js
packages/relay-core/dist/broker-agent.js.map
apps/backend/src/modules/orchestrator/
apps/nexus-orchestrator/
apps/picoclaw-overseer/
cloudflare-sharedstate/
packages/agent-coordination/
```

## Archive gate checklist

- [ ] Unique tags exported to `docs/lineage/TAGS_BRANCHES_EXPORT.md`
- [ ] Git bundle created: `docs/lineage/bundles/fuse.bundle` (Phase 3)
- [ ] `ARCHIVED.md` committed on target repo default branch (Phase 3)
- [ ] GitHub repo marked archived (Phase 3, manual via `gh`)

## Parity criteria

| Criterion                            | Result |
| ------------------------------------ | ------ |
| No proprietary paths in open-runtime | N/A    |
| Legacy runtime captured in monorepo  | REVIEW |
| Distribution sync path documented    | N/A    |
