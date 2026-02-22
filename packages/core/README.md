# @the-new-fuse/core

Core functionality for The New Fuse platform. Provides essential services, utilities, and infrastructure for building AI-powered agent systems, workflows, monitoring, and more.

## Overview

The core package is the foundation of The New Fuse platform, providing production-ready implementations of critical services including:
- System monitoring and metrics collection
- Agent orchestration and LLM services
- Memory management systems
- Workflow execution engines
- Feature flags and configuration
- Database services
- Logging and error handling utilities

## Features

### Monitoring & Performance
- **System Monitor**: Real-time system health monitoring
- **Metrics Collector**: Application and performance metrics
- **Performance Monitor**: Detailed performance tracking
- **Unified Monitoring**: Centralized monitoring service
- **Alert System**: Configurable alerting with severity levels
- **Trace & Span**: Distributed tracing support

### AI & Agents
- **Agent Orchestrator**: Multi-agent task coordination
- **Agent Swarm Orchestration**: Swarm intelligence coordination
- **Agent LLM Service**: LLM integration for agents
- **Prompt Service**: Prompt template management
- **Local AI Detection**: Detect local AI capabilities

### Memory & State
- **Memory System**: Advanced memory management
- **Memory Manager**: Long-term and short-term memory
- **Context Management**: Conversation and task context

### Workflow & Processing
- **Workflow Engine**: Execute complex workflows
- **Workflow Executor**: Task execution and coordination
- **Pipeline Processing**: Data processing pipelines

### Configuration & Database
- **Config Service**: Centralized configuration management
- **Database Service**: Database abstraction layer
- **Redis Integration**: Redis caching and pub/sub
- **Feature Flags**: Feature flag management (Mongo-backed)

### Utilities
- **Logger**: Structured logging with Winston
- **Error Utilities**: Error handling helpers
- **Type Definitions**: Comprehensive TypeScript types

## Installation

```bash
npm install @the-new-fuse/core
# or
pnpm add @the-new-fuse/core
```

## Quick Start

### System Monitoring

```typescript
import { SystemMonitor } from '@the-new-fuse/core';

const monitor = new SystemMonitor({
  checkInterval: 5000, // 5 seconds
  enableAlerts: true,
});

await monitor.start();

// Get system metrics
const metrics = await monitor.getSystemMetrics();
console.log('CPU Usage:', metrics.cpu.usage);
console.log('Memory Usage:', metrics.memory.used);
```

### Agent Orchestration

```typescript
import { AgentOrchestrator, Agent, Task } from '@the-new-fuse/core';

const orchestrator = new AgentOrchestrator();

// Define agents
const dataAgent: Agent = {
  id: 'data-agent-1',
  name: 'Data Processor',
  capabilities: ['data-processing', 'analysis'],
  execute: async (task) => {
    // Process task
    return { result: 'processed' };
  },
};

orchestrator.registerAgent(dataAgent);

// Create and execute task
const task: Task = {
  id: 'task-1',
  type: 'data-processing',
  payload: { data: [...] },
};

const result = await orchestrator.executeTask(task);
```

### Workflow Engine

```typescript
import { WorkflowEngine } from '@the-new-fuse/core';

const engine = new WorkflowEngine();

// Define workflow
const workflow = {
  id: 'workflow-1',
  name: 'Data Processing Pipeline',
  steps: [
    {
      id: 'fetch',
      type: 'fetch-data',
      config: { source: 'api' },
    },
    {
      id: 'process',
      type: 'transform',
      config: { operation: 'aggregate' },
    },
    {
      id: 'store',
      type: 'save',
      config: { destination: 'database' },
    },
  ],
};

// Execute workflow
const result = await engine.executeWorkflow(workflow);
```

### Memory System

```typescript
import { MemorySystem } from '@the-new-fuse/core';

const memory = new MemorySystem({
  shortTermCapacity: 100,
  longTermEnabled: true,
});

// Store memory
await memory.store({
  key: 'conversation-1',
  content: 'User asked about features',
  context: { userId: 'user-123' },
  importance: 8,
});

// Retrieve relevant memories
const memories = await memory.recall({
  query: 'features',
  limit: 10,
});
```

