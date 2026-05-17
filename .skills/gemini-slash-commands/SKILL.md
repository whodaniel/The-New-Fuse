---
name: gemini-slash-commands
description: Complete reference for all Gemini CLI slash commands. Use this skill when operating the Gemini CLI or instructing users/agents on how to manage Gemini CLI sessions via interactive slash commands.
---

# Gemini CLI Slash Commands

The Gemini CLI provides a suite of slash commands for session management, model configuration, context management, and debugging.

## Core Commands
- `/help`: Displays a comprehensive list of all available slash commands and their usage.
- `/bug`: Opens the bug reporting interface to submit issues or feedback regarding the CLI.
- `/clear`: Clears the conversation history for the current session, allowing for a fresh start without previous context.
- `/exit` (or `/quit`): Terminates the Gemini CLI session and returns to the standard terminal prompt.
- `/model [name]`: Lists available models or switches the active model (e.g., `/model gemini-1.5-pro`).
- `/system [prompt]`: Sets or updates the system instructions that define the model's persona and operational constraints.

## Context & Management Commands
- `/context`: Displays the current status of the context window, including any pinned documents or system state.
- `/token`: Shows token usage statistics for the previous interaction and the cumulative session total.
- `/file <path>`: Loads and attaches a local file (e.g., PDF, image, source code) to the current conversation context.
- `/history`: Lists the most recent user prompts and model responses for reference or re-execution.

## Advanced & Hidden Commands
- `/debug`: Toggles "Debug Mode," which provides verbose logging of API requests, responses, and internal processing metrics.
- `/raw`: Prints the raw JSON response from the last Gemini API call, useful for developers and troubleshooting.
- `/reset`: Performs a hard reset of the session, clearing context, history, and any modified system instructions.
- `/undo`: Removes the most recent exchange (User + Assistant) from the conversation history.
- `/save <filename>`: Exports the current conversation transcript and session state to a file.
- `/load <filename>`: Imports a previously saved conversation or session state into the active environment.
