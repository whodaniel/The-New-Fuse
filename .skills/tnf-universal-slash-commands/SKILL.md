---
name: tnf-universal-slash-commands
description: Reference for universal The New Fuse (TNF) commands shared across high-level agents (Claude, Codex, OpenCode). Use these for standard workspace operations like creating skills, agents, or workflows.
---

# TNF Universal Slash Commands

These commands are ubiquitous across the TNF agent swarm for consistent management of the ecosystem.

## Workspace Management
- `/agent`: Creates a new TNF agent definition (at `.agent/NAME/SKILL.md`).
- `/skill`: Creates a new TNF skill definition (at `.agent/skills/NAME/SKILL.md`).
- `/workflow`: Generates a new n8n workflow definition.
- `/mcp-server`: Generates a new MCP server implementation.

## Standard Interaction
- `/help`: Displays ubiquitous help for the current agent environment.
- `/clear`: Clears conversation history across all session-aware TNF agents.
- `/compact`: Condenses context to optimize token usage.
- `/cost`: Reports usage and cost for the active session.
- `/exit` (or `/quit`): Standard termination command.
