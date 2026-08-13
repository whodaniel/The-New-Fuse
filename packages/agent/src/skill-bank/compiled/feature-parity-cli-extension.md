---
name: Feature Parity CLI Extension
slug: feature-parity-cli-extension
description: Analyze source CLI agents and extend target CLI to achieve full feature parity
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [cli, feature-parity, hermes, extension]
priority: P1
---

# Feature Parity Analysis & CLI Extension Skill

## Purpose

Analyze an existing CLI agent (source) and extend a target CLI (like TNF) to achieve full feature parity by discovering missing commands and implementing them natively in the target.

## Prerequisites

- Access to source CLI codebase (e.g., hermes in ~/.hermes/)
- Access to target CLI codebase (e.g., tnf in The-New-Fuse/packages/tnf-cli/)
- Understanding of both CLIs' command structures
- Ability to edit target CLI's commands.ts file

## Implementation Steps

### Step 1: Explore Source CLI

```bash
# Find source CLI location
ls -la ~/.hermes/hermes-agent/
cat ~/.hermes/hermes-agent/README.md

# Get source CLI help to list commands
hermes --help
```

### Step 2: Explore Target CLI

```bash
# Navigate to target CLI
cd The-New-Fuse

# Get target CLI help
pnpm tnf --help

# Find CLI entry point
cat packages/tnf-cli/src/cli.ts | head -100
```

### Step 3: Compare Commands

Create a comparison table:

| Source Command | Target Command | Status |
|---------------|--------------|--------|
| hermes model | tnf model | ✅ / ❌ |
| hermes tools | tnf tools | ✅ / ❌ |
| hermes config | tnf config | ✅ / ❌ |
| hermes gateway | tnf gateway | ✅ / ❌ |
| hermes setup | tnf setup | ✅ / ❌ |
| hermes update | tnf upgrade | ✅ / ❌ |
| hermes doctor | tnf doctor | ✅ / ❌ |

### Step 4: Identify Gap

For each missing command:
1. Create new command group (e.g., `program.command('model')`)
2. Add subcommands matching source's structure
3. Wire to existing services or create new ones

### Step 5: Implement Missing Commands

Example template for new commands:

```typescript
// New command group
const newCmd = program
  .command('command-name')
  .description('Description from source CLI');

newCmd
  .command('subcommand')
  .description('Subcommand description')
  .action(async () => {
    // Implementation
  });
```

### Step 6: Verify

```bash
# Test new commands load
pnpm tnf --help
pnpm tnf command-name --help

# Test specific subcommands
pnpm tnf command-name subcommand
```

## Success Criteria

- [ ] All source CLI commands have target equivalents
- [ ] New commands appear in `tnf --help`
- [ ] Subcommands work correctly
- [ ] No duplicate command errors

## Common Pitfalls

1. **Duplicate command error** - Command already exists; use `.alias()` instead
2. **Service not imported** - Import from `./services/*.js` at top of file
3. **Passthrough interference** - Check `isXxxPassthroughArgv()` functions

## Example: The Gap We Fixed

- **Source**: hermes CLI has `model`, `tools`, `config`, `gateway`, `setup`
- **Target**: tnf CLI initially lacked native versions (only `hermes` passthrough)
- **Solution**: Added native `tnf model`, `tnf tools`, `tnf config`, `tnf gateway`, `tnf setup`

## Related Skills

- `cli-debugging` - Debugging CLI issues
- `service-wiring` - Connecting new services to CLI
- `package-management` - Adding dependencies