---
name: hermes-slash-commands
description: Reference for Hermes Agent CLI subcommands and interactive slash commands. Use this when operating Hermes or managing its background services (gateway, cron, kanban).
---

# Hermes Agent Slash Commands

Hermes provides a powerful CLI interface and interactive TUI for agentic operations.

## CLI Subcommands (Non-Interactive)
- `hermes chat`: Start an interactive chat session.
- `hermes model`: Select the default model and provider.
- `hermes fallback`: Manage the fallback provider chain.
- `hermes gateway`: Manage messaging gateways (WhatsApp, Slack).
- `hermes setup`: Run the interactive setup wizard.
- `hermes status`: Show status of all TNF components.
- `hermes kanban`: Manage the collaboration board.
- `hermes hooks`: Inspect and manage shell-script hooks.
- `hermes doctor`: Check configuration and dependencies.
- `hermes sessions`: List, rename, or prune session history.
- `hermes dashboard`: Start the web UI dashboard (port 9119).
- `hermes logs`: View and filter Hermes log files.

## Interactive TUI Slash Commands
- `/help`: Displays help for interactive commands.
- `/clear`: Wipes session history.
- `/compact`: Summarizes context to save tokens.
- `/cost`: Shows session usage and cost.
- `/model`: Switches the active model.
- `/exit` (or `/quit`): Exits the session.
- `/kanban`: Quickly access kanban operations from chat.
- `/hooks`: Manage active hooks for the current session.
