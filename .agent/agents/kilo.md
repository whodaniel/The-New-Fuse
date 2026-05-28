---
name: Kilo
type: agent
description: General-purpose software engineering agent with extensive tool access
version: 1.0.0
author: The New Fuse
tags:
  - code
  - development
  - general
  - worker
platform: darwin
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
