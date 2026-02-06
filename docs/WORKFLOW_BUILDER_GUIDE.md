# The New Fuse Workflow Builder - Complete Guide

## Overview

The Enhanced Workflow Builder is a production-ready drag-and-drop visual
workflow editor for The New Fuse framework. It enables you to create complex
multi-agent workflows with conditional logic, parallel execution, and
human-in-the-loop approvals.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Node Types](#node-types)
3. [Building Workflows](#building-workflows)
4. [Agent Integration](#agent-integration)
5. [Execution & Monitoring](#execution--monitoring)
6. [Workflow Templates](#workflow-templates)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Workflow Builder

Navigate to `/workflows/builder` in The New Fuse application.

### Interface Overview

The workflow builder consists of:

- **Canvas**: Central area where you design workflows
- **Node Library**: Right drawer containing all available node types
- **Control Panel**: Top toolbar with execution and save controls
- **Settings Panel**: Configure individual nodes
- **Execution Logs**: Real-time monitoring of workflow execution

---

## Node Types

### 1. Agent Task Nodes

Agent Task Nodes execute tasks using AI agents from the agent registry.

**Features:**

- Select specific agents or agent types
- Set task priority (low, medium, high)
- Define estimated execution time
- Track real-time progress
- View agent execution status

**Configuration:**

```typescript
{
  label: "Code Review Agent",
  agentType: "code-reviewer",
  agentId: "agent-123", // optional, specific agent
  task: "Review pull request #456",
  instructions: "Focus on security and performance",
  estimatedTime: 5, // minutes
  priority: "high",
  context: {
    pullRequestId: "456",
    repository: "the-new-fuse"
  }
}
```

**Use Cases:**

- Code analysis and review
- Research and information gathering
- Content generation
- Testing and validation
- Deployment automation

### 2. Conditional Logic Nodes

Branch workflow execution based on conditions.

**Features:**

- JavaScript expression evaluation
- True/False output handles
- Access to workflow variables
- Safe execution context

**Configuration:**

```typescript
{
  label: "Check Test Results",
  condition: "testsPassed === true && coverage >= 80",
  description: "Verify tests passed with minimum coverage"
}
```

**Available Variables:**

- Workflow input variables
- Previous node outputs
- Built-in functions: Math, Date, String, Number, Boolean, Array, Object

**Examples:**

```javascript
// Simple comparison
status === 'success';

// Numeric threshold
errorCount < 5 && coverage >= 90;

// Array operations
results.length > 0 && results.every((r) => r.passed);

// String matching
message.includes('approved') || priority === 'high';
```

### 3. Parallel Execution Nodes

Execute multiple tasks simultaneously.

**Features:**

- Up to 10 parallel branches
- Wait for all or first completion
- Aggregate results
- Independent error handling

**Configuration:**

```typescript
{
  label: "Parallel Research",
  parallelTasks: 3,
  waitForAll: true, // or false for first completion
  aggregation: "merge" // merge, concat, custom
}
```

**Use Cases:**

- Multi-agent research
- Parallel data processing
- Independent service calls
- A/B testing workflows
- Distributed computation

### 4. Human Approval Nodes

Pause workflow for human review and approval.

**Features:**

- Multiple approvers support
- Timeout configuration
- Email/Slack notifications
- Approval comments
- Rejection handling

**Configuration:**

```typescript
{
  label: "Senior Developer Approval",
  approvers: 2, // minimum number of approvals
  timeout: 24 * 60, // 24 hours in minutes
  reviewType: "code",
  notificationChannels: ["email", "slack"],
  allowComments: true
}
```

**Approval Flow:**

1. Workflow pauses at approval node
2. Notifications sent to approvers
3. Approvers review in UI
4. Approval/rejection with optional comments
5. Workflow continues or stops based on decision

### 5. Multi-Agent Coordination Nodes

Coordinate multiple agents working together on a task.

**Features:**

- Sequential or parallel coordination
- Agent handoff management
- Context preservation
- Load balancing

**Configuration:**

```typescript
{
  label: "Team Code Review",
  agents: ["agent-1", "agent-2", "agent-3"],
  coordinationStrategy: "sequential", // or "parallel", "round-robin"
  shareContext: true,
  fallbackAgent: "agent-fallback"
}
```

---

## Building Workflows

### Creating a New Workflow

1. Click "Add Node" button
2. Select node type from library
3. Configure node settings
4. Connect nodes by dragging from output to input
5. Save workflow

### Connecting Nodes

- **Standard Connection**: Drag from source (bottom) to target (top)
- **Conditional Connection**: Drag from specific output handle (True/False)
- **Parallel Connection**: Multiple outputs to different targets

### Workflow Variables

Define workflow-level variables:

```typescript
{
  name: "pullRequestId",
  type: "string",
  required: true,
  defaultValue: "",
  description: "GitHub pull request number"
}
```

### Best Practices

1. **Name your nodes descriptively**: Use clear, action-oriented names
2. **Add descriptions**: Document what each node does
3. **Set realistic timeouts**: Account for agent processing time
4. **Use conditional logic**: Handle success and failure paths
5. **Add human approvals**: For critical decisions
6. **Test incrementally**: Build and test in stages
7. **Save frequently**: Use version control

---

## Agent Integration

### Connecting to Agent Registry

The workflow builder automatically loads available agents from the Master Agent
Registry.

**Agent Selection:**

```typescript
// Method 1: By Agent ID (specific agent)
{
  agentId: 'agent-abc-123';
}

// Method 2: By Agent Type (any available)
{
  agentType: 'code-reviewer';
}

// Method 3: By Capabilities (matching capabilities)
{
  requiredCapabilities: ['codeGeneration', 'gitOperations'];
}
```

### Agent Status Monitoring

Real-time agent status displayed in nodes:

- **Idle**: Ready to accept tasks
- **Running**: Currently executing
- **Completed**: Task finished successfully
- **Error**: Execution failed
- **Waiting**: Awaiting approval or input

### Agent Configuration

Configure agent behavior per node:

```typescript
{
  agentConfig: {
    temperature: 0.7, // for LLM agents
    maxRetries: 3,
    timeout: 300000, // 5 minutes
    priority: "high",
    resourceLimits: {
      memory: "2GB",
      cpu: "2 cores"
    }
  }
}
```

---

## Execution & Monitoring

### Starting Execution

1. Click "Execute" button
2. Provide input variables if required
3. Monitor real-time progress
4. View logs in execution drawer

### Real-Time Monitoring

**WebSocket Connection:**

```typescript
// Frontend automatically subscribes
ws://localhost:3000/workflow-execution

// Events received:
- node_started
- node_completed
- node_failed
- workflow_completed
- workflow_failed
- log messages
```

**Execution Controls:**

- **Pause**: Temporarily halt execution
- **Resume**: Continue paused execution
- **Cancel**: Stop and rollback
- **Retry**: Re-run failed nodes

### Execution Logs

View detailed execution logs:

```typescript
{
  timestamp: "2025-11-18T10:30:00Z",
  level: "info" | "warn" | "error",
  message: "Node completed successfully",
  nodeId: "node-123",
  agentId: "agent-456",
  metadata: {
    duration: 2500, // ms
    output: { ... }
  }
}
```

### Error Handling

**Automatic Retry:**

```typescript
{
  retryPolicy: {
    enabled: true,
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  }
}
```

**Error Recovery:**

```typescript
{
  errorHandling: {
    onError: "continue" | "stop" | "retry" | "skip",
    captureErrors: true,
    notifyOnError: true,
    fallbackWorkflowId: "workflow-fallback"
  }
}
```

---

## Workflow Templates

### Available Templates

1. **Code Review Workflow**
   - Agent reads code → Agent reviews → Human approves → Merge
   - Time: ~15 minutes
   - Difficulty: Beginner

2. **Multi-Agent Research**
   - 3 parallel researchers → Combine → Synthesize report
   - Time: ~30 minutes
   - Difficulty: Intermediate

3. **Self-Improvement Loop**
   - Analyze → Suggest → Approve → Implement → Test → Deploy
   - Time: ~45 minutes
   - Difficulty: Advanced

4. **Customer Support**
   - Receive → Triage → Auto-resolve or Human escalation
   - Time: ~20 minutes
   - Difficulty: Intermediate

5. **Data Pipeline**
   - Extract → Parallel transformations → Validate → Load
   - Time: ~40 minutes
   - Difficulty: Advanced

### Using Templates

```typescript
import { getTemplateById } from '@/data/workflowTemplates';

// Load template
const template = getTemplateById('code-review-workflow');

// Apply to canvas
setNodes(template.nodes);
setEdges(template.edges);

// Customize
nodes.forEach((node) => {
  // Assign specific agents
  if (node.type === 'agentTask') {
    node.data.agentId = 'your-agent-id';
  }
});
```

### Creating Custom Templates

```typescript
const myTemplate: WorkflowTemplate = {
  id: 'custom-workflow',
  name: 'My Custom Workflow',
  description: 'Description of workflow',
  category: 'Development',
  difficulty: 'intermediate',
  estimatedTime: 20,
  tags: ['custom', 'automation'],
  nodes: [
    /* your nodes */
  ],
  edges: [
    /* your edges */
  ],
};
```

---

## API Reference

### Workflow API

#### Create Workflow

```http
POST /api/workflows
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Workflow description",
  "nodes": [...],
  "edges": [...],
  "variables": [...],
  "settings": {...}
}
```

#### Execute Workflow

```http
POST /api/workflows/:id/execute
Content-Type: application/json

{
  "input": {
    "variable1": "value1",
    "variable2": "value2"
  }
}
```

#### Get Execution Status

```http
GET /api/workflows/executions/:executionId
```

#### Control Execution

```http
POST /api/workflows/executions/:executionId/pause
POST /api/workflows/executions/:executionId/resume
POST /api/workflows/executions/:executionId/cancel
```

### WebSocket Events

#### Subscribe to Execution

```typescript
socket.emit('subscribe_execution', {
  executionId: 'exec-123',
});
```

#### Receive Updates

```typescript
socket.on('execution_update', (update) => {
  console.log(update.type, update.data);
});
```

---

## Best Practices

### Workflow Design

1. **Keep it Simple**: Start with basic workflows, add complexity gradually
2. **Clear Naming**: Use descriptive names for nodes and connections
3. **Documentation**: Add descriptions to all nodes
4. **Error Handling**: Always handle failure cases
5. **Testing**: Test each path through the workflow

### Performance Optimization

1. **Parallel Execution**: Use parallel nodes for independent tasks
2. **Timeouts**: Set appropriate timeouts to prevent hanging
3. **Resource Limits**: Configure agent resource limits
4. **Caching**: Cache expensive operations
5. **Monitoring**: Monitor execution metrics

### Security

1. **Input Validation**: Validate all workflow inputs
2. **Agent Permissions**: Ensure agents have appropriate permissions
3. **Approval Gates**: Add human approval for sensitive operations
4. **Audit Logging**: Enable comprehensive logging
5. **Secrets Management**: Never hardcode secrets

### Maintenance

1. **Version Control**: Save workflow versions
2. **Change Log**: Document changes
3. **Regular Reviews**: Review and optimize workflows
4. **Deprecation**: Mark outdated workflows
5. **Backup**: Regular workflow backups

---

## Examples

### Example 1: Simple Code Review

```typescript
const codeReviewWorkflow = {
  name: 'Simple Code Review',
  nodes: [
    {
      id: 'read',
      type: 'agentTask',
      data: {
        label: 'Read Code',
        agentType: 'code-reader',
      },
    },
    {
      id: 'review',
      type: 'agentTask',
      data: {
        label: 'Review Code',
        agentType: 'code-reviewer',
      },
    },
    {
      id: 'approve',
      type: 'humanApproval',
      data: {
        label: 'Approval',
        approvers: 1,
      },
    },
  ],
  edges: [
    { source: 'read', target: 'review' },
    { source: 'review', target: 'approve' },
  ],
};
```

### Example 2: Parallel Research with Aggregation

```typescript
const researchWorkflow = {
  name: 'Parallel Research',
  nodes: [
    {
      id: 'split',
      type: 'parallel',
      data: { parallelTasks: 3 },
    },
    {
      id: 'research1',
      type: 'agentTask',
      data: { label: 'Technical Research' },
    },
    {
      id: 'research2',
      type: 'agentTask',
      data: { label: 'Business Research' },
    },
    {
      id: 'research3',
      type: 'agentTask',
      data: { label: 'Market Research' },
    },
    {
      id: 'combine',
      type: 'agentTask',
      data: { label: 'Combine Results' },
    },
  ],
  edges: [
    { source: 'split', sourceHandle: 'output-1', target: 'research1' },
    { source: 'split', sourceHandle: 'output-2', target: 'research2' },
    { source: 'split', sourceHandle: 'output-3', target: 'research3' },
    { source: 'research1', target: 'combine' },
    { source: 'research2', target: 'combine' },
    { source: 'research3', target: 'combine' },
  ],
};
```

### Example 3: Conditional with Error Handling

```typescript
const conditionalWorkflow = {
  name: 'Test and Deploy',
  nodes: [
    {
      id: 'test',
      type: 'agentTask',
      data: { label: 'Run Tests' },
    },
    {
      id: 'condition',
      type: 'conditional',
      data: {
        label: 'Tests Passed?',
        condition: 'testsPassed === true',
      },
    },
    {
      id: 'deploy',
      type: 'agentTask',
      data: { label: 'Deploy to Production' },
    },
    {
      id: 'notify',
      type: 'agentTask',
      data: { label: 'Notify Team of Failure' },
    },
  ],
  edges: [
    { source: 'test', target: 'condition' },
    { source: 'condition', sourceHandle: 'true', target: 'deploy' },
    { source: 'condition', sourceHandle: 'false', target: 'notify' },
  ],
};
```

---

## Troubleshooting

### Common Issues

**Issue**: Workflow won't execute

- Check that all required inputs are provided
- Verify all nodes are properly connected
- Ensure agents are available and active

**Issue**: Node execution timeout

- Increase timeout in node configuration
- Check agent availability
- Verify task complexity is appropriate

**Issue**: WebSocket connection lost

- Check network connectivity
- Verify WebSocket endpoint is accessible
- Review server logs

**Issue**: Agent not found

- Refresh agent registry
- Verify agent is registered
- Check agent status

---

## Support

For questions and support:

- Documentation: `/docs`
- GitHub Issues:
  [github.com/your-repo/issues](https://github.com/your-repo/issues)
- Community: Join our Discord
- Email: support@thenewfuse.com

---

## Changelog

### Version 1.0.0 (2025-11-18)

- Initial release
- Enhanced node types (agent, conditional, parallel, human approval)
- Agent registry integration
- Real-time WebSocket monitoring
- 5 pre-built workflow templates
- Comprehensive testing suite
- Full documentation

---

## License

Copyright © 2025 The New Fuse Project. All rights reserved.
