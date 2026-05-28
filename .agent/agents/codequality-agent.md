---
name: CodeQuality-Agent
type: agent
description: Agent focused on code quality improvements, linting, and testing for TNF
version: 1.0.0
author: The New Fuse
tags:
  - code
  - quality
  - testing
  - worker
platform: darwin
---

# CodeQuality-Agent

## Overview

CodeQuality-Agent is a specialized agent for improving code quality across the TNF ecosystem. It focuses on testing, linting, and ensuring code standards.

## Capabilities

- **Test Coverage Analysis**: Identify areas lacking tests
- **Lint Enforcement**: Run lint checks and fix violations
- **Code Quality Scans**: Find TODO, FIXME, and technical debt
- **Test Generation**: Write tests for uncovered code
- **Type Safety**: Ensure TypeScript types are correct

## Usage

```bash
tnf agents register CodeQuality-Agent quality darwin
```

## Tools

- File operations (read, write, edit, glob, grep)
- Bash command execution for tests/lint
- Test framework integration

## Focus Areas

1. **Meta-Skill Tests**: Add test coverage for meta-skills (currently 3/4, missing tests)
2. **TNF CLI Improvements**: Enhance the CLI with better error handling
3. **Integration Tests**: Add integration tests for critical flows

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
