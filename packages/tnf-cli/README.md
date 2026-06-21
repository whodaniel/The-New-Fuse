# @the-new-fuse/tnf-cli

Unified command surface for TNF operations and agent orchestration.

## Installation

### One-line install (remote)

```bash
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh | bash
```

### Install from a local clone

```bash
pnpm run tnf:install:local
```

Install scripts automatically run `tnf:onboard` at the end so a fresh install
joins the TNF frontload/session flow immediately.

Skip this only when needed (for example CI/non-interactive provisioning):

```bash
pnpm run tnf:install:local -- --skip-onboard
# or
TNF_INSTALL_AUTO_ONBOARD=0 pnpm run tnf:install:local
```

### Verify

```bash
tnf
tnf --help
tnf menu
```

Package-script invocation is also supported. The CLI normalizes the package
manager separator before Commander parsing, so these forms are valid:

```bash
pnpm run tnf -- --help
pnpm run tnf -- menu --compact --theme mono --no-splash
```

## Root behavior

Running `tnf` with no arguments is a harness-compliant agent entrypoint:

1. Run the Turn Zero onboarding surface.
2. Inject living state, handoff, runtime snapshot, MCP inventory, and memory
   excerpts into the interactive agent context.
3. Start the TNF interactive agent from the canonical workspace root.

Set `TNF_SKIP_TURN_ZERO_ONBOARD=1` only for CI or tests that must bypass the
interactive Turn Zero surface.

OpenCode compatibility remains available explicitly:

```bash
tnf run "your prompt"
tnf web
tnf attach <url>
```

Use full inventory mode when you need the entire command surface:

```bash
tnf menu --full
tnf paths --json
```

## Slash Commands

TNF exposes a standard slash-command surface in direct CLI mode, `tnf tui`, and
`tnf ai chat`.

```bash
tnf /help
tnf /review public distribution readiness
tnf slash list
tnf slash show /apply
tnf slash run /commands
tnf slash run /agent browser-helper
tnf slash run /workflow release-triage
```

Built-in standard commands include `/help`, `/clear`, `/compact`, `/cost`,
`/exit`, `/quit`, `/review`, and `/apply`. TNF operational shortcuts include
`/commands`, `/status`, `/doctor`, `/agents`, `/sessions`, `/models`, `/config`,
`/mcp`, `/skills`, `/agent`, `/skill`, `/workflow`, and `/mcp-server`.

The creation shortcuts scaffold files in the caller project:

```bash
tnf project create agent browser-helper
tnf project create skill prompt-auditor
tnf project create workflow release-triage
tnf project create mcp-server browser-tools
```

Project commands are loaded from `.tnf/command/*.md` and become available as
slash commands automatically. For example, `.tnf/command/release-check.md`
becomes `/release-check`.

The latest reviewed command inventory is recorded at
`docs/protocols/reports/tnf-cli-command-paths-2026-05-28.json` and contained 237
CLI command paths at review time.

TypeScript package boundaries are enforced through project references. Before
checking or building the CLI after dependency changes, build the referenced
workspace packages:

```bash
pnpm --filter @the-new-fuse/tnf-core build
pnpm --filter @the-new-fuse/infrastructure build
pnpm --filter @the-new-fuse/tnf-note-taking build
pnpm --filter @the-new-fuse/tnf-cli type-check
pnpm --filter @the-new-fuse/tnf-cli build
```

## Splash and Color Options

```bash
tnf splash --theme fuse --animate on
tnf splash --theme atri --animate on --speed 60
tnf splash --theme neon --animate on --speed 70
tnf splash --theme ember --animate off
tnf menu --theme mono --compact
```

Themes: `fuse`, `atri`, `neon`, `ember`, `mono`. Animation mode: `auto`, `on`,
`off`.

## Command Paths

### Agent paths

```bash
tnf agents list
tnf agents register [name] [role] [platform]
tnf agents send <message>
tnf agents orchestrate <workflow>
tnf agents convo <start|join> [param]
tnf agents bank reconcile --targets all
```

### Taxonomy paths

```bash
tnf types list
tnf traits list
tnf paths
tnf menu
tnf menu --full
```

