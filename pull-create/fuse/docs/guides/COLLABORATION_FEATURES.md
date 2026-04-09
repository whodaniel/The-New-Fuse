# The New Fuse - Collaboration Features

This document provides comprehensive documentation for the collaboration features in The New Fuse VSCode extension.

## Table of Contents

1. [Shared Context System](#shared-context-system)
2. [Agent Negotiation Protocol](#agent-negotiation-protocol)
3. [Task Coordination Framework](#task-coordination-framework)
4. [Security Features](#security-features)
5. [Examples](#examples)

## Shared Context System

The Shared Context System provides a way for agents to share information and maintain state across different sessions and instances.

### Key Features

- **Persistent Storage**: Context data is stored persistently using Redis or VS Code's extension storage
- **TTL Support**: Context entries can have a time-to-live (TTL) for automatic expiration
- **Metadata**: Context entries can include metadata for better organization and filtering
- **Query Capabilities**: Context can be queried by prefix, tags, agent ID, and other criteria
- **Real-time Updates**: Changes to context can be subscribed to for real-time updates

### Usage Examples

```typescript
// Initialize shared context
const sharedContext = new SharedContext(context, redisStorage, 'shared');

// Store a value
await sharedContext.set('user.preferences', {
    theme: 'dark',
    fontSize: 14
}, {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    metadata: {
        agentId: 'user-agent',
        tags: ['preferences', 'ui']
    }
});

// Retrieve a value
const preferences = await sharedContext.get('user.preferences');

// Query context
const results = await sharedContext.query({
    prefix: 'user.',
    tags: ['preferences'],
    minPriority: 1
});

// Subscribe to changes
const subscription = sharedContext.subscribe('user.*', (entry, changeType) => {
    console.log(`Context changed: ${entry.key} (${changeType})`);
    console.log('New value:', entry.value);
});

// Unsubscribe when done
subscription.dispose();
```

## Agent Negotiation Protocol

The Agent Negotiation Protocol enables agents to negotiate tasks and capabilities, allowing for dynamic task delegation based on agent capabilities.

### Key Features

- **Capability Queries**: Agents can query other agents for specific capabilities
- **Task Delegation**: Tasks can be delegated to the most capable agent
- **Collaboration Requests**: Agents can request collaboration on complex tasks
- **Scoring System**: Responses are scored based on capability match and other factors
- **Automatic Selection**: The best agent is automatically selected based on responses

### Negotiation Process

1. **Request Creation**: An agent creates a negotiation request specifying required capabilities or a task
2. **Request Broadcasting**: The request is broadcast to all available agents
3. **Response Collection**: Agents respond with their capabilities and scores
4. **Agent Selection**: The best agent is selected based on responses
5. **Task Assignment**: The task is assigned to the selected agent
6. **Result Reporting**: The agent reports the result back to the requester

### Usage Examples

```typescript
// Initialize negotiation manager
const negotiationManager = new AgentNegotiationManager(
    context,
    sharedContext,
    communicationManager
);

// Create a capability query
const negotiation = await negotiationManager.createRequest(
    'capability-query',
    {
        capabilities: ['code-generation', 'code-explanation'],
        priority: 2,
        ttl: 60000 // 1 minute
    }
);

// Create a task delegation request
const taskNegotiation = await negotiationManager.createRequest(
    'task-delegation',
    {
        task: {
            type: 'code-generation',
            description: 'Generate a function to calculate factorial',
            context: {
                language: 'typescript',
                requirements: 'Must handle negative numbers and use recursion'
            }
        },
        priority: 1,
        ttl: 120000 // 2 minutes
    }
);

// Wait for negotiation to complete
const result = await negotiationManager.getNegotiationResult(taskNegotiation.request.id);

if (result && result.status === 'completed' && result.selectedAgent) {
    console.log(`Task assigned to ${result.selectedAgent.name}`);
} else {
    console.log('No agent available for the task');
}

// Cancel a negotiation if needed
await negotiationManager.cancelNegotiation(negotiation.request.id);
```

## Task Coordination Framework

The Task Coordination Framework provides a system for managing tasks between agents, tracking progress, and handling dependencies.

### Key Features

- **Task Creation**: Tasks can be created with various properties and priorities
- **Automatic Assignment**: Tasks are automatically assigned to the most capable agent
- **Progress Tracking**: Task progress can be tracked and updated
- **Dependency Management**: Tasks can depend on other tasks
- **Status Updates**: Task status changes can be subscribed to
- **Filtering and Querying**: Tasks can be filtered by various criteria

### Task Lifecycle

1. **Creation**: A task is created with a type, name, description, and other properties
2. **Assignment**: The task is assigned to an agent through negotiation
3. **Execution**: The agent executes the task and provides updates
4. **Completion**: The agent completes the task and provides the result
5. **Dependency Resolution**: Dependent tasks are triggered when their dependencies are completed

### Usage Examples

```typescript
// Initialize task manager
const taskManager = new TaskCoordinationManager(
    context,
    sharedContext,
    negotiationManager,
    communicationManager
);

// Create a task
const task = await taskManager.createTask({
    type: 'code-generation',
    name: 'Generate Factorial Function',
    description: 'Create a function to calculate factorial of a number',
    priority: 'medium',
    context: {
        language: 'typescript',
        requirements: 'Must handle negative numbers and use recursion'
    }
});

// Subscribe to task status changes
taskManager.onTaskStatusChange(({ task, previousStatus }) => {
    console.log(`Task ${task.id} status changed from ${previousStatus} to ${task.status}`);
    
    if (task.status === 'completed') {
        console.log('Task result:', task.result);
    }
});

// Get a task by ID
const retrievedTask = taskManager.getTask(task.id);

// Get task updates
const updates = taskManager.getTaskUpdates(task.id);

// Filter tasks
const highPriorityTasks = taskManager.getTasks({
    priority: 'high',
    status: ['pending', 'assigned', 'in-progress']
});

// Cancel a task if needed
await taskManager.cancelTask(task.id);
```

## Security Features

The New Fuse includes several security features to ensure secure agent communication and interaction.

### Agent Verification

The Agent Verification system ensures that only verified agents can interact with the system.

```typescript
// Initialize verification manager
const verificationManager = new AgentVerificationManager(context);

// Generate a verification token for an agent
const token = verificationManager.generateVerificationToken('agent-id');

// Verify an agent
const result = verificationManager.verifyAgent('agent-id', token);

// Check if an agent is verified
const status = verificationManager.isAgentVerified('agent-id');

// Revoke verification
verificationManager.revokeVerification('agent-id');
```

### Message Security

The Message Security system provides message signing, validation, and encryption.

```typescript
// Initialize message security
const messageSecurity = new MessageSecurityManager(verificationManager, {
    signMessages: true,
    verifySignatures: true,
    encryptPayloads: true,
    requireVerification: true
});

// Secure an outgoing message
const securedMessage = messageSecurity.secureOutgoingMessage(message);

// Process an incoming message
const { message: processedMessage, isValid, isVerified } = 
    messageSecurity.processIncomingMessage(receivedMessage);

// Update security options
messageSecurity.updateOptions({
    encryptPayloads: false
});
```

### Permission System

The Permission System controls agent access to resources.

```typescript
// Initialize permission system
const permissionSystem = new PermissionSystem(context);

// Add a permission rule
const rule = permissionSystem.addRule({
    agentId: 'agent-id',
    resourceType: 'file',
    resourceId: '/path/to/file',
    level: 'read'
});

// Check permission
const { granted, message } = permissionSystem.checkPermission(
    'agent-id',
    'file',
    '/path/to/file',
    'write'
);

// Grant temporary permission
permissionSystem.grantTemporaryPermission(
    'agent-id',
    'file',
    '/path/to/file',
    'write',
    60 * 60 * 1000 // 1 hour
);

// Set default permission
permissionSystem.setDefaultPermission('file', 'read');
```

## Examples

### Example 1: Code Generation with Context

This example demonstrates how to use the GitHub Copilot adapter with context awareness:

```typescript
// Get the GitHub Copilot adapter
const adapter = new GitHubCopilotAdapter();
await adapter.initialize();

// Generate code with context
const code = await adapter.sendMessage('generateWithContext', {
    prompt: 'Add a method to calculate average',
    language: 'typescript',
    filePath: '/path/to/file.ts',
    includeImports: true,
    maxContextFiles: 5
});

console.log('Generated code:', code);
```

### Example 2: Task Delegation

This example demonstrates how to delegate a task to the most capable agent:

```typescript
// Create a task
const task = await taskManager.createTask({
    type: 'code-explanation',
    name: 'Explain Sorting Algorithm',
    description: 'Explain how quicksort works',
    priority: 'high',
    context: {
        code: `
            function quicksort(arr) {
                if (arr.length <= 1) return arr;
                const pivot = arr[0];
                const left = arr.slice(1).filter(x => x < pivot);
                const right = arr.slice(1).filter(x => x >= pivot);
                return [...quicksort(left), pivot, ...quicksort(right)];
            }
        `,
        language: 'javascript',
        detail: 'high'
    }
});

// The task will be automatically assigned to the most capable agent
// and the result will be available when the task is completed

// Wait for the task to complete
const waitForCompletion = () => {
    return new Promise((resolve) => {
        const subscription = taskManager.onTaskStatusChange(({ task: updatedTask }) => {
            if (updatedTask.id === task.id && updatedTask.status === 'completed') {
                subscription.dispose();
                resolve(updatedTask.result);
            }
        });
    });
};

const explanation = await waitForCompletion();
console.log('Explanation:', explanation);
```

### Example 3: Agent Collaboration

This example demonstrates how multiple agents can collaborate on a complex task:

```typescript
// Create a workflow with multiple steps
const workflow = {
    id: 'complex-task',
    name: 'Complex Task',
    steps: [
        {
            id: 'step1',
            name: 'Generate Code',
            type: 'code-generation',
            agentId: null, // Will be assigned through negotiation
            dependencies: []
        },
        {
            id: 'step2',
            name: 'Explain Code',
            type: 'code-explanation',
            agentId: null,
            dependencies: ['step1']
        },
        {
            id: 'step3',
            name: 'Optimize Code',
            type: 'code-enhancement',
            agentId: null,
            dependencies: ['step1']
        },
        {
            id: 'step4',
            name: 'Final Review',
            type: 'code-review',
            agentId: null,
            dependencies: ['step2', 'step3']
        }
    ]
};

// Execute the workflow
const executeWorkflow = async (workflow) => {
    const results = {};
    
    // Create tasks for each step
    for (const step of workflow.steps) {
        const task = await taskManager.createTask({
            type: step.type,
            name: step.name,
            description: `Execute ${step.name} for workflow ${workflow.name}`,
            priority: 'medium',
            dependencies: step.dependencies.map(depId => {
                const depStep = workflow.steps.find(s => s.id === depId);
                return results[depId]?.taskId;
            }).filter(Boolean)
        });
        
        results[step.id] = {
            taskId: task.id,
            status: task.status
        };
    }
    
    // Wait for all tasks to complete
    const allCompleted = () => {
        return Object.values(results).every(result => 
            taskManager.getTask(result.taskId)?.status === 'completed'
        );
    };
    
    while (!allCompleted()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Collect results
    for (const [stepId, result] of Object.entries(results)) {
        results[stepId].result = taskManager.getTask(result.taskId)?.result;
    }
    
    return results;
};

const workflowResults = await executeWorkflow(workflow);
console.log('Workflow results:', workflowResults);
```

These examples demonstrate how to use the collaboration features in The New Fuse to enable sophisticated agent interactions and workflows.
