---
name: jules-delegation
description:
  Delegate complex coding tasks to Google's Jules autonomous AI coding agent.
  Use this skill when you need to offload time-consuming implementation work,
  create parallel coding sessions, or handle tasks that benefit from
  asynchronous execution.
allowed-tools:
  - 'jules*:*'
  - 'Bash'
  - 'Read'
  - 'Write'
---

# Jules Delegation Skill

This skill allows you to delegate complex coding tasks to Google's **Jules**, an
autonomous AI coding agent designed for long-running and intricate
implementation workflows.

## When to Use Jules

Use Jules for tasks that are:

- **Time-consuming**: Large refactors, test suite creation, or multi-file
  migrations.
- **Independent**: Tasks that can be worked on in parallel without blocking your
  main interaction.
- **Complex**: Features that require multi-step reasoning, execution, and
  verification loops.
- **Iterative**: Tasks where the agent needs to try, fail, fix, and retry loops
  autonomously.
- **Proactive Maintenance**: Scanning the repository for `#TODO` comments,
  technical debt, and potential refactors.
- **Repoless Sessions**: Using the Jules SDK to execute code in a serverless
  environment without a full repository context.

**Examples:**

- "Jules, scan the codebase for `#TODO` comments and propose a plan to address
  the high-priority ones."
- "Create a new feature branch and implement the user profile settings page."
- "Use a repoless session to verify this snippet of code in an isolated
  environment."

## Capabilities

Jules can:

1.  **Read and understand** the codebase.
2.  **Plan and execute** complex coding tasks.
3.  **Run commands** to build, test, and verify changes.
4.  **Self-correct** based on error messages and test failures.
5.  **Create standardized PRs/MRs** with detailed descriptions.
6.  **Analyze build logs** and trigger auto-fixes for failed deployments.
7.  **Identify performance bottlenecks** and security vulnerabilities
    proactively.

## Usage Instructions

To delegate a task to Jules:

1.  **Identify the Scope**: Clearly define what Jules needs to do. Provide
    context from the current conversation if necessary.
2.  **Formulate the Instruction**: Create a clear, actionable prompt for Jules.
    - _Bad_: "Fix the bugs."
    - _Good_: "Run the unit tests in `packages/core`, identify the flakiness in
      the `UserAuth` suite, and fix the race conditions causing the failures."
3.  **Trigger via Tool**: Use the appropriate tool (e.g., `jules:create_task` or
    via CLI command if tools are unavailable) to send the instruction.

### CLI Usage (Fallback)

If the MCP tool is not directly available, you can invoke Jules via the CLI:

```bash
jules --task "YOUR_INSTRUCTION_HERE" --path ./path/to/project
```

## Integration with Antigravity

Jules runs as a specialized sub-agent within the Google ecosystem. When you
delegate to Jules:

- Acknowledged the delegation to the user: "I passed this task to Jules for
  autonomous execution."
- Jules will work in the background.
- You can poll for status or receive a notification when Jules completes the
  task (depending on environment configuration).

## Workflow

1.  **User Request**: "Can you migrate the database schema?"
2.  **Agent Decision**: task is complex -> Delegate to Jules.
3.  **Action**: Call
    `jules:create_task(description="Migrate database schema to new version...")`.
4.  **Response**: "I've assigned the database migration to Jules. It will handle
    the schema updates and data migration scripts autonomously."
