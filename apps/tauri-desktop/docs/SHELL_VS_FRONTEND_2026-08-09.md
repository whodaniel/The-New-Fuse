# Frontend vs Tauri shell — routing logic (2026-08-09)

## Verdict

These are **two product shells with shared naming**, not a stale fork of one
router. Naively “sharing ComprehensiveRouter” would break one of them.

## Models

|                       | `apps/frontend`                                            | `apps/tauri-desktop`                                                                      |
| --------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Entry                 | `src/main.tsx` → React                                     | `src/main.tsx` → React (`index.html`)                                                     |
| Router                | `react-router-dom` (`<Routes>` / ~245 paths)               | Custom `RouteProvider` + `config/routes.ts` + `routeComponents.tsx` — **no** react-router |
| `ComprehensiveRouter` | Route table + marketplace/auth/admin web surface (~2k LOC) | Desktop chrome (nav, command palette, brand) resolving components from config (~750 LOC)  |
| Dead path             | Parallel `main.simplified.tsx` / archives                  | Vanilla MCP hub archived → `src/_archive/main.vanilla-hub.ts`                             |

Same relative filenames under `src/` (~21) are almost all **diverged** (1
byte-identical). Notable inversions: Tauri owns a fuller `MultiAgentChat` /
`KnowledgeHub`; frontend owns a larger `useAuth` / PerformanceMonitor / router.

## What “share” can mean (without a rewrite)

1. **Brand / layout atoms** — `TnfLogo`, nav icons, CSS variables — candidates
   for `@the-new-fuse/ui-consolidated` or a thin `packages/app-brand`.
2. **Domain pages** that should match (Settings, A2A) — share **feature
   packages**, not the router file.
3. **Dead code** — ~~archive Tauri `main.ts`~~ **done 2026-08-09**
   (`src/_archive/main.vanilla-hub.ts`).
4. **Do not** — merge the two `ComprehensiveRouter.tsx` files or force
   react-router into Tauri without an explicit product decision.

## Canonical mental model

- **Web SaaS / marketing / membership**: `apps/frontend`
- **Operator desktop / federation surface**: `apps/tauri-desktop` (React shell)
- **Legacy vanilla hub**: `src/_archive/main.vanilla-hub.ts`

Full router unification = product ADR, not a cleanup PR.
