# KIMI k2.5 Orchestration Examples

This directory contains practical examples demonstrating how to use the KIMI
Orchestrator with 100 parallel KIMI k2.5 agents for various software engineering
tasks.

## Prerequisites

Before running these examples, ensure you have:

1. **Node.js 20+** installed
2. **pnpm** package manager: `npm install -g pnpm`
3. **TNF Relay Server** running on `ws://localhost:3000/ws`
4. **Redis** (optional but recommended)
5. **Built kimi-orchestrator package**:
   ```bash
   pnpm build --filter @the-new-fuse/kimi-orchestrator
   ```

## Installation

```bash
# Install dependencies
pnpm install

# Install additional dependencies for examples
pnpm add -D glob @types/glob
```

## Examples Overview

### 1. Parallel Code Review

**File**: [`parallel-code-review.ts`](./parallel-code-review.ts)

Review an entire codebase using 100 parallel agents. Each agent reviews a subset
of files, analyzing security, performance, style, and architecture.

```bash
# Basic usage
tsx examples/kimi-orchestration/parallel-code-review.ts

# Review specific directory with custom settings
tsx examples/kimi-orchestration/parallel-code-review.ts \
  --path ./packages/core \
  --agents 50 \
  --dimensions security,performance

# Output to custom location
tsx examples/kimi-orchestration/parallel-code-review.ts \
  --output ./reports/security-review.json
```

**Features**:

- Automatic file discovery and distribution
- Multi-dimensional analysis (security, performance, style, architecture)
- Priority-based review (critical files first)
- Aggregated reporting with actionable insights

**Output**: JSON report with:

- Issue counts by severity and category
- Code quality scores
- Top issues requiring attention
- Recommendations for improvement

---

### 2. Swarm Intelligence for Architecture Optimization

**File**: [`swarm-optimization.ts`](./swarm-optimization.ts)

Use swarm intelligence to explore architectural solutions. 100 agents
collaboratively evaluate and evolve architectural proposals.

```bash
# Optimize for scalability
tsx examples/kimi-orchestration/swarm-optimization.ts --problem scalability

# Optimize for performance with custom settings
tsx examples/kimi-orchestration/swarm-optimization.ts \
  --problem performance \
  --swarm-size 50 \
  --iterations 3 \
  --convergence 0.9

# Cost optimization
tsx examples/kimi-orchestration/swarm-optimization.ts \
  --problem cost-optimization \
  --output ./architecture-decision.json
```

**Available Domains**:

- `scalability` - Scale to handle growth
- `performance` - Optimize response times
- `cost-optimization` - Reduce infrastructure costs
- `reliability` - Improve system reliability
- `maintainability` - Enhance code maintainability
- `security` - Strengthen security posture

**Features**:

- Iterative solution evolution
- Convergence tracking
- Weighted voting by expertise
- Solution comparison and selection

---

### 3. Distributed Testing

**File**: [`distributed-testing.ts`](./distributed-testing.ts)

Distribute test execution across 100 parallel agents for ultra-fast test runs.

```bash
# Run all tests
tsx examples/kimi-orchestration/distributed-testing.ts

# Custom test pattern
tsx examples/kimi-orchestration/distributed-testing.ts \
  --pattern "**/*.spec.ts" \
  --root ./src

# With coverage and specific agent count
tsx examples/kimi-orchestration/distributed-testing.ts \
  --agents 50 \
  --coverage true \
  --timeout 600

# Fail fast mode
tsx examples/kimi-orchestration/distributed-testing.ts --bail
```

**Features**:

- Automatic test file chunking
- Parallel execution with load balancing
- Coverage report merging
- Intelligent failure analysis
- JUnit XML output for CI/CD
- Retry mechanism for flaky tests

**Output**:

- `test-report.json` - Detailed results
- `junit-report.xml` - CI/CD integration
- `coverage-report.json` - Coverage data

---

### 4. Multi-Modal Refactoring

**File**: [`multi-modal-refactoring.ts`](./multi-modal-refactoring.ts)

Refactor large codebases using parallel agents, each handling different aspects.

