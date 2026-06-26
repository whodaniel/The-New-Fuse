# Lineage Archive Status

> Updated: 2026-06-22

## Completed

| Repo | Parity | Bundle | ARCHIVED.md | GitHub archived |
| ---- | ------ | ------ | ----------- | --------------- |
| NexusOrchestrator | PASS | `bundles/NexusOrchestrator.bundle` (83K) | Yes | **Yes** (2026-06-22) |
| fuse-master | PASS | `bundles/fuse-master.bundle` (165M) | Yes | **Yes** (2026-06-22) |
| fuse-mirror | PASS | `bundles/fuse-mirror.bundle` (1.7G) | Yes | **Yes** (2026-06-22) |
| fuse | PASS | alias → `fuse-mirror.bundle` | Yes | **Yes** (2026-06-22) |

## Deferred (bundle or size)

_None — all lineage archive candidates with PASS parity are archived or covered by alias bundle._

## Never archive (live)

- `the-new-fuse-next-gen` — canonical dev
- `fuse-open-runtime` — open distribution
- `fuse-control-plane` — proprietary distribution

## Product satellites (Phase 4 — keep active)

- `SkIDEancer` — standalone Cloud IDE product
- `MyPhone-Remote` — standalone mobile remote product

## Cold backup location

```
docs/lineage/bundles/*.bundle   # gitignored (large binaries)
```

Regenerate bundles:

```bash
pnpm run lineage:bundle -- NexusOrchestrator
./scripts/archive-lineage-repo.sh <slug>   # only after PASS + bundle
```