### Feature Flags

```typescript
import { FeatureFlagService } from '@the-new-fuse/core';

const featureFlags = new FeatureFlagService();

// Check feature flag
const isEnabled = await featureFlags.isEnabled('new-ui', {
  userId: 'user-123',
});

if (isEnabled) {
  // Show new UI
}

// Get flag with metadata
const flag = await featureFlags.getFlag('beta-features');
console.log('Rollout percentage:', flag.rolloutPercentage);
```

### Logger

```typescript
import { logger, Logger } from '@the-new-fuse/core';

// Use singleton logger
logger.info('Application started');
logger.warn('High memory usage detected', { usage: 85 });
logger.error('Database connection failed', error);

// Create service-specific logger
const serviceLogger = new Logger('UserService');
serviceLogger.info('User created', { userId: 'user-123' });
```

## API Reference

### System Monitoring

#### SystemMonitor

```typescript
class SystemMonitor {
  constructor(config?: {
    checkInterval?: number;
    enableAlerts?: boolean;
    cpuThreshold?: number;
    memoryThreshold?: number;
  });

  start(): Promise<void>;
  stop(): Promise<void>;
  getSystemMetrics(): Promise<SystemMetrics>;
  getHealthStatus(): Promise<HealthStatus>;
  setAlertThreshold(metric: string, threshold: number): void;
}
```

#### MetricsCollector

```typescript
class MetricsCollector {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
  recordTiming(name: string, duration: number, tags?: Record<string, string>): void;
  getMetrics(): Promise<Metric[]>;
  clearMetrics(): void;
}
```

#### PerformanceMonitor

```typescript
class PerformanceMonitor {
  startTimer(operation: string): () => void;
  recordOperation(operation: string, duration: number, success: boolean): void;
  getOperationStats(operation: string): Promise<OperationStats>;
  getSlowOperations(threshold: number): Promise<Operation[]>;
}
```

### Agent Services

#### AgentOrchestrator

```typescript
interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  execute: (task: Task) => Promise<TaskResult>;
}

interface Task {
  id: string;
  type: string;
  payload: any;
  priority?: number;
  deadline?: Date;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
}

class AgentOrchestrator {
  registerAgent(agent: Agent): void;
  unregisterAgent(agentId: string): void;
  executeTask(task: Task): Promise<TaskResult>;
  getAvailableAgents(): Agent[];
  getAgentsByCapability(capability: string): Agent[];
}
```

#### AgentLLMService

```typescript
interface LLMResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

class AgentLLMService {
  async complete(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
  }): Promise<LLMResponse>;

  async chat(messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>, options?: object): Promise<LLMResponse>;

  async embed(text: string): Promise<number[]>;
}
```

#### PromptService

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category?: string;
}

interface PromptContext {
  [key: string]: any;
}

class PromptService {
  registerTemplate(template: PromptTemplate): void;
  getTemplate(id: string): PromptTemplate | null;
  render(templateId: string, context: PromptContext): string;
  listTemplates(category?: string): PromptTemplate[];
}
```

### Memory System

#### MemorySystem

```typescript
interface MemoryEntry {
  key: string;
  content: any;
  context?: Record<string, any>;
  importance?: number;
  timestamp?: Date;
  expiresAt?: Date;
}

interface RecallOptions {
  query?: string;
  context?: Record<string, any>;
  limit?: number;
  minImportance?: number;
  timeRange?: {
    start?: Date;
    end?: Date;
  };
}

class MemorySystem {
  constructor(config?: {
    shortTermCapacity?: number;
    longTermEnabled?: boolean;
    vectorDBEnabled?: boolean;
  });

  store(entry: MemoryEntry): Promise<void>;
  recall(options: RecallOptions): Promise<MemoryEntry[]>;
  forget(key: string): Promise<void>;
  consolidate(): Promise<void>;
  getStats(): Promise<MemoryStats>;
}
```

#### MemoryManager

```typescript
class MemoryManager {
  // Short-term memory
  addToShortTerm(key: string, data: any, ttl?: number): Promise<void>;
  getFromShortTerm(key: string): Promise<any | null>;

