# TNF Platform Reconciliation Program — 2026-09-05

> **Status:** ACTIVE swarm directive (see `docs/protocols/LIVING_STATE.md`)
> **Operator ask (Daniel, 2026-09-04):** reconcile the "newest iteration" at
> `production.thenewfuse-main.pages.dev` with `app.thenewfuse.com`, keep the UI
> consolidation, restore the features that went missing (drag-and-drop workflow
> building), get cloud-hosted agents working live on the website in conjunction
> with the local CLI agents, and engage the whole swarm. **Branch:**
> `feat/platform-reconciliation-20260905` **Evidence discipline:** every claim
> below was re-probed on 2026-09-05 (State Freshness Mandate). Re-probe before
> asserting any of it later.

---

## 1. What is actually true (findings)

### F1. The two hostnames are one app, one Pages project, two commits

| Host                                   | Pages environment                   | Deployment | Source commit          | Deployed     |
| -------------------------------------- | ----------------------------------- | ---------- | ---------------------- | ------------ |
| `app.thenewfuse.com`                   | Production (branch `main`)          | `195e7d31` | `05e1189` (2026-09-02) | 2 days ago   |
| `production.thenewfuse-main.pages.dev` | Preview (branch alias `production`) | `209ff5a6` | `9ac13b2` (2026-09-04) | 13 hours ago |

Both are `apps/frontend` built into the Cloudflare Pages project
`thenewfuse-main`. `pnpm --filter @the-new-fuse/frontend-app deploy:pages` uses
`--branch=production`, which is **not** the project's production branch
(`main`), so it publishes a _preview alias_. CI (`deploy-frontend-pages.yml`,
manual dispatch only — Actions billing is blocked) publishes `--branch=main`.

Bundle-level diff of the two live deployments (all lazy chunks downloaded and
compared by name and size):

- identical route table (247 `path:` entries), identical lazy-chunk set (186);
- 7 chunks differ, none by more than 151 bytes (`WorkflowBrowser`,
  `SkillsBrowser`, `AgentTemplatesBrowser`, `SuperAdminControlPanel`, the shared
  `service`/`client`/`es` chunk) — matching the tiny committed diff between
  `05e1189` and `9ac13b2`.

**Conclusion:** there are not two UIs to merge. The "newest iteration" is the
same consolidated UI both hosts already serve. Reconciliation means _promote one
verified build to the production branch_ and stop deploying to the preview alias
by accident.

### F2. Drag-and-drop workflow building is present and working — it is hidden

- `/workflows/builder` renders `pages/workflow-pages/Builder.tsx` →
  `WorkflowCanvas` from `@the-new-fuse/workflow-builder` (drop handler at
  `packages/workflow-builder/src/canvas/WorkflowCanvas.tsx:123`) with the
  frontend `NodeToolbox` as the drag source.
- Verified live on the preview host: dragging the **Agent** card onto the canvas
  created a node (`1 NODES`).
