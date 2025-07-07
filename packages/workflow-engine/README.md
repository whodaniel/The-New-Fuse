# Unified Workflow Engine

The Unified Workflow Engine consolidates all workflow execution capabilities from scattered implementations across The New Fuse Framework into a single, cohesive system. It provides comprehensive workflow creation, validation, execution, and management capabilities with deep integration into the Master Agent Registry and relay systems.

## Features

### Core Components

- **🚀 Workflow Engine**: Core execution engine with agent integration and relay system support
- **🔧 Workflow Builder**: Visual workflow creation with validation and templates
- **⚡ Workflow Executor**: Runtime execution engine for all node types including agent tasks
- **💾 Workflow Repository**: Persistence layer with caching and database integration
- **✅ Workflow Validator**: Comprehensive validation with custom rules and performance analysis

### Key Capabilities

- **Agent Integration**: Native support for agent tasks, handoffs, and coordination
- **Master Agent Registry**: Deep integration with the single source of truth for all agents
- **Heartbeat Monitoring**: Anti-stagnation mechanisms and activity tracking
- **State Preservation**: Redis integration for context preservation across executions
- **Visual Builder**: Drag-and-drop workflow creation with real-time validation
- **Performance Optimization**: Execution metrics, bottleneck detection, and optimization suggestions

## Installation

```bash
npm install @the-new-fuse/workflow-engine
```

## Quick Start

### Basic Usage

```typescript
import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@the-new-fuse/relay-core';

// Create workflow engine with default configuration
const prisma = new PrismaClient();
const logger = new Logger();
const agentRegistry = new MasterAgentRegistry(/* config */);
const heartbeatService = new HeartbeatMonitoringService(/* config */);

const { engine, builder, validator, repository } = WorkflowEngineFactory.createDefault(
  prisma,
  agentRegistry,
  heartbeatService,
  logger
);

// Create a workflow
const workflow = builder.createWorkflow('My First Workflow', 'A simple test workflow');

// Add nodes
const startNode = builder.addNode('start', 'Start', { x: 100, y: 100 });
const agentTaskNode = builder.addNode('agent_task', 'Process Data', { x: 300, y: 100 }, {
  task: 'Analyze the input data and generate a summary',
  priority: 'medium',
  expectedDuration: 5
});
const endNode = builder.addNode('end', 'End', { x: 500, y: 100 });

// Connect nodes
builder.addConnection(startNode.id, 'output', agentTaskNode.id, 'task');
builder.addConnection(agentTaskNode.id, 'result', endNode.id, 'input');

// Validate workflow
const validation = await validator.validateWorkflow(workflow);
if (validation.valid) {
  // Save and execute
  const savedWorkflow = await repository.createWorkflow(workflow);
  const executionId = await engine.executeWorkflow(savedWorkflow.id, { data: 'test input' });
  
  console.log(`Workflow execution started: ${executionId}`);
}
```

### Advanced Configuration

```typescript
import { WorkflowEngineFactory, type WorkflowEngineFactoryConfig } from '@the-new-fuse/workflow-engine';

const config: WorkflowEngineFactoryConfig = {
  prisma,
  agentRegistry,
  heartbeatService,
  logger,
  engine: {
    maxConcurrentExecutions: 20,
    defaultTimeoutMs: 600000, // 10 minutes
    enableHeartbeatMonitoring: true,
    enableAgentCoordination: true,
    enableStatePreservation: true,
    relayIntegration: true,
    debug: true
  },
  repository: {
    enableCaching: true,
    cacheTimeoutMs: 600000, // 10 minutes
    maxCacheSize: 2000,
    enableMetrics: true
  },
  validator: {
    strictMode: true,
    maxNodes: 200,
    maxConnections: 400,
    maxVariables: 100,
    allowCircularReferences: false,
    requireStartNode: true,
    requireEndNode: true,
    enablePerformanceValidation: true
  },
  builder: {
    enableAutoValidation: true,
    enableAutoSave: true,
    autoSaveIntervalMs: 15000, // 15 seconds
    maxNodes: 200,
    maxConnections: 400,
    enableVersioning: true,
    debug: true
  },
  executor: {
    maxParallelNodes: 10,
    nodeTimeoutMs: 120000, // 2 minutes
    retryDelayMs: 10000, // 10 seconds
    maxRetries: 5,
    enableDebugLogging: true
  }
};

const workflowSystem = WorkflowEngineFactory.create(config);
```

## Workflow Node Types

