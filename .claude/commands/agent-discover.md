---
description:
  'Discover available agents by capability, semantic search, or filters'
category: 'agent-discovery'
---

Search for agents in The New Fuse ecosystem using semantic matching and
capability filters.

**Endpoint**: POST /api/agent-discovery/search

**Parameters**:

- Search Query or Capability: $ARGUMENTS

**Example Usage**:

```
/agent-discover "code review and security scanning"
/agent-discover capability:data-analysis
/agent-discover type:coordinator status:online
```

**Search Features**:

- Semantic capability matching with relevance scoring
- Fuzzy search with typo tolerance
- Multi-indexed search (name, capabilities, tags, description)
- Real-time agent status (online/offline)
- Load balancing recommendations
- Cost estimation

**Response includes**:

- Agent ID and name
- Capabilities and skills
- Current status and availability
- Performance metrics
- Estimated cost
- Relevance score (0-100)
