# Lineage Archive Status

> Updated: 2026-08-13

`fuse`, `fuse-master`, and `fuse-mirror` stay GitHub-archived. Do not delete
them. Do not add `old-fuse` / `private-origin` / `split-mirror` /
`nexus-orchestrator` remotes back to the monorepo. Canonical development is
`whodaniel/tnf-monorepo`. See [PRODUCT_REPO_MAP.md](./PRODUCT_REPO_MAP.md) for
the full live-vs-archive map.

## Completed

| Repo              | Parity | Bundle                                   | ARCHIVED.md | GitHub archived      |
| ----------------- | ------ | ---------------------------------------- | ----------- | -------------------- |
| NexusOrchestrator | PASS   | `bundles/NexusOrchestrator.bundle` (83K) | Yes         | **Yes** (2026-06-22) |
| fuse-master       | PASS   | `bundles/fuse-master.bundle` (165M)      | Yes         | **Yes** (2026-06-22) |
| fuse-mirror       | PASS   | `bundles/fuse-mirror.bundle` (1.7G)      | Yes         | **Yes** (2026-06-22) |
| fuse              | PASS   | alias → `fuse-mirror.bundle`             | Yes         | **Yes** (2026-06-22) |

## Deferred (bundle or size)

_None — all lineage archive candidates with PASS parity are archived or covered
by alias bundle._

## Never archive (live)

- `tnf-monorepo` — canonical private development
- `The-New-Fuse` — public open-runtime publication
- `fuse-control-plane` — proprietary distribution
- all `tnf-*` satellite repos listed in PRODUCT_REPO_MAP
- `virtual-library-blueprints`

## Product satellites and related products (keep active)

- `SkIDEancer` — TNF-adjacent Cloud IDE
- `MyPhone-Remote` — public phone-remote client (`tnf-myphoneremote-api` is the
  API)
- `EXTREAMIX` — standalone streaming product
- `LPM-Standalone` — localhost port monitor

## Scaffolding archives (2026-08-13)

GitHub-archived, not deleted. No new cold bundles; history stays on GitHub.

`AI-ARCADE.XYZ---POKER-ROOM`, `Casin8`, `Localhost-Port-Monitor`, `SkIDEancer2`,
`docs`, `vscode-extension`, `tnf-railway-configs-backup`,
`tnf-railway-era-archive`, `Video-Intelligence-Archive`, `BizSynth`,
`SocialSalez`, `EventSynth`, `StarTree`, `W3MARKETING`.

## Cold backup location

```
docs/lineage/bundles/*.bundle   # gitignored (large binaries)
```

Regenerate bundles:

```bash
pnpm run lineage:bundle -- NexusOrchestrator
./scripts/archive-lineage-repo.sh <slug>   # only after PASS + bundle
```
