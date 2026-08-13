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
name: CodeQuality-Agent
description: Agent focused on code quality improvements, linting, and testing for
  TNF
version: 1.0.0
tags:
- code
- quality
- testing
- worker
author: The New Fuse
platform: darwin
type: agent
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
