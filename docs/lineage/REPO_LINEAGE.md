# TNF Repository Lineage Registry

> **Status**: Active preservation-first consolidation **Last updated**:
> 2026-08-13 **Canonical dev repo**:
> [`whodaniel/tnf-monorepo`](https://github.com/whodaniel/tnf-monorepo) **Public
> publication**:
> [`whodaniel/The-New-Fuse`](https://github.com/whodaniel/The-New-Fuse)
> **Historical slug**: `the-new-fuse-next-gen` (GitHub 301 → `The-New-Fuse`)

## Four layers

| Layer                      | Repos                                                     | Purpose                                    |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| **L1 — Live dev**          | `tnf-monorepo`                                            | Combined private monorepo; all development |
| **L2 — Live distribution** | `The-New-Fuse`, `fuse-control-plane`                      | Published via `pnpm sync:repos`            |
| **L3 — Lineage archives**  | `fuse`, `fuse-master`, `fuse-mirror`, `NexusOrchestrator` | Read-only history; stay GitHub-archived    |
| **L4 — Cold backup**       | `docs/lineage/bundles/*.bundle`                           | Offline git bundles before GitHub archive  |

## Remote map (local monorepo)

| Remote                | GitHub                       | Role                            |
| --------------------- | ---------------------------- | ------------------------------- |
| `origin`              | whodaniel/tnf-monorepo       | **Canonical development**       |
| `split-open-runtime`  | whodaniel/The-New-Fuse       | Open distribution (~90%)        |
| `split-control-plane` | whodaniel/fuse-control-plane | Proprietary distribution (~10%) |

Do **not** recreate `old-fuse`, `private-origin`, `split-mirror`, or
`nexus-orchestrator`. Those pointed at archived lineage repos. Current Nexus is
`tnf-nexus-orchestrator`. Product map:
[PRODUCT_REPO_MAP.md](./PRODUCT_REPO_MAP.md).

## Parity audit status

| Repo                       | Verdict                                                | Report                                                                                               |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| The-New-Fuse (ex next-gen) | PASS                                                   | [REPO_PARITY_the-new-fuse-next-gen.md](./REPO_PARITY_the-new-fuse-next-gen.md) (historical filename) |
| The-New-Fuse               | PASS\*                                                 | [REPO_PARITY_The-New-Fuse.md](./REPO_PARITY_The-New-Fuse.md)                                         |
| fuse-control-plane         | PASS                                                   | [REPO_PARITY_fuse-control-plane.md](./REPO_PARITY_fuse-control-plane.md)                             |
| fuse                       | PASS (archived 2026-06-22; stay archived, not deleted) | [REPO_PARITY_fuse.md](./REPO_PARITY_fuse.md)                                                         |
| fuse-master                | PASS (archived 2026-06-22; stay archived, not deleted) | [REPO_PARITY_fuse-master.md](./REPO_PARITY_fuse-master.md)                                           |
| fuse-mirror                | PASS (archived 2026-06-22; stay archived, not deleted) | [REPO_PARITY_fuse-mirror.md](./REPO_PARITY_fuse-mirror.md)                                           |
| NexusOrchestrator          | PASS (archived 2026-06-22)                             | [REPO_PARITY_NexusOrchestrator.md](./REPO_PARITY_NexusOrchestrator.md)                               |
| SkIDEancer                 | DEFER                                                  | [REPO_PARITY_SkIDEancer.md](./REPO_PARITY_SkIDEancer.md)                                             |
| MyPhone-Remote             | DEFER                                                  | [REPO_PARITY_MyPhone-Remote.md](./REPO_PARITY_MyPhone-Remote.md)                                     |

\*Open-runtime contains **contract stubs** at proprietary paths (expected).
Audit passes when stubs are detected, not full implementations.

## Sync cadence (Phase 1)

1. Merge feature work to `main` on `tnf-monorepo`
2. Tag release when ready: `git tag vX.Y.Z && git push origin vX.Y.Z`
3. Run `pnpm run sync:repos:dry-run` then `pnpm run sync:repos` (opens a PR onto
   public `main`; does **not** force-push public `main`)
4. CI workflow `.github/workflows/repo-sync.yml` is **disabled**. Do not
   re-enable or dispatch until a dry-run of the PR path against restored public
   `main` is proven. See [REPO_SEPARATION.md](../REPO_SEPARATION.md).

## Archive ceremony (Phase 3)

`fuse`, `fuse-master`, and `fuse-mirror` already completed this ceremony on
2026-06-22. They stay archived. GitHub deletion is irreversible and is **not**
authorized unless the operator says delete.

Only new lineage candidates with **PARITY: PASS** and bundle backup:

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

TNF-owned extension satellites (`tnf-ai-arcade`, `tnf-nexus-orchestrator`, …)
are per-repo clones under the local `TNF-Extensions/` workspace, not a packed
GitHub tree. See [OSS_APP_BOUNDARY.md](../packaging/OSS_APP_BOUNDARY.md).

## Tools

```bash
./scripts/audit-repo-parity.sh all          # parity reports
./scripts/check-proprietary-leakage.sh      # monorepo leakage scan
pnpm run sync:repos:dry-run                 # distribution preview
```

See also: [TAGS_BRANCHES_EXPORT.md](./TAGS_BRANCHES_EXPORT.md),
[REPO_SEPARATION.md](../REPO_SEPARATION.md).