  // Long-term memory
  addToLongTerm(key: string, data: any): Promise<void>;
  searchLongTerm(query: string, limit?: number): Promise<any[]>;

  // Memory operations
  clearShortTerm(): Promise<void>;
  getMemoryUsage(): Promise<MemoryUsageStats>;
}
```

### Workflow System

#### WorkflowEngine

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
}

interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, any>;
  condition?: string;
  onError?: 'fail' | 'continue' | 'retry';
}

interface WorkflowResult {
  workflowId: string;
  success: boolean;
  steps: StepResult[];
  duration: number;
  error?: Error;
}

class WorkflowEngine {
  executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
  pauseWorkflow(workflowId: string): Promise<void>;
  resumeWorkflow(workflowId: string): Promise<void>;
  cancelWorkflow(workflowId: string): Promise<void>;
  getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>;
}
```

#### WorkflowExecutor

```typescript
class WorkflowExecutor {
  registerStepHandler(type: string, handler: StepHandler): void;
  executeStep(step: WorkflowStep, context: ExecutionContext): Promise<StepResult>;
  validateWorkflow(workflow: Workflow): ValidationResult;
}
```

### Configuration

#### ConfigService

```typescript
class ConfigService {
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: any): void;
  has(key: string): boolean;
  getAll(): Record<string, any>;
  loadFromFile(path: string): Promise<void>;
  loadFromEnv(prefix?: string): void;
}
```

#### DatabaseService

```typescript
class DatabaseService {
  connect(connectionString: string): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  isConnected(): boolean;
}
```

### Feature Flags

#### FeatureFlagService

```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
  description?: string;
}

class FeatureFlagService {
  isEnabled(flagName: string, context?: Record<string, any>): Promise<boolean>;
  getFlag(flagName: string): Promise<FeatureFlag | null>;
  setFlag(flag: FeatureFlag): Promise<void>;
  getAllFlags(): Promise<FeatureFlag[]>;
  evaluateConditions(flag: FeatureFlag, context: Record<string, any>): boolean;
}
```

#### MongoFeatureFlagService

MongoDB-backed feature flag service for persistent storage.

```typescript
class MongoFeatureFlagService extends FeatureFlagService {
  constructor(mongoUrl: string, dbName?: string);
  // Inherits all FeatureFlagService methods
  // Automatically persists to MongoDB
}
```

## Types

### Core Types

```typescript
// From types/core.ts
export interface ServiceConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  port?: number;
  host?: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: Date;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  responseTime?: number;
}
```

### Agent Types

```typescript
// From types/agent.ts
export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  maxConcurrentTasks?: number;
}

export enum AgentType {
  EXECUTOR = 'executor',
  COORDINATOR = 'coordinator',
  SPECIALIST = 'specialist',
}

export interface AgentMetrics {
  agentId: string;
  tasksCompleted: number;
  averageTaskTime: number;
  successRate: number;
  lastActive: Date;
}
```

### Memory Types

```typescript
// From types/memory.ts
export interface MemoryConfig {
  shortTermCapacity: number;
  longTermEnabled: boolean;
  vectorDBEnabled: boolean;
  compressionEnabled: boolean;
}

export interface MemoryStats {
  shortTermCount: number;
  longTermCount: number;
  totalSize: number;
  hitRate: number;
}
```

### Workflow Types

```typescript
// From types/workflow.ts
export interface WorkflowConfig {
  id: string;
  name: string;
  version: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoff: 'fixed' | 'exponential';
  initialDelay: number;
}

export interface WorkflowMetrics {
  workflowId: string;
  executionCount: number;
  averageDuration: number;
  successRate: number;
  lastExecution: Date;
}
```

### Monitoring Types