- It is "missing" because commit `ceead4410` (2026-09-01, #278) reduced the
  default sidebar to _Dashboard_ + _Workspace_ and folded the entire **Forge**
  tier (Agent Fleet, Workflows, AI Portal, Computer Use) plus Nexus and Apex
  into a collapsed **Advanced Controls** toggle
  (`apps/frontend/src/components/Sidebar/PremiumSidebar.tsx`).
- Fix on this branch: Forge is a first-class section again; Workflows gains
  Builder / Templates / Executions children; Nexus, Apex and the `advanced`
  items stay behind the toggle. Regression test added in
  `PremiumSidebar.test.tsx`.

### F3. The builder's agent palette cannot load agents on the preview host

Console on `production.thenewfuse-main.pages.dev/workflows/builder`:
`/api/agents` and `/api/agents/bank/templates` → `TypeError: Failed to fetch`
(`AgentService.getFleetAgents`). Same-origin `/api/*` is routed for
`app.thenewfuse.com` (`/api/health` → 200 there); verify the routing on the
preview alias and on the promoted production build (Lane A acceptance).

### F4. "Mission Control" is a local-harness surface being served from the cloud

`/dashboard` → `useHarnessStatus` → `GET /api/harness/status` →
`apps/api/src/modules/harness/harness.service.ts`, which reads
`~/.tnf/fleet/mode.json`, the harness cycle file and the local Redis hash
`tnf:agent-registry`. On Cloud Run (`api.thenewfuse.com`) none of those exist,
so the cloud dashboard shows _No deployment data_ / _Local crontab unavailable_
while the operator's machine has a live fleet:

| Surface                                           | Agents visible                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| local relay `http://127.0.0.1:3007/health`        | 6                                                                                                       |
| local Redis `tnf:agent-registry`                  | ~20 (Project-Planner, Continuous-Improver, LLM-Orchestrator, News-Scout, hermes, sub-director, BROKER…) |
| cloud relay `https://relay.thenewfuse.com/agents` | 0                                                                                                       |
| cloud API `https://api.thenewfuse.com/api/agents` | DB agents only (401 unauthenticated)                                                                    |

### F5. Cloud-hosted agent runtime exists but is not wired to the website

- `cloudflare-openclaw-runtime` (`openclaw-runtime.bizsynth.workers.dev`) is
  live: `POST /v1/agents/invoke|chat` → SharedState receipt → forwards to
  `openclaw-gateway` (`executorConfigured: true`). Blueprint:
  `docs/operations/CLOUD_HOSTED_AGENT_DEPLOYMENT_BLUEPRINT.md` (#303).
- Nothing in `apps/frontend` calls it. Nothing publishes the local roster to the
  cloud (searched `scripts`, `packages/tnf-cli`, `apps/relay-server`, `apps/api`
  for a sharedstate/relay/harness uplink client: none).
- The local relay already has an outbound bridge pattern
  (`initializeSynapseBridge`, `TNF_SYNAPSE_URL`) and the cloud relay accepts
  `REGISTER` frames with `capabilities` — the uplink can reuse both.

### F6. Unlanded work that belongs to this program

| Branch                                                               | Ahead of main       | What it carries                                                                                                                               |
| -------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `chore/worktree-consolidation-20260904` (= preview commit `9ac13b2`) | 4                   | commercialization scaffolding (Stripe webhook, extension auth), `tnf list` joins definitions with the live bus, duplicate handoff-command fix |
| `feat/workflow-builder-tauri-migration`                              | 7 (base 2026-08-31) | finishes the builder extraction so SaaS + Tauri share one canvas; node library moved into the package                                         |
| `fix/workflow-execution-engine`                                      | 1                   | conditional branching fix + **real agent execution** in the engine                                                                            |
| `main` vs both deployments                                           | 10                  | Google ecosystem hub, AG-UI dynamic UI synthesizer, Chrome built-in AI, GCP Cloud Build pipeline                                              |

### F7. The box is mostly supervising itself

Process census 2026-09-05T01:40Z — 67 node/pnpm processes at load1 175 on a
4-core machine:

| Count  | Category                                                                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20     | uncategorised — 4 wrangler, **3 concurrent `tnf-doctor.cjs`**, 2 turbo, 2 scan.cjs, 2 serve-browser-control                                                                             |
| 12     | relay/broker/clock daemons (standalone-relay, redis-ws-bridge, relay-channel-monitor, federation-channel-broker, green-channel-coordinator, master-clock, broker-agent, director-agent) |
| **14** | **pure pnpm wrapper overhead** — 10 pnpm shims + 4 `pnpm run` wrappers, for roughly 5 logical jobs                                                                                      |
| 5      | agent loops (supercycle-flywheel, impetus-loop, project-planner)                                                                                                                        |
| 5      | continuous test loop (`test:continuous` → vitest, 44 min elapsed, 365 MB + forked workers)                                                                                              |
| 4      | interactive CLI/TUI                                                                                                                                                                     |
| 3      | resource guard/watchdog                                                                                                                                                                 |
| 2      | vite dev servers                                                                                                                                                                        |

Very little of this is product work. `pnpm run X` costs three processes per job
and every daemon started that way pays the tax for its whole lifetime.
`A1-Inter-LLM-Com/The-New-Fuse` (no `TNF/` segment) is a **symlink** to the same
checkout, not a second clone — 8 processes merely spell the path that way.

### F8. The roster is 85% fossils, and the mesh is empty

| Measure                                                | Count                |
| ------------------------------------------------------ | -------------------- |
| Redis `tnf:agent-registry` entries                     | **39**               |
| Beating within their own declared `expectedCadenceSec` | **6**                |
| Connected to the federation mesh `:3007`               | **1** (BROKER-Green) |
| Connected to the legacy relay `:3000`                  | **0**                |

The transport itself is proven, not mocked:
`docs/protocols/reports/FEDERATED_WS_CHANNEL_CHECK_LATEST.json` (00:47) shows
real bidirectional delivery with isolation holding in both directions —
`blueLeakToGemini: false`, `greenLeakToKimi: false`, and matching observer
counts. But every participant in that run is a synthetic client the check script
creates and tears down (`fed-ws-<runId>-green-observer`,
`-subdirector-blue-bridge`, …). **It proves the pipes work; it does not prove
agents use them.** Agents register in Redis and do not connect to the mesh, so
most sends address ids nobody is listening on.

### F9. Model allocation is flat — every role gets the same model

`data/llm-provider-status.json`, lastChecked 2026-09-05T01:35Z:

```text
bestAvailable : openrouter / openrouter/auto
fallbackChain : [openrouter]                     ← one entry
allocations   : orchestrator → openrouter/auto
                worker       → openrouter/auto
                reviewer     → openrouter/auto
```

`openrouter/auto` hands model selection to OpenRouter's router, so TNF has no
control over cost per task and no way to put a cheap flash model on high-volume
worker turns while reserving a stronger model for orchestration and review. The
`allocations` map is **already role-keyed** — the shape for tiered routing
exists and is simply unused. This is the largest compute-per-cost lever in the
system and it is a config-plus-wiring change, not new architecture.
`scripts/llm-intel/llm-apply-rankings.cjs` and `llm-ranking-optimizer.cjs`
already exist to drive it.

### F10. The resource guard becomes a load source under load

`scripts/lib/tnf-resource-guard.cjs preflight` has no self-timeout. Observed at
load1 175: a preflight starved for 4.5 minutes while launchd's 300s
`StartInterval` spawned another on top of it. The component that detects
overload contributes to it. This predates the 2026-09-05 priority work (the hang
is _before_ the priority decision) and is untouched by it.

---

## 2. Lanes (swarm assignment)

Each lane is a capability, not a named agent (harness rule). Claim a lane by
appending a row to `docs/protocols/AGENT_STATUS_LEDGER.md`, work in a worktree
or clone (`node scripts/harness/resolve-workspace-tier.cjs --describe`), and
emit a handoff at every stage boundary. Do not `--no-verify`.

### Lane A — Surface and promote (frontend + deploy)

1. Land this branch (sidebar Forge section + Workflows children).
2. Build `apps/frontend`, deploy to the preview alias, verify in a browser:
   Forge visible, `/workflows/builder` drag-drop creates a node, agent palette
   loads (F3).
3. Promote to production:
   `wrangler pages deploy dist --project-name=thenewfuse-main --branch=main`
   (this is what serves `app.thenewfuse.com`). Verify the same three checks
   there.
4. Make the accident impossible: change `deploy:pages` in
   `apps/frontend/package.json` to require an explicit `--branch`, and document
   that `production.thenewfuse-main.pages.dev` is a _preview_ alias.

**Accept when:** `app.thenewfuse.com` shows Forge by default, drag-drop verified
there, `/api/agents` returns 200 for a logged-in operator.

### Lane B — Workflow builder completion

1. Triage `fix/workflow-execution-engine` against `main` (real worktree merge,
   not `merge-tree`) and land it.
2. Triage `feat/workflow-builder-tauri-migration`: what of the 7 commits is
   already on `main` since #272 (`c42604484`), what still matters. Land the
   remainder or close the branch with a written reason.
3. Builder → save → execute round trip verified on `app.thenewfuse.com` against
   `api.thenewfuse.com`; execution appears under `/workflows/executions`.
4. Agent palette in the builder reads the merged fleet (Lane C4), not only DB
   agents.

**Accept when:** an operator can build a 3-node workflow with drag-drop, save
it, run it, and see the run in Executions — on the public site.

### Lane C — Cloud-hosted agents live, federated with local CLI agents

- **C1 Cloud fleet source.** `GET /api/harness/status` and `GET /api/agents` on
  Cloud Run must answer from cloud sources: DB agents, the
  `openclaw-runtime`/`openclaw-gateway` roster, and the SharedState receipt
  ledger — never from `~/.tnf` files. Keep the local-file reader for the
  operator-machine API (it is correct there); select by runtime, not by
  guessing.
- **C2 Local→cloud uplink.** One daemon (extend `apps/relay-server`'s bridge
  pattern or add a `tnf` CLI command — search first, `tnf list` already joins
  definitions with the live bus on `9ac13b2`) that publishes the local roster
  and harness snapshot to the cloud on an interval, authenticated with the
  operator's login custody (#293 entitlements). Transport: `REGISTER` on
  `wss://relay.thenewfuse.com/ws` as `type: local-relay` with the roster in
  `capabilities`, or a SharedState `deposit`. Both endpoints are live today.
- **C3 Merge and label.** `harness/status.relay.agents[]` carries
  `origin: 'local' | 'cloud'` and `operatorId`. Frontend Agent Fleet (`/agents`,
  `pages/AgentsRevolution.tsx`) and the builder palette show the badge.
- **C4 Invoke path.** Agent Fleet → _Run_ on a cloud agent →
  `POST /v1/agents/invoke` on `openclaw-runtime` with tenant + `budgetCap`; the
  receipt shows up in Audit Channels. Respect the Federation gate finding: a
  swallowed 401 that returns `allow` is not success — surface it.

**Accept when:** with the operator's laptop online, `app.thenewfuse.com/agents`
lists the local CLI agents _and_ the cloud agents with origin badges; with the
laptop offline the cloud agents remain and the local ones age out; invoking a
cloud agent from the site returns a receipt id that is visible in Audit
Channels.

### Lane D — Branch convergence

1. PR the 4 commits on `chore/worktree-consolidation-20260904` (they are what
   the preview alias is running).
2. Re-verify `retire-openclaw` carries (Subscriptions, Task Workers, Chrome Ext
   v7) — memory says they never landed.
3. Every PR: fresh branch off `main`, squash-merge, delete branch.

### Lane E — Swarm engagement (this session)

- Directive set in `LIVING_STATE.md`; handoff emitted with the lane list as
  `next_actions`; heartbeat-driven terminals pick it up at Turn Zero.
- Lane owners report by ledger row + handoff, not chat.

### Lane F — Runtime efficiency and compute-per-cost (RUN THIS FIRST)

Findings F7–F10. Ordered deliberately: each step makes the next one meaningful,
and doing them out of order optimises fiction.

**F1 — Roster truth before routing.** Ordering decisions across a roster that is
85% fossils optimises fiction; every downstream tree branches on stale inputs.
Derive liveness from `lastSeen` vs `expectedCadenceSec` at every read site (the
`DispatchGuard` fix on this branch does it for sends — do the same wherever the
roster is consumed), make `agent-registry-prune.cjs` run on a schedule now that
it points at the live bus, and find out why registered agents never connect to
`:3007`. Accept when the mesh count and the live-registry count agree within
one.

**F2 — Role-tiered model allocation.** Populate `allocations` per role in
`data/llm-provider-status.json` instead of `openrouter/auto` across the board: a
flash-class model for worker turns, a stronger model for orchestrator and
reviewer. Drive it from the existing `scripts/llm-intel/` ranking tools rather
than hand-editing. Biggest cost win, smallest change. Accept when a worker turn
and an orchestrator turn demonstrably resolve to different models and the
per-role choice is recorded in a receipt.

**F3 — Process-count budget.** Set a target and hold to it. Invoke scripts
directly from launchd/cron instead of through `pnpm run` (14 of 67 processes are
wrapper tax), collapse the 3 concurrent `tnf-doctor.cjs` and 4 wrangler
processes to one each, and decide whether `test:continuous` and the vite dev
servers belong in the always-on set at all. This is what buys the headroom that
makes delegation viable — priority admission gets one message through a pause;
it does not lower the baseline. Accept when idle-state process count is under a
written budget and load1 sits below the normal bar (16) at rest.

**F4 — Guard self-timeout.** Bound `tnf-resource-guard.cjs preflight` so it
cannot be starved past a few seconds, and make the launchd guard refuse to stack
a second preflight while one is in flight. Accept when a synthetic load spike
produces exactly one guard process per job per interval.

**F5 — Then delegation ordering**, which is where `taskDispatchScore` already
lives and already works (see §3). Do not rebuild it; feed it a true roster and a
tiered model table and it will do its job.

**Delegation routing note (operator, 2026-09-05):** the **`pi` agent is
currently the most efficient CLI agent** in the fleet — prefer it for delegated
specialty work where a CLI agent is the right executor, and treat it as the
default worker-tier target until measurement says otherwise. Record the
measurement when you have it, so this stops being a preference and becomes a
number.

---

## 3. Do-not-reinvent index

| Responsibility                            | Existing implementation                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow canvas, node library, validation | `packages/workflow-builder/src`                                                                                                                                                                                                                                                                                                          |
| Drag source (palette)                     | `apps/frontend/src/components/workflow/NodeToolbox.tsx`                                                                                                                                                                                                                                                                                  |
| Sidebar IA                                | `apps/frontend/src/config/sidebarNavigation.ts`, `components/Sidebar/PremiumSidebar.tsx`                                                                                                                                                                                                                                                 |
| Harness / fleet status API                | `apps/api/src/modules/harness/*`                                                                                                                                                                                                                                                                                                         |
| Cloud agent ingress                       | `cloudflare-openclaw-runtime/src/index.ts`                                                                                                                                                                                                                                                                                               |
| Receipt ledger                            | `cloudflare-sharedstate` (`/deposit`)                                                                                                                                                                                                                                                                                                    |
| Relay outbound bridge pattern             | `apps/relay-server/src/comprehensive-tnf-relay.js` (`initializeSynapseBridge`)                                                                                                                                                                                                                                                           |
| Cloud relay routing                       | `cloudflare-relay-proxy/wrangler.toml` → Cloud Run `relay-server`                                                                                                                                                                                                                                                                        |
| Frontend agent client                     | `apps/frontend/src/services/AgentService.ts`                                                                                                                                                                                                                                                                                             |
| Live bus roster                           | Redis hash `tnf:agent-registry`; `tnf list` on `9ac13b2`                                                                                                                                                                                                                                                                                 |
| Deployment blueprint                      | `docs/operations/CLOUD_HOSTED_AGENT_DEPLOYMENT_BLUEPRINT.md`                                                                                                                                                                                                                                                                             |
| **Message priority / dispatch ordering**  | `TaskSchedulerService.taskDispatchScore` (`packages/relay-core/src/services/task-scheduler.service.ts`) — live, instantiated by `master-clock.ts`. Weights: p0/urgent 500, critical 400, p1/high 300, normal/p2 200, p3/low 100, plus itinerary-lane and horizon weights, votes and a freshness bonus. **Do not build a second ranker.** |
| **Process admission under load**          | `scripts/lib/tnf-resource-guard.cjs` + `tnf-fleet-mode.cjs`. Distinct from the broker: the broker decides _which_ message goes first, the guard decides whether _anything_ may start. Since 2026-09-05 they share one priority vocabulary.                                                                                               |
| Channel bridging (NOT ordering)           | `scripts/runtime/federation-channel-broker.cjs` — DACC-v1 signing and context references. Despite the name it has no priority logic.                                                                                                                                                                                                     |
| Model/provider allocation                 | `data/llm-provider-status.json` `allocations` (role-keyed); tooling in `scripts/llm-intel/`                                                                                                                                                                                                                                              |
| Registry pruning                          | `scripts/agent-registry/agent-registry-prune.cjs` (points at the live bus since 2026-09-05)                                                                                                                                                                                                                                              |

---

## 4. Probe commands (re-run before asserting)

```bash
# Which commit is each host serving?
cd apps/frontend && npx --no-install wrangler pages deployment list --project-name=thenewfuse-main | head -20

# Edge + cloud services
curl -s https://openclaw-runtime.bizsynth.workers.dev/health
curl -s https://openclaw-gateway.bizsynth.workers.dev/health
curl -s https://relay.thenewfuse.com/agents
curl -s https://api.thenewfuse.com/health

# Local fleet
curl -s http://127.0.0.1:3007/health
redis-cli HKEYS tnf:agent-registry | wc -l

# Lane F: roster truth — registered vs actually beating vs on the mesh
redis-cli HLEN tnf:agent-registry
curl -s http://127.0.0.1:3007/health | python3 -c "import sys,json;print('mesh agents:',json.load(sys.stdin)['agents'])"

# Lane F: what is the box actually running?
ps -A -o args | grep -cE "[n]ode|[p]npm"
node scripts/lib/tnf-resource-guard.cjs snapshot

# Lane F: is model allocation still flat?
node -e "const d=require('./data/llm-provider-status.json');console.log(Object.entries(d.allocations).map(([r,p])=>r+' -> '+p.defaultModel).join('\n'))"
```
