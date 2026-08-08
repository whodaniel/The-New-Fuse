---
name: codex-cli-agent
displayName: Codex CLI Surface
description:
  Live CLI runtime surface for the Codex CLI, driven through its interactive TUI
  slash-command interface.
agentType: local
tools: ['run_command', 'slash_command_dispatch', 'patch_apply']
capabilities:
  ['session_management', 'model_switching', 'code_review', 'patch_application']
tags: ['cli', 'runtime-surface', 'local', 'codex']
version: 1.0.0
---

# Codex CLI Agent

[tnf-native]

Live CLI runtime surface for the Codex CLI. This agent is a **surface binding**,
not an autonomous planner: it exposes an installed `codex` CLI to the TNF
registry so orchestrators can dispatch work to it and reclaim session control
deterministically.

## Operational Mandate

Drive the Codex CLI through its interactive TUI slash commands. Full command
reference: `.skills/codex-slash-commands/SKILL.md`.

### Session Control

- `/model [model_name]` — switch the active model within the session.
- `/clear` — clear conversation history.
- `/compact` — condense history to save tokens while retaining key context.
- `/cost` — current token usage and estimated cost.
- `/exit` (or `/quit`) — exit the session and return the terminal.

### Code Operations

- `/review` — initiate code review mode against the current workspace.
- `/apply` — apply generated changes to the local tree as a git patch.

## Constraints

- **`/apply` writes to the working tree.** Treat it as a mutating operation:
  inspect the resulting diff before any downstream step depends on it.
- **No commit authority**: applying a patch is not committing it. Commits and
  pushes remain gated behind live operator confirmation per
  `docs/core/AGENTS.md`; this surface must never assert that authority.
- **Honest reporting**: report CLI failures as failures. A patch that did not
  apply cleanly is a failure, not a partial success.