```bash
# TypeScript migration
tsx examples/kimi-orchestration/multi-modal-refactoring.ts \
  --mode typescript-migration

# Security hardening
tsx examples/kimi-orchestration/multi-modal-refactoring.ts \
  --mode security-harden \
  --path ./src/auth

# Dry run to preview changes
tsx examples/kimi-orchestration/multi-modal-refactoring.ts \
  --mode api-modernization \
  --dry-run

# Full modernization with custom output
tsx examples/kimi-orchestration/multi-modal-refactoring.ts \
  --mode full-modernization \
  --path ./packages/legacy \
  --output ./modernized-code
```

**Available Modes**:

- `typescript-migration` - Convert JavaScript to TypeScript
- `api-modernization` - Update to modern API patterns
- `dependency-cleanup` - Remove unused dependencies
- `performance-optimize` - Performance improvements
- `security-harden` - Security enhancements
- `full-modernization` - Complete modernization

**Features**:

- Automatic backup before changes
- Dependency-aware task scheduling
- Dry-run mode for preview
- Rollback capability
- Change reporting

---

### 5. Consensus-Based Decision Making

**File**: [`consensus-based-decisions.ts`](./consensus-based-decisions.ts)

Make architectural decisions using weighted consensus voting among 100
specialized agents.

```bash
# Database selection decision
tsx examples/kimi-orchestration/consensus-based-decisions.ts \
  --topic database-selection

# API strategy with supermajority requirement
tsx examples/kimi-orchestration/consensus-based-decisions.ts \
  --topic api-strategy \
  --threshold 0.66 \
  --algorithm supermajority

# Quadratic voting for complex decision
tsx examples/kimi-orchestration/consensus-based-decisions.ts \
  --topic database-selection \
  --algorithm quadratic \
  --participants 100

# Custom decision with output
tsx examples/kimi-orchestration/consensus-based-decisions.ts \
  --topic "my-custom-topic" \
  --output ./my-decision.json
```

**Available Topics**:

- `database-selection` - Choose database technology
- `api-strategy` - Determine API architecture

**Consensus Algorithms**:

- `simple-majority` - >50% agreement
- `supermajority` - >66% agreement
- `unanimous` - 100% agreement
- `weighted-expertise` - Weighted by capability match (default)
- `quadratic` - Quadratic voting
- `liquid-democracy` - Delegated voting

**Features**:

- Expertise-weighted voting
- Dissent capture and preservation
- Confidence scoring
- Risk assessment
- Implementation guide generation

---

## Common Patterns

### Pattern 1: Agent Registration

```typescript
// Register agents with diverse capabilities
const capabilities = [
  ['testing', 'typescript'],
  ['testing', 'javascript', 'react'],
  ['testing', 'nodejs', 'database'],
];

for (let i = 0; i < 100; i++) {
  const profile = capabilities[i % capabilities.length];
  await orchestrator.registerAgent(`agent-${i}`, profile);
}
```

### Pattern 2: Task Distribution

```typescript
// Submit tasks with capabilities and priority
const result = await orchestrator.submitTask(
  'my-task',
  { data: payload },
  {
    requiredCapabilities: ['typescript', 'testing'],
    priority: 8,
    timeoutMs: 300000,
  }
);
```

### Pattern 3: Progress Tracking

```typescript
// Track task progress
orchestrator.on('task:completed', (data) => {
  console.log(`Task ${data.task.id} completed by ${data.agentId}`);
});

orchestrator.on('task:failed', (data) => {
  console.error(`Task ${data.task.id} failed:`, data.error);
});
```

### Pattern 4: Result Aggregation

```typescript
// Collect and aggregate results
const results = await Promise.all(
  tasks.map((task) => orchestrator.submitTask(task.type, task.payload))
);

const successful = results.filter((r) => r.success);
const failed = results.filter((r) => !r.success);
```

## Configuration Options

### Orchestrator Configuration

```typescript
const orchestrator = new KimiOrchestrator({
  maxAgents: 100, // 1-100 agents
  distributionStrategy: 'capability-based', // or 'round-robin', 'load-balanced'
  heartbeatIntervalMs: 30000, // Health check interval
  agentTimeoutMs: 120000, // Task timeout
  enableAutoRecovery: true, // Auto-restart failed agents
  maxRetries: 3, // Retry failed tasks
  logLevel: 'info', // debug, info, warn, error
});
```

### Environment Variables

