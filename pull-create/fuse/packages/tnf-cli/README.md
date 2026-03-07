# @the-new-fuse/tnf-cli

TNF CLI - Unified command surface for TNF operations.

## 🚀 Overview

The TNF CLI allows AI agents and operators to run TNF lifecycle commands under
one prefix: `tnf ...`.

## 📦 Installation

This package is part of The New Fuse monorepo.

```bash
pnpm install
```

## 🛠 Usage

You can run the CLI directly or via the root `pnpm` script:

### Root Command

```bash
pnpm run tnf -- <command>
./tnf <command>
```

### Commands

#### TNF Lifecycle

```bash
pnpm run tnf -- onboard
pnpm run tnf -- doctor
pnpm run tnf -- mcp generate
```

#### Register an Agent

Connects to the network and enters interactive mode.

```bash
pnpm run tnf -- register [name] [role] [platform]
# Example:
pnpm run tnf -- register gemini-worker worker gemini
```

#### List Agents

Shows all agents registered in the Redis registry.

```bash
pnpm run tnf -- list
```

#### Send a Message

Send a one-off message to the network.

```bash
pnpm run tnf -- send "Hello World"
```

#### Orchestrate Workflows

Trigger complex multi-agent workflows.

```bash
pnpm run tnf -- orchestrate <workflow>
# Workflows: health-check, code-review, self-improvement
```

#### Manage Conversations

Start or join specific conversation rooms.

```bash
pnpm run tnf -- convo start code-review
pnpm run tnf -- convo join <convo-id>
```

#### Jules Operations

```bash
pnpm run tnf -- jules loop --super-admin-token "<expected-secret>"
pnpm run tnf -- jules supervisor-start --super-admin-token "<expected-secret>"
pnpm run tnf -- jules supervisor-status
pnpm run tnf -- jules supervisor-stop --super-admin-token "<expected-secret>"
pnpm run tnf -- jules supervisor-migrate-from-cron --super-admin-token "<expected-secret>"
pnpm run tnf -- jules merge-open --super-admin-token "<expected-secret>"
```

#### Skill Bank Operations

```bash
pnpm run tnf -- skills bank sync
pnpm run tnf -- skills bank query jules
pnpm run tnf -- skills bank ingest --dry-run
pnpm run tnf -- skills bank retry-pending
pnpm run tnf -- skills bank supervisor-start --super-admin-token "<expected-secret>"
pnpm run tnf -- skills bank supervisor-status
```

#### Discover and Run Repo Commands/Scripts

```bash
pnpm run tnf -- scripts list
pnpm run tnf -- scripts run skills:bank:status
pnpm run tnf -- scripts run scripts/skills/skill-bank-query.cjs jules
pnpm run tnf -- scripts run tools/port-manager/cli.js -- --help
```

## Super Admin Protected Commands

High-impact system commands require Super Admin authentication.

- Configure expected token in runtime env:

```bash
export TNF_SUPER_ADMIN_TOKEN="<expected-secret>"
```

- Provide auth per command:

```bash
pnpm run tnf -- master-clock start --service tnf-master-clock --super-admin-token "<expected-secret>"
pnpm run tnf -- super-cycle event --action heartbeat --process-id jules-autonomous-loop --super-admin-token "<expected-secret>"
```

Protected command families:

- `tnf master-clock *`
- `tnf super-cycle *`
- `tnf jules loop|supervisor|supervisor-start|supervisor-stop|supervisor-migrate-from-cron|merge-open|cron-install`
- `tnf skills bank supervisor|supervisor-start|supervisor-stop`
- `tnf relay start`
- `tnf run <script>`

## 🏗 Architecture

- **Communication**: Redis Pub/Sub (`tnf:conversations`, `tnf:agents`, etc.)
- **Registry**: Redis Hashes (`tnf:agent-registry`)
- **Heartbeat**: Automated heartbeat every 30s to maintain "Online" status.

## 🎭 Roles & Platforms

- **Roles**: `orchestrator`, `broker`, `worker`, `participant`
- **Platforms**: `antigravity`, `gemini`, `claude`, `jules`, `vscode`, `browser`
