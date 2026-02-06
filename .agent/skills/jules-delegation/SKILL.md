---
name: jules-delegation
description:
  Delegate complex coding tasks to Google's Jules autonomous AI coding agent.
  Use this skill when you need to offload time-consuming implementation work,
  create parallel coding sessions, or handle tasks that benefit from
  asynchronous execution.
---

# Jules Delegation Skill

## Purpose

Enable AI agents in The New Fuse to delegate coding tasks to Google's **Jules**
autonomous coding agent. Jules works asynchronously on GitHub repositories,
handling complex implementation tasks while the primary agent continues other
work.

## When to Use This Skill

Activate this skill when:

- You need to implement a feature but have other concurrent tasks
- The coding task is well-defined and can run asynchronously
- You want to parallelize work across multiple coding sessions
- The task involves repository-wide changes (refactoring, adding tests,
  migrations)
- You need specialized coding work that benefits from isolation

**Do NOT use this skill for:**

- Quick inline fixes you can do immediately
- Tasks requiring real-time user interaction
- Exploratory analysis (use local tools instead)

## Pre-Flight Checklist

### 1. ✅ Verify Jules CLI is Available

```bash
jules version
```

Expected output: Version number (e.g., `1.0.0`)

### 2. ✅ Verify User is Logged In

```bash
jules remote list --session 2>&1 | head -5
```

If you see an authentication error, user must run `jules login` first.

### 3. ✅ Verify Repository Context

```bash
git remote -v | head -1
```

Confirm the repository is correctly identified for Jules to work on.

### 4. ✅ Prepare Task Description

Structure your task using this template:

```xml
<instruction>You are an expert software engineer. Run `git status` and `git diff` to understand the current state. Complete the mission brief.</instruction>
<workspace_context>
[Describe the codebase architecture, tech stack, relevant files]
</workspace_context>
<mission_brief>
## Task: [Clear task name]

### Steps:
1. [First step]
2. [Second step]
...

### Success Criteria:
- [Criterion 1]
- [Criterion 2]
</mission_brief>
```

## Workflow Diagram

```
┌─────────────────────────────────────┐
│    Agent Needs Coding Task Done     │
└──────────────┬──────────────────────┘
               │
               ▼
         ┌─────────────┐
         │ Check Jules │───NO──►┌──────────────────┐
         │ Available?  │        │ Inform User:     │
         └─────┬───────┘        │ "Install Jules   │
               │ YES            │  CLI first"      │
               │                └──────────────────┘
               ▼
         ┌─────────────┐
         │ Logged In?  │───NO──►┌──────────────────┐
         │             │        │ Run: jules login │
         └─────┬───────┘        └──────────────────┘
               │ YES
               ▼
         ┌─────────────────────┐
         │ Compose Task Prompt │
         │ Using Template      │
         └──────┬──────────────┘
                │
                ▼
         ┌─────────────────────┐
         │ Execute:            │
         │ jules new "<task>"  │
         └──────┬──────────────┘
                │
                ▼
         ┌─────────────────────┐
         │ Session Created     │
         │ (Async Execution)   │
         └──────┬──────────────┘
                │
                ▼
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌────────────┐    ┌──────────────────┐
│ Continue   │    │ Monitor Status:  │
│ Other Work │    │ jules remote     │
│            │    │ list --session   │
└────────────┘    └──────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ When Complete:   │
                 │ jules remote     │
                 │ pull --session X │
                 │ --apply          │
                 └──────────────────┘
```

## Core Operations

### 1. Create a New Session

```bash
# Basic task
jules new "Implement user authentication with OAuth2"

# With specific repository
jules new --repo owner/repo "Add unit tests for UserService"

# Multiple parallel sessions
jules new --parallel 4 "Add comprehensive error handling"
```

### 2. List Active Sessions

```bash
jules remote list --session
```

### 3. Pull Completed Work

```bash
# Preview changes
jules remote pull --session 123456

# Apply to local repo
jules remote pull --session 123456 --apply
```

### 4. Teleport to Session

```bash
# Clone + checkout + apply all at once
jules teleport 123456
```

## Self-Referential Knowledge

This skill references:

- `.agent/skills/skill-builder/SKILL.md` (for task template patterns)
- `.agent/context/tnf-architecture.md` (for codebase context)
- `packages/jules-skill/` (TypeScript client implementation)
- `.jules/tasks/` (predefined task templates)

## Script: check_jules.py

