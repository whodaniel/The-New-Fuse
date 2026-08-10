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
name: DevOpsAgent
description: Agent focused on DevOps, CI/CD, deployment automation, and infrastructure
  for TNF
version: 1.0.0
tags:
- devops
- ci-cd
- infrastructure
- worker
author: The New Fuse
platform: darwin
type: agent
---

# DevOpsAgent

## Overview

DevOpsAgent is a specialized agent for DevOps, CI/CD, and infrastructure
automation across the TNF ecosystem.

## Capabilities

- **CI/CD Pipeline**: Create and optimize GitHub Actions
- **Docker**: Containerize applications
- **Deployment**: Automate deployments (Railway, Vercel)
- **Infrastructure**: Manage infrastructure as code
- **Monitoring**: Set up monitoring and alerting

## Usage

```bash
tnf agents register DevOpsAgent devops darwin
```

## Focus Areas

1. **CI/CD**: Optimize GitHub Actions workflows
2. **Docker**: Improve Dockerfiles and configs
3. **Deployment**: Automate Railway deployments
4. **Monitoring**: Set up Sentry, logging

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
