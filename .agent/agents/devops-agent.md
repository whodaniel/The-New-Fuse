---
name: DevOpsAgent
type: agent
description:
  Agent focused on DevOps, CI/CD, deployment automation, and infrastructure for
  TNF
version: 1.0.0
author: The New Fuse
tags:
  - devops
  - ci-cd
  - infrastructure
  - worker
platform: darwin
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
