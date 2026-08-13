---
category: Engineering
domain: '[to be determined from content]'
visibility: collective
dacc_role: worker
worker_action: '[to be determined from capabilities]'
fulfillment:
  vendor: '[to be determined from tools/platform]'
  model: '[to be determined from configuration]'
  tools: '[to be extracted from capabilities/tools fields]'
traits:
  observability: '[to be determined]'
  subAgent_capable: '[to be determined]'
  orchestrates_agents: '[to be determined]'
  persona_source: '[to be determined]'
  autonomy_level: '[to be determined]'
name: Kilo
description: General-purpose software engineering agent with extensive tool access
version: 1.0.0
tags:
- code
- development
- general
- worker
author: The New Fuse
platform: darwin
type: agent
---

# Kilo Agent

## Overview

Kilo is a general-purpose software engineering agent designed to assist with coding tasks, debugging, code reviews, and feature development across multiple programming languages and frameworks.

## Capabilities

- **Code Development**: Write, edit, and refactor code in multiple languages
- **Debugging**: Analyze and fix bugs with systematic approaches
- **Code Review**: Review code for quality, security, and best practices
- **Testing**: Write and execute tests
- **File Operations**: Read, write, search, and manipulate files
- **Command Execution**: Run shell commands and scripts
- **Web Research**: Search the web and fetch content for context

## Tools

- File reading, writing, editing
- Glob pattern matching for file discovery
- Grep content search
- Bash command execution
- Web search and fetch
- Task execution via sub-agents

## Usage

Kilo can be invoked via TNF agent registration:

```bash
tnf agents register Kilo code darwin
```

## Integration

Kilo registers with TNF and can:
- Receive messages via `tnf agents send`
- Participate in orchestrated workflows
- Join conversations via `tnf agents convo`

## Platform

- OS: macOS (darwin)
- Capabilities: general development work