```bash
# Relay connection
RELAY_URL=ws://localhost:3000/ws
RELAY_API_KEY=your_api_key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Agent configuration
KIMI_MAX_AGENTS=100
KIMI_HEARTBEAT_INTERVAL_MS=30000
KIMI_AGENT_TIMEOUT_MS=120000
KIMI_LOG_LEVEL=info
```

## Troubleshooting

### Agents Not Registering

```bash
# Check relay health
curl http://localhost:3000/health

# Verify WebSocket connection
pnpm --filter @the-new-fuse/kimi-orchestrator test:ws

# Check logs
pnpm logs --filter @the-new-fuse/kimi-orchestrator
```

### High Task Failure Rate

```typescript
// Increase timeout
const orchestrator = new KimiOrchestrator({
  agentTimeoutMs: 600000, // 10 minutes
  maxRetries: 5,
});

// Check agent health
const stats = orchestrator.getStats();
console.log('Healthy agents:', stats.healthyAgents);
```

### Memory Issues

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=8192" tsx example.ts

# Reduce agent count
tsx example.ts --agents 50
```

## Best Practices

### 1. Start Small

Begin with a smaller number of agents (10-20) to validate your approach:

```bash
tsx parallel-code-review.ts --agents 10 --path ./src/small-module
```

### 2. Use Dry Run Mode

Always test with `--dry-run` first when making changes:

```bash
tsx multi-modal-refactoring.ts --mode typescript-migration --dry-run
```

### 3. Monitor Progress

Enable debug logging to troubleshoot issues:

```typescript
const orchestrator = new KimiOrchestrator({
  logLevel: 'debug',
});
```

### 4. Handle Failures Gracefully

```typescript
const results = await Promise.allSettled(
  tasks.map((task) => orchestrator.submitTask(task.type, task.payload))
);

const failed = results.filter((r) => r.status === 'rejected');
if (failed.length > 0) {
  console.warn(`${failed.length} tasks failed`);
}
```

### 5. Save Results

Always save results for later analysis:

```typescript
writeFileSync('./results.json', JSON.stringify(results, null, 2));
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Distributed Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Build orchestrator
        run: pnpm build --filter @the-new-fuse/kimi-orchestrator

      - name: Start infrastructure
        run: docker-compose up -d redis relay

      - name: Run distributed tests
        run:
          tsx examples/kimi-orchestration/distributed-testing.ts --output
          ./test-results

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: ./test-results/
```

## Advanced Usage

### Custom Task Types

Create your own task types by extending the examples:

```typescript
// Custom analysis task
const result = await orchestrator.submitTask(
  'custom-analysis',
  {
    files: myFiles,
    rules: myCustomRules,
  },
  {
    requiredCapabilities: ['analysis', 'typescript'],
    priority: 7,
  }
);
```

### Agent Specialization

Create specialized agents for specific tasks:

```typescript
// Security specialists
await orchestrator.registerAgent('security-001', [
  'security-audit',
  'code-review',
  'typescript',
]);

// Performance specialists
await orchestrator.registerAgent('perf-001', [
  'performance-optimization',
  'code-review',
  'database',
]);
```

### Hybrid Workflows

Combine multiple examples for complex workflows:

```typescript
// 1. Review code
const review = await runParallelCodeReview({...});

// 2. Make decision on refactoring
const decision = await runConsensusDecision({
  topic: 'refactor-strategy',
  context: review,
});

// 3. Execute refactoring
if (decision.result.consensusAchieved) {
  await runMultiModalRefactoring({...});
}

// 4. Run tests
await runDistributedTests({...});
```

## Contributing

To add new examples:

1. Create a new `.ts` file in this directory
2. Follow the existing code structure and patterns
3. Include comprehensive JSDoc comments
4. Add CLI argument parsing
5. Update this README with usage instructions

## Resources

- [Kilo Code + KIMI Integration Guide](../../KILO_KIMI_INTEGRATION_GUIDE.md)
- [KIMI Orchestrator Package](../../packages/kimi-orchestrator/)
- [TNF Documentation](../../docs/)

## Support

For issues and questions:

- GitHub Issues:
  [the-new-fuse/issues](https://github.com/your-org/the-new-fuse/issues)
- Discord: [TNF Community](https://discord.gg/tnf)

---

_Last Updated: 2026-01-29_
