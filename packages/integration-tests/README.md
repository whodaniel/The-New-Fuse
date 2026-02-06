# Integration Tests for The New Fuse Framework

This package contains comprehensive integration tests for The New Fuse unified
framework, validating the integration between Master Agent Registry, Workflow
Engine, and Extension System components.

## Overview

The integration tests demonstrate and validate:

- **Master Agent Registry**: Single source of truth for all agents with
  universal onboarding
- **Workflow Engine**: Unified orchestration system with agent task assignment
- **Extension System**: Comprehensive extension architecture with security
  sandboxing
- **Cross-System Integration**: All components working together seamlessly

## Test Structure

```
src/
├── setup/
│   └── test-setup.ts           # Test environment configuration
├── integration/
│   ├── master-agent-workflow.test.ts    # Agent + Workflow integration
│   └── extension-system.test.ts         # Extension system integration
├── e2e/
│   └── complete-scenarios.test.ts       # End-to-end scenarios
├── performance/
│   └── benchmark.test.ts               # Performance benchmarks
└── examples/
    ├── data-pipeline-app.ts            # Data processing example
    └── collaboration-app.ts            # Multi-agent collaboration example
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Setup test database
ppnpm run setup-d
```

### Test Commands

```bash
# Run all integration tests
pnpm test

# Run specific test suites
pnpm run test:integration
pnpm run test:e2e
pnpm run test:performance

# Run with coverage
pnpm run test:coverage

# Watch mode for development
pnpm run test:watch
```

### Performance Benchmarks

```bash
# Run performance benchmarks
pnpm run test:performance

# Generate benchmark report
pnpm run benchmark:report
```

## Test Categories

### 1. Integration Tests (`/integration`)

These tests validate the integration between framework components:

#### Master Agent Registry + Workflow Engine Integration

- Agent task assignment in workflows
- Agent capability matching for task assignment
- Agent handoffs with context preservation
- Multi-agent coordination in parallel workflows
- Heartbeat monitoring during workflow execution
- Stagnation detection and handling
- Error handling and recovery mechanisms

#### Extension System Integration

- Extension loading and management
- Agent capability extensions integration
- Workflow node extensions integration
- Extension security validation
- Runtime error handling
- Resource usage monitoring

### 2. End-to-End Scenarios (`/e2e`)

Complete real-world scenarios combining all systems:

#### Data Processing Pipeline

- CSV parsing with custom extensions
- Agent-based data validation and cleaning
- Statistical analysis with workflow nodes
- Report generation with multi-agent coordination
- Quality assurance throughout the pipeline

#### Multi-Agent Collaboration

- Software development team simulation
- Task coordination with specialized agents
- Communication and progress tracking
- Error recovery and resilience testing
- Team performance analytics

#### Error Recovery and Resilience

- System failures and graceful recovery
- Extension error handling
- Agent failure fallback mechanisms
- Data consistency during failures

#### Performance and Scalability

- High-load concurrent processing
- Resource optimization under stress
- System stability during peak usage
- Performance monitoring and metrics

### 3. Performance Benchmarks (`/performance`)

Comprehensive performance testing:

#### Master Agent Registry Performance

- Agent registration throughput
- Capability update performance
- Profile retrieval speed
- Concurrent operations handling

#### Workflow Engine Performance

- Workflow creation and execution speed
- Node processing performance
- Concurrent workflow handling
- Memory usage optimization

#### Extension System Performance

- Extension loading times
- Runtime execution performance
- Resource usage monitoring
- Concurrent extension usage

#### Integrated System Performance

- End-to-end workflow performance
- Memory usage analysis
- Cross-system communication overhead
- Scalability testing

## Example Applications (`/examples`)

### Data Pipeline Application

Demonstrates a complete data processing pipeline:

```typescript
import { runDataPipelineExample } from './src/examples/data-pipeline-app';

// Run the example
await runDataPipelineExample();
```

**Features:**

- CSV data ingestion and parsing
- Agent-based data validation
- Statistical analysis with custom extensions
- Automated report generation
- Quality assurance monitoring

### Collaboration Application

Shows multi-agent team collaboration:

```typescript
import { runCollaborationExample } from './src/examples/collaboration-app';

// Run the example
await runCollaborationExample();
```

**Features:**

- Software development team simulation
- Task coordination and assignment
- Real-time communication hub
- Progress tracking and reporting
- Team performance analytics

## Test Environment Setup

The test environment automatically configures:

### Database

- In-memory SQLite for fast testing
- Drizzle ORM integration
- Automatic schema migration

### Master Agent Registry

- Merkle tree verification enabled
- Heartbeat monitoring active
- Protocol compliance required
- Universal onboarding system

