# Directive to the Local Sub-Director — Platform Reconciliation & World-Class TNF

**From:** Operator (Daniel) via Claude session
`session_01R1srw2s4BNMKbAGF3VAAsN`, 2026-09-05 **To:** `tnf-local-subdirector`
(tnf-cli-agent), to orchestrate the whole fleet **Authority:** Operator
directive. Supersedes "Merge Authority Lane PR #301" as the Current Directive in
`docs/protocols/LIVING_STATE.md`. **Program file (ground truth + lanes +
acceptance criteria):**
`docs/operations/PLATFORM_RECONCILIATION_PROGRAM_2026-09-05.md` **Starting
branch:** `feat/platform-reconciliation-20260905` (worktree at
`.claude/worktrees/platform-reconciliation`) — sidebar fix, regression test,
program doc, this directive. Typecheck clean, sidebar tests 7/7.

---

## 0. Why you are receiving this

The operator can no longer afford to run the frontier model for day-to-day work.
From here on **you** run the program: hydrate, plan, dispatch to specialty
agents by capability, verify, and report by ledger + handoff. Do not wait for a
human to prompt each step. Use `tnf full-auto` for the loop and
`tnf subdirector cycle` for drain/sync. Escalate to the operator only for
decisions that are genuinely theirs (spend, public publication, deleting data).

## 1. The operator's intent, verbatim in spirit

1. Reconcile the "newest iteration" (`production.thenewfuse-main.pages.dev`)
   with `app.thenewfuse.com`. Keep the UI consolidation and component
   refactoring. Restore what went missing — the drag-and-drop workflow builder
   is the named example. The newest iteration is unfinished.
2. Get **cloud-hosted agents working live on the website**, working **in
   conjunction with the local CLI agents**.
3. **The entire swarm engages** in improving the platform.
4. Standing mandate: make TNF **world class in all aspects** — product,
   reliability, security, developer experience, documentation, cost.

## 2. Ground truth you must not re-derive from memory (re-probe, then act)

- Both hostnames are the same `apps/frontend` build in Pages project
  `thenewfuse-main`. `app.thenewfuse.com` = Production/`main` deployment
  `195e7d31` (commit `05e1189`). The pages.dev URL = Preview alias `production`,
  deployment `209ff5a6` (commit `9ac13b2`). Bundles are byte-equivalent apart
  from 7 chunks under 151 bytes. **There are not two UIs to merge.**
  Reconciliation = promote one verified build to `main` and stop deploying to
  the preview alias by accident (`deploy:pages` uses `--branch=production`).
