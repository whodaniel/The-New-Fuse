# TNF Continuous Testing System

## Overview

The TNF Continuous Testing System is a multi-agent framework that runs constant
loops of specialized testing agents to ensure the website is production-ready.
Each agent has a specific specialty and runs tests in a continuous cycle until
the target quality score is achieved.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 PRODUCTION-READY FLYWHEEL                       │
│              (Master Orchestrator Script)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    WEBSITE    │   │ INTEGRATION   │   │    UI/UX      │
│ TESTING AGENT │   │ TESTING AGENT │   │ TESTING AGENT │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ • Frontend    │   │ • API Tests   │   │ • Components  │
│ • Backend     │   │ • Database    │   │ • Accessibility│
│ • Build       │   │ • Services    │   │ • Design      │
│ • Type Check  │   │ • Config      │   │ • Routing     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPPORTING AGENTS                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   IMPROVER      │   NEWS SCOUT    │    LLM TEST FLYWHEEL        │
│ (System Health) │ (Market Intel)  │  (Model Benchmarking)       │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Quick Start

### Run All Tests Once

```bash
# Using npm scripts
pnpm run test:website          # Website testing agent only
pnpm run test:integration:agent # Integration testing agent only
pnpm run test:uiux             # UI/UX testing agent only

# Run full flywheel once
pnpm run flywheel:production
```

### Run Continuous Loop

```bash
# Run continuous testing until 95% score achieved
pnpm run flywheel:production:loop

# Or with custom settings
TARGET_SCORE=90 LOOP_INTERVAL=120000 pnpm run flywheel:production:loop
```

## Agent Specialties

### 1. Website Testing Agent (`website-testing-agent.cjs`)

**Purpose**: Tests frontend and backend build, type-check, and unit tests.

**Tests Performed**:

- TypeScript type checking
- ESLint code quality
- Production build
- Unit tests (Vitest/Jest)
- Critical file existence

**Output**: `.agent/test-reports/test-report-*.json`

### 2. Integration Testing Agent (`integration-test-agent.cjs`)

**Purpose**: Tests API endpoints, database connections, and service
integrations.

**Tests Performed**:

- API endpoint discovery
- Database schema validation
- Migration status
- Service configuration (Redis, Firebase)
- MCP server availability

**Output**: `.agent/test-reports/integration-report-*.json`

### 3. UI/UX Testing Agent (`uiux-testing-agent.cjs`)

**Purpose**: Tests user interface quality, accessibility, and design
consistency.

**Tests Performed**:

- Component structure analysis
- Accessibility patterns (ARIA, roles, alt text)
- Design system consistency
- Routing structure
- Theme configuration

**Output**: `.agent/test-reports/uiux-report-*.json`

### 4. Continuous Improver (`improver/scan.cjs`)

**Purpose**: System health diagnostics and tech debt tracking.

**Tests Performed**:

- TNF Doctor diagnostics
- Lint baseline
- TODO/FIXME scanning
- Redis task dispatch

### 5. News Scout (`swarm/news-scout.cjs`)

**Purpose**: Market intelligence and competitor tracking.

### 6. LLM Test Flywheel (`swarm/llm-test-flywheel.cjs`)

**Purpose**: LLM model viability and benchmarking.

## Configuration

### Environment Variables

| Variable              | Default  | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `TARGET_SCORE`        | `95`     | Target quality score to achieve (0-100)          |
| `MAX_ITERATIONS`      | `0`      | Maximum iterations (0 = infinite)                |
| `LOOP_INTERVAL`       | `300000` | Milliseconds between iterations (default: 5 min) |
| `TEST_LOOP_INTERVAL`  | `300000` | Interval for continuous testing loop             |
| `TEST_MAX_ITERATIONS` | `0`      | Max iterations for testing loop                  |
| `TEST_TARGET_SCORE`   | `95`     | Target score for testing loop                    |

### Example Configuration

```bash
# Run with 1-minute intervals, target 90% score
LOOP_INTERVAL=60000 TARGET_SCORE=90 pnpm run flywheel:production:loop

# Run exactly 10 iterations
MAX_ITERATIONS=10 pnpm run flywheel:production
```

## Output and Reports

### Test Reports Location

All test reports are saved to: `.agent/test-reports/`

### Report Format

```json
{
  "timestamp": "2026-02-22T18:00:00.000Z",
  "frontend": {
    "passed": 5,
    "failed": 2,
    "errors": [...]
  },
  "backend": {
    "passed": 4,
    "failed": 1,
    "errors": [...]
  },
  "integration": {
    "passed": 6,
    "failed": 0,
    "errors": []
  },
  "overall": {
    "score": 75,
    "status": "needs-attention"
  }
}
```

### Status Values

- `healthy` (80-100%): System is in good shape
- `needs-attention` (60-79%): Some issues need addressing
- `critical` (0-59%): Immediate attention required

### Flywheel State

The flywheel state is saved to: `.agent/flywheel-status.json`

```json
{
  "iteration": 5,
  "startTime": 1677081600000,
  "lastRun": "2026-02-22T18:30:00.000Z",
  "bestScore": 85,
  "currentScore": 82,
  "status": "running",
  "phases": {
    "website": { "success": true, "duration": "45.2" },
    "integration": { "success": true, "duration": "12.3" },
    ...
  }
}
```

## NPM Scripts Reference

| Script                     | Description                        |
| -------------------------- | ---------------------------------- |
| `test:website`             | Run website testing agent once     |
| `test:integration:agent`   | Run integration testing agent once |
| `test:uiux`                | Run UI/UX testing agent once       |
| `test:continuous`          | Run continuous testing loop        |
| `flywheel:production`      | Run full flywheel once             |
| `flywheel:production:loop` | Run flywheel in continuous loop    |

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Continuous Testing
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Production Flywheel
        run: pnpm run flywheel:production
        env:
          TARGET_SCORE: 90
```

## Troubleshooting

### Common Issues

1. **"pnpm: command not found"**
   - Solution: Use the shell wrapper script: `bash scripts/swarm/run-tests.sh`
   - Or ensure NVM is sourced: `source ~/.nvm/nvm.sh`

2. **Tests timeout**
   - Increase timeout: `LOOP_INTERVAL=600000 pnpm run flywheel:production`

3. **Low score despite passing tests**
   - Check individual agent reports in `.agent/test-reports/`
   - Review error messages for specific failures

4. **Flywheel stops unexpectedly**
   - Check `.agent/flywheel-status.json` for last state
   - Review terminal output for error messages

## Best Practices

1. **Start with a single run** before enabling continuous mode
2. **Review test reports** to understand what needs fixing
3. **Set realistic target scores** (start with 80%, increase gradually)
4. **Monitor system resources** during continuous runs
5. **Use MAX_ITERATIONS** for testing new configurations

## Future Enhancements

- [ ] Add E2E testing agent (Playwright)
- [ ] Add performance testing agent (Lighthouse)
- [ ] Add security testing agent (OWASP checks)
- [ ] Add visual regression testing
- [ ] Add Slack/Discord notifications
- [ ] Add auto-fix capabilities for common issues
