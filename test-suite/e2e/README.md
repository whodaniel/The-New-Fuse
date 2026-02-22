# The New Fuse - End-to-End Test Suite

Comprehensive end-to-end testing suite for The New Fuse framework, validating
production readiness through extensive testing of agent lifecycle, multi-agent
collaboration, load handling, integration, chaos resilience, and real-world
scenarios.

## 📋 Overview

This test suite provides comprehensive coverage of The New Fuse framework:

- **Agent Lifecycle Testing**: Complete agent journey from registration to
  shutdown
- **Multi-Agent Collaboration**: 5+ agents working together using Redis, A2A,
  MCP
- **Load Testing**: 10+ agents, 100+ messages/second, complex workflows
- **Integration Testing**: Full-stack validation (Frontend → Backend → DB →
  Redis)
- **Chaos Testing**: Failure scenarios, recovery, graceful degradation
- **Real-World Scenarios**: Production-like workflows (Code Review,
  Self-Improvement, Documentation)

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Node.js 18+
- pnpm 10.19.0+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

# Optional
- Playwright browsers (auto-installed)
```

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Start services
pnpm run docker:start

# Or use docker-compose
docker-compose -f docker-compose.local.yml up -d
```

### Running Tests

```bash
# Run all E2E tests
./run-e2e-tests.sh

# Run specific test suite
pnpm exec playwright test 01-agent-lifecycle.spec.ts

# Run with UI mode
pnpm exec playwright test --ui

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Run specific test
pnpm exec playwright test -g "Agent Registration"
```

## 📁 Test Structure

```
test-suite/e2e/
├── 01-agent-lifecycle.spec.ts          # Agent lifecycle tests
├── 02-multi-agent-collaboration.spec.ts # Multi-agent scenarios
├── 03-load-testing.spec.ts             # Load and performance tests
├── 04-integration-testing.spec.ts      # Full-stack integration
├── 05-chaos-testing.spec.ts            # Chaos engineering tests
├── 06-real-world-scenarios.spec.ts     # Production scenarios
├── run-e2e-tests.sh                    # Test runner script
└── README.md                           # This file
```

## 🧪 Test Suites

### 1. Agent Lifecycle (01-agent-lifecycle.spec.ts)

Tests complete agent lifecycle:

- ✅ Agent registration
- ✅ Onboarding process
- ✅ Agent discovery
- ✅ Task execution
- ✅ Communication via chat
- ✅ Workflow participation
- ✅ Graceful shutdown

**Estimated Runtime**: 2-3 minutes

### 2. Multi-Agent Collaboration (02-multi-agent-collaboration.spec.ts)

Tests 5 agents collaborating:

- ✅ Redis coordination
- ✅ A2A protocol communication
- ✅ MCP tools usage
- ✅ Workflow orchestration
- ✅ Chat room collaboration
- ✅ Performance metrics

**Estimated Runtime**: 3-5 minutes

### 3. Load Testing (03-load-testing.spec.ts)

Stress tests system limits:

- ✅ 15 concurrent agents
- ✅ 100+ messages per second
- ✅ Complex workflows (25+ nodes)
- ✅ Multiple concurrent workflows
- ✅ Database performance under load

**Estimated Runtime**: 5-10 minutes

### 4. Integration Testing (04-integration-testing.spec.ts)

Full-stack integration:

- ✅ Frontend → Backend → Database → Redis flow
- ✅ REST + GraphQL integration
- ✅ Authentication & authorization
- ✅ File uploads/downloads
- ✅ WebSocket concurrency (1000+ connections)
- ✅ Database transactions

**Estimated Runtime**: 4-6 minutes

### 5. Chaos Testing (05-chaos-testing.spec.ts)

Resilience testing:

- ✅ Agent failures and recovery
- ✅ Redis disconnection handling
- ✅ Database connection loss
- ✅ High CPU/memory load
- ✅ Network issues
- ✅ Invalid data handling

**Estimated Runtime**: 3-5 minutes

### 6. Real-World Scenarios (06-real-world-scenarios.spec.ts)

Production workflows:

- ✅ Code Review Workflow (3 agents + 1 human)
- ✅ Self-Improvement Sprint (5 agents)
- ✅ Documentation Generation

**Estimated Runtime**: 5-8 minutes

## 📊 Test Reports

Test reports are generated in:

```
reports/e2e/
├── test-report-YYYYMMDD_HHMMSS.json    # JSON report
└── test-report-YYYYMMDD_HHMMSS.html    # HTML report
```

Open the HTML report in a browser for detailed results.

## 🔧 Configuration

### Environment Variables

Create a `.env.test` file:

```bash
# API URLs
API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3004
FRONTEND_URL=http://localhost:3000
WS_URL=ws://localhost:3004

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thenewfuse_test

# Redis
REDIS_URL=redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570

# GraphQL
GRAPHQL_URL=http://localhost:3001/graphql

# Test Configuration
TEST_TIMEOUT=300000
PARALLEL_WORKERS=1
```

### Playwright Configuration

See `playwright.config.ts` in the root directory for configuration options.

## 📈 Success Criteria

Tests are considered passing if:

- ✅ Overall pass rate ≥ 95%
- ✅ No critical failures
- ✅ Response times within acceptable limits
- ✅ Error rate < 5%
- ✅ All security tests pass

## 🐛 Troubleshooting

### Services Not Running

```bash
# Check service status
docker-compose -f docker-compose.local.yml ps

# Start services
docker-compose -f docker-compose.local.yml up -d

# Check logs
docker-compose -f docker-compose.local.yml logs -f
```

### Database Connection Issues

```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Reset database
pnpm run db:reset
```

### Redis Connection Issues

```bash
# Check Redis
redis-cli ping

# Restart Redis
docker restart tnf-redis
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001
lsof -i :3004

# Kill process using port (example)
kill -9 $(lsof -ti:3000)
```

### Test Timeouts

If tests are timing out:

1. Increase timeout in test file
2. Check system resources (CPU, memory)
3. Reduce parallel test execution
4. Check network latency

## 🔍 Debugging Tests

### Run in Debug Mode

```bash
# Debug with Playwright Inspector
PWDEBUG=1 pnpm exec playwright test

# Debug specific test
PWDEBUG=1 pnpm exec playwright test -g "Agent Registration"

# Run with verbose output
pnpm exec playwright test --reporter=list
```

### View Test Traces

```bash
# Generate trace
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

## 📝 Writing New Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('My Test Suite', () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Setup code
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`);
    authToken = authResponse.data.token;
  });

  test('My Test Case', async () => {
    // Test code
    const response = await axios.get(`${API_BASE_URL}/endpoint`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('expectedField');
  });

  test.afterAll(async () => {
    // Cleanup code
  });
});
```

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping" --health-interval 10s --health-timeout
          5s --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: ./test-suite/e2e/run-e2e-tests.sh

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: reports/e2e/
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [The New Fuse Documentation](../../docs/)
- [Production Readiness Report](../../PRODUCTION_READINESS_REPORT.md)
- [Architecture Documentation](../../docs/architecture/)

## 🤝 Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Add appropriate comments and documentation
3. Ensure tests are idempotent and can run multiple times
4. Clean up resources in `afterAll` hooks
5. Update this README with new test information

## 📞 Support

- Issues: [GitHub Issues](https://github.com/whodaniel/fuse/issues)
- Discussions:
  [GitHub Discussions](https://github.com/whodaniel/fuse/discussions)
- Documentation: Check the `docs/` directory

---

**Happy Testing!** 🚀
