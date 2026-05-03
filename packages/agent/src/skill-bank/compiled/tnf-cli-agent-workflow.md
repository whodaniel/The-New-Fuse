---
name: tnf-cli-agent-workflow
slug: tnf-cli-agent-workflow
description: Generic go-to skill for ANY AI agent working with TNF CLI - the reference skill for TNF operations
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [cli, workflow, tnf, reference]
priority: P0
---

# TNF CLI Agent Workflow Skill

## Purpose

A general-purpose skill for **any AI agent** working with The New Fuse ecosystem to understand, navigate, and execute tasks using the TNF CLI.

This is the **go-to skill** for agents when working with TNF — reference this first for any TNF-related task.

## Quick Start

```bash
# Navigate to TNF root
cd The-New-Fuse

# Get oriented
pnpm tnf --help           # All available commands
pnpm tnf menu            # Organized command menu

# Run any command
pnpm tnf <command>
```

## Core Concepts

### TNF CLI Entry Point

```
The-New-Fuse/packages/tnf-cli/src/cli.ts
```

### CLI Architecture

The TNF CLI uses **Commander.js** with this pattern:

```typescript
import { Command, Option } from 'commander';

const program = new Command();

// Main command with subcommands
const mainCmd = program
  .command('main-cmd')
  .description('Description shown in help');

mainCmd
  .command('sub-cmd')
  .description('Subcommand description')
  .argument('[arg]', 'Optional argument')
  .option('-o, --option <value>', 'Option description')
  .action(async (options: { option: string }) => {
    // Implementation
  });

// Aliases
mainCmd.alias('alias');

// Passthrough pattern
program
  .command('passthrough')
  .allowUnknownOption()  // Accepts extra args
  .argument('[args...]', 'Arguments to pass through')
  .action(async (args: string[]) => {
    await runPassthrough('external-cli', args);
  });
```

## Common Agent Tasks

### Task 1: List Available Commands

```bash
cd The-New-Fuse
pnpm tnf --help                    # All commands
pnpm tnf menu                    # Organized menu
pnpm tnf paths                   # All command paths
pnpm tnf types                  # Namespace inventory
```

### Task 2: Find a Specific Command

```bash
# Search for command
pnpm tnf --help | grep <keyword>

# Or search in source
grep -r "command('" packages/tnf-cli/src/cli.ts
```

### Task 3: Add New Command

1. Find where to add in `cli.ts`
2. Use existing pattern as template
3. Import any new services needed

```typescript
// Example: Adding a new simple command
program
  .command('newcmd')
  .description('Description')
  .action(async () => {
    console.log(chalk.green('✅ Done'));
  });
```

### Task 4: Run Existing Scripts

```bash
# Package scripts
pnpm tnf scripts list
pnpm tnf scripts run <target>

# File scripts (bash/sh/py/ts)
pnpm tnf run-script scripts/my-script.sh
```

### Task 5: Debug Issues

```bash
# Run diagnostics
pnpm tnf doctor

# Debug mode
pnpm tnf debug --verbose

# Check logs
tail -f logs/*.log
```

### Task 6: Passthrough to External CLIs

TNF automatically passthrough to these if command not found internally:

```bash
tnf openclaw <args>     # → openclaw CLI
tnf hermes <args>      # → hermes CLI
tnf gemini <args>      # → gemini CLI
```

## Command Categories

| Category | Commands | Use For |
|----------|----------|--------|
| **Core Ops** | boot, onboard, doctor | System control |
| **Agent Ops** | register, list, send, convo | Agent management |
| **AI Ops** | ai start, ai models, chat | AI interactions |
| **Voice** | voice listen, voice target | Voice Bridge |
| **Skills** | skills bank sync, skills query | Skill management |
| **Compat** | compat openclaw sync | OpenClaw migration |
| **Remote** | remote start, remote status | Remote connections |

## Services Reference

Located in `packages/tnf-cli/src/services/`:

| Service | Purpose |
|---------|---------|
| `ACPService.ts` | ACP server |
| `AgentManagerService.ts` | Agent registry |
| `AuthService.ts` | Credentials |
| `CompletionService.ts` | Shell completions |
| `DatabaseService.ts` | SQLite operations |
| `DebugService.ts` | Debugging tools |
| `MCPManagerService.ts` | MCP tools |
| `ModelsService.ts` | LLM models |
| `RemoteService.ts` | Remote connections |
| `SessionManagerService.ts` | Sessions |
| `SkillsService.ts` | Skill bank |
| `StatsService.ts` | Usage stats |
| `UpgradeService.ts` | Updates |

## Extension Patterns

### Adding a Service Command

```typescript
import { MyService } from './services/MyService.js';

const myCmd = program
  .command('mycmd')
  .description('My command group');

const service = new MyService();

myCmd
  .command('action')
  .description('Do something')
  .argument('<input>', 'Input description')
  .action(async (input: string) => {
    const result = await service.doSomething(input);
    console.log(result);
  });
```

### Adding a Passthrough

```typescript
// Check for passthrough in main()
if (isMyCliPassthroughArgv(process.argv)) {
  await runPassthrough('mycli', process.argv.slice(3));
  return;
}

// Define check function
function isMyCliPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'mycli';
}
```

### Adding Configuration

```typescript
// In service, load from config
const config = authService.getConfig('key');
// Or environment
const envValue = process.env.MY_VAR;
```

## Verification Commands

```bash
# Syntax check
pnpm tsc --noEmit

# Run specific command
pnpm tnf <command> <subcommand>

# Check help appears
pnpm tnf <command> --help
```

## Troubleshooting

| Issue | Solution |
|-------|---------|
| "command already exists" | Use `.alias()` or different name |
| Service not found | Add import at top of file |
| Passthrough priority | Check main() passthrough order |
| Type errors | Run `pnpm tsc` |

## Quick Reference

```bash
# Get help
tnf --help
tnf <cmd> --help

# List everything
tnf menu
tnf paths

# Run any script
tnf run-script <path>

# External passthrough
tnf openclaw <args>
tnf hermes <args>
```

## Related Skills

- `feature-parity-cli-extension` - Adding commands for feature parity
- `service-wiring` - Connecting new services
- `cli-debugging` - Troubleshooting CLI issues