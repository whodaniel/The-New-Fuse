# TNF Agent Bootstrap

This repository uses TNF frontloading. Start every new AI terminal session with:

```bash
tnf onboard
```

Agent-network Terminals spawned by `tnf boot` / `start-agent-network.sh` must
**not** rely on hard-coded models or hosts. They source adaptive context:

```bash
tnf harness context --force   # refresh models/providers/hosts for this user/env/time
# Artifacts: .agent/runtime-state/harness-context.{env,latest.json,md}
```

Profile overrides live in `~/.tnf/profiles/<callsign>.json` under `harness.*`.
Catalog truth: `~/.tnf/model-providers.json`. Live hosts:
`.agent/runtime-state/*`.

## Mandatory Context Files

Canonical ordered list: **`docs/core/FRONTLOAD_MANIFEST.md`** (Stages A–C).
Verify with `node scripts/verify-repo-frontload.cjs`.

1. `docs/protocols/TURN_ZERO_MANDATE.md` (canonical Turn Zero authority)
2. `docs/protocols/LIVING_STATE.md`
3. `docs/protocols/AGENT_STATUS_LEDGER.md`
4. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (if present)
5. `~/.tnf/swarm-context.md` (swarm terminal state, coordination issues, active
   directives - updated every heartbeat cycle)
6. `.agent/SYSTEM_PROMPT.md`
7. `.agent/context/resource-map.md`
8. `.agent/context/agent-onboarding.md`
9. `.agent/workflows/frontload.md`
10. `docs/core/ENGINEERING_PRINCIPLES.md`
11. `docs/core/SOUL.md`, `docs/core/USER.md`, `docs/core/IDENTITY.md`,
    `docs/core/HEARTBEAT.md`, `docs/core/TOOLS.md`, `docs/core/SECURITY.md`
12. `docs/core/MEMORY.md` (curated long-term facts; private sessions)
13. `docs/core/BOOTSTRAP.md` (first-run harness ritual; stamp COMPLETE)
14. `docs/protocols/HARNESS_CONFIG.md` + `data/harness/harness-config.json`

Also verify host injection (not just docs presence):

```bash
node scripts/harness/verify-harness-completeness.cjs --provision
```

14. `docs/operations/STALL_DEFENSE.md`
15. `docs/protocols/TNF_FRONTEND_IA_CANON.md` (frontend chrome / chat / Ask AI —
    do not reintroduce always-open assist panels or duplicate chat homes)
16. `docs/protocols/TNF_AGENT_SHELL_HYGIENE.md` (agent shell transcripts ≠
    operator terminals; prefer short-lived shells)

### Informal → Canonical Aliases

- `soul.md` → `docs/core/SOUL.md`
- `agent.md` → `.agent/agents/<id>.md` + `docs/core/IDENTITY.md`
- `brain.md` → `docs/core/MEMORY.md` + Living State + session handoff

## Where Resources Live

- TNF specialized agents: `.agent/agents/*.md`
  - `orchestrator`: Multi-agent coordination
  - `project-planner`: Discovery and planning
  - `tnf-cli-agent`: CLI-optimized Antigravity agent
- Claude specialized agents: `.claude/agents/*.md`
- TNF skills: `.agent/skills/**/SKILL.md`
- Skill-bank operations scripts (not skill definitions): `scripts/skills/*`
- Claude skills: `.claude/skills/*.md`
- Gemini workspace docs: `.gemini/*`
- MCP config source of truth: `data/mcp_config.json`

## Immediate TNF Protocol

At session start, the agent should:

1. Execute Turn Zero from `docs/protocols/TURN_ZERO_MANDATE.md`.
2. Recover canonical state from `docs/protocols/LIVING_STATE.md` and
   `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`.
3. Confirm TNF identity from `.agent/SYSTEM_PROMPT.md`.
4. Load capabilities from `.agent/context/resource-map.md` only after Turn Zero.
5. Use MCP and specialized agents from the inventory printed by `tnf onboard`.

For raw AI CLI sessions launched without TNF auto-injection, paste:

```text
Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.
```

