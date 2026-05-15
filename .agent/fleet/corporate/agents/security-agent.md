---
name: SecurityAgent
type: agent
description:
  Agent focused on security auditing, penetration testing, and vulnerability
  assessment for TNF
version: 1.0.0
author: The New Fuse
tags:
  - security
  - auditing
  - worker
platform: darwin
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
