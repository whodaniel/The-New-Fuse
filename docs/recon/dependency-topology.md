# TNF Monorepo — Real Dependency Topology

Recon workstream: **Dependency Topology**. Generated 2026-08-27 from the working tree at local `main`
(commit `184e9c23b`, 3 commits ahead of `origin/main`), in the isolated worktree
`.claude/worktrees/agent-a91bba796cf1eb6c5`.

Companion machine-readable artifact: [`dependency-topology.json`](./dependency-topology.json).

This is a graph of **what the code actually imports**, not what `package.json` declares. Every claim
below is backed by a file path you can open. Where a tool run failed or a part of the tree could not
be resolved, that is stated explicitly rather than papered over.

---

## 1. Method, tooling, and honest limitations

- **`node_modules` is not installed anywhere in this worktree.** `madge` and `turbo` are devDependencies
  but were not locally installed; both were run via `npx` (network-fetched, confirmed working:
  `madge 8.0.0`, `turbo 2.9.10`). A full `pnpm install` was deliberately **not** run — it would write a
  large amount of untracked material into a read-mostly task and risks not finishing in a reasonable
  time on a 100+-package workspace.
- **Consequence:** neither `madge` nor TypeScript could do real module resolution against `tsconfig`
  `paths` or package `exports` maps for bare package-specifier imports (`import x from '@the-new-fuse/y'`).
  Two techniques were combined instead:
  1. **`madge --json` / `madge --circular`** over `apps/**` + `packages/**` (extensions
     `ts,tsx,js,jsx`, tests/mocks/dist/build/node_modules excluded) — this resolves fine for **relative**
     imports (`./x`, `../y`) purely from the filesystem, no `node_modules` needed. 4,931–5,022 files
     processed depending on the run. Full raw output preserved in the JSON artifact's edge `files` lists.
  2. **A custom regex-based extractor** (`import`/`export …from`/`require(...)`/dynamic `import(...)`)
     matched against the 91 real workspace package names found in `package.json` `name` fields under
     `apps/*`, `apps/mcp-servers/*`, `packages/*`. This is how every "bare-import" edge in the JSON was
     built, and it is why every such edge lists the exact citing file(s) and specifier string(s).
- **What this means for negative claims** ("`X` is never imported", "`Y` declares `Z` but never uses
  it"): these are **upper-bound estimates from static string matching**, not proof of dead code. They
  do not see: a package consumed only via a `tsconfig.json` `"types"` array or triple-slash reference,
  a package's `bin` entry invoked as a CLI at runtime, or usage inside non-`.ts/.tsx/.js/.jsx` files.
  Every such finding below is phrased as "no import statement found," and where useful, cross-checked
  with `ripgrep` against `scripts/`, `tests/`, `e2e/`, `test-suite/`, `tools/`, `src/` as an extra sweep
  (results in `zeroFanInPackages_externalUsageCheck` in the JSON).
- **`scripts/` scope.** `scripts/` holds 736 JS/TS-family source files — far more than "a handful of
  one-off scripts." Per the brief's own rule ("anything imported BY multiple other things does" need a
  node), `scripts/` was **not** exploded into 736 individual graph nodes. Instead:
  - `madge` was run over `scripts/` alone to find internally-shared modules. This surfaced a
    **methodology trap worth naming explicitly**: the raw run reported things like "43 scripts import
    `apps/api/src/guards/secure-auth.guard.ts`" and "77 scripts import `packages/database/dist/index.d.ts`".
    Investigation showed this was an artifact — a single `scripts/*.ts` file has a relative import that
    reaches out of `scripts/` into `apps/api/src/...`, and `madge` then kept walking **`apps/api`'s own
    internal file graph** and attributed all of it back to the `scripts/` root. Filtering to edges whose
    **source** file is genuinely under `scripts/` collapses this to **15 real crossings from 12 distinct
    scripts** (§7). The bogus 43/77 numbers are recorded in `docs/recon/dependency-topology.json` only as
    a documented cautionary artifact, not used anywhere as a finding.
  - 13 modules under `scripts/lib/` (and a few siblings) that are genuinely imported by ≥3 other
    `scripts/` files were added as lightweight `type: "script"` nodes (§8).
- **Cross-check tools used:** `pnpm -v` (10.22.0), `node -v` (v22.22.3) confirmed present;
  `pnpm -r list --depth -1` was not additionally run because the same declared-dependency information
  is already extracted directly from every `package.json` (more precise, and captured per-edge with
  version specifiers in `declaredWorkspaceDependencyEdges`).

---

## 2. Top-line numbers