```typescript
// From types/monitoring.ts
export interface PerformanceMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
}

export interface SystemMetrics {
  timestamp: Date;
  performance: PerformanceMetrics;
  application: ApplicationMetrics;
  custom: Record<string, number>;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
```

## Usage Examples

### Complete Monitoring Setup

```typescript
import {
  SystemMonitor,
  MetricsCollector,
  PerformanceMonitor,
  UnifiedMonitoringService,
} from '@the-new-fuse/core';

// Initialize monitoring stack
const systemMonitor = new SystemMonitor({
  checkInterval: 5000,
  cpuThreshold: 80,
  memoryThreshold: 85,
});

const metricsCollector = new MetricsCollector();
const perfMonitor = new PerformanceMonitor();

const monitoring = new UnifiedMonitoringService({
  systemMonitor,
  metricsCollector,
  perfMonitor,
});

// Start monitoring
await monitoring.start();

// Record custom metrics
metricsCollector.recordMetric('api_requests', 1, {
  endpoint: '/users',
  method: 'GET',
});

// Monitor operation performance
const endTimer = perfMonitor.startTimer('database_query');
try {
  await database.query('SELECT * FROM users');
  endTimer(); // Records success
} catch (error) {
  endTimer(); // Records failure
}

// Get comprehensive metrics
const allMetrics = await monitoring.getAllMetrics();
```

### Multi-Agent System

```typescript
import {
  AgentOrchestrator,
  AgentSwarmOrchestrationService,
  Agent,
  Task,
} from '@the-new-fuse/core';

// Create orchestrator
const orchestrator = new AgentOrchestrator();

// Define specialized agents
const dataAgent: Agent = {
  id: 'data-agent',
  name: 'Data Processor',
  capabilities: ['data-fetch', 'data-transform'],
  execute: async (task) => {
    // Implementation
    return { success: true, result: 'processed' };
  },
};

const analysisAgent: Agent = {
  id: 'analysis-agent',
  name: 'Data Analyzer',
  capabilities: ['analysis', 'insights'],
  execute: async (task) => {
    // Implementation
    return { success: true, result: 'analyzed' };
  },
};

// Register agents
orchestrator.registerAgent(dataAgent);
orchestrator.registerAgent(analysisAgent);

// Create swarm coordination
const swarm = new AgentSwarmOrchestrationService();
swarm.addAgent(dataAgent);
swarm.addAgent(analysisAgent);

// Execute complex task requiring multiple agents
const complexTask: Task = {
  id: 'analysis-pipeline',
  type: 'data-analysis',
  payload: {
    source: 'api',
    operations: ['fetch', 'transform', 'analyze'],
  },
};

const result = await swarm.executeSwarmTask(complexTask);
```

### Workflow with Memory Integration

```typescript
import {
  WorkflowEngine,
  MemorySystem,
  logger,
} from '@the-new-fuse/core';

const engine = new WorkflowEngine();
const memory = new MemorySystem({
  shortTermCapacity: 100,
  longTermEnabled: true,
});

// Define workflow with memory
const workflow = {
  id: 'research-workflow',
  name: 'AI Research Assistant',
  steps: [
    {
      id: 'recall',
      type: 'memory-recall',
      config: {
        query: 'previous research',
        limit: 10,
      },
    },
    {
      id: 'research',
      type: 'web-search',
      config: {
        query: 'latest AI trends',
      },
    },
    {
      id: 'analyze',
      type: 'llm-analysis',
      config: {
        model: 'claude-sonnet-4',
      },
    },
    {
      id: 'store',
      type: 'memory-store',
      config: {
        importance: 8,
      },
    },
  ],
};

// Execute with logging
logger.info('Starting research workflow');
const result = await engine.executeWorkflow(workflow);

if (result.success) {
  logger.info('Workflow completed', {
    duration: result.duration,
    steps: result.steps.length,
  });
}
```

### Feature Flag Gradual Rollout

