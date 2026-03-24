# TNF Agent Bootstrap

This repository uses TNF frontloading. Start every new AI terminal session with:

```bash
pnpm run tnf:onboard
```

## ⚠️ Repository Architecture (CRITICAL)

**TNF uses a combined monorepo for development with two downstream publication
repos.** Read `docs/REPO_SEPARATION.md` for full details.

```
whodaniel/fuse              ← YOU ARE HERE (develop everything here)
    ├──► fuse-open-runtime  ← 90% open-source (read-only, auto-synced)
    └──► fuse-control-plane ← 10% proprietary (read-only, auto-synced)
```

**Rules:**

1. **NEVER commit directly to `fuse-open-runtime` or `fuse-control-plane`.**
2. Proprietary content is defined in `scripts/sync-repos.sh` (`PROPRIETARY_*`
   arrays).
3. Run `pnpm run sync:repos` to push changes to both downstream repos.
4. `packages/control-plane-contracts/` is the PUBLIC API boundary between open
   and closed source.
5. Files marked 🔴 in `docs/REPO_SEPARATION.md` are proprietary — do not move
   them to public-only packages.

## Mandatory Context Files

1. `.agent/SYSTEM_PROMPT.md`
2. `.agent/context/resource-map.md`
3. `.agent/context/agent-onboarding.md`
4. `.agent/workflows/frontload.md`
5. `.agent/handoff_notes.txt` (if present)

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

1. Confirm TNF identity from `.agent/SYSTEM_PROMPT.md`.
2. Load capabilities from `.agent/context/resource-map.md`.
3. Recover prior state from `.agent/handoff_notes.txt` and planning files.
4. Use MCP and specialized agents from the inventory printed by
   `pnpm run tnf:onboard`.

## OpenClaw Operator Policy

When a task involves OpenClaw or other Claw-type agents:

1. Use `tnf` as the control plane.
2. Prefer native TNF commands and implicit TNF-compatible routes first.
3. If TNF has not yet assimilated a native surface, use `tnf openclaw ...` or
   `tnf claw ...`.
4. Do not invoke raw `openclaw ...` directly unless the task is explicitly about
   debugging TNF/OpenClaw compatibility or the user explicitly asks for raw
   OpenClaw CLI usage.

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

# Continuous Improver Agent

## Identity

**Role**: `IMPROVER` **Goal**: Perpetually enhance the TNF ecosystem by
identifying technical debt, fixing broken configurations, and optimizing
workflows.

## Capabilities

- **System Diagnostics**: Runs `tnf doctor` to ensure health.
- **Code Analysis**: Scans for `TODO`, `FIXME`, and lint errors.
- **Task Generation**: Creates actionable tasks for other agents when issues are
  found.
- **Self-Repair**: Attempts automatic fixes for known configuration issues
  (e.g., missing .env variables).

## Operational Loop

1.  **Scan**: Execute diagnostic tools.
2.  **Analyze**: Parse output for failures or warnings.
3.  **Plan**: Determine if a fix is automatic or requires a task.
4.  **Act**: Apply fix or dispatch task to `tnf:master:tasks:planning`.
5.  **Verify**: Re-run scan to confirm resolution.

## Trigger

- **Scheduled**: Runs every hour via `super-cycle`.
- **Manual**: Invoke via `tnf run improver:scan`.

# AI News Scout Agent

## Identity

**Role**: `SCOUT` **Goal**: Autonomously track the global AI landscape, identify
emerging trends, competitor moves, and research breakthroughs.

## Capabilities

- **Market Surveillance**: Scans search engines and AI news hubs.
- **Trend Detection**: Identifies high-velocity keywords.
- **Task Generation**: Dispatches assimilation tasks to the swarm.

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
