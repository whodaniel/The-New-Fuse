# TNF Agent Bootstrap

This repository uses TNF frontloading. Start every new AI terminal session with:

```bash
pnpm run tnf:onboard
```

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

## Agent Bank Access

AI agents can access the full scope of agent definitions and skills via the MCP
server tools:

- `get_agent_bank_resources(action: 'list' | 'read', resourceType: 'agents' | 'skills', bank: 'tnf' | 'claude')`

This allows agents to dynamically discover personas and capabilities that they
can adopt or delegate to.

The platform API also exposes these via REST endpoints:

- `/api/agents/bank/templates`: List all templates
- `/api/agents/bank/template/:bank/:filename`: Get template content