```typescript
import { FeatureFlagService } from '@the-new-fuse/core';

const featureFlags = new FeatureFlagService();

// Define progressive rollout
await featureFlags.setFlag({
  name: 'new-dashboard',
  enabled: true,
  rolloutPercentage: 10, // Start with 10%
  conditions: {
    betaUsers: true,
    minVersion: '2.0.0',
  },
  description: 'New dashboard UI',
});

// Check flag for user
const showNewDashboard = await featureFlags.isEnabled('new-dashboard', {
  userId: 'user-123',
  userGroup: 'beta',
  version: '2.1.0',
});

// After testing, increase rollout
await featureFlags.setFlag({
  name: 'new-dashboard',
  enabled: true,
  rolloutPercentage: 50, // Increase to 50%
  conditions: {
    betaUsers: true,
    minVersion: '2.0.0',
  },
});
```

## Integration with The New Fuse Ecosystem

### With Database Package

```typescript
import { DatabaseService } from '@the-new-fuse/core';
import { DrizzleService } from '@the-new-fuse/database';

// Core provides database abstraction
// Database package provides Drizzle implementation
const db = new DatabaseService();
await db.connect(process.env.DATABASE_URL);
```

### With Authentication

```typescript
import { AgentLLMService } from '@the-new-fuse/core';
import { AuthService } from '@the-new-fuse/core-auth';

// Use authenticated LLM service
const llmService = new AgentLLMService();
const authService = new AuthService();

// Verify user before LLM access
const user = await authService.validateUser(userId);
if (user) {
  const response = await llmService.complete(prompt);
}
```

### With Error Handling

```typescript
import { logger } from '@the-new-fuse/core';
import {
  SystemError,
  DatabaseError,
} from '@the-new-fuse/core-error-handling';

try {
  await dbOperation();
} catch (error) {
  logger.error('Database operation failed', error);
  throw new DatabaseError(
    'Failed to execute query',
    'SELECT',
    query,
    error
  );
}
```

### With Resource Registry

```typescript
import { AgentOrchestrator } from '@the-new-fuse/core';
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';

const orchestrator = new AgentOrchestrator();
const registry = new ResourceRegistryService();

// Register agent as resource
await registry.create({
  name: orchestrator.getAgent('agent-1').name,
  category: 'AGENT_TEMPLATE',
  type: 'JSON',
  content: orchestrator.getAgent('agent-1'),
});
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tnf

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# MongoDB (for feature flags)
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=tnf-feature-flags

# Monitoring
METRICS_ENABLED=true
METRICS_INTERVAL=5000
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# AI Services
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.anthropic.com

# Feature Flags
FEATURE_FLAGS_ENABLED=true
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

## Development

### Building

```bash
# Build the package
pnpm build

# Build in watch mode
pnpm dev

# Clean build artifacts
pnpm clean

# Production build
pnpm build:production
```

### Testing

```bash
# Run all tests
pnpm test

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Code Quality

```bash
# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check

# Type checking
pnpm type-check
```

## Architecture

```
packages/core/
├── src/
│   ├── services/                    # Core services
│   │   ├── SystemMonitor.ts
│   │   ├── MetricsCollector.ts
│   │   ├── PerformanceMonitor.ts
│   │   ├── UnifiedMonitoringService.ts
│   │   ├── AgentLLMService.ts
│   │   ├── PromptService.ts
│   │   ├── FeatureFlagService.ts
│   │   ├── MongoFeatureFlagService.ts
│   │   ├── ConfigService.ts
│   │   └── DatabaseService.ts
│   ├── agents/                      # Agent systems
│   │   ├── agent-orchestrator.ts
│   │   └── AgentSwarmOrchestrationService.ts
│   ├── memory/                      # Memory systems
│   │   ├── MemorySystem.ts
│   │   └── MemoryManager.ts
│   ├── workflow/                    # Workflow systems
│   │   ├── WorkflowEngine.ts
│   │   └── WorkflowExecutor.ts
│   ├── config/                      # Configuration
│   │   ├── ConfigService.ts
│   │   └── redis.config.ts
│   ├── database/                    # Database
│   │   └── DatabaseService.ts
│   ├── models/                      # Data models
│   │   └── FeatureFlag.ts
│   ├── types/                       # TypeScript types
│   │   ├── core.ts
│   │   ├── agent.ts
│   │   ├── memory.ts
│   │   ├── workflow.ts
│   │   ├── monitoring.ts
│   │   └── featureFlags.ts
│   ├── utils/                       # Utilities
│   │   ├── logger.ts
│   │   └── errors.ts
│   └── index.ts                     # Package exports
├── __tests__/                       # Tests
├── dist/                            # Build output
├── package.json
├── tsconfig.json
└── README.md
```