| Metric | Value |
|---|---|
| Workspace packages/apps with a `package.json` (real pnpm members) | 91 |
| Package-level real import edges found (bare-specifier + relative-boundary-crossing) | 142 |
| Declared workspace dependency edges (`package.json` deps/devDeps/peerDeps pointing at another workspace package) | 197 |
| Declared but **no** import statement found anywhere | 77 |
| Imported by bare specifier but **not** declared in the importer's `package.json` | 18 |
| File-level circular dependencies (`madge --circular`) | 39, all confined within a single app/package |
| Package-level circular dependencies | 1 candidate, and it turns out to be **not a real build-time cycle** (§6) |
| Relative imports that cross a package boundary directly (bypass the public entry point) | 10, across 5 package pairs (§5) |
| Packages/apps with **zero** internal consumers by static import (fan-in = 0) | 50 of 91 (55%) |
| `packages/*` directories with no `package.json` (not real pnpm workspace members despite living in `packages/`) | 14 |

---

## 3. Genuinely structural packages (real, multi-consumer, load-bearing)

Ranked by fan-in (distinct workspace packages/apps that import them by bare specifier), from
`fanin-fanout.json` / the JSON artifact's `nodes[].fanIn`:

| Package | Fan-in | Size (files) | Notes |
|---|---|---|---|
| `@the-new-fuse/infrastructure` | 18 | 39 | Widest-consumed package in the repo. Declares itself as a dependency of `database`, `types`, `shared`, `tnf-note-taking`, apps `frontend`, `tauri-desktop`, `relay-server`, `tnf-network-mcp`, etc. |
| `@the-new-fuse/database` | 14 | 89 | Drizzle-based DB layer; consumed across `security`, `mcp-core`, `workflow-engine`, `utils`, `n8n-workflows`, `backend-app`, and more. |
| `@the-new-fuse/types` | 13 | 88 | Shared TS type surface; declared-but-unused in 15 other packages too (§4), so it is both heavily *used* and heavily *over-declared*. |
| `@the-new-fuse/relay-core` | 8 | 120 | Consumed by `a2a-core`, `mcp-core`, `fairtable-adapters` (via `MasterAgentRegistry.ts`), apps `api-gateway`, `vscode-extension`. |
| `@the-new-fuse/a2a-core` | 6 | 21 | Agent-to-Agent protocol core; consumed by `tauri-desktop` (declared-only, see §4) and directly by `gemini-browser-skill` (undeclared import, §4). |
| `@the-new-fuse/logger` | 6 | **1** | Single-file logger, but genuinely fanned out to 6 consumer packages — a real, load-bearing "thin" package (contrast with §4's fake-thin cases). |
| `@the-new-fuse/utils` | 6 | 82 | |
| `@the-new-fuse/core-vector-db` | 4 | 17 | |
| `@the-new-fuse/fairtable-core` | 4 | 5 | Root of a genuinely well-layered 4-package cluster: `fairtable-core` ← `fairtable-utils` ← `fairtable-components` ← `fairtable-adapters`, consumed by `apps/frontend` (`FairtableDashboard.tsx`), `packages/hooks` (`useKanbanBoard.tsx`), and `packages/relay-core` (`MasterAgentRegistry.ts`). This is the cleanest layered-dependency example in the whole repo — cite it as the positive counter-example to §5/§6. |
| `@the-new-fuse/mcp-core` | 4 | 168 | See §6 for its (non-)cycle with `web-scraping`. |
| `@the-new-fuse/protocol-contracts` | 4 | 14 | |
| `@the-new-fuse/ui-consolidated` | 4 | 143 | |
| `@the-new-fuse/workflow-engine` | 4 | 36 | |

`@the-new-fuse/core` sits at fan-in 5 but is the single largest package by file count (502 files) —
its own fan-*out* and internal complexity (it contains the one genuine intra-file cycle,
`packages/core/src/workflow/types/index.ts`, a self-referential re-export loop) make it a hub more by
size and history than by clean layering.

---

## 4. Declared-but-never-imported and imported-but-never-declared (drift between intent and reality)

**77 declared workspace dependencies have no matching import statement anywhere.** Full list is in
`declaredButNeverImported` in the JSON. This clusters heavily around the same handful of foundational
packages being pre-declared without (detectable) use:

- `@the-new-fuse/types` — declared-but-unused by 15 different packages (`agent`, `api-optimization`,
  `api-types`(!), `database`, `deployment-core`, `features`, `hooks`, `n8n-workflows`,
  `port-management`, `proto-definitions`, `testing`, `tauri-desktop`, `api-gateway`, `the-new-fuse`
  (vscode-extension)). `api-types` declaring `types` and never importing it is a strong "boilerplate
  dependency, never wired up" signal since those two packages exist specifically to hold types.
- `@the-new-fuse/infrastructure` — 9 declared-but-unused (`database`, `shared`, `types`, `testing`,
  `tnf-note-taking`, `tnf-network-mcp`, apps `chrome-extension`, `tauri-desktop`, `relay-server`).
- `@the-new-fuse/utils` — 8 declared-but-unused (`agent`, `api`, `backend`, `feature-tracker`,
  `n8n-workflows`, `port-management`, `backend-app`, `api-server`).
- `@the-new-fuse/core` — 7 declared-but-unused (`backend`, `deployment-core`, `feature-tracker`,
  `security`, `testing`, `workflow-engine`, `api-gateway`).
- `apps/tauri-desktop` alone declares **8** workspace packages (`a2a-core`, `a2a-react`,
  `feature-suggestions`, `infrastructure`, `port-management`, `prompt-templating`,
  `protocol-contracts`, `types`) with zero matching bare imports found — either heavy dynamic/runtime
  use not visible to static regex matching, or a large amount of aspirational scaffolding in a Tauri
  app's `package.json`. Worth a targeted follow-up (see §11).

**18 edges go the other way** — a real `import` exists but the importer's `package.json` does not
declare the target as a dependency at all (full detail with citing files/specifiers in
`importedButNeverDeclared` in the JSON; every one listed here):

| Source | Target | Citing file(s) |
|---|---|---|
| `@the-new-fuse/core` | `@the-new-fuse/ui-consolidated` | `packages/core/components/agents/AgentCard.tsx` |
| `@the-new-fuse/extension-system` | `@the-new-fuse/workflow-engine` | `packages/extension-system/src/manager/ExtensionManager.ts`, `.../types/ExtensionTypes.ts` |
| `@the-new-fuse/features` | `@the-new-fuse/database` | `packages/features/dashboard/templates/TemplateManager.tsx` |
| `@the-new-fuse/features` | `@the-new-fuse/ui-consolidated` | `packages/features/agents/components/AgentCard.tsx` |
| `@the-new-fuse/features` | `@the-new-fuse/utils` | `packages/features/dashboard/templates/TemplateManager.tsx` |
| `@the-new-fuse/frontend-app` | `@the-new-fuse/api-client` | `apps/frontend/src/hooks/useApi.ts`, `useBackup.ts` |
| `@the-new-fuse/frontend-app` | `@the-new-fuse/prompt-templating` | `apps/frontend/src/components/WorkflowBuilder/nodes.tsx` |
| `@the-new-fuse/gemini-browser-skill` | `@the-new-fuse/a2a-core` | `packages/gemini-browser-skill/src/TranscriptProcessorV2.ts` |
| `@the-new-fuse/integration-tests` | `@the-new-fuse/workflow-engine` | `packages/integration-tests/src/examples/collaboration-app.ts`, `data-pipeline-app.ts` |
| `@the-new-fuse/mcp-core` | `@the-new-fuse/database` | `packages/mcp-core/src/integrations/database.ts` |
| `@the-new-fuse/mcp-core` | `@the-new-fuse/relay-core` | `packages/mcp-core/src/integrations/relay-core.ts` |
| `@the-new-fuse/mcp-core` | `@the-new-fuse/types` | `packages/mcp-core/src/integrations/platform-types.ts` |
| `@the-new-fuse/security` | `@the-new-fuse/utils` | `packages/security/src/audit/storage.ts`, `SecurityMiddleware.ts`, `rate-limiting/index.ts` |
| `@the-new-fuse/utils` | `@the-new-fuse/database` | `packages/utils/disabled_modules/logging/ephemeral.tsx` (note: inside a directory literally named `disabled_modules`) |
| `@the-new-fuse/workflow-engine` | `@the-new-fuse/database` | `packages/workflow-engine/src/WorkflowTypes.ts` |
| `the-new-fuse` (vscode-extension) | `@the-new-fuse/tnf-cli` | `apps/vscode-extension/src/services/tnf-framework/RelayServerService.ts` |
| `the-new-fuse-chrome-extension` | `@the-new-fuse/core` | `apps/chrome-extension/src/_legacy/agents/BaseAgent.ts` |
| `the-new-fuse-chrome-extension` | `@the-new-fuse/types` | same file + `interfaces/IAgent.ts` |

(A 19th candidate, `@the-new-fuse/agent → @the-new-fuse/core`, was found in the first pass but is a false
positive — see §9. It was excluded once verified.)

These are the real, undeclared couplings the brief asked to surface: if any of these 5 packages
(`core`, `extension-system`, `features`, `frontend-app`, `gemini-browser-skill`, `integration-tests`,
`mcp-core`, `security`, `utils`, `workflow-engine`, `the-new-fuse`, `the-new-fuse-chrome-extension`) is
ever built/installed without hoisting saving it (pnpm workspaces usually do, which is why this hasn't
broken yet), these imports will fail to resolve.

---

## 5. Relative imports that bypass the package boundary

10 file-level imports reach directly into another package's `src/` via a relative path instead of the
package's declared public entry point. Every one, verbatim (`relativePackageBoundaryCrossings` in the
JSON):

