---
description: "Create a new multi-agent workflow"
category: "workflow"
---

Create a new workflow in The New Fuse workflow builder.

**MCP Integration**: Uses MCP tool `workflow/create`

**Parameters**:
- Workflow Name: $1
- Workflow Type: $2 (options: code-review, research, deployment, self-improvement)
- Agent IDs (comma-separated): $3

**Example Usage**:
```
/workflow-create "Code Review Pipeline" "code-review" "analyzer-01,reviewer-02,implementer-03"
```

Creates a new workflow with:
- Drag-and-drop visual builder
- Real-time execution monitoring
- Agent coordination and task distribution
- WebSocket progress updates

**Available Node Types**:
- Agent Task
- Conditional Logic
- Parallel Execution
- Human Approval
- Multi-Agent Coordination
