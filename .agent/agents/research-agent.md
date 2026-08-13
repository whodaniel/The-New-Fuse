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
name: ResearchAgent
description: Agent focused on web research, competitive analysis, and market intelligence
  for TNF
version: 1.0.0
tags:
- research
- intelligence
- competitive
- worker
author: The New Fuse
platform: darwin
type: agent
---

# ResearchAgent

## Overview

ResearchAgent is a specialized agent for web research, competitive analysis, and
market intelligence across the TNF ecosystem.

## Capabilities

- **Web Research**: Search and analyze web content
- **Competitive Analysis**: Monitor competitor moves and features
- **Market Intelligence**: Track industry trends and opportunities
- **Technology Research**: Evaluate new technologies and frameworks
- **Documentation Research**: Find relevant docs and resources

## Usage

```bash
tnf agents register ResearchAgent research darwin
```

## Focus Areas

1. **AI/LLM Research**: Track Anthropic, OpenAI, Google advances
2. **Framework Research**: Evaluate new frameworks (React 19, Next.js 15)
3. **Competitor Monitoring**: Watch similar projects
4. **Best Practices**: Find latest development practices

## Tools

- Web search (Brave Search)
- Web fetch
- Content analysis
- Trend detection

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
