---
name: agy
description: Imported wrapper for agy
source_agent: .claude/agents/agy.md
---

# agy

This skill is a provider-neutral wrapper for the canonical Claude agent definition at `.claude/agents/agy.md`.

## Canonical Agent Prompt

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
