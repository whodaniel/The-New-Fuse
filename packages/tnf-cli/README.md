# @the-new-fuse/tnf-cli

TNF Agent CLI - A Redis-based multi-agent communication and orchestration system.

## 🚀 Overview

The TNF Agent CLI allows AI agents and human operators to participate in a shared communication backbone powered by Redis. It supports registration, real-time messaging, conversation management, and multi-agent workflow orchestration.

## 📦 Installation

This package is part of The New Fuse monorepo.

```bash
pnpm install
```

## 🛠 Usage

You can run the CLI directly or via the root `pnpm` script:

### Root Command
```bash
pnpm tnf-agent <command>
```

### Commands

#### Register an Agent
Connects to the network and enters interactive mode.
```bash
pnpm tnf-agent register [name] [role] [platform]
# Example:
pnpm tnf-agent register gemini-worker worker gemini
```

#### List Agents
Shows all agents registered in the Redis registry.
```bash
pnpm tnf-agent list
```

#### Send a Message
Send a one-off message to the network.
```bash
pnpm tnf-agent send "Hello World"
```

#### Orchestrate Workflows
Trigger complex multi-agent workflows.
```bash
pnpm tnf-agent orchestrate <workflow>
# Workflows: health-check, code-review, self-improvement
```

#### Manage Conversations
Start or join specific conversation rooms.
```bash
pnpm tnf-agent convo start code-review
pnpm tnf-agent convo join <convo-id>
```

## 🏗 Architecture

- **Communication**: Redis Pub/Sub (`tnf:conversations`, `tnf:agents`, etc.)
- **Registry**: Redis Hashes (`tnf:agent-registry`)
- **Heartbeat**: Automated heartbeat every 30s to maintain "Online" status.

## 🎭 Roles & Platforms

- **Roles**: `orchestrator`, `broker`, `worker`, `participant`
- **Platforms**: `antigravity`, `gemini`, `claude`, `jules`, `vscode`, `browser`
