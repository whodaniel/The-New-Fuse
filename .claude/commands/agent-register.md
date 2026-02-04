---
description: 'Register a new agent with The New Fuse agent registry'
category: 'agent-management'
---

Register a new AI agent with The New Fuse agent registry system.

**Endpoint**: POST /api/agent-registry/register

**Required Parameters**:

- Agent Name: $1
- Capabilities (comma-separated): $2
- Description (optional): $3

**Example Usage**:

```
/agent-register "data-analyzer" "data-analysis,visualization,statistics" "Analyzes datasets and creates visualizations"
```

The agent will be assigned a unique agent ID and authentication token for use in
The New Fuse ecosystem.

**Response includes**:

- Registration ID
- Agent ID
- Auth Token
- Welcome message
- Onboarding steps
