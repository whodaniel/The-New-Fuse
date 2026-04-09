# TNF Session Onboarding (Terminal AI)

Use this to make TNF resources appear immediately in new terminal-based AI
sessions.

## One-Command Bootstrap

```bash
pnpm run tnf:onboard
```

Cloud policy:

- `tnf:onboard`, `tnf:doctor`, and `tnf:audit:synergy` are cloud-rooted by
  default.
- They require `DATABASE_URL` and reject localhost/sqlite targets unless
  `TNF_ALLOW_LOCAL_DB=1` is set.
- Keep `TNF_REQUIRE_CLOUD_DB` unset (or `1`) to enforce cloud-first behavior.
- Backend startup paths also enforce this via
  `apps/backend/src/config/cloud-root-policy.ts`.

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

## Orchestration Runtime (Web/Cloud-First)

Use these when running TNF orchestration services directly:

```bash
pnpm run factory:boot
pnpm run factory:supervisor
pnpm run tnf:orchestration:audit
```

Notes:

- `factory:boot` now resolves Redis and API targets in cloud-first order.
  Localhost is the final fallback only.
- `factory:boot` also starts `factory-supervisor` by default
  (`FACTORY_SUPERVISOR_ENABLED=true`).
- `factory-supervisor` continuously monitors relay/master-clock/broker/director/
  workflow-router and triggers `factory:boot` recovery with bounded backoff.
- `tnf:orchestration:audit` validates script and process-command alignment
  (launch commands, `pgrep` patterns, and Redis target consistency).

## Jules + Skill Bank Operators (recommended)

After onboarding, keep follow-up and cross-LLM skill sharing running:

```bash
pnpm run jules:supervisor:start
pnpm run jules:supervisor:status

pnpm run skills:bank:sync
pnpm run skills:bank:ingest
pnpm run skills:bank:supervisor:start
pnpm run skills:bank:supervisor:status
```

Equivalent TNF CLI commands:

```bash
./tnf jules supervisor-start --super-admin-token "<expected-secret>"
./tnf jules supervisor-status
./tnf skills bank sync
./tnf skills bank ingest
./tnf skills bank supervisor-start --super-admin-token "<expected-secret>"
./tnf skills bank supervisor-status
./tnf scripts list
./tnf scripts run <script-or-file-target>
```

Reference docs:

- `docs/JULES_AUTONOMOUS_LOOP.md`
- `docs/SKILL_BANK_OPERATIONS.md`
- `packages/tnf-cli/README.md`

Environment precedence:

- Redis:
  `REDIS_URL -> RAILWAY_REDIS_URL -> LIVE_REDIS_URL -> REDIS_PRIVATE_URL -> REDIS_TLS_URL -> localhost`
- Ledger/API:
  `LEDGER_API_BASE -> RAILWAY_API_URL -> LIVE_API_BASE_URL -> API_BASE_URL -> TNF_API_BASE -> localhost`

## Recommended Default Workflow

1. `cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse`
2. `pnpm run tnf:onboard`
3. Start your AI session in this repository root

## Auto-Run In New Shells (zsh)

Add this to `~/.zshrc`:

```bash
tnf_auto_onboard() {
  local repo="/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
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
alias codex-tnf='cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm run -s tnf:start:codex'
alias claude-tnf='cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm run -s tnf:start:claude'
alias gemini-tnf='cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm run -s tnf:start:gemini'
```

## Client-Specific Notes

- Claude/Codex-like sessions: include this repository `AGENTS.md` at startup.
- MCP clients: point to `data/mcp_config.json` first; it has the broadest server
  set.
- If a client supports project instructions, add:
  `Run pnpm run tnf:onboard before task execution.`
- Generated per-client MCP configs are in `data/mcp.clients/`.
