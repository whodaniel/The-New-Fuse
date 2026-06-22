# TNF Agent Bootstrap

This repository uses TNF frontloading. Start every new AI terminal session with:

```bash
tnf onboard
```

## Mandatory Context Files

1. `docs/protocols/TURN_ZERO_MANDATE.md` (canonical Turn Zero authority)
2. `docs/protocols/LIVING_STATE.md`
3. `docs/protocols/AGENT_STATUS_LEDGER.md`
4. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (if present)
5. `.agent/SYSTEM_PROMPT.md`
6. `.agent/context/resource-map.md`
7. `.agent/context/agent-onboarding.md`
8. `.agent/workflows/frontload.md`
9. `docs/core/ENGINEERING_PRINCIPLES.md`
10. `docs/core/SOUL.md`, `docs/core/USER.md`, `docs/core/IDENTITY.md`,
    `docs/core/HEARTBEAT.md`
11. `docs/operations/STALL_DEFENSE.md`

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

## OpenClaw Operator Policy

When a task involves OpenClaw or other Claw-type agents:

1. Treat TNF as the primary control plane.
2. Treat OpenClaw as an optional interoperability surface through TNF.
3. Prefer native TNF commands and implicit TNF-compatible routes first.
4. If TNF has not yet assimilated a native surface, use `tnf openclaw ...` or
   `tnf claw ...`.
5. Do not invoke raw `openclaw ...` directly unless the task is explicitly about
   debugging the TNF<->OpenClaw adapter or the user explicitly asks for raw
   OpenClaw CLI usage.

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

Use `tnf compat openclaw` as the source of truth for current routing coverage.

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
