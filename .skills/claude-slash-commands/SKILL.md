---
name: claude-slash-commands
description: Reference for Claude Code interactive slash commands. Use this skill when operating the Claude CLI or managing Claude interactive sessions.
---

# Claude CLI Slash Commands

Claude Code provides interactive slash commands for managing your session, tokens, and context efficiently.

## Session & Context Management
- `/clear`: Clears the current conversation history to start fresh and save tokens.
- `/compact`: Compacts the conversation history. Claude summarizes the previous context to free up tokens while retaining important details. Use this when you hit token limits but want to keep the context.
- `/history`: Shows the history of past sessions, allowing you to review previous prompts and responses.
- `/cost`: Displays the token usage and estimated cost of the current session and past requests.
- `/bug`: Opens the interface to report a bug or issue with Claude Code.
- `/help`: Shows help information for interactive commands.

## Authentication & System
- `/login`: Initiates the login process to Anthropic.
- `/logout`: Clears authentication credentials and ends the session.
- `/exit` (or `/quit`): Exits the interactive Claude Code session.
