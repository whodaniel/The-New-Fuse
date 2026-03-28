# @the-new-fuse/tnf-cli

Unified command surface for TNF operations and agent orchestration.

## Installation

### One-line install (remote)

```bash
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse/main/scripts/install-tnf-cli.sh | bash
```

### Install from a local clone

```bash
pnpm run tnf:install:local
```

### Verify

```bash
tnf
tnf --help
tnf menu
```

## Root behavior

Running `tnf` with no arguments now prints an organized command menu. The menu
includes a themed TNF splash animation by default. It also prints
command-surface totals and points to expanded discovery.

Use full inventory mode when you need the entire command surface:

```bash
tnf menu --full
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
tnf onboard
tnf doctor
tnf mcp generate
tnf openclaw status
tnf claw channels login
tnf scripts list
tnf scripts run <target> [args...]
tnf voice up --profile main
tnf voice down --profile main
tnf voice relay --from a --to b
tnf voice start --profile main
tnf voice listen --profile main
tnf voice activate --profile main
tnf voice status --profile main
tnf voice protocol status --from a --to b
```

### Voice Bridge quickstart

```bash
# One command (voice runtime only)
tnf voice up --profile a

# Add local listen sidecar too
tnf voice up --profile a --with-listen

# Stop both cleanly
tnf voice down --profile a

# Relay user transcribed input from profile a to profile b
tnf voice relay --from a --to b

# Relay both directions
tnf voice relay --from a --to b --bidirectional

# By default, relay auto-isolates the pair by stopping stray "main" runtime workers.
# Use --keep-main only if you intentionally want main running at the same time.
tnf voice relay --from a --to b --bidirectional --keep-main

# Optional fail-fast (errors if either endpoint is not live at startup)
tnf voice relay --from a --to b --bidirectional --require-live

# Keep relay actively polled and auto-healed with heartbeat
tnf voice relay --from a --to b --bidirectional --require-live --heartbeat-ms 5000

# Disable heartbeat auto-heal if you only want passive health polling
tnf voice relay --from a --to b --bidirectional --heartbeat-ms 5000 --no-heartbeat-heal

# Heartbeat/control traffic is non-vocalized by default in the profile watchers
# (only conversational A2A payloads are spoken).

# One-shot protocol health snapshot (relay, watchers, last tx/rx)
tnf voice protocol status --from a --to b

# Continuous protocol watch loop with optional auto-heal pulse
tnf voice protocol watch --from a --to b --interval-ms 5000
```

Useful controls:

```bash
tnf voice target here --profile a
tnf voice target pick --profile a --delay 3
tnf voice target show --profile a
tnf voice target clear --profile a
tnf voice mic toggle --profile a
tnf voice response-audio toggle --profile a
tnf voice response-audio status --profile a
```

Profile notes:

```bash
# Default profile is "main" (port 50005)
tnf voice status --profile main

# Non-default profiles use deterministic ports; you can override if needed
tnf voice status --profile b
tnf voice status --profile b --port 50123
```

Protocol notes:

```bash
# Heartbeat is protocol-level only; it is not spoken into A2A audio by default.
# To preserve clean prompts, A2A control/heartbeat lines are audio-only and
# not injected as terminal text.
```

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
- `tnf jules loop|supervisor|supervisor-start|supervisor-stop|supervisor-migrate-from-cron|merge-open|cron-install`
- `tnf skills bank supervisor|supervisor-start|supervisor-stop`
- `tnf run <script>`

## Agent traits

`tnf traits list` exposes:

- roles: `orchestrator`, `broker`, `worker`, `participant`
- platforms: `antigravity`, `gemini`, `claude`, `jules`, `vscode`, `browser`
- command behavior groups: `super_admin_protected`, `redis_required`,
  `cloud_first`
