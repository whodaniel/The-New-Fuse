---
name: kilo-slash-commands
description: Reference for Kilo CLI and interactive commands. Use this skill when leveraging Kilo for coding tasks or connecting to its 500+ supported LLM models.
---

# Kilo CLI Commands

Kilo is a coding-focused agent that supports a wide array of AI providers.

## CLI Commands
- `kilo`: Starts the interactive Kilo TUI.
- `kilo run "task"`: Executes a one-shot coding task.
- `kilo --prompt "task"`: Alternative way to launch a task.

## Interactive Slash Commands
- `/help`: Shows available commands.
- `/connect`: Opens the interface to authenticate with AI providers (Minimax, GLM, etc.).
- `/clear`: Resets the session context.
- `/model`: Selects from 500+ supported models.
- `/exit`: Exits the Kilo session.

## Integration Tip
Use `tmux new-session -d -s kilo 'kilo'` to run Kilo in the background for long-running coding tasks.
