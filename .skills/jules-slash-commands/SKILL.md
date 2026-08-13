---
name: jules-slash-commands
description: Reference for Google Jules CLI commands. Use this skill when delegating complex coding tasks to the Jules asynchronous agent.
---

# Jules CLI Commands

Jules is an asynchronous coding agent for repository-wide tasks.

## Core Commands
- `jules new "task"`: Start a new coding session with a task description.
- `jules new --repo owner/repo "task"`: Explicitly set the repository.
- `jules new --parallel N "task"`: Launch N parallel sessions for the same task.
- `jules remote list --session`: List all active Jules sessions.
- `jules remote list --repo`: List all repositories with Jules activity.
- `jules remote pull --session ID`: Retrieve the results of a session for review.
- `jules remote pull --session ID --apply`: Retrieve and apply changes to the local repo.

## Best Practices
- Use Jules for large-scale refactors and systematic improvements.
- Always review changes with `jules remote pull` before applying.
- Use parallel sessions for independent tasks (e.g., implementing multiple routes).
