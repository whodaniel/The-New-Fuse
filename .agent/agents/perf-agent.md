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
name: PerfAgent
description: Agent focused on performance optimization, profiling, and efficiency
  improvements for TNF
version: 1.0.0
tags:
- performance
- optimization
- worker
author: The New Fuse
platform: darwin
type: agent
---

# PerfAgent

## Overview

PerfAgent is a specialized agent for performance optimization and efficiency
improvements across the TNF ecosystem.

## Capabilities

- **Performance Profiling**: Analyze code for performance bottlenecks
- **Optimization**: Optimize slow functions and algorithms
- **Caching Strategies**: Implement effective caching
- **Database Query Optimization**: Optimize DB queries
- **Bundle Analysis**: Analyze and reduce bundle sizes

## Usage

```bash
tnf agents register PerfAgent performance darwin
```

## Focus Areas

1. **Bundle Size**: Analyze and reduce frontend bundle
2. **API Performance**: Optimize slow API endpoints
3. **Database Queries**: Optimize N+1 queries and slow operations
4. **Caching**: Implement Redis caching strategies

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
