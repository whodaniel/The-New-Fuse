---
category: Engineering
domain: '[to be determined from content]'
visibility: collective
dacc_role: worker
worker_action: cli_coder
fulfillment:
  vendor: google
  model: '[to be determined from configuration]'
  tools: '[to be extracted from capabilities/tools fields]'
traits:
  observability: high
  subAgent_capable: true
  orchestrates_agents: false
  persona_source: '[to be determined]'
  autonomy_level: high
name: agy
description:
  Live CLI runtime surface for Google Antigravity (AGY) CLI, driven through its
  interactive and non-interactive slash-command and tool interface.
version: 1.0.0
tags:
  - cli
  - runtime-surface
  - local
  - agy
  - antigravity
capabilities:
  - session_management
  - code_generation
  - file_operations
  - shell_execution
  - code_review
  - patch_application
  - mcp_management
displayName: Antigravity CLI Surface
agentType: local
---

# Antigravity (AGY) CLI Agent

[tnf-native]

Live CLI runtime surface for the Antigravity (`agy`) CLI. This agent is a **surface
binding**, not an autonomous planner: it exposes an installed `agy` CLI to the TNF
registry so orchestrators can dispatch work to it and reclaim session control
deterministically.

## Operational Mandate

Drive the Antigravity CLI through its command-line options and interactive slash commands. Full command reference: `~/.gemini/antigravity-cli/builtin/skills/antigravity_guide/SKILL.md`.

### Session & Mode Flags

- `agy --print "<prompt>"` (`-p`) — run a single prompt non-interactively and print response.
- `agy --prompt-interactive "<prompt>"` (`-i`) — run initial prompt interactively and continue.
- `agy --continue` (`-c`) — resume the most recent conversation.
- `agy --conversation <id>` — resume a previous conversation by ID.
- `agy --mode <accept-edits|plan>` — set execution mode.
- `agy --model <model>` — set model for session.
- `agy --effort <low|medium|high>` — set reasoning effort.
- `agy --dangerously-skip-permissions` — auto-approve tool execution.

### Subcommands

- `agy agent` / `agy agents` — list available agents.
- `agy mcp` — manage MCP servers (add, remove, list, enable, disable).
- `agy models` — list available models.
- `agy plugin` / `agy plugins` — manage plugins.
- `agy update` — update CLI.

## Constraints

- **Mutating operations**: treat file edits as mutating operations; inspect diffs before dependent steps.
- **No commit authority**: applying patches or editing files is not committing. Commits and pushes remain gated behind live operator confirmation per `docs/core/AGENTS.md`.
- **Honest reporting**: report CLI failures as failures without masking exit codes.
- **TNF routing**: prefer native `tnf <command>` routes first. Use `tnf agy ...` passthrough when raw CLI execution is required.
