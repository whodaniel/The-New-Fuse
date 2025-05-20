# Workflow Builder

A powerful visual editor for creating, editing, and executing workflows that orchestrate agent-to-agent communication and tool interactions.

## Features

- Visual workflow editor with drag-and-drop interface
- Support for various node types (agents, tools, transformations, etc.)
- Real-time workflow execution
- Step-by-step debugging
- Workflow templates
- Execution analytics
- A2A protocol support with multiple versions

## Components

### Core Components

- `WorkflowCanvas`: The main canvas for creating and editing workflows
- `NodeToolbox`: A sidebar with available node types
- `NodeProperties`: A sidebar for editing node properties
- `WorkflowNode`: Base component for all node types
- `WorkflowEdge`: Component for edges between nodes

### Node Types

- `AgentNode`: Represents an agent that can perform tasks
- `A2ANode`: Represents agent-to-agent communication
- `MCPToolNode`: Represents a tool from the MCP
- `TransformNode`: Represents a data transformation
- `ConditionNode`: Represents a conditional branch
- `NotificationNode`: Represents a notification
- `InputNode`: Represents workflow input
- `OutputNode`: Represents workflow output

### Execution Components

- `WorkflowExecutionContext`: Controls for executing workflows
- `WorkflowDebugger`: Tools for debugging workflows
- `WorkflowAnalytics`: Analytics for workflow executions
- `WorkflowTemplates`: Pre-defined workflow templates

## Services

- `WorkflowExecutionService`: Service for executing workflows
- `A2AProtocolService`: Service for A2A protocol operations
- `MCPService`: Service for MCP operations
- `WorkflowDatabaseService`: Service for workflow database operations

## Usage

### Basic Usage

```tsx
import { WorkflowCanvas, NodeToolbox, NodeProperties } from '@/components/workflow';

const WorkflowEditor = () => {
  return (
    <div className="flex h-screen">
      <NodeToolbox />
      <div className="flex-1">
        <WorkflowCanvas />
      </div>
      <NodeProperties />
    </div>
  );
};
```

### Executing Workflows

```tsx
import { workflowExecutionService } from '@/services/WorkflowExecutionService';

// Execute a workflow
const executionId = await workflowExecutionService.executeWorkflow(workflow);

// Subscribe to execution updates
const subscription = workflowExecutionService.subscribe((update) => {
  console.log('Execution update:', update);
});

// Abort execution
workflowExecutionService.abortExecution(executionId);

// Clean up subscription
subscription.unsubscribe();
```

### Using Templates

```tsx
import { WorkflowTemplates } from '@/components/workflow';

const WorkflowEditor = () => {
  const handleApplyTemplate = (template) => {
    // Apply template to canvas
    console.log('Applying template:', template);
  };

  return (
    <div>
      <WorkflowTemplates onApplyTemplate={handleApplyTemplate} />
      {/* Other components */}
    </div>
  );
};
```

### Debugging Workflows

```tsx
import { WorkflowDebugger } from '@/components/workflow';
import { workflowExecutionService } from '@/services/WorkflowExecutionService';

// Set debug options
workflowExecutionService.setDebugOptions({
  enabled: true,
  stepByStep: true,
  breakpoints: ['node-1', 'node-2'],
  logLevel: 'debug'
});

// Continue execution
workflowExecutionService.continueExecution();

// Render debugger
const WorkflowEditor = () => {
  return (
    <div>
      <WorkflowDebugger workflowId="workflow-1" />
      {/* Other components */}
    </div>
  );
};
```

## Development

### Adding a New Node Type

1. Create a new component in `src/components/workflow/nodes/`
2. Extend the `BaseNode` component
3. Register the node type in `src/components/workflow/WorkflowCanvas.tsx`
4. Add the node to the `NodeToolbox` component

### Adding a New Feature

1. Identify the component or service to modify
2. Make the necessary changes
3. Update tests
4. Update documentation

## Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test --coverage
```

## Documentation

For more detailed documentation, see the [Workflow Builder Documentation](../../../docs/workflow-builder.md).