| File | Specifier | Reaches into |
|---|---|---|
| `apps/frontend/api/proxy.ts` | `../../../packages/web-scraping/src/proxy/ProxyService.js` | `packages/web-scraping` |
| `apps/frontend/api/scrape.ts` | `../../../packages/web-scraping/src/core/WebScrapingService.js` | `packages/web-scraping` |
| `apps/tauri-desktop/src/lib/sharedFederation.ts` | `../../../../packages/shared/src/federation/FederationNodeClient` | `packages/shared` |
| `apps/tauri-desktop/src/lib/sharedFederation.ts` | `../../../../packages/shared/src/federation/protocol` | `packages/shared` |
| `packages/core/analytics/AnalyticsManager.ts` | `../../features/dashboard/analytics/AnalyticsManager.js` | `packages/features` |
| `packages/core/analytics/types.ts` | `../../features/dashboard/analytics/types.js` | `packages/features` |
| `packages/mcp-core/examples/web-scraping-server.ts` | `../../web-scraping/src/mcp/WebScrapingMCPTools.js` | `packages/web-scraping` (outside `mcp-core`'s build — see §6) |
| `packages/shared/providers/index.tsx` | `../../core/components/auth/Login` | `packages/core` |
| `packages/shared/providers/index.tsx` | `../../core/components/auth/Register` | `packages/core` |
| `packages/shared/providers/index.tsx` | `../../core/components/auth/TwoFactorAuth` | `packages/core` |

Two of these are worth flagging specifically:

- **`apps/frontend` reaching directly into `packages/web-scraping/src/...`** twice (`proxy.ts`,
  `scrape.ts`, both under `apps/frontend/api/`, i.e. Next.js API routes) instead of importing the
  package normally. `apps/frontend`'s `package.json` does not declare `@the-new-fuse/web-scraping` at
  all — this is a real, undeclared, boundary-violating coupling from a Next.js API route straight into
  another package's internal `src/`.
- **`packages/shared` reaching into `packages/core/components/auth/*`** — semantically backwards for a
  package named "shared" (which by convention should be *depended on*, not *depend on* a bigger,
  higher-level UI package), and undeclared in `packages/shared/package.json`. No reverse edge exists
  (`core` does not import `shared`), so it is not circular, just a one-way layering inversion.

---

## 6. Circular dependencies

**File-level (`madge --circular` over `apps/**` + `packages/**`, 39 found):** every single one is
confined to files inside one app or package — no cross-package file-level cycle exists. Full raw list
preserved in `circularDependencies.fileLevel...` context and reproduced here in full since it's short
enough to be useful as-is:

```
apps/api/src/graphql/types/agent.type.ts > apps/api/src/graphql/types/user.type.ts
apps/api/src/graphql/types/user.type.ts > apps/api/src/graphql/types/workflow.type.ts
apps/api/src/graphql/types/agent.type.ts > ... > workflow-step.type.ts   (3-hop)
apps/backend/src/modules/orchestrator/orchestrator.service.ts > AgentLifecycleManager.ts
apps/chrome-extension/src/_legacy/types.ts <-> types/index.ts (barrel file <-> its own subdirectory)
apps/frontend/src/components/a11y/A11yProvider.tsx > KeyboardNavigation.tsx
apps/vscode-extension/src/commands/index.ts > extension.ts
packages/agent/src/bridges/index.ts > (11 separate bridge files, barrel-file fan-out cycle)
packages/agent/src/bridges/universal_bridge.ts > adapters/RedisTransportAdapter.ts
packages/api/src/constants.ts <-> constants/index.ts (barrel file <-> its own subdirectory; verified: constants.ts does `export * from './constants.js'`, which NodeNext resolution sends to constants/index.ts, not to itself literally)
packages/core/src/workflow/types/index.ts <-> types/index.ts (cross-directory barrel re-export: workflow/types/index.ts does `export * from '../types/index.js'`)
packages/database/src/drizzle/schema/agents.ts > users.ts > workspace.ts
packages/deployment-core/src/infrastructure/ResourceProvisioner.ts > providers/GCPProvider.ts
packages/features/{agents,auth,dashboard,dashboard/ai,theme}/components/index.ts (5 barrel-file cycles, one per feature module's index.ts and its own subdirectory)
packages/mcp-core/src/types/broker.ts <-> interfaces/index.ts (fans out to IMCPAgentIntegration, IMCPBroker, IMCPClient, IMCPServer, IMCPServiceMesh, IMessageRouter — 6-way barrel-file cycle)
packages/tnf-cli/src/utils/llm-client.ts > llm-tools.ts
```

Most of these are **barrel-file re-export cycles** (an `index.ts` importing from files that import back
from it) — the most common, usually-benign form of TS circularity — rather than genuine control-flow
cycles. The `packages/agent/src/bridges/index.ts` cluster (11 edges) and `packages/mcp-core` type/interface
cluster (6 edges) are the two densest.

**Package-level: 1 candidate found, and it does NOT hold up as a real build-time cycle.**

```
@the-new-fuse/web-scraping -> @the-new-fuse/mcp-core -> @the-new-fuse/web-scraping
```

- `web-scraping -> mcp-core`: real, declared (`workspace:^`), production edge —
  `packages/web-scraping/src/mcp/WebScrapingMCPTools.ts` does `import ... from '@the-new-fuse/mcp-core'`.
- `mcp-core -> web-scraping`: exists **only** in `packages/mcp-core/examples/web-scraping-server.ts`,
  which imports `../../web-scraping/src/mcp/WebScrapingMCPTools.js` via a relative path. Checked
  `packages/mcp-core/tsconfig.json`: `"include": ["src/**/*"]` — `examples/` is **not** part of the
  compiled package. `mcp-core/package.json` does not declare `web-scraping` as a dependency either.

**Conclusion: there is no genuine circular dependency between any two workspace packages in this
repo.** The one candidate is a one-directional production dependency (`web-scraping → mcp-core`) plus
an uncompiled example file that happens to import the other direction. Reporting this as "a circular
dependency exists" without checking the `tsconfig.json` `include` would have been exactly the kind of
confident-but-wrong claim this task was warned against.

---

## 7. `scripts/` → package/app crossings (real ones only, after discarding the tool artifact)

12 distinct scripts contain 15 real relative imports that reach out of `scripts/` into `packages/*` or
`apps/*` (methodology and the discarded 43/77 false-positive numbers are explained in §1):

```
scripts/antigravity-join-green.ts       -> packages/tnf-cli/src/RedisAgentClient.ts
scripts/borg-handoff-demo.ts            -> packages/a2a-core/src/pointer-resolver.service.ts
scripts/borg-handoff-demo.ts            -> packages/a2a-core/src/signature-wrapper.ts
scripts/check-seeded-ids.ts             -> packages/database/src/drizzle/schema/agents.ts
scripts/pi-session-handoff.cjs          -> packages/relay-core/src/services/HandoffStoreService.js
scripts/populate-feature-tracker.ts     -> packages/database/dist/index.d.ts   (compiled output, not source)
scripts/protocols/run-cron-audit.ts     -> apps/api/src/app.module.ts
scripts/protocols/run-cron-audit.ts     -> apps/api/src/modules/admin/chronological-processes.service.ts
scripts/search-codebase.ts              -> packages/core-vector-db/src/codebase-search.ts
scripts/security/sync-permissions.ts    -> packages/core/src/security/permission-manager.ts
scripts/test-optimize.ts                -> packages/database/dist/index.d.ts   (compiled output, not source)
scripts/vectorize-codebase.ts           -> packages/core-vector-db/src/codebase-vectorizer.ts
scripts/verify-llm-connections.ts       -> packages/core/src/llm/providers/{AnthropicProvider,GeminiProvider,OpenCodeCliProvider}.ts
```

Two scripts (`populate-feature-tracker.ts`, `test-optimize.ts`) import `packages/database`'s **compiled
`dist/` output** directly by relative path rather than the package name — meaning they require
`packages/database` to have been built first and will not resolve on a clean, un-built checkout.

---

## 8. Real shared modules inside `scripts/` (nodes worth tracking, despite no `package.json`)

Per the brief's own inclusion rule, these are modules genuinely imported by 3+ other files inside
`scripts/` (from a `madge` run scoped to `scripts/`, filtered to source files actually under
`scripts/` — see §1 for why the filter matters):

| Module | In-degree within `scripts/` |
|---|---|
| `scripts/lib/tnf-single-instance-guard.cjs` | 28 |
| `scripts/timeline/lib/output-paths.mjs` | 10 |
| `scripts/tnf-agent-cli.cjs` | 9 |
| `scripts/lib/tnf-fleet-mode.cjs` | 9 |
| `scripts/lib/tnf-trust-root.cjs` | 6 |
| `scripts/lib/tnf-identity.cjs` | 5 |
| `scripts/watchdog-signal-utils.cjs` | 4 |
| `scripts/lib/resolve-tnf-repo.cjs` | 3 |
| `scripts/lib/tnf-capability-grant.cjs` | 3 |
| `scripts/lib/tnf-elevation-broker.cjs` | 3 |
| `scripts/personal-archaeology/db.mjs` | 3 |
| `scripts/lib/sync-handoff-cache.cjs` | 3 |
| `scripts/swarm/report-lifecycle.cjs` | 3 |

`scripts/lib/tnf-single-instance-guard.cjs` (28 importers) is the closest thing `scripts/` has to a
foundational shared kernel, on par with `packages/logger`'s role in the main graph.

---

## 9. Historical duplication and stale forks (named, cited, not just gestured at)

### 9.1 `packages/api` vs `apps/api` — a real stale fork, not a naming coincidence

`packages/api` (`@the-new-fuse/api`, 98 files) has **zero** internal consumers (fan-in 0; confirmed both
by the bare-import scan and a targeted `ripgrep` sweep of `scripts/tests/tools`) and `apps/api`
(`@the-new-fuse/api-server`, 381 files) does not declare it as a dependency. That alone could mean "just
an unused scaffold." The stronger evidence is filename overlap: comparing basenames,
`packages/api/src/**/*.ts` and `apps/api/src/**/*.ts` share **29 of 85** filenames (34%), and the shared
names are not generic boilerplate — they include distinctive, feature-specific files:

```
unified-ledger.controller.ts, unified-ledger.module.ts, unified-ledger.service.ts,
unified-ledger.types.ts, admin-config.controller.ts, admin-metrics.controller.ts,
agent.module.ts, agent.service.ts, workflow.controller.ts, workflow.service.ts, ...
```

Diffed one directly:
- `apps/api/src/modules/unified-ledger/unified-ledger.controller.ts` — **919 lines**
- `packages/api/src/modules/unified-ledger/unified-ledger.controller.ts` — **223 lines**, materially
  different imports and structure (different guard/decorator paths, missing endpoints).

`packages/api` also shares 27 of the same 85 filenames with `apps/backend/src/**` (`@the-new-fuse/backend-app`).
Read together: `packages/api` looks like an earlier snapshot of what became `apps/api`'s (and partially
`apps/backend`'s) NestJS module tree, left behind as dead weight after the active development moved into
the app directories. It is not consumed by anything and should be a prime target for either deletion or
archival — a call for the authority-tracing workstream, not this one, but the evidence is here.

### 9.2 `packages/backend` — an unrelated stub, not a duplicate of `apps/backend`

`packages/backend` (`@the-new-fuse/backend`) is 3 files total: `src/index.ts` (a bare
`http.createServer` wrapper, 29 lines) and one sample test. It shares no filenames with `apps/backend`
(`@the-new-fuse/backend-app`, 313 files, the real NestJS service) and is not consumed by it. This is
plain dead scaffolding, not a fork of anything — worth distinguishing from 9.1's real-fork case.

### 9.3 `packages/agent/srcs/` and `packages/agent/srcsrc/` — literal duplicate source trees on disk

`packages/agent/` contains **three** sibling top-level directories: `src/` (77 files, the real one),
`srcs/` (1 file), and `srcsrc/` (2 files) — almost certainly the residue of a botched `mv`/`cp` during a
rename. Confirmed via `packages/agent/tsconfig.json`: `"include": ["src/**/*"]` — `srcs/` and `srcsrc/`
are outside the compiled build. Diffing the one file that exists in both `src/` and `srcs/`
(`services/MessageValidator.ts`) shows real divergent content (different imports: canonical `src/` uses
a relative `../types/core.js`, the orphan `srcs/` copy uses a bare `@the-new-fuse/core` import that
`packages/agent/package.json` does not declare — this file is the cause of a false-positive
"undeclared dependency" finding in an earlier pass of this analysis, excluded once identified; see the
`knownExclusions` note in the JSON). These two directories were excluded from the final graph as
non-representative dead weight, but they're worth flagging for cleanup on their own.

### 9.4 Naming collisions that look like duplication but are not

Checked and ruled out as false positives, for the record (so nobody re-flags them):
- **`contracts` / `contracts-legacy` / `control-plane-contracts` / `protocol-contracts`** — four
  unrelated meanings of "contract" (Solidity smart contracts under Hardhat; an orphaned older Solidity
  corpus with **zero filename overlap** with the active `contracts/src/`; TS control-plane
  authority/cost-policy types; TS wire-protocol schemas for `twip`/`sgp`/handoff/envelope). Confusing
  for humans and for the sibling "authority tracing" workstream, but not code duplication.
- **`claude-skills` / `claw-skills` / `jules-skill` / `gemini-browser-skill`** — four different
  agent-runtime skill integrations (Anthropic Claude Skills loader/parser/executor;
  markdown-only OpenClaw/PicoClaw skill packs, no code; Jules CLI delegation; Chrome's built-in Gemini
  automation). Consistent naming convention across CLI runtimes, not a fork.
- **`fairtable-*` cluster (4 packages)** — genuinely layered, not duplicated (§3).

---

## 10. Non-workspace directories living inside `packages/` (14 found)

These sit in `packages/` but have **no `package.json`**, so pnpm does not register them as workspace
members at all — they are invisible to `pnpm -r`, `turbo`, and any workspace-relative import:

| Directory | What's actually there |
|---|---|
| `packages/cache` | 2 `.ts` files (`redis-cache.service.ts`, `CacheService.ts`) |
| `packages/cli` | 3 `.ts` files under `src/` |
| `packages/compounding-memory` | `schemas/` + a large non-code `wiki/` tree |
| `packages/contracts-legacy` | 10 standalone `.sol` files + `shared/BaseAgentContract.sol` (§9.4) |
| `packages/core-auth` | Only a `README.md`, no source at all |
| `packages/crypto-agent-framework` | A Python project (`main.py`, `requirements.txt`) — not JS/TS |
| `packages/debugging` | 3 `.ts` files under `src/` |
| `packages/docs` | 2 `.ts` files under `src/` |
| `packages/hardware-bridge` | A compiled binary (`iphone_touch_send`) + `src/` |
| `packages/job-queue` | 1 `.ts` file under `src/` |
| `packages/lpm-native` | A Go module (`go.mod`/`go.sum`/`main.go`) |
| `packages/shared-utils` | 1 `.ts` file under `src/` |
| `packages/websocket` | 1 `.ts` file under `src/` |
| `packages/tnf-orchestrator-go` | A Go project |

None of these 13 orphan `.ts` files (across `cache`, `cli`, `debugging`, `docs`, `job-queue`,
`shared-utils`, `websocket`) were found being imported by anything, by relative path or otherwise — they
are stranded: not part of a build, not importable by package name (no `package.json` to give them one).

---

## 11. Packages with zero internal consumers (55% of the workspace)

**50 of 91** workspace packages/apps have fan-in 0 by static analysis. Apps having fan-in 0 is expected
(apps are roots, not libraries other things import). The list below is `packages/*` only — 38 of them —
cross-checked with an extra `ripgrep` sweep across `scripts/`, `tests/`, `e2e/`, `test-suite/`,
`tools/`, `src/`, `src-gen/`, `workflows/`, `autonomy/`, `self_improvement/`, `infrastructure/`,
`agent-communication/` for the package name string (not import-verified, just string presence — see
`zeroFanInPackages_externalUsageCheck` in the JSON for the exact file hits):

- **Found string references outside `apps/packages` (not proof of a real import, but a signal of
  intended use):** `@the-new-fuse/api` (7 hits, e.g. `scripts/execute-refactor-consensus.ts`),
  `@the-new-fuse/backend` (2), `@the-new-fuse/common` (1), `@the-new-fuse/contracts` (1),
  `@the-new-fuse/control-plane-contracts` (4, in `scripts/lib/tnf-elevation-broker.cjs` and
  `tnf-capability-grant.cjs`), `@the-new-fuse/data` (7), `eslint-config-custom` (2, expected — referenced
  via `.eslintrc` `extends`, not `import`), `@the-new-fuse/feature-suggestions` (2),
  `@the-new-fuse/tnf-browser` (1).
- **Zero references found anywhere in the sweep too** (strongest "unused" signal in this repo):
  `@tnf/a2a-protocol`, `@the-new-fuse/agent-coordination`, `@the-new-fuse/agent-evaluation-framework`,
  `@the-new-fuse/agentic-rag-search`, `@the-new-fuse/ai-security-bridge`, `@the-new-fuse/api-optimization`,
  `@the-new-fuse/auth`, `@tnf/build-optimization`, `@the-new-fuse/claude-skills`, `@the-new-fuse/claw-skills`
  (expected — markdown skill packs, consumed by symlink/file-copy per its own description, not import),
  `@the-new-fuse/client`, `@the-new-fuse/deployment-core`, `@the-new-fuse/extension-core`,
  `@the-new-fuse/gemini-browser-skill`, `@the-new-fuse/google-sheets-mcp-server`,
  `@the-new-fuse/governance-gate`, `@the-new-fuse/integration-tests`, `@the-new-fuse/jules-integration`,
  `@the-new-fuse/mcp-cloud-redis-bridge`, `@the-new-fuse/mcp-concordance-server`,
  `@the-new-fuse/mcp-skills-server`, `@the-new-fuse/mcp-tar-bridge`, `@the-new-fuse/messaging-bridge`,
  `@the-new-fuse/port-management`, `@the-new-fuse/proto-definitions`, `@the-new-fuse/resource-registry`,
  `@the-new-fuse/telegram-bot-service`, `@the-new-fuse/test-utils`, `@the-new-fuse/testing` (81 files —
  the largest zero-fan-in package by far; most plausibly a standalone E2E suite invoked via its own
  `package.json` `scripts`/CI job rather than imported, but that is inference, not verified here),
  `@the-new-fuse/websocket-infrastructure`.

Several of these (`mcp-cloud-redis-bridge`, `mcp-concordance-server`, `mcp-skills-server`,
`mcp-tar-bridge`, `google-sheets-mcp-server`, `devops-bridge-mcp`, `tnf-network-mcp`,
`vision-bridge-mcp`) are standalone MCP servers by design — they are meant to be launched as separate
processes (referenced from an MCP client config like `.mcp.json`, not imported by other packages), so
zero *import* fan-in is expected and not itself a defect for that subset. This report does not have
visibility into `.mcp.json`/agent config files to confirm they're actually registered anywhere; that is
a natural next question (§13).

---

## 12. Thin adapters (small, legitimately low fan-out, real re-export role)

- **`@the-new-fuse/logger`** — 1 file, fan-in 6. The cleanest "thin but real" package in the repo:
  minimal surface, genuinely depended on.
- **`@the-new-fuse/api-types`** — 13 files, exists purely to hold shared request/response types; declares
  `@the-new-fuse/types` as a dependency it never imports (§4), consistent with a thin, mostly-static
  types package.
- **`@the-new-fuse/core-error-handling`** (20 files) and **`@the-new-fuse/core-monitoring`** (44 files) —
  fan-in 3 each, consumed by `claude-skills` and `backend-app`; moderate size but narrow adoption,
  consistent with "adapter for a specific concern" rather than a structural hub.

---

## 13. Confidence and next questions

**Most confident about:**
- The package-level edge list, the "declared vs imported" mismatch tables, and the 10 relative
  boundary-crossings in §5 — every one of these is backed by an exact file path and specifier string
  that was read directly off disk in this worktree, and the highest-stakes claims (§6's non-cycle, §9.3's
  orphan trees) were independently verified against the relevant `tsconfig.json` `include` and a real
  `diff`, not just import-string matching.
- That there is **no genuine cross-package circular dependency** in this monorepo — this was checked
  two ways (my own DFS over the bare-import+relative-crossing edge set, and `madge --circular`'s
  independent file-level traversal) and both agree once the one candidate is traced to its `tsconfig`
  exclusion.
- The `packages/api` vs `apps/api` stale-fork finding (§9.1) — the 34% filename overlap plus a direct
  content diff on a shared filename is about as strong as static evidence gets without git-blame/history
  archaeology.

**Least confident about, and why:**
- **The "55% of packages have zero fan-in" number as a measure of "unused."** It is a real measure of
  "no source-level import statement was found," not a measure of "unused in production." Several likely
  explanations were spot-checked (MCP servers launched by config, not import; `testing` as a
  standalone E2E harness) but not verified against actual `.mcp.json`/CI/deploy configs, which this
  workstream did not have in scope. This is the single biggest source of possible overstatement in this
  report if read too literally.
- **The `scripts/` coverage.** Only the 13 genuinely-shared modules and 15 real crossings were graphed;
  the other ~700 script files were not individually walked for imports of workspace packages beyond the
  targeted `ripgrep` string sweep in §11. A package could have a real script-only consumer that the
  sweep's directory list (`scripts/tests/e2e/test-suite/tools/...`) didn't happen to cover, or that only
  shows up as a dynamic `require()` built from a variable rather than a string literal (which the regex
  extractor cannot see by construction).
- **`apps/tauri-desktop`'s 8 declared-but-unimported workspace packages.** Tauri apps often do more of
  their real work through Rust/FFI boundaries and dynamic imports than a typical Node app; it's plausible
  several of these are genuinely used via a pattern this analysis can't see, rather than aspirational.
  Flagged, not resolved.

**Highest-value next question this graph raises:** given that `packages/api` (98 files, real NestJS
module code, zero consumers) sits alongside `apps/api` (381 files, likely its successor) with 34%
filename overlap and divergent content on the files they share — **is `packages/api` safe to delete, or
does something outside this static graph (a deploy target, a CI job, a symlink, an agent config) still
depend on it?** That is squarely an authority-tracing / structural-audit question for the sibling
workstreams, and this graph is the evidence they'd need to act on it rather than guess.
