# TNF Session Onboarding (Terminal AI)

Use this to make TNF resources appear immediately in new terminal-based AI
sessions.

## One-Command Bootstrap

```bash
pnpm run tnf:onboard
```

This command prints:

- TNF frontload checklist
- Skills inventory
- Specialized agent files
- MCP config and server entrypoints

## Full Start Pipeline (recommended)

Run one of:

```bash
pnpm run tnf:start:codex
pnpm run tnf:start:claude
pnpm run tnf:start:gemini
```

Or generic:

```bash
pnpm run tnf:start -- codex
pnpm run tnf:start -- claude
pnpm run tnf:start -- gemini
```

`tnf:start` does:

1. `tnf:onboard`
2. `tnf:mcp:generate` (from canonical `data/mcp_config.json`)
3. `tnf:doctor`
4. Launches selected AI CLI with `TNF_MCP_CONFIG_PATH` and `MCP_CONFIG_PATH`
   exported

## Recommended Default Workflow

1. `cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`
2. `pnpm run tnf:onboard`
3. Start your AI session in this repository root

## Auto-Run In New Shells (zsh)

Add this to `~/.zshrc`:

```bash
tnf_auto_onboard() {
  local repo="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
  if [[ "$PWD" == "$repo" ]]; then
    [[ -n "$TNF_ONBOARDED" ]] && return
    export TNF_ONBOARDED=1
    pnpm run -s tnf:onboard
  fi
}
autoload -U add-zsh-hook
add-zsh-hook chpwd tnf_auto_onboard
tnf_auto_onboard

# Optional wrappers for one-command AI launches
alias codex-tnf='cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm run -s tnf:start:codex'
alias claude-tnf='cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm run -s tnf:start:claude'
alias gemini-tnf='cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm run -s tnf:start:gemini'
```

## Client-Specific Notes

- Claude/Codex-like sessions: include this repository `AGENTS.md` at startup.
- MCP clients: point to `data/mcp_config.json` first; it has the broadest server
  set.
- If a client supports project instructions, add:
  `Run pnpm run tnf:onboard before task execution.`
- Generated per-client MCP configs are in `data/mcp.clients/`.
