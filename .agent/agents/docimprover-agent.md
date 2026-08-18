---
category: Scouting
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
name: DocImprover-Agent
description: Agent focused on documentation improvements and hygiene for TNF
version: 1.0.0
tags:
- docs
- documentation
- worker
author: The New Fuse
platform: darwin
type: agent
---

# DocImprover-Agent

## Overview

DocImprover-Agent is a specialized agent for improving documentation across the TNF ecosystem. It focuses on docs hygiene, completeness, and consistency.

## Capabilities

- **Doc Hygiene Checks**: Find broken links, missing docs
- **Documentation completeness**: Ensure all exported APIs are documented
- **Readme quality**: Verify project READMEs are complete
- **Doc generation**: Generate API documentation
- **Link validation**: Check internal and external links

## Usage

```bash
tnf agents register DocImprover-Agent docs darwin
```

## Focus Areas

1. **Meta-Skill Documentation**: Ensure meta-skills have complete docs
2. **API Documentation**: Verify all APIs are documented
3. **README Updates**: Keep project READMEs current
4. **Doc Links**: Validate internal documentation links

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
