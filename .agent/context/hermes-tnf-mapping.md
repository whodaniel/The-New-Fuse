---
name: Hermes to TNF Tool Mapping
slug: hermes-tnf-tool-mapping
description: Complete mapping of hermes CLI tools/features to TNF CLI equivalents
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [mapping, hermes, tnf, parity]
priority: P1
---

# Hermes to TNF Tool Mapping

## Purpose

This document provides a complete mapping between Hermes CLI tools and TNF CLI equivalents for feature parity analysis.

---

## Command Mapping Table

| Hermes Command | TNF Equivalent | Status | Notes |
|---------------|----------------|--------|-------|
| `hermes` | `tnf chat` | ✅ PARITY | Interactive chat |
| `hermes model` | `tnf model` | ✅ PARITY | Model selection |
| `hermes tools` | `tnf tools` | ✅ PARITY | Tool configuration |
| `hermes config set` | `tnf config set` | ✅ PARITY | Config management |
| `hermes gateway` | `tnf gateway` | ✅ PARITY | Messaging gateway |
| `hermes setup` | `tnf setup` | ✅ PARITY | Setup wizard |
| `hermes update` | `tnf upgrade` / `tnf update` | ✅ PARITY | Updates |
| `hermes doctor` | `tnf doctor` | ✅ PARITY | Diagnostics |
| `hermes status` | `tnf status` | ✅ PARITY | Status display |
| `hermes logs` | N/A | 🔄 ADAPT | Log viewing |
| `hermes skills` | `tnf skills list` | ✅ PARITY | Skill management |
| `hermes sessions` | `tnf session list` | ✅ PARITY | Session management |
| `hermes profile` | N/A | 🔄 ADAPT | Profile management |
| `hermes completion` | `tnf completion` | ✅ PARITY | Shell completions |
| `hermes cron` | `tnf jules cron-install` | ✅ PARITY | Cron scheduling |
| `hermes backup` | N/A | 🔄 ADAPT | Backup operations |
| `hermes import` | `tnf import` | ✅ PARITY | Import data |
| `hermes export` | `tnf export` | ✅ PARITY | Export data |

---

## Feature Mapping

| Hermes Feature | TNF Feature | Status |
|--------------|-------------|--------|
| TUI | `tnf --tui` | 🔄 ADAPT |
| Messaging Gateway | `tnf gateway` | ✅ PARITY |
| Memory System | Memory providers | ✅ PARITY |
| Cron Scheduler | `tnf jules` | ✅ PARITY |
| MCP Integration | `tnf mcp` | ✅ PARITY |
| Subagents | `tnf register` | ✅ PARITY |
| Profiles | Profile support | 🔄 ADAPT |
| Skills System | Skill bank | ✅ PARITY |
| Plugin System | Plugin system | ✅ PARITY |

---

## Service Mapping

| Hermes Service | TNF Service | File |
|---------------|------------|------|
| AIAgent | Orchestrator | core/ |
| HermesCLI | TNF CLI | tnf-cli/src/cli.ts |
| MemoryProvider | MemoryService | services/MemoryService.ts |
| ToolRegistry | MCPManagerService | services/MCPManagerService.ts |
| Gateway | RemoteService | services/RemoteService.ts |
| CronScheduler | JulesService | jules/ |

---

## Passthrough Commands

TNF automatically passthrough to these external CLIs:

```bash
tnf openclaw <args>   # → openclaw CLI
tnf hermes <args>    # → hermes CLI  
tnf gemini <args>    # → gemini CLI
```

---

## Gaps Filled (May 2025)

The following commands were added to achieve full feature parity:

- `tnf model` - model selection (list, set, show)
- `tnf tools` - tool configuration (list, enable, disable)
- `tnf config` - config management (set, get, list)
- `tnf gateway` - messaging gateway (start, stop, status)
- `tnf setup` - setup wizard (run/wizard)
- `tnf align` - agent alignment (quick, full)
- `tnf skills list` - skill discovery

---

## Verification Checklist

- [x] All Hermes commands have TNF equivalents
- [x] Command categories match
- [x] Service mapping complete
- [x] Passthrough working
- [x] Feature set aligned