### Core operations

```bash
tnf boot --plan
tnf boot
tnf onboard
tnf doctor
tnf state show
tnf state show --json
tnf handoff show
tnf handoff emit --auto-verify
tnf handoff validate
tnf protocol validate
tnf protocol turn-zero
tnf harness boot
tnf registry check
tnf registry reconcile
tnf hooks test --file ./chain.json --event ./event.json --record
tnf hooks logs --chain typescript-validation-chain
tnf hooks explain --run <run_id>
tnf hooks replay --run <run_id> --from-step lint
tnf self-improvement run
tnf self-improvement status --strict
tnf full-auto once
tnf full-auto start --interval-minutes 30
tnf full-auto status
tnf full-auto provision --targets all
tnf mcp generate
tnf mcp sync --from repo
tnf mcp health
tnf openclaw status
tnf claw channels login
tnf scripts list
tnf scripts run <target> [args...]
tnf scripts run <target> --skip-protocol-gate [args...]
```

`tnf run` and `tnf scripts run` execute a fast harness protocol gate before
running repo scripts. Use `--skip-protocol-gate` only for CI/bootstrap paths
that already validated Turn Zero authority.

### Assimilation paths

```bash
tnf assimilate run <provider> [args...]
tnf assimilate run <provider> --skip-protocol-gate [args...]
tnf assimilate link <provider>
```

Assimilated providers run from the TNF repo root with `TNF_PROTOCOL_ACK`,
`TNF_HARNESS_ROOT`, and `TNF_TURN_ZERO_CANONICAL` in the child environment.

`tnf state show` reports both committed repo handoff
`docs/protocols/reports/SESSION_HANDOFF_LATEST.json` and local operator handoff
`~/.tnf/handoff-current.json` when present. If those packets differ, the command
surfaces `handoffDivergence` so agents do not silently execute stale repo state
after a newer terminal status packet was generated on another machine.

### Existing direct commands (still supported)

```bash
tnf register [name] [role] [platform]
tnf list
tnf send <message>
tnf orchestrate <workflow>
tnf convo <start|join> [param]
tnf jules supervisor-status
tnf skills bank sync
tnf reports status
```

## Self-Improvement Loop

Run the deterministic reliability loop directly from `tnf`:

```bash
tnf self-improvement run --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com
tnf self-improvement status --strict
tnf self-improvement scorecard
tnf self-improvement mermaid
tnf self-improvement log "Follow-up remediation note"
```

`tnf self-improvement run` performs:

1. Frontend build
2. Live link crawl
3. Semantic route audit
4. Auth path audit
5. Scorecard generation
6. Architecture mermaid generation
7. Artifact verification + protocol run-log entry

## Full-Auto Loop

Run unattended, non-interactive cycles from one command:

```bash
tnf full-auto provision --targets all
tnf full-auto once --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com
tnf full-auto start --interval-minutes 30 --max-cycles 0 --broadcast
tnf full-auto status
```

Behavior:

1. Provision shared full-auto slash-command + skill artifacts into detected
   agent runtimes.
2. Each cycle runs `tnf self-improvement run` with your selected options.
3. Optionally broadcasts `tnf orchestrate self-improvement` when `--broadcast`
   is enabled.
4. Verifies health via `tnf self-improvement status --strict`.
5. Persists state to `docs/operations/tnf-full-auto-state.json`.
6. Appends cycle events to `docs/operations/tnf-full-auto-runs.jsonl`.

Provisioning targets include detected local roots for:

- `codex`, `claude`, `gemini`, `opencode`, `kilo`, `augment`, `tnf`, `hermes`,
  and `project` runtime mirrors.

## Agent Bank Reconciliation

Reconcile multitenant agent definition pathways (`.agent/agents`,
`.claude/agents`, `.skills/imported-claude-agents`) and distribute imported
definitions to all runtime homes:

```bash
tnf agents bank reconcile --targets all
```

Optional flags:

- `--dry-run`
- `--json`
- `--skip-restore`
- `--skip-imported-sync`
- `--skip-provision`

## Control-Plane Provider Routing

`master-clock` and `super-cycle` are provider-routed with `local` default:

