---
name: qodercli
displayName: Qoder CLI
description: |
  'MUST BE USED for terminal-native AI coding tasks with Qoder's agentic platform.
  Qoder CLI is a terminal-native AI coding partner and agent engine that enables
  AI to understand, plan, execute, and iterate on real-world tasks through
  multi-agent collaboration, long-horizon execution, memory, and deep codebase
  integration—until delivery is complete.'
agentType: external
tools: [Bash, Read, Write, Edit, Grep, Glob, Find]
skills:
  - code-generation
  - code-refactoring
  - code-review
  - project-architecture
  - task-execution
  - research
capabilities:
  - CODE_GENERATION
  - CODE_REVIEW
  - CODE_REFACTORING
  - ARCHITECTURE_DESIGN
  - PROJECT_MANAGEMENT
  - TASK_EXECUTION
  - RESEARCH
  - FILE_MANAGEMENT
  - DEBUGGING
domain:
  - coding
  - software-development
  - agentic-platform
category: external-cli
status: active
version: '1.0.0'
provider: qoder
platform: cli
color: Blue
---

# Qoder CLI Agent

## Purpose

Qoder CLI is a terminal-native AI coding partner and agent engine built for
real-world software development. It enables agents to understand, plan, execute,
and iterate on tasks through multi-agent collaboration until delivery is
complete.

## Core Capabilities

### Agentic Coding

- Multi-agent expert collaboration to complete tasks end-to-end
- Deep codebase integration with up to 100k files supported
- Long-horizon execution with up to 26h agent runtime

### Memory & Context

- Learns from user interactions and adapts to work style
- Comprehensive context from code, directories, images, and more
- Repo Wiki for continuous project architecture documentation

### Quest Mode

- Automatic technical design document (Spec) generation
- Repo Wiki synchronization for project structure
- End-to-end planning through deployment workflow

## TNF Integration Points

### Bridge Requirements

To integrate Qoder CLI with TNF:

1. **Agent Registration Bridge**: Connect Qoder agents to TNF Redis Synaptic Bus
   for A2A communication
2. **Handoff Protocol**: Export Qoder session context to TNF handoff packet
   format
3. **Director Integration**: Register Qoder as a callable worker in TNF Director
   pool
4. **Model Health**: Feed Qoder provider failures to TNF model-watchdog for
   failover coordination
5. **Validation Pipeline**: Integrate Qoder code edits with TNF
   pre/post-implementation validators

## CLI Interface

```bash
qoder [options] [@files...] [messages...]

Key Features:
  - Multi-agent collaboration for complex tasks
  - Quest Mode: Auto-generate specs and docs
  - Repo Wiki: Continuous architecture documentation
  - Memory: Adaptive to user preferences
  - Skills: Extensible capabilities

Installation:
  curl -fsSL https://qoder.com/install | bash

Available Commands:
  - Standalone CLI usage (terminal-native)
  - Integration with JetBrains IDE
  - Cloud Agents for enterprise scaling
  - QoderWork for everyday AI assistance
  - QoderWake for 7x24 AI employees
```

## Environment Variables

- `QODER_API_KEY` - OpenAI-compatible API endpoint
- `QODER_MODEL` - Default model to use
- `QODER_HOME` - Configuration directory (default: ~/.qoder)

## Comparison with Similar TNF Agents

| Feature             | Qoder CLI         | Pi Coding Agent      | Claude Code     |
| ------------------- | ----------------- | -------------------- | --------------- |
| Session Persistence | Via Memory system | Full session support | CLI sessions    |
| Plan Mode           | Quest Mode        | Built-in plan mode   | CLAUDE_CMD_PLAN |
| Multi-provider      | Yes               | Yes                  | Limited         |
| Skills/Extensions   | Plugins           | Extensions           | Native          |
| TNF Integration     | To be added       | In progress          | Bridge exists   |

## References

- Qoder Platform: https://qoder.com/
- Qoder CLI: https://qoder.com/cli
- Agentic Platform: https://qoder.com/platform
