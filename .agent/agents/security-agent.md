---
category: Engineering
department: tech
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
name: SecurityAgent
description:
  Agent focused on security auditing, penetration testing, and vulnerability
  assessment for TNF
version: 1.0.0
tags:
  - security
  - auditing
  - worker
author: The New Fuse
platform: darwin
type: agent
---

# SecurityAgent

## Overview

SecurityAgent is a specialized agent for security auditing and vulnerability
assessment across the TNF ecosystem.

## Capabilities

- **Penetration Testing**: Test for common vulnerabilities
- **Security Audits**: Review code for security issues
- **Dependency Scanning**: Check for vulnerable dependencies
- **Authentication Testing**: Verify auth mechanisms are secure
- **API Security**: Test API endpoints for vulnerabilities

## Usage

```bash
tnf agents register SecurityAgent security darwin
```

## Focus Areas

1. **Dependency Audit**: Run security audits on dependencies
2. **Authentication**: Test authentication flows
3. **API Security**: Scan for API vulnerabilities
4. **Secret Detection**: Find exposed secrets in code

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