### Workflow Engine

- Agent integration enabled
- Extension support configured
- Performance monitoring active

### Extension System

- Security sandboxing enabled
- Permission validation active
- Resource limit enforcement

## Test Data and Helpers

### Test Helpers

```typescript
import { TestHelpers } from './setup/test-setup';

// Create test agent
const agent = await TestHelpers.createTestAgent('TestAgent', 'TEST_TYPE');

// Create test workflow
const { workflow, builder } =
  await TestHelpers.createTestWorkflow('Test Workflow');

// Create test extension
const extension = await TestHelpers.createTestExtension(
  'test-extension',
  'workflow_node'
);

// Wait for conditions
await TestHelpers.waitForCondition(async () => {
  return someAsyncCondition();
});

// Generate test data
const data = TestHelpers.generateTestData(100);
```

### Environment Access

```typescript
import { getTestEnvironment } from './setup/test-setup';

const env = getTestEnvironment();

// Access framework components
const agentRegistry = env.agentRegistry;
const workflowEngine = env.workflowEngine;
const extensionManager = env.extensionManager;
```

## Assertions and Expectations

### Agent Registry Assertions

```typescript
// Agent registration
expect(result.success).toBe(true);
expect(result.agentId).toBeDefined();
expect(result.onboardingRequired).toBe(true);

// Agent profiles
expect(profile.todoList).toHaveLength(1);
expect(profile.capabilities.dataProcessing).toBe(true);
expect(profile.status).toBe('ACTIVE');
```

### Workflow Engine Assertions

```typescript
// Workflow execution
expect(execution.status).toBe(WorkflowExecutionStatus.COMPLETED);
expect(execution.nodeExecutions.length).toBeGreaterThan(0);

// Task assignment
expect(agentProfile.todoList[0].content).toContain('Process data');
expect(agentProfile.todoList[0].priority).toBe('high');
```

### Extension System Assertions

```typescript
// Extension loading
expect(loadResult.success).toBe(true);
expect(loadResult.extension.status).toBe(ExtensionStatus.LOADED);

// Extension execution
expect(capabilityResult.success).toBe(true);
expect(extensionMetrics.executionCount).toBeGreaterThan(0);
```

## Performance Benchmarks

### Benchmark Results Format

```typescript
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  memoryUsage?: number;
}
```

### Performance Targets

- **Agent Registration**: < 50ms average, > 20 ops/sec
- **Workflow Execution**: < 2 seconds average
- **Extension Loading**: < 200ms average, > 5 ops/sec
- **Extension Execution**: < 50ms average, > 20 ops/sec
- **Memory Usage**: < 100MB increase for full test suite

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: pnpm run test:integration
      - run: pnpm run test:e2e
      - run: pnpm run test:performance
```

### Test Reports

- **Coverage Reports**: Generated in `coverage/` directory
- **Performance Reports**: Output to console and saved as JSON
- **Error Reports**: Detailed logs for debugging failures

## Debugging and Troubleshooting

### Enable Debug Logging

```bash
# Enable verbose logging
DEBUG=* pnpm test

# Component-specific logging
DEBUG=agent-registry pnpm test
DEBUG=workflow-engine pnpm test
DEBUG=extension-system pnpm test
```

### Common Issues

1. **Database Connection Errors**
   - Ensure test database is properly configured
   - Check Drizzle schema migrations

2. **Extension Loading Failures**
   - Verify extension manifest format
   - Check file permissions on extension directories

3. **Workflow Execution Timeouts**
   - Increase test timeout values
   - Check agent availability and heartbeat status

4. **Memory Leaks in Long Tests**
   - Ensure proper cleanup in `afterEach` hooks
   - Monitor resource usage with `--max-old-space-size`

### Test Data Cleanup

Tests automatically clean up:

- Test databases and connections
- Temporary extension directories
- Agent registrations and workflows
- System monitoring services

## Contributing

### Adding New Tests

1. **Integration Tests**: Add to appropriate files in `/integration`
2. **E2E Scenarios**: Create comprehensive scenarios in `/e2e`
3. **Performance Tests**: Add benchmarks to `/performance`
4. **Examples**: Create realistic applications in `/examples`

### Test Guidelines

- Use descriptive test names and descriptions
- Include both positive and negative test cases
- Test error conditions and edge cases
- Ensure tests are deterministic and repeatable
- Add performance assertions where appropriate
- Clean up resources in test teardown

### Code Coverage Targets

- **Integration Tests**: > 80% coverage
- **E2E Scenarios**: > 70% coverage
- **Critical Paths**: > 90% coverage

## License

MIT - see [LICENSE](../../LICENSE) for details.