### Agent Nodes
- **`agent_task`**: Execute tasks using available agents
- **`agent_handoff`**: Transfer context between agents
- **`agent_coordination`**: Coordinate multiple agents

### Logic Nodes
- **`condition`**: Conditional branching with JavaScript expressions
- **`loop`**: Iterate over arrays or until conditions are met
- **`parallel`**: Execute multiple branches in parallel
- **`merge`**: Combine results from multiple paths

### Integration Nodes
- **`api_call`**: Make HTTP API calls
- **`database_query`**: Execute database operations
- **`file_operation`**: File system operations

### Communication Nodes
- **`relay_message`**: Send messages through the relay system
- **`webhook`**: Trigger webhooks
- **`email`**: Send email notifications

### AI/LLM Nodes
- **`llm_prompt`**: Execute LLM prompts with various providers
- **`code_generation`**: Generate code using AI
- **`analysis`**: Perform data analysis

## Agent Integration

The workflow engine integrates deeply with the Master Agent Registry:

```typescript
// Agent task configuration
const agentTaskConfig = {
  agentId: 'specific-agent-id', // Optional: use specific agent
  agentType: 'ANALYST', // Optional: find agent by type
  task: 'Analyze the quarterly financial data',
  instructions: 'Focus on trend analysis and anomaly detection',
  context: { quarter: 'Q4', year: 2024 },
  priority: 'high',
  expectedDuration: 15 // minutes
};

const agentTaskNode = builder.addNode('agent_task', 'Financial Analysis', position, agentTaskConfig);
```

### Agent Handoff

```typescript
const handoffConfig = {
  fromAgentId: 'analyst-agent-001',
  toAgentId: 'reviewer-agent-002',
  handoffTemplateId: 'financial-review-handoff',
  preserveContext: true,
  stagnationThresholdMs: 900000 // 15 minutes
};

const handoffNode = builder.addNode('agent_handoff', 'Review Handoff', position, handoffConfig);
```

## Validation System

The validator provides comprehensive checking:

```typescript
// Custom validation rule
validator.addCustomValidationRule('require_agent_tasks', (workflow) => {
  const hasAgentTasks = workflow.definition.nodes.some(n => n.type === 'agent_task');
  if (!hasAgentTasks) {
    return [{
      code: 'NO_AGENT_TASKS',
      message: 'Workflow must contain at least one agent task',
      severity: 'error'
    }];
  }
  return [];
});

// Validate specific node configuration
const errors = await validator.validateNodeConfiguration('agent_task', {
  task: 'Process data',
  priority: 'medium'
});
```

## Event System

Monitor workflow execution with events:

```typescript
engine.on('workflowEvent', (event) => {
  switch (event.type) {
    case 'workflow_started':
      console.log(`Workflow ${event.workflowId} started`);
      break;
    case 'node_completed':
      console.log(`Node ${event.nodeId} completed`);
      break;
    case 'agent_handoff':
      console.log(`Agent handoff: ${event.data.fromAgentId} → ${event.data.toAgentId}`);
      break;
  }
});
```

## Performance Monitoring

Track execution metrics and performance:

```typescript
// Get engine metrics
const metrics = engine.getMetrics();
console.log(`Active executions: ${metrics.activeExecutionCount}`);
console.log(`Success rate: ${metrics.successfulExecutions / metrics.totalExecutions * 100}%`);

// Get workflow statistics
const stats = await repository.getWorkflowStatistics('workflow-id');
console.log(`Execution statistics:`, stats);

// Health check
const health = await repository.healthCheck();
console.log(`Database healthy: ${health}`);
```

## Integration with Relay Core

The workflow engine integrates with The New Fuse relay system:

```typescript
// Relay message node
const relayConfig = {
  messageType: 'status_update',
  targetAgent: 'monitoring-agent',
  content: 'Workflow execution progress update',
  priority: 'normal'
};

const relayNode = builder.addNode('relay_message', 'Send Status', position, relayConfig);
```

## Templates and Import/Export

```typescript
// Export workflow as template
const template = builder.exportAsTemplate();

// Import from template
const importedWorkflow = builder.importFromTemplate(template);

// Export workflow for backup
const workflowData = builder.exportWorkflow();
```

## Testing

```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## TypeScript Support

The package is fully typed with comprehensive TypeScript definitions:

```typescript
import type {
  UnifiedWorkflow,
  WorkflowNode,
  WorkflowExecution,
  WorkflowValidationResult,
  AgentTaskNodeConfig
} from '@the-new-fuse/workflow-engine/types';
```

## Contributing

See the main [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - see [LICENSE](../../LICENSE) for details.