## Performance Considerations

### Memory Management
- Short-term memory uses LRU cache with configurable capacity
- Long-term memory uses vector database for efficient recall
- Automatic memory consolidation to prevent overflow

### Monitoring Overhead
- Configurable check intervals (default: 5s)
- Lightweight metric collection
- Async operations to prevent blocking

### Agent Coordination
- Task queue for efficient distribution
- Agent pooling for resource management
- Automatic load balancing

### Workflow Execution
- Step-level error handling
- Parallel execution where possible
- Efficient state management

## Best Practices

### 1. Initialize Services Early

```typescript
// Initialize monitoring at application startup
const monitor = new SystemMonitor();
await monitor.start();

// Initialize agents before task execution
const orchestrator = new AgentOrchestrator();
orchestrator.registerAgent(dataAgent);
```

### 2. Use Appropriate Logging Levels

```typescript
logger.debug('Detailed debug info'); // Development only
logger.info('Important events'); // Production
logger.warn('Warning conditions'); // Issues to watch
logger.error('Error conditions'); // Failures
```

### 3. Handle Errors Gracefully

```typescript
try {
  await workflow.execute();
} catch (error) {
  logger.error('Workflow failed', error);
  // Implement recovery strategy
  await workflow.rollback();
}
```

### 4. Monitor Performance

```typescript
const timer = perfMonitor.startTimer('operation');
await operation();
timer(); // Always complete timer
```

### 5. Use Feature Flags for Gradual Rollouts

```typescript
// Start small
rolloutPercentage: 1 // 1%

// Monitor and increase
rolloutPercentage: 5, 10, 25, 50, 100
```

## Troubleshooting

### High Memory Usage

```typescript
// Check memory stats
const stats = await memorySystem.getStats();
console.log('Memory usage:', stats.totalSize);

// Clear short-term memory if needed
await memoryManager.clearShortTerm();
```

### Agent Task Failures

```typescript
// Check agent status
const agents = orchestrator.getAvailableAgents();
console.log('Available agents:', agents.length);

// Review task results
const result = await orchestrator.executeTask(task);
if (!result.success) {
  logger.error('Task failed', result.error);
}
```

### Workflow Execution Issues

```typescript
// Validate workflow before execution
const validation = executor.validateWorkflow(workflow);
if (!validation.valid) {
  console.error('Invalid workflow:', validation.errors);
}

// Monitor workflow status
const status = await engine.getWorkflowStatus(workflowId);
```

## Dependencies

Core dependencies:
- `@nestjs/common` - NestJS framework
- `@nestjs/core` - NestJS core
- `@nestjs/config` - Configuration management
- `winston` - Logging
- `ioredis` - Redis client
- `mongoose` - MongoDB client
- `chromadb` - Vector database
- `prom-client` - Prometheus metrics

## License

MIT

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Contact the maintainers

## Related Packages

- `@the-new-fuse/database` - Database integration (Drizzle)
- `@the-new-fuse/core-auth` - Authentication and authorization
- `@the-new-fuse/core-error-handling` - Error handling utilities
- `@the-new-fuse/resource-registry` - Resource management
- `@the-new-fuse/agent-coordination` - Advanced agent coordination
- `@the-new-fuse/n8n-workflows` - Workflow integrations
- `@the-new-fuse/api` - REST API implementation

## Roadmap

Future enhancements:
- OpenTelemetry integration
- GraphQL support
- Enhanced vector database integration
- Multi-region support
- Advanced agent learning capabilities
- Workflow visual designer
- Real-time collaboration features
