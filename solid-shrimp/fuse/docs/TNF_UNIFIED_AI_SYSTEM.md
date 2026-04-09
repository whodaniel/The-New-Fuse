# TNF Unified AI System Blueprint

This is the recommended architecture for a cohesive Codex + Claude + Gemini
terminal workflow.

## Objectives

1. New sessions must bootstrap TNF context immediately.
2. MCP server availability must be deterministic and shared.
3. Agent skills/personas must be discoverable from one source.
4. Session continuity must survive context resets and tool switching.

## Core Architecture

## 1) Single Source of Truth

- Project instructions: `AGENTS.md`
- TNF identity and protocol: `.agent/SYSTEM_PROMPT.md`
- Capabilities map: `.agent/context/resource-map.md`
- Canonical MCP config: `data/mcp_config.json`
- Canonical startup command: `pnpm run tnf:start -- <client>`

## 2) Deterministic Startup Pipeline

Use `tnf:start` as mandatory entrypoint.

Pipeline:

1. `tnf:onboard`: print and verify context inventory
2. `tnf:mcp:generate`: generate `data/mcp.clients/*.mcp.json`
3. `tnf:doctor`: validate required files/config/entrypoints
4. launch client with exported MCP env vars

## 3) Cross-Client MCP Consistency

- Generate client configs from `data/mcp_config.json` (no manual per-client
  drift).
- Keep optional auth values empty in source config and inject secrets through
  environment.
- Review server list quarterly and prune dead entries.

## 4) Session Memory Discipline

- Update `.agent/handoff_notes.txt` at end of every significant session.
- Keep long-running work in `task_plan.md`, `findings.md`, `progress.md`.
- Prefer file-based state over chat memory.

## 5) Agent and Skill Registry Cohesion

- Keep TNF personas in `.agent/agents/`.
- Keep external platform personas in `.claude/agents/` and parallel folders.
- Periodically run registry sync into backend metadata store.

## 6) Operational Controls

- Add CI check: `tnf:doctor` + schema check for `data/mcp_config.json`.
- Require `AGENTS.md` presence in root.
- Block merges that break startup pipeline.

## Recommended Next Upgrades

1. Add `tnf:doctor --json` for machine-readable health.
2. Add `tnf:start --profile dev|prod|sandbox` with profile-specific MCP filters.
3. Add automated secret validation per MCP server.
4. Add heartbeat telemetry on AI session startup/shutdown.
5. Add auto-registry sync for `.agent/agents` + `.claude/agents`.