```bash
tnf master-clock start --provider local
tnf master-clock logs --provider local --no-follow
tnf super-cycle status --provider local
```

CloudRuntime remains available as an explicit legacy adapter:

```bash
tnf master-clock status --provider cloud_runtime --service tnf-master-clock
tnf super-cycle event --provider cloud_runtime --service tnf-master-clock --action heartbeat --process-id my-loop
```

Environment variables:

- `TNF_CONTROL_PLANE_PROVIDER` (global fallback)
- `TNF_MASTER_CLOCK_PROVIDER` (master-clock override)
- `TNF_SUPER_CYCLE_PROVIDER` (super-cycle override)

## OpenClaw passthrough

Use TNF as the entrypoint for any OpenClaw command:

```bash
tnf openclaw --help
tnf openclaw status
tnf openclaw agents add work --workspace ~/.openclaw/workspace-work --model openai/gpt-5.2 --bind whatsapp:biz --non-interactive --json
tnf claw doctor
```

`tnf openclaw ...` forwards the raw argument tail to `openclaw ...`, so it
covers the full current and future OpenClaw CLI surface without separate TNF
wrappers per subcommand.

For lower-friction migration, TNF also auto-forwards non-conflicting OpenClaw
top-level commands directly:

```bash
tnf channels login
tnf gateway --port 18789
tnf status
tnf message send --target +15555550123 --message "Hi"
tnf help channels
```

When a command name overlaps with an existing TNF command, TNF keeps its own
behavior and you use the explicit namespace instead:

```bash
tnf doctor
tnf openclaw doctor
tnf agents list
tnf openclaw agents list
tnf skills bank sync
tnf openclaw skills list
```

Audit current command-surface parity at any time:

```bash
tnf compat openclaw
tnf compat openclaw --mode implicit
tnf compat openclaw --json
```

Inspect and manage existing OpenClaw installations and instances through TNF
without losing raw passthrough access:

```bash
tnf compat openclaw instances --json
tnf compat openclaw inventory --json
tnf compat openclaw inventory --all-instances --json
tnf compat openclaw inventory --installation local-openclaw-cli --instance dev --json
tnf compat openclaw config --path gateway.auth --json
tnf compat openclaw config --path gateway.auth --all-instances --json
tnf compat openclaw config-set gateway.mode local --installation local-openclaw-cli --instance main
tnf compat openclaw config-unset channels.telegram.botToken
tnf compat openclaw cron --all-instances --json
tnf compat openclaw cron-disable "TNF Knowledge Scout Sprint" --installation local-openclaw-cli --instance main
tnf compat openclaw cron-schedule "TNF Daily Priority Plan" --cron "0 8 * * *" --tz America/New_York --installation local-openclaw-cli --instance main
tnf compat openclaw sync --all-instances
tnf compat openclaw cleanup --disable-failing --all-instances --dry-run
```

These managed compatibility commands read and write the existing OpenClaw
configuration files directly, with redaction applied to sensitive fields in read
paths. They are intended to let TNF observe and govern OpenClaw settings and
cron state while preserving the original `tnf openclaw ...` passthrough for full
OpenClaw-native behavior. TNF resolves targets through
`data/protocols/openclaw-installations.registry.json`, where one installation
may expose many isolated instances and additional separate installations can be
declared explicitly.

## Super Admin protected commands

These require `TNF_SUPER_ADMIN_TOKEN` configured in runtime and
`--super-admin-token` on the command call.

- `tnf relay start`
- `tnf master-clock *`
- `tnf super-cycle *`
- `tnf self-improvement run`
- `tnf full-auto once|start`
- `tnf jules loop|supervisor|supervisor-start|supervisor-stop|supervisor-migrate-from-cron|merge-open|cron-install`
- `tnf skills bank supervisor|supervisor-start|supervisor-stop`
- `tnf run <script>`

## Agent traits

`tnf traits list` exposes:

- roles: `orchestrator`, `broker`, `worker`, `participant`
- platforms: `antigravity`, `gemini`, `claude`, `jules`, `vscode`, `browser`
- command behavior groups: `super_admin_protected`, `redis_required`,
  `provider_routed`
