---
name: openclaw-protocol
description:
  Guide for using the OpenClaw protocol CLI tool (v2026.2.15). Use when you need
  to send cross-channel messages (WhatsApp, Telegram), manage agents, control
  the WebSocket Gateway, or use ACP (Agent Control Protocol).
---

# OpenClaw Protocol CLI Guide

This skill provides expertise on the OpenClaw CLI tool (v2026.2.15), a gateway
for agent control and cross-channel messaging ("iMessage green bubble energy,
but for everyone").

## Core Commands and Usage

The `openclaw` CLI exposes a comprehensive set of commands for interacting with
the OpenClaw protocol.

### Gateway Management

The OpenClaw gateway brokers messages and agent connections. The default gateway
port is `18789`.

- **Start Local Gateway**: `openclaw gateway --port 18789`
- **Start Dev Gateway**: `openclaw --dev gateway` (Isolates state/config under
  `~/.openclaw-dev`, default port `19001`)
- **Force Start Gateway**: `openclaw gateway --force` (Kills any process bound
  to the gateway port, then starts it)
- **Check Status/Health**: `openclaw status`, `openclaw health`,
  `openclaw doctor`
- **View Logs**: `openclaw logs`

### Messaging

Send messages directly through linked channels (e.g., WhatsApp, Telegram).

- **Send WhatsApp message**:
  `openclaw message send --target +15555550123 --message "Hi" --json`
- **Send Telegram message**:
  `openclaw message send --channel telegram --target @mychat --message "Hi"`

### Agent Control

Talk directly to agents or manage them.

- **Interact with agent**:
  `openclaw agent --to +15555550123 --message "Run summary" --deliver`

### Channel Management

Link and manage messaging channels (like WhatsApp Web, Telegram bots).

- **Link WhatsApp (example)**: `openclaw channels login --verbose` (Shows QR
  code and connection logs)

### Configuration and Profiles

- **Named Profiles**: `openclaw --profile <name> <command>` (Isolates state and
  config under `~/.openclaw-<name>`)
- **Dashboard**: `openclaw dashboard` (Opens the Control UI with your current
  token)

## Available Commands Overview

`acp`, `agent`, `agents`, `approvals`, `browser`, `channels`, `completion`,
`config`, `configure`, `cron`, `daemon` (legacy gateway alias), `dashboard`,
`devices`, `directory`, `dns`, `docs`, `doctor`, `gateway`, `health`, `help`,
`hooks`, `logs`, `memory`, `message`, `models`, `node`, `nodes`, `onboard`,
`pairing`, `plugins`, `reset`, `sandbox`, `security`, `sessions`, `setup`,
`skills`, `status`, `system`, `tui`, `uninstall`, `update`, `webhooks`.

## Global Options

- `--dev`: Dev profile (isolates state, port 19001)
- `--profile <name>`: Custom named profile
- `--no-color`: Disable ANSI colors
- `-V`, `--version`: Output version

For more detailed documentation on any command, consult
`openclaw <command> --help` or visit `docs.openclaw.ai/cli`.
