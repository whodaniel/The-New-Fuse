# TNF Repository Lineage Registry

> **Status**: Active preservation-first consolidation  
> **Last updated**: 2026-07-14  
> **Canonical dev repo**:
> [`whodaniel/The-New-Fuse`](https://github.com/whodaniel/The-New-Fuse)  
> **Historical slug**: `the-new-fuse-next-gen` (GitHub 301 → `The-New-Fuse`)

## Four layers

| Layer                      | Repos                                                     | Purpose                                      |
| -------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| **L1 — Live dev**          | `The-New-Fuse`                                            | Combined monorepo; all development           |
| **L2 — Live distribution** | `fuse-open-runtime`, `fuse-control-plane`                 | Published via `pnpm sync:repos`              |
| **L3 — Lineage archives**  | `fuse`, `fuse-master`, `fuse-mirror`, `NexusOrchestrator` | Read-only history; archive after parity PASS |
| **L4 — Cold backup**       | `docs/lineage/bundles/*.bundle`                           | Offline git bundles before GitHub archive    |

## Remote map (local monorepo)

| Remote                | GitHub                       | Role                                                                    |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `origin`              | whodaniel/The-New-Fuse       | **Canonical development** (slug `the-new-fuse-next-gen` redirects here) |
| `split-open-runtime`  | whodaniel/fuse-open-runtime  | Open distribution (~90%)                                                |
| `split-control-plane` | whodaniel/fuse-control-plane | Proprietary distribution (~10%)                                         |
| `old-fuse`            | whodaniel/fuse               | Legacy public monorepo                                                  |
| `private-origin`      | whodaniel/fuse-master        | Legacy private snapshot                                                 |
| `split-mirror`        | whodaniel/fuse-mirror        | Structural mirror                                                       |
| `nexus-orchestrator`  | whodaniel/NexusOrchestrator  | Legacy 3D viz (superseded by monorepo)                                  |

## Parity audit status

| Repo                       | Verdict                                                              | Report                                                                                               |
| -------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| The-New-Fuse (ex next-gen) | PASS                                                                 | [REPO_PARITY_the-new-fuse-next-gen.md](./REPO_PARITY_the-new-fuse-next-gen.md) (historical filename) |
| fuse-open-runtime          | PASS\*                                                               | [REPO_PARITY_fuse-open-runtime.md](./REPO_PARITY_fuse-open-runtime.md)                               |
| fuse-control-plane         | PASS                                                                 | [REPO_PARITY_fuse-control-plane.md](./REPO_PARITY_fuse-control-plane.md)                             |
| fuse                       | PASS (archived 2026-06-22; cold backup via fuse-mirror.bundle alias) | [REPO_PARITY_fuse.md](./REPO_PARITY_fuse.md)                                                         |
| fuse-master                | PASS (archived 2026-06-22)                                           | [REPO_PARITY_fuse-master.md](./REPO_PARITY_fuse-master.md)                                           |
| fuse-mirror                | PASS (archived 2026-06-22)                                           | [REPO_PARITY_fuse-mirror.md](./REPO_PARITY_fuse-mirror.md)                                           |
| NexusOrchestrator          | PASS (archived 2026-06-22)                                           | [REPO_PARITY_NexusOrchestrator.md](./REPO_PARITY_NexusOrchestrator.md)                               |
| SkIDEancer                 | DEFER                                                                | [REPO_PARITY_SkIDEancer.md](./REPO_PARITY_SkIDEancer.md)                                             |
| MyPhone-Remote             | DEFER                                                                | [REPO_PARITY_MyPhone-Remote.md](./REPO_PARITY_MyPhone-Remote.md)                                     |

\*Open-runtime contains **contract stubs** at proprietary paths (expected).
Audit passes when stubs are detected, not full implementations.

## Sync cadence (Phase 1)

1. Merge feature work to `main` on `The-New-Fuse`
2. Tag release when ready: `git tag vX.Y.Z && git push origin vX.Y.Z`
3. Run `pnpm run sync:repos:dry-run` then `pnpm run sync:repos`
4. CI workflow `.github/workflows/repo-sync.yml` syncs on push to `main` when
   `TNF_SYNC_PAT` is set

## Archive ceremony (Phase 3)

Only repos with **PARITY: PASS** and bundle backup:

1. Create bundle: `scripts/create-lineage-bundle.sh <repo>`
2. Copy `docs/lineage/ARCHIVED.md.template` → target repo `ARCHIVED.md`
3. `gh repo archive whodaniel/<repo> --yes`
4. Update this table with archive date

## Product satellites (Phase 4)

| Repo                       | Classification                     | Action                                        |
| -------------------------- | ---------------------------------- | --------------------------------------------- |
| SkIDEancer                 | Standalone product (Cloud IDE)     | Keep active; not a sync target                |
| MyPhone-Remote             | Standalone product (iPhone remote) | Keep active; not a sync target                |
| tnf-railway-configs-backup | Infra backup                       | Archive when GCP migration narrative complete |
| the-new-fuse-docs-private  | Docs safety backup                 | Keep private; not a code distribution         |

## Tools

```bash
./scripts/audit-repo-parity.sh all          # parity reports
./scripts/check-proprietary-leakage.sh      # monorepo leakage scan
pnpm run sync:repos:dry-run                 # distribution preview
```

See also: [TAGS_BRANCHES_EXPORT.md](./TAGS_BRANCHES_EXPORT.md),
[REPO_SEPARATION.md](../REPO_SEPARATION.md).
