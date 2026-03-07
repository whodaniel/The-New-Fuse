---
name: jules-autonomous-loop
description: Run Jules delegation and PR lifecycle autonomously (status, plan approval, publish, PR creation, conflict resolution, merge) and schedule unattended runs with cron.
---

# Jules Autonomous Loop

Use this skill when the user wants fully programmatic Jules operations with minimal supervision.

## Trigger cues

- "run the whole Jules cycle"
- "autonomously merge all Jules PRs"
- "set this up as a recurring loop"
- "no manual publish clicks"

## Commands

Run one autonomous cycle:

```bash
pnpm run jules:loop
```

Run one cycle and seed new sessions from a task file:

```bash
pnpm run jules:loop -- <task-file>
```

Run only open-PR merge/conflict resolution:

```bash
pnpm run jules:merge-open
```

Install scheduled loop:

```bash
INTERVAL_MINUTES=15 pnpm run jules:cron:install
```

## Execution policy

1. Prefer single-command loop execution over step-by-step manual commands.
2. Only pause for user input on critical blockers:
   - missing auth
   - permission-denied system operations
   - ambiguous conflict strategy
3. Always emit current status and remaining blockers at the end.
