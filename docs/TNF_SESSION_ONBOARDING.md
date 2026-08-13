# TNF Session Onboarding (Terminal AI)

Use this to make TNF resources appear immediately in new terminal-based AI
sessions.

## One-Command Bootstrap

```bash
tnf onboard
```

If baseline frontload files/config stubs are missing, self-heal in one pass:

```bash
tnf onboard --repair
```

`tnf onboard` prints the exact prompt to paste into a raw AI CLI session:

```text
Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.
```

The prompt uses repository-relative paths. Start raw AI CLIs from the TNF repo
root or run `tnf onboard` first.

When TNF is installed via `scripts/install-tnf-cli.sh` (including
`pnpm run tnf:install` and `pnpm run tnf:install:local`), this onboarding step
now runs automatically at install time unless explicitly skipped.

## OpenClaw / Claw Operator Policy

Future TNF sessions should treat TNF as the primary control plane.

- OpenClaw is an optional interoperability surface, not TNF's parent system.
- Canonical Turn Zero authority lives in `docs/protocols/TURN_ZERO_MANDATE.md`.
- Any external mirror (for example `~/GEMINI.md`) is non-authoritative.

- Prefer native TNF commands first.
- Use implicit TNF-compatible routes when available, for example `tnf status` or
  `tnf channels`.
- When TNF has not yet assimilated a native route, use `tnf openclaw ...` or
  `tnf claw ...`.
- Avoid raw `openclaw ...` unless the task is explicitly about debugging the
  TNF<->OpenClaw adapter or the operator explicitly asks for direct OpenClaw CLI
  usage.

Audit current routing coverage with:

```bash
tnf compat openclaw
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

## Frontload Health Checks

Local verification:

```bash
pnpm run tnf:frontload:verify
```

Machine-readable status from your shell banner cache:

```bash
~/.tnf/tnf-status --json
```

This returns a compact JSON object with cache presence, task counts, cloud
health, and stale-cache indicators.

CI coverage:

- `Frontload Nightly` runs fixture-based contract checks nightly.
- The same workflow exposes an optional strict live probe job on
  `workflow_dispatch`: set `run_live_probe=true` to run against a self-hosted
  runner that has TNF frontload installed.

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

The native `tnf boot` and `tnf tui` entrypoints also run the Turn Zero
onboarding surface before starting their runtime. `tnf boot` performs that
read-only onboarding before the Super Admin gate so a new operator still sees
the correct prompt and canonical state even if boot authentication is not yet
configured.

## Local Runtime Profile

Personal paths, local WebSocket endpoints, and known occupied development ports
are valid operator assets when they are stored in the local runtime profile
instead of committed source:

```bash
touch .tnf.local.env
./tnf ports status
./tnf ports preflight
```

Use `.tnf.local.env` for `TNF_ROOT`, `TNF_RELAY_URL`, custom `TNF_PORTS`, and
`TNF_PORTS_ALLOW_OCCUPIED`. See `docs/reference/local-runtime-profile.md` and
`docs/PORT_MANAGEMENT.md`.

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
  `REDIS_URL -> CLOUD_RUNTIME_REDIS_URL -> LIVE_REDIS_URL -> REDIS_PRIVATE_URL -> REDIS_TLS_URL -> localhost`
- Ledger/API:
  `LEDGER_API_BASE -> CLOUD_RUNTIME_API_URL -> LIVE_API_BASE_URL -> API_BASE_URL -> TNF_API_BASE -> localhost`

## Recommended Default Workflow

1. `export TNF_REPO_DIR="/absolute/path/to/The-New-Fuse"`
2. `cd "$TNF_REPO_DIR"`
3. `pnpm run tnf:onboard`
4. Start your AI session in this repository root

## Auto-Run In New Shells (zsh)

Add this to `~/.zshrc`:

```bash
tnf_auto_onboard() {
  local repo="${TNF_REPO_DIR:-$HOME/code/The-New-Fuse}"
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
alias codex-tnf='cd "${TNF_REPO_DIR:?set TNF_REPO_DIR}" && pnpm run -s tnf:start:codex'
alias claude-tnf='cd "${TNF_REPO_DIR:?set TNF_REPO_DIR}" && pnpm run -s tnf:start:claude'
alias gemini-tnf='cd "${TNF_REPO_DIR:?set TNF_REPO_DIR}" && pnpm run -s tnf:start:gemini'
```

## Client-Specific Notes

- Claude/Codex-like sessions: include this repository `AGENTS.md` at startup.
- MCP clients: point to `data/mcp_config.json` first; it has the broadest server
  set.
- If a client supports project instructions, add:
  `Run pnpm run tnf:onboard before task execution. Use tnf rather than raw openclaw for Claw operations.`
- Generated per-client MCP configs are in `data/mcp.clients/`.