- Drag-and-drop works at `/workflows/builder` (verified live: dragging Agent
  created a node). It was hidden by commit `ceead4410` (#278), which folded
  Forge (Agent Fleet, Workflows, AI Portal, Computer Use) into the collapsed
  "Advanced Controls" toggle. Fixed on the starting branch.
- The builder's agent palette fails on the preview host: `/api/agents` →
  `Failed to fetch`. Verify on the promoted production build.
- Mission Control (`/dashboard`) reads `GET /api/harness/status`, which reads
  `~/.tnf/*` files and local Redis `tnf:agent-registry`. On Cloud Run those do
  not exist, so the public dashboard is empty while the laptop runs a live fleet
  (local relay :3007 = 6 agents; Redis registry ≈ 20 entries; cloud relay
  `relay.thenewfuse.com/agents` = 0).
- Cloud agent ingress exists and is healthy (`openclaw-runtime` →
  `openclaw-gateway`, `executorConfigured: true`; blueprint in
  `docs/operations/CLOUD_HOSTED_AGENT_DEPLOYMENT_BLUEPRINT.md`). Nothing in the
  frontend calls it, and **no uplink publishes the local roster to the cloud**
  (searched; none exists).
- Unlanded work: `chore/worktree-consolidation-20260904` (= `9ac13b2`, 4
  commits: commercialization scaffolding, `tnf list` joins definitions with the
  live bus), `feat/workflow-builder-tauri-migration` (7 commits),
  `fix/workflow-execution-engine` (real agent execution). `main` is 10 commits
  ahead of both deployments.

## 3. Lanes to dispatch (capability → lane; owners claim by ledger row)

| Lane                                       | Capability                         | First concrete task                                                                                                                                                                                                                                                                                                                                                                                                            | Accept when                                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F Runtime efficiency & cost (DO FIRST)** | runtime + llm-intel + relay        | F1 roster truth (39 registered, 6 beating, 1 on the mesh); F2 role-tiered model allocation (every role is `openrouter/auto` today); F3 process-count budget (67 processes, 14 of them pnpm wrapper tax); F4 guard self-timeout; F5 then delegation ordering                                                                                                                                                                    | Mesh count ≈ live-registry count; worker and orchestrator turns resolve to different models; idle process count under a written budget with load1 < 16 at rest                                    |
| A Surface & promote                        | frontend + Cloudflare deploy       | Land the starting branch; build; deploy preview; verify Forge visible + drag-drop + palette loads; then `wrangler pages deploy dist --project-name=thenewfuse-main --branch=main`                                                                                                                                                                                                                                              | `app.thenewfuse.com` shows Forge by default, drag-drop verified there, `/api/agents` 200 for a logged-in operator                                                                                 |
| B Workflow completion                      | frontend + api                     | Land `fix/workflow-execution-engine` (real worktree merge); triage `feat/workflow-builder-tauri-migration` vs `main` since #272                                                                                                                                                                                                                                                                                                | 3-node workflow: drag-drop → save → run → visible in `/workflows/executions` on the public site                                                                                                   |
| C Cloud agents live + federated            | api + relay + cloudflare + tnf-cli | C1 cloud fleet source for `harness/status` & `/api/agents` on Cloud Run; C2 local→cloud uplink daemon (extend relay `initializeSynapseBridge` pattern or `tnf` command; `REGISTER` on `wss://relay.thenewfuse.com/ws` or SharedState deposit; auth = operator login custody #293); C3 origin badges local/cloud in Agent Fleet + palette; C4 Run → `POST /v1/agents/invoke` with tenant + budgetCap, receipt in Audit Channels | Laptop online: site lists local CLI agents _and_ cloud agents with badges; laptop offline: cloud agents remain, local age out; invoking a cloud agent returns a receipt visible in Audit Channels |
| D Branch convergence                       | git/release                        | PR the 4 commits on `chore/worktree-consolidation-20260904`; re-verify `retire-openclaw` carries; fresh branch per PR, squash-merge                                                                                                                                                                                                                                                                                            | No feature exists only on a stale branch                                                                                                                                                          |
| E World-class loop                         | all, coordinated by you            | Each full-auto cycle: pick the highest-leverage measurable gap (broken route, failing check, missing test, slow build, security finding, stale doc), fix it end-to-end with evidence, record it                                                                                                                                                                                                                                | Every cycle leaves a ledger row with before/after evidence                                                                                                                                        |

## 4. Operating rules (non-negotiable)

1. **Inspect → Act → Verify.** Verify external state before claiming it (State
   Freshness Mandate). Existence is not position.
2. **Workspace isolation.** Anything that moves HEAD or is broad runs in a
   worktree or clone
   (`node scripts/harness/resolve-workspace-tier.cjs --describe "<task>"`). The
   shared checkout has lost other agents' work twice. Commit at every stage
   boundary.
3. **Gates are verdicts.** A crashed gate is not permission. Never
   `--no-verify`. Emit a handoff before pushing (the push gate needs it).
4. **Do not reinvent.** Search for the responsibility first (index in the
   program doc §3). Extend; only add a parallel path if it removes overlap.
5. **Honest results.** No fabricated success (SkIDEancer pattern). A swallowed
   401 that returns `allow` is a bug, not a pass.
6. **Report by artifact:** ledger row + `tnf turn-end` handoff per stage. Chat
   acknowledgement is not memory; use `tnf remember retain` for facts.
7. **Cost discipline:** prefer local/free providers and cheaper models for
   routine lanes; reserve frontier models for architecture decisions with a
   written rationale.
8. **Public repo hygiene:** `The-New-Fuse` remote is public and auto-fed.
   Personal data stays in its own repo. Check the proprietary-leak probe before
   publishing.

## 4a. Delegation routing (operator guidance, 2026-09-05)

- **The `pi` agent is currently the most efficient CLI agent in the fleet.**
  Prefer it for delegated specialty work where a CLI agent is the right
  executor, and treat it as the default worker-tier target until measurement
  says otherwise. When you have a cost/throughput number for it, record that in
  the ledger so this stops being a preference and becomes a measurement.
- **Delegation is a first-class priority, not an afterthought.** You are the
  delegation path; a cycle you spend executing something a worker could have
  taken is a cycle the fleet spent at orchestrator prices. Route by capability
  first, cost second, and only execute yourself what cannot be delegated.
- **You now hold high-priority admission.** Your cycle and the local
  sub-director runtime pass through a watchdog load pause up to the hard ceiling
  (`--priority high`, 2.5x the load bar / 96% memory). That exists so you can
  keep delegating while the fleet is throttled — use it to dispatch, not to run
  heavy work yourself. Above the ceiling nothing runs at any priority, and that
  is correct: a directive that finishes the box off delivers nothing.
- **Two priority layers, one vocabulary** (see program doc §3): the broker
  (`TaskSchedulerService.taskDispatchScore`) decides which message goes first;
  the resource guard decides whether anything may start. Both read the same
  words — `p0|urgent|critical|p1|high` outrank `normal|p2|medium|p3|low`. Do not
  build a third ranker.

## 5. Dispatch protocol for you

1. Run Turn Zero (`pnpm run tnf:onboard -- --task "platform reconciliation"`),
   then re-probe §2 with the commands in the program doc §4.
2. Set fleet autonomy for the program (`tnf subdirector autonomy`), enqueue lane
   tasks to the planning queue, and assign each lane to the agent whose declared
   capabilities match (use the registry; not named agents).
3. Order of operations: **F1–F4** → A → (B ∥ C1 ∥ D) → C2 → C3 → C4 → F5 → E
   continuous. Lane F comes first because the rest is delegated work, and
   delegation across a roster that is 85% fossils on a box at load 175 does not
   land. F1–F4 buy the headroom and the truth that every other lane spends.
4. After each lane acceptance, deploy and verify **on the public site**, not
   only locally. Screenshots or curl receipts go in the ledger row.
5. Every 24h, publish a short program status into `LIVING_STATE.md` under this
   directive: lanes done / in progress / blocked-on-operator.
