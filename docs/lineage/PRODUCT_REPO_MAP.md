# TNF Product and Repository Map

> **Status**: Active — this is the scaffolding map for where code lives. **Last
> updated**: 2026-08-13 **Machine-readable**:
> [`data/distribution/product-repo-map.json`](../../data/distribution/product-repo-map.json)

If an agent is about to clone, push, or create a GitHub repo for TNF, read this
first. Product _classification_ (OSS vs SaaS vs satellite vs personal) is
[`docs/product/TNF_PRODUCT_BOUNDARY.md`](../product/TNF_PRODUCT_BOUNDARY.md).
How the three core repos publish is
[`docs/REPO_SEPARATION.md`](../REPO_SEPARATION.md).

## Develop here

| Layer                 | GitHub                                                                            | Visibility | Commit?                   |
| --------------------- | --------------------------------------------------------------------------------- | ---------- | ------------------------- |
| Combined development  | [`whodaniel/tnf-monorepo`](https://github.com/whodaniel/tnf-monorepo)             | private    | **Yes**                   |
| Public open runtime   | [`whodaniel/The-New-Fuse`](https://github.com/whodaniel/The-New-Fuse)             | public     | **No** — publication only |
| Private control plane | [`whodaniel/fuse-control-plane`](https://github.com/whodaniel/fuse-control-plane) | private    | **No** — extract only     |

Local disk: `Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse` **is** the
`tnf-monorepo` working tree. The folder name is historical. Confirm with
`git remote get-url origin`.

TNF Repo Separation Sync stays **disabled** until a dry-run of the
`sync/open-runtime` PR path against restored public `main` is proven.

## Local workspace (not a git repo)

```text
TNF/                          # not a git repo
├── The-New-Fuse/             # tnf-monorepo working tree
│   └── apps/
│       ├── api … vscode-extension   # nine OSS form factors
│       └── extensions → ../../TNF-Extensions
└── TNF-Extensions/           # local clones; not a packaged offering
    ├── adk-gateway           → tnf-adk-gateway
    ├── ai-arcade             → tnf-ai-arcade
    ├── … one GitHub repo per folder
    └── external/             # vendored research; no TNF GitHub repo
```

## Satellites (one private GitHub repo each)

Listed in
[`data/distribution/oss-app-boundary.json`](../../data/distribution/oss-app-boundary.json).
Do not recreate a packed `TNF-Extensions` GitHub repo. Do not put satellites
back under `tnf-monorepo/apps/` except as the `extensions` symlink.

| Class                            | Examples                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Optional OSS-shaped satellites   | `tnf-ai-arcade`, `tnf-poker-room`, `tnf-casin8-games`, `tnf-telegram-mcp`, `tnf-visualization-hub`, `tnf-adk-gateway`, `tnf-openclaw` (optional adapter, not required to staff TNF), `tnf-audio-trigger-kws-mvp` |
| Private / proprietary satellites | `tnf-nexus-orchestrator`, `tnf-picoclaw-overseer` (optional adapter), `tnf-cloud-sandbox`, `tnf-myphoneremote-api`                                                                    |
| Operator workstream              | `virtual-library-blueprints`                                                                                                                                       |

Current Nexus source is `tnf-nexus-orchestrator`. `NexusOrchestrator` is an
archive.

## Related products (not the TNF runtime)

These stay live. They are not form factors of the OSS download.

| Repo                                                            | Role                                          |
| --------------------------------------------------------------- | --------------------------------------------- |
| [`SkIDEancer`](https://github.com/whodaniel/SkIDEancer)         | TNF-adjacent Cloud IDE                        |
| [`MyPhone-Remote`](https://github.com/whodaniel/MyPhone-Remote) | Public client; API is `tnf-myphoneremote-api` |
| [`EXTREAMIX`](https://github.com/whodaniel/EXTREAMIX)           | Standalone streaming product                  |
| [`LPM-Standalone`](https://github.com/whodaniel/LPM-Standalone) | Port-monitor product                          |

`the-new-fuse-docs-private` is a docs **backup**. Never develop TNF there.

## Archives (stay archived)

Superseded dumps, empty stubs, and lineage clones stay GitHub-archived. Do not
delete them. Do not add write remotes.

| Archive                                                            | Use instead                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| `fuse`, `fuse-mirror`, `fuse-master`                               | `tnf-monorepo`                                         |
| `the-new-fuse-legacy-v1`, `the-new-fuse-legacy-2025`               | `tnf-monorepo`                                         |
| `NexusOrchestrator`                                                | `tnf-nexus-orchestrator`                               |
| `AI-ARCADE.XYZ---POKER-ROOM`                                       | `tnf-ai-arcade` and `tnf-poker-room`                   |
| `Casin8`                                                           | `tnf-casin8-games`                                     |
| `Localhost-Port-Monitor`                                           | `LPM-Standalone`                                       |
| `SkIDEancer2`                                                      | `SkIDEancer`                                           |
| `docs`                                                             | monorepo `docs/` (backup: `the-new-fuse-docs-private`) |
| `vscode-extension`                                                 | `tnf-monorepo` `apps/vscode-extension`                 |
| `tnf-railway-configs-backup`, `tnf-railway-era-archive`            | retired Railway era                                    |
| `Video-Intelligence-Archive`                                       | content archive, not a product                         |
| `BizSynth`, `SocialSalez`, `EventSynth`, `StarTree`, `W3MARKETING` | empty/dormant 2022 public names; not TNF               |

## Verify

```bash
node scripts/packaging/check-oss-app-boundary.cjs
node scripts/packaging/check-product-repo-map.cjs
```
