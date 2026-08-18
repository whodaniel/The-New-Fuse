# Apps audit — 2026-08-09

Continuing inventory / absorb-or-archive of `apps/*` for distribution cohesion.
Machine boundary: `data/distribution/oss-app-boundary.json`.

## Apps layout (2026-08-09)

Core form factors only under `The-New-Fuse/apps/`. Everything else moved to
sibling `TNF-Extensions/`, redirected as `apps/extensions` → symlink.

Protocol extension package remains in-repo: `packages/extension-system`.

## Archived this pass

| From                           | To                                      | Reason                                                                        |
| ------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/browser-extension`       | `archive/apps/browser-extension/`       | Stale fork of `packages/tnf-browser/extension`                                |
| `apps/demo-agent-extension`    | `archive/apps/demo-agent-extension/`    | 3-file VS Code demo; real product is `apps/vscode-extension`                  |
| `apps/gemini-bridge-extension` | `archive/apps/gemini-bridge-extension/` | Lagging twin of Fuse Connect; chrome ahead (~74% identical src)               |
| `apps/zeroclaw-sandbox`        | `archive/apps/zeroclaw-sandbox/`        | Unused CloudRuntime sandbox; prefer adaptive role fill over stale entrypoints |
| `apps/stripe-provider-bridge`  | `archive/apps/stripe-provider-bridge/`  | Unused Stripe APP demo sketch                                                 |
| `apps/claim-tracker`           | `archive/apps/claim-tracker/`           | Personal ClaimTracker mini-monorepo                                           |

## Regular OSS (keep / harden)

| App                               | Notes / refactor opportunities                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `api` / `api-gateway` / `backend` | Core runtime — dogfood + secret hygiene                                                                         |
| `chrome-extension`                | Canonical Fuse Connect; drop nested `aivi/` dup later; absorb PokerTechnician from archive only if product asks |
| `frontend`                        | Large surface; viz hub overlap with `visualization-hub`                                                         |
| `mcp-servers`                     | Ship with OSS; keep thin                                                                                        |
| `relay-server`                    | Core local WS                                                                                                   |
| `tauri-desktop`                   | P2: inline styles in `ComprehensiveRouter`, PlatformOverview emoji cards, legacy `main.ts` vs React shell       |
| `vscode-extension`                | Canonical IDE form factor                                                                                       |

## Ranked remaining cleanups

1. **`visualization-hub`** — thin satellite; merge into frontend/nexus ops route
   or leave separate but wire one entry point.
2. **Nested AIVI under chrome** — historical dup with archived gemini; factor
   only if AIVI stays productized.
3. **Game satellites** (`ai-arcade`, `casin8-games`, `poker-room`) — leave as
   satellites; do not pull into default OSS.
4. **PicoClaw CloudRuntime entrypoint** — retained with the Go overseer but
   treat as optional/legacy deploy path; do not block adaptive routing on it.

## Principle (operator)

Fill required roles with the best **current** candidates via adaptive routing /
agent registry. Do not keep dead CloudRuntime apps or twin extensions "because
they used to matter."

## Claw skills (done 2026-08-09)

Canonical content: `packages/claw-skills/` (10 packs). Relative symlinks from:

- `apps/extensions/openclaw/skills/*` (→ TNF-Extensions/openclaw)
- `apps/extensions/picoclaw-overseer/pkg/skills/*` (Go `loader.go` /
  `installer.go` retained)
- `apps/extensions/picoclaw-overseer/workspace/skills/*` (operator overlays stay
  real dirs)

`scripts/skills/skill-bank-sync.cjs` indexes `packages/claw-skills` as
`claw-skills`.

## Core OSS form-factor debt (audit 2026-08-09)

From parallel deep pass on regular download apps (after satellites left
`TNF-Extensions`):

1. **api / backend / api-gateway** — ~~clarify Nest stack; backend `simple-main`
   vs `main`~~ **done 2026-08-09** (`main` canonical; `dev:simple` legacy);
   gateway scripts no longer embed `DATABASE_URL`.
2. **vscode-extension** — ~~fix misplaced `contributes` settings; purge VSIX
   junk~~ **done 2026-08-09** (`configuration.properties` +
   `scripts/validate-package-contributes.cjs`); restore fuller smoke tests
   later.
3. **chrome-extension** — ~~make `build` → V7-only~~ **done 2026-08-09**
   (`build`/`dev` → `webpack.v7` → `dist-v7`; version/description aligned to
   Fuse Connect 7.0.0); trim `_legacy`/`v5` trees from default mental path
   later.
4. **frontend ↔ tauri** — **not a fork**: web = react-router (~245 routes);
   desktop = custom `RouteProvider`. Doc:
   `apps/tauri-desktop/docs/SHELL_VS_FRONTEND_2026-08-09.md`. ~~archive dead
   Tauri `main.ts`~~ **done** → `src/_archive/main.vanilla-hub.ts`. Share
   brand/pages later — do **not** merge `ComprehensiveRouter` files.
5. **relay-server vs packages/relay-core** — ~~document ownership~~ **done
   2026-08-09** (`docs/packaging/RELAY_OWNERSHIP.md`); shrink/legacy-tag app
   further when safe.
6. **mcp-servers** — ~~umbrella README; promote/archive root `.js` stubs~~
   **done 2026-08-09** (`apps/mcp-servers/README.md`; stubs → `_archive/`).
7. **Env scrub** — ~~backend/api/gateway `.env*` residue~~ **done 2026-08-09**
   (deleted `.env.bak-*`; `env.example` → `env.wallet.example`; gateway
   `.env.example` documents `DATABASE_URL`). Live `.env` / `.env.local` stay
   gitignored.

Highest-ROI remaining inside core: archive Tauri `main.ts` → relay ownership doc
→ mcp-servers umbrella → selective brand/page packages (not router merge).

## Remaining satellites (scan 2026-08-09)

| App                                         | Rec                  | Why                                                                |
| ------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `adk-gateway`                               | **keep**             | Thin Python ADK adapter; wired to core GoogleADKProvider paths     |
| `telegram-mcp`                              | **keep**             | Optional messaging; small, unique                                  |
| `audio-trigger-kws-mvp`                     | **keep** (pilot)     | Distinct capability; not default OSS                               |
| `openclaw`                                  | **keep thin**        | Skills/vendor overlay; content in `packages/claw-skills`           |
| `ai-arcade` / `casin8-games` / `poker-room` | **keep satellites**  | Game/demo product lane; do not put in default OSS                  |
| `cloud-sandbox`                             | **keep**             | Hosted sandbox; README rewritten 2026-08-09 (was cache-bust stub)  |
| `visualization-hub`                         | **archive or merge** | ~4 React viewers; boilerplate README; **no** frontend/tauri import |
| `myphoneremote-api`                         | **keep non-OSS**     | Standalone product (like archived claim-tracker class)             |
| `virtual-library-blueprints`                | **keep non-OSS**     | Operator library workstream                                        |
| `nexus-orchestrator` / `picoclaw-overseer`  | **keep proprietary** | Control-plane / overseer                                           |
| `external`                                  | **keep excluded**    | Vendored checkouts                                                 |

## Prefer load paths (agents)

| Need                                | Path                             |
| ----------------------------------- | -------------------------------- |
| User browser product (Fuse Connect) | `apps/chrome-extension`          |
| Agent browser MV3 (legacy WS)       | `packages/tnf-browser/extension` |
| New agent browser                   | `tnf browser`                    |
| IDE                                 | `apps/vscode-extension`          |
| Desktop                             | `apps/tauri-desktop`             |

## Next audit targets

- Skill-bank single source of truth for claw skills
- Whether `stripe-provider-bridge` / `claim-tracker` should leave the monorepo
- Frontend vs visualization-hub route ownership
