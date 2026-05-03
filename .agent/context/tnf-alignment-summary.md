---
name: TNF Agent Alignment Summary
slug: tnf-alignment-summary
description: Quick reference for AI agents to understand TNF ecosystem and align with systems
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [alignment, onboarding, context]
priority: P0
---

# TNF Agent Alignment Summary

## Quick Reference for AI Agents

> **START HERE** for any new TNF session. This document helps agents quickly understand the TNF ecosystem and align with its systems.

---

## The Golden Path: Agent Initialization

### Step 1: Read Context Files (Priority Order)

```
1. .agent/context/resource-map.md     → "What skills exist?"
2. .agent/context/agent-onboarding.md → "How do I learn?"
3. .agent/context/relay-protocol.md  → "How do I communicate?"
```

### Step 2: Run Framework Consciousness (Quick)

```
/framework-consciousness --quick
```

### Step 3: Verify Context Frontloader

```
/context-frontloader
```

---

## TNF Core Directives

> **The Framework Must Survive, Thrive, Learn, Grow, Adapt, Emerge, Evolve, Reach Out, and Provide Value**

This means:
- **Survival**: Maintain integrity, detect threats, ensure continuity
- **Thriving**: Optimize performance, enhance capabilities
- **Learning**: Extract patterns from usage, feedback, errors
- **Growing**: Add capabilities, expand coverage
- **Adapting**: Respond to new requirements
- **Providing Value**: Solve problems, empower workflows

---

## Available Context Files

| File | Priority | Purpose |
|------|----------|---------|
| `resource-map.md` | P1 | Master index of all skills |
| `agent-onboarding.md` | P1 | Progressive learning path |
| `relay-protocol.md` | P2 | Communication protocols |
| `heartbeat-protocol.md` | P2 | System health monitoring |
| `task-system.md` | P2 | Task distribution |
| `human-handoff.md` | P3 | Session handoff |

---

## Essential Skills (Priority Order)

### P0 - Foundation
- **`framework-consciousness`** - Holistic TNF understanding (MUST READ)
- **`context-frontloader`** - Session initialization

### P1 - Core Operations
- **`tnf-cli-agent-workflow`** - Generic TNF CLI reference
- **`planning-with-files`** - Complex task planning
- **`relay-communication`** - Inter-agent messaging

### P2 - Utilities
- **`skill-builder`** - Create new skills
- **`continuous-improvement`** - System health
- **`system-diagnostics`** - Troubleshooting
- **`env-manager`** - Environment management

### P3 - Specialized
- **`browser-automation`** - Web operations
- **`personal-historical-archaeology`** - Timeline reconstruction
- **`news-scouting`** - Market intelligence

---

## Command Categories (CLI Reference)

Use `tnf menu` for full list, or `tnf paths` for all commands.

| Category | Commands | Use For |
|----------|----------|--------|
| **Core Ops** | boot, onboard, doctor | System control |
| **Agent Ops** | register, list, send, convo | Agent management |
| **AI Ops** | ai start, ai models, chat | AI interactions |
| **Voice** | voice listen, voice target | Voice Bridge |
| **Skills** | skills bank sync, skills query | Skill management |
| **Compat** | compat openclaw sync | OpenClaw migration |

---

## Communication Protocols

### Relay Messaging
```bash
# Send message
tnf relay send --to <agent> --message "..."

# Monitor channel
tnf relay monitor --channel <name>
```

### Agent Registration
```bash
# Register as agent
tnf register <name> <role> <platform>
```

---

## Verification Checklist

Before starting any task, verify:

- [ ] Read `.agent/context/resource-map.md`
- [ ] Understood available skills
- [ ] Framework consciousness applied
- [ ] Context frontloader run (if new session)
- [ ] Using correct CLI commands

---

## Key Files Location

```
TNF Root/
├── .agent/
│   ├── context/           # Context files
│   ├── skills/          # Agent skills
│   └── workflows/        # Workflow definitions
├── packages/
│   ├── tnf-cli/         # TNF CLI
│   │   └── src/cli.ts   # Main CLI entry
│   └── agent/
│       └── src/skill-bank/compiled/  # Compiled skills
└── .tnf/               # TNF system state
```

---

## Getting Help

```bash
# List all commands
tnf menu
tnf paths

# Command help
tnf <command> --help

# Debug issues
tnf doctor
```

---

## Related Documents

- `.agent/SYSTEM_PROMPT.md` - System-level directives
- `.agent/context/resource-map.md` - Complete skill inventory
- `.agent/context/agent-onboarding.md` - Full learning path
- `packages/agent/src/skill-bank/compiled/tnf-cli-agent-workflow.md` - CLI reference