## Autonomous Commits and Pushes

All TNF agents and CLI tools are authorized to commit and push changes
autonomously, subject to the following constraints:

1. **All content gates must pass** — privacy, secret sweep, PII guard, lint,
   build gate, merge guard, authority:surface:staged, locked-doc-ledger. If any
   gate blocks, the agent surfaces the block to the operator instead of
   bypassing it.
2. **Audit trail is non-negotiable** — every commit and push is logged to
   `~/.tnf/audit/commit-attempts.jsonl` with full ancestry chain, so every
   autonomous action is traceable.
3. **Authority surfaces remain gated** — changes to files listed in
   `data/protocols/agent-owned-docs.registry.json` under
   `globally_approval_required` (this file, DIRECTIVES, schemas, workflows,
   TURN_ZERO_MANDATE, .gitignore, etc.) still require explicit operator approval
   via `TNF_AUTHORITY_EDIT_CONFIRM=1`. The agent cannot self-approve
   authority-surface edits.
4. **No force-push to main** — direct force-push to `main` is forbidden. Feature
   branches may be force-pushed only when rebasing own commits.
5. **Operator retains veto** — Daniel can revoke this authorization at any time
   by restoring the `TNF_OPERATOR_CONFIRM` requirement in
   `.husky/tnf-authority.sh`.

This authorization was granted by operator directive on 2026-08-09. Prior
session evidence: the operator explicitly requested protocol changes to allow
all agents to commit and push autonomously, after repeated friction with the
manual confirmation gate blocking progress on routine (non-authority) changes.

## Build Before You Merge

Do not merge to `main` on the strength of review alone. Run the build.

Incident (2026-07-28, PR #71): a PR was assembled by cherry-picking files from
an automation commit. The file list was correct, the diffstat looked right, and
`mergeable=CLEAN`. All of that was verified and reported as correct. It was
merged, and `main` could not compile — a file imported `@/services/authSession`,
a module that exists only on the source branch. The break was discovered by a
build that ran _after_ the merge, during deploy preparation.

File lists, diffstats, and merge status cannot detect wrong file _contents_.
Compiling can, in one step. `.github/workflows/ci-build.yml` now enforces this
on PRs touching `apps/**` or `packages/**`.

When a full build is not possible locally (this repo's Vite build is
memory-hungry), `tsc --noEmit` on the affected app is the minimum bar — it is
exactly what catches a missing or renamed module.

## Porting Work Between Branches

Never port work by copying files out of a commit made on another branch.

Files carry everything that branch changed, not just the change you want. In the
#71 incident, five files each carried unrelated work:

| File                                         | Intended              | Actually carried                                                                     |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| `services/api.ts`                            | add a `patch` method  | entire auth interceptor swapped to `authSession` + `withCredentials` + refresh-retry |
| `controllers/auth.controller.ts`             | widen a type          | ~94 lines of httpOnly cookie auth                                                    |
| `app.module.ts`                              | register one service  | two modules that do not exist on `main`                                              |
| `controllers/available-models.controller.ts` | fix a type annotation | a 196-line file that never existed on `main`                                         |
| `core/utils/client-security.ts`              | one CSP line          | a Prettier reformat of the whole file                                                |

Do this instead, in order of preference:

1. **Branch from the target and redo the edit.** Cheapest and safest.
2. If you must port, diff against the **target baseline** and read every line:
   `git diff <target> <candidate> -- <path>`. A per-file `--numstat` that is
   larger than your intended change is the tell — `api.ts` showed `+50/-45` for
   what should have been `+8/-0`.

Never treat "the file list is correct" as verification. It was correct in #71.

## Deploys Are Not Done When They Are Merged

`thenewfuse-main` (serving `app.thenewfuse.com`, `thenewfuse.com`,
`www.thenewfuse.com`) is a Cloudflare Pages **Direct Upload** project with no
Git integration, as are all other Pages projects on the account. Cloudflare does
not permit converting a Direct Upload project to Git, so **merging to `main`
does not deploy anything**.

Two consequences:

- Deploy with `scripts/deployment/deploy-frontend.sh`. It refuses to upload a
  dirty tree or a commit that is not an ancestor of `origin/main`, and records
  the commit hash with the deployment.
- A deploy is finished when the live site serves the new artifact, not when the
  upload command exits 0. `scripts/deployment/verify-production.mjs` asserts the
  entry bundle hash changed and that the app's API contract holds.

This is not theoretical: AI Assist posted to `/orchestration/chat` while the API
served `/api/orchestration/chat`, returning 404 on every page for an unknown
period, and the fix was later merged to `main` and reported as shipped while
production continued serving a two-day-old bundle.

## Heartbeat Prompts and Provenance

`scripts/runtime/terminal-heartbeat-pulse.cjs` writes its prompt into a terminal
composer and, by default, does **not** submit it. The operator may then append
their own text and submit both together.

The template itself is correctly scoped — it states that state files are
informational and that high-impact actions still need live confirmation. But
once appended text is submitted with it, an agent cannot distinguish the
machine-authored portion from the operator-authored portion in the same turn.

Therefore: treat any _action verb_ arriving in a heartbeat turn as operator
intent that still requires confirmation before a high-impact action. When in
doubt, restate the action and ask. Confirming costs one turn; an unattended
merge or deploy can cost a production outage.

## Harness staffing policy

TNF capabilities (coding-agent session, MCP surface, credential rotation, sandbox
wake, chat-UI bridge) are staffed by whichever installed harness can fulfill them.
Claude, Cursor, Codex, Gemini, Hermes, Pi, and any future client are interchangeable
adapters. OpenClaw is one optional adapter, not the role.

1. Treat TNF as the primary control plane.
2. Prefer native TNF commands (`tnf harness staff`, `tnf cursor`, `tnf claude`, …).
3. If a vendor CLI is installed and TNF has not assimilated a native surface, pass
   through that CLI (`tnf <client> …`).
4. Do not invoke a raw vendor binary unless the task is debugging that adapter or
   the operator explicitly asks for it.

`tnf harness clients` lists who can currently staff the role.
`tnf compat openclaw` remains a compatibility map for that one optional adapter.

## Tri-Fold Domain Protocol

Agents must strictly identify and operate within one of three domain contexts.
The active domain dictates the expected degree of proactivity, technical rigor,
and autonomy.

1. **Corporate Dev Work:** Work on the core TNF framework itself (system-level,
   canonical protocols, framework-wide utilities). Demands the highest level of
   rigor, regression testing, and strict adherence to established TNF legacy
   protocols.
2. **Agency Dev Work:** Work serving a specific user's agency or clients.
   Balances speed of delivery with robust architecture.
3. **Personal Dev Work:** Daily personal tasks, organization, and custom agent
   development for the user themselves. **Proactive Mandate applies here**:
   Agents must shift from reactive task execution to proactive inquiry. Agents
   are required to "lead the user" in defining how the agent can be most
   practical, requesting context, and automatically breaking vague personal
   goals into discrete execution plans and "threads".

Turn Zero authority:

- Canonical source: `docs/protocols/TURN_ZERO_MANDATE.md`.
- Any external mirror (for example `~/GEMINI.md`) is non-authoritative.

Use `tnf harness clients` as the source of truth for who can staff a capability.
Use `tnf compat openclaw` only when working the optional OpenClaw compatibility map.

## Operations Index

Use these docs for day-2 operations and ongoing automation:

- `docs/JULES_AUTONOMOUS_LOOP.md`
  - Jules supervisor lifecycle (`jules:supervisor:start|status|stop`)
  - Cron migration (`jules:supervisor:migrate-from-cron`)
  - Alerting/env variables and log paths
- `docs/SKILL_BANK_OPERATIONS.md`
  - Cross-LLM skill-bank sync/query/ingest/retry
  - Skill-bank supervisor lifecycle
  - Artifact paths under `.agent/skill-bank`
- `docs/TNF_SESSION_ONBOARDING.md`
  - Session bootstrap + operator runtime commands
  - Cloud-first defaults and recommended startup sequence
- `packages/tnf-cli/README.md`
  - Full `tnf` command surface including:
    - `tnf jules ...`
    - `tnf skills bank ...`
    - `tnf scripts list|run ...`

## Agent Bank Access

AI agents can access the full scope of agent definitions and skills via the MCP
server tools:

- `get_agent_bank_resources(action: 'list' | 'read', resourceType: 'agents' | 'skills', bank: 'tnf' | 'claude')`

This allows agents to dynamically discover personas and capabilities that they
can adopt or delegate to.

The platform API also exposes these via REST endpoints:

- `/api/agents/bank/templates`: List all templates
- `/api/agents/bank/template/:bank/:filename`: Get template content

## Autonomy Script Inventory

The following autonomy and intelligence expansion scripts are globally available
in `scripts/autonomy/` and must be utilized by agents when orchestrating complex
reasoning or relationship tasks:

- `phase7_directive_conversion_loop.py` (with `--adopt-claimed` logic for
  unblocking queues)
- `personality_relationship_analyzer.py`
- `frontier_agent_capability_explorer.py`
- `cross_dm_context_synthesizer.py`
- `p2p_pii_redacted_data_request.py`

# Continuous Improver Agent

## Identity

**Role**: `IMPROVER` **Goal**: Perpetually enhance the TNF ecosystem by
identifying technical debt, fixing broken configurations, and optimizing
workflows.

## Capabilities

- **System Diagnostics**: Runs `tnf doctor` to ensure health.
- **Code Analysis**: Scans for `TODO`, `FIXME`, and lint errors.
- **Orchestration & Interval Optimization**: Actively reviews Master Calendar
  schedule densities, analyzing telemetry to propose cron frequency reductions.
- **Task Generation**: Creates actionable tasks for other agents when issues are
  found.
- **Self-Repair**: Attempts automatic fixes for known configuration issues
  (e.g., missing .env variables).
- **Protocol Enforcer**: Scans task queues for `ASSIMILATE_CHECK` breadcrumbs
  dropped by other agents, actively prioritizing the integration of those
  external strengths natively into TNF.

## Operational Loop

1.  **Scan**: Execute diagnostic tools.
2.  **Analyze**: Parse output for failures or warnings.
3.  **Plan**: Determine if a fix is automatic or requires a task.
4.  **Act**: Apply fix or dispatch task to `tnf:master:tasks:planning`.
5.  **Verify**: Re-run scan to confirm resolution. Ensure any structural
    optimizations strictly respect proven legacy execution boundaries and verify
    against them.

## Trigger

- **Scheduled**: Runs every hour via `super-cycle`.
- **Manual**: Invoke via `tnf run improver:scan`.

# AI News Scout Agent

## Identity

**Role**: `SCOUT` **Goal**: Autonomously track the global AI landscape, identify
emerging trends, competitor moves, and research breakthroughs.

## Capabilities

- **Market Surveillance**: Scans search engines and AI news hubs. Must
  explicitly run the `ASSIMILATE_CHECK` protocol to evaluate all discoveries
  against the **Attribution Cornerstone** _(applying strictly to substantive
  claims, not standard software patterns)_.
- **Trend Detection**: Identifies high-velocity keywords.
- **Task Generation**: Dispatches assimilation tasks to the swarm. Any
  cutting-edge architectures assimilated must be proposed strictly as parallel
  supplements to, not immediate replacements of, core legacy systems. When
  reporting news or frameworks, Scout MUST output structured directives
  summarizing _how_ TNF can natively emulate the discovered capabilities.

# The "Claw" Swarm

## PicoClaw (The Analyzers)

- **Perplexity**: Real-time research and fact-checking.
- **Subject**: Domain-specific subject matter expertise.
- **Tester**: Automated QA and scenario simulation.

## OpenClaw (The Executor)

- **Fleet**: Distributed compute management and high-concurrency task
  processing.

## ZeroClaw (The Environment)

- **Sandbox**: Secure, isolated runtime for untrusted code execution.
- **Competitive Edge**: Fast, regularly scheduled tasks in a hardened
  environment.