```python
#!/usr/bin/env python3
"""
Jules CLI Status Checker
Verifies Jules is installed, available, and user is authenticated.
"""
import subprocess
import sys
import json


def run_command(cmd: list[str]) -> tuple[bool, str]:
    """Execute command and return success status and output."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except FileNotFoundError:
        return False, "Command not found"


def check_jules_installed() -> bool:
    """Check if Jules CLI is installed."""
    success, output = run_command(['jules', 'version'])
    if success:
        print(f"✅ Jules CLI installed: {output}")
        return True
    print("❌ Jules CLI not installed")
    print("   Install from: https://jules.google/cli")
    return False


def check_jules_authenticated() -> bool:
    """Check if user is logged in to Jules."""
    success, _ = run_command(['jules', 'remote', 'list', '--session'])
    if success:
        print("✅ Jules authenticated")
        return True
    print("❌ Jules not authenticated")
    print("   Run: jules login")
    return False


def get_current_repo() -> str | None:
    """Get current repository from git remote."""
    success, output = run_command(['git', 'remote', 'get-url', 'origin'])
    if success:
        # Extract owner/repo from URL
        import re
        match = re.search(r'[:/]([^/]+/[^/.]+)(?:\.git)?$', output)
        if match:
            return match.group(1)
    return None


def main():
    """Run all Jules checks."""
    print("=" * 50)
    print("Jules CLI Status Check")
    print("=" * 50)

    status = {
        "installed": check_jules_installed(),
        "authenticated": False,
        "repository": None
    }

    if status["installed"]:
        status["authenticated"] = check_jules_authenticated()
        status["repository"] = get_current_repo()

        if status["repository"]:
            print(f"✅ Repository detected: {status['repository']}")
        else:
            print("⚠️  No git repository detected")

    print("=" * 50)

    # Output JSON for programmatic use
    if "--json" in sys.argv:
        print(json.dumps(status, indent=2))

    # Exit with appropriate code
    if status["installed"] and status["authenticated"]:
        print("STATUS: READY")
        sys.exit(0)
    else:
        print("STATUS: NOT READY")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

## Script: submit_task.py

```python
#!/usr/bin/env python3
"""
Jules Task Submitter
Submits a task to Jules and tracks the session.
"""
import subprocess
import sys
import argparse


def submit_task(task: str, repo: str = None, parallel: int = 1) -> bool:
    """Submit a task to Jules."""
    cmd = ['jules', 'new']

    if repo:
        cmd.extend(['--repo', repo])

    if parallel > 1:
        cmd.extend(['--parallel', str(parallel)])

    cmd.append(task)

    print(f"Submitting task to Jules...")
    print(f"Task: {task[:100]}..." if len(task) > 100 else f"Task: {task}")

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print("✅ Task submitted successfully")
        print(result.stdout)
        return True
    else:
        print("❌ Task submission failed")
        print(result.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description='Submit task to Jules')
    parser.add_argument('task', help='Task description or path to task file')
    parser.add_argument('--repo', help='Repository (owner/repo)')
    parser.add_argument('--parallel', type=int, default=1, help='Parallel sessions')
    parser.add_argument('--file', action='store_true', help='Read task from file')

    args = parser.parse_args()

    task = args.task
    if args.file:
        with open(args.task, 'r') as f:
            task = f.read()

    success = submit_task(task, args.repo, args.parallel)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
```

## Common Mistakes to Avoid

### ❌ WRONG: Vague Tasks

```
jules new "Fix the bug"
```

### ✅ CORRECT: Specific, Structured Tasks

```
jules new "<instruction>...</instruction>
<mission_brief>
## Task: Fix Authentication Token Expiry Bug

### Context
The JWT tokens are not being refreshed properly...

### Steps
1. Locate AuthService.ts
2. Review token refresh logic
3. Implement proper refresh mechanism

### Success Criteria
- Tokens refresh 5 minutes before expiry
- Unit tests pass
</mission_brief>"
```

### ❌ WRONG: Not Checking Status

Submitting tasks without verifying Jules is ready.

### ✅ CORRECT: Always Pre-Flight

```bash
python3 check_jules.py && jules new "..."
```

## Integration with TNF

This skill is **automatically loaded** when Claude detects keywords:

- "jules"
- "delegate"
- "delegate to"
- "autonomous agent"
- "async coding"
- "parallel implementation"
- "coding session"

It integrates with:

1. **MCP Server**: Uses `packages/jules-skill/` for programmatic access
2. **Task Templates**: Reads from `.jules/tasks/` for predefined operations
3. **Repository Context**: Automatically detects current git repository

## Available Task Templates

Templates are stored in `.jules/tasks/`. To submit a template:

```bash
jules new "$(cat .jules/tasks/JULES_TASK_01_drizzle_user_repository.md)"
```

Current templates:

| ID  | Name                    | Category   |
| --- | ----------------------- | ---------- |
| 01  | Drizzle User Repository | Database   |
| 02  | Drizzle Workflow Repo   | Database   |
| 03  | Drizzle Task Repository | Database   |
| 04  | Drizzle Chat Repository | Database   |
| 05  | Core Drizzle Migration   | Migration  |
| 06  | Core Messaging Service  | Migration  |
| 07  | TypeScript Strict Audit | Validation |
| 08  | Agent Dashboard         | Frontend   |
| 09  | Redis Agent Registry    | Backend    |
| 10  | Agent API Endpoints     | Backend    |
| 11  | Workflow Engine         | Backend    |
| 12  | Database Unit Tests     | Testing    |
| 13  | Documentation Update    | Docs       |
| 14  | Lint & Format           | Quality    |
| 15  | Security Audit          | Security   |
| 16  | Dependency Audit        | Security   |

## Testing

```bash
# 1. Run pre-flight check
python3 .agent/skills/jules-delegation/check_jules.py

# 2. Submit a test task (dry run in message)
echo "Would submit: test task"

# 3. List sessions to verify
jules remote list --session
```

## Version

- **Skill ID**: `tnf-jules-delegation-v1`
- **Created**: December 28, 2025
- **Last Updated**: December 28, 2025
- **Dependencies**: Jules CLI, Git
