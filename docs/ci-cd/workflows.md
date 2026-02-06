# Workflows Guide

Complete guide to all GitHub Actions workflows in The New Fuse CI/CD pipeline.

## Overview

| Workflow           | File                | Triggers                   | Purpose                    |
| ------------------ | ------------------- | -------------------------- | -------------------------- |
| Test Suite         | `test.yml`          | PR, Push                   | Run all tests and checks   |
| Build Verification | `build.yml`         | PR, Push                   | Build and verify artifacts |
| Deploy             | `deploy.yml`        | Push to main, Tags, Manual | Deploy to Railway          |
| Quality Gates      | `quality.yml`       | PR, Push, Weekly           | Enforce quality standards  |
| PR Automation      | `pr-automation.yml` | PR events                  | Automate PR management     |

## Test Workflow (`test.yml`)

### Purpose

Runs comprehensive test suite including linting, type checking, unit tests,
integration tests, and E2E tests.

### When It Runs

- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual dispatch

### Jobs

#### 1. Setup

- Installs Node.js 20
- Sets up pnpm 10.22.0
- Caches dependencies
- Installs packages

**Duration**: ~2-3 minutes

#### 2. Lint

- Runs ESLint on all TypeScript/JavaScript files
- Runs Prettier to check code formatting
- Fails on any linting errors

**Duration**: ~1-2 minutes

**Common failures**:

- Unused variables
- Missing semicolons
- Incorrect formatting

**Fix**:

```bash
pnpm run lint:fix
pnpm run format
```

#### 3. Type Check

- Runs TypeScript compiler in check mode
- Verifies all types are correct
- Checks all apps and packages

**Duration**: ~2-3 minutes

**Common failures**:

- Type mismatches
- Missing type definitions
- Import errors

**Fix**:

```bash
pnpm run type-check
```

#### 4. Unit Tests

- Runs unit tests in 4 parallel shards
- Generates coverage reports
- Tests all packages

**Duration**: ~5-8 minutes (parallelized)

**Common failures**:

- Test assertion failures
- Mock issues
- Environment setup problems

**Fix**:

```bash
pnpm run test:unit
```

#### 5. Integration Tests

- Runs integration tests with real services
- Spins up Postgres and Redis
- Tests API endpoints and database operations

**Duration**: ~5-10 minutes

**Services**:

- PostgreSQL 16
- Redis 7

**Common failures**:

- Database connection issues
- Missing migrations
- Service timeout

**Fix**:

```bash
# Run locally with Docker
pnpm run docker:start
pnpm run test:integration
```

#### 6. E2E Tests

- Runs Playwright tests
- Tests full user workflows
- Uses Chromium browser

**Duration**: ~10-15 minutes

**Common failures**:

- Element not found
- Timeout waiting for elements
- Browser crashes

**Fix**:

```bash
pnpm run test:e2e
pnpm exec playwright show-report
```

#### 7. Security Scan

- Runs `pnpm audit`
- Runs Trivy filesystem scan
- Uploads results to GitHub Security

**Duration**: ~2-3 minutes

**Common failures**:

- Critical vulnerabilities found
- High-severity issues

**Fix**:

```bash
pnpm audit fix
```

#### 8. Coverage

- Aggregates coverage from all test runs
- Uploads to Codecov
- Comments on PR with coverage report

**Duration**: ~1-2 minutes

**Requirements**:

- Minimum 70% overall coverage
- New code should have 80%+ coverage

### Total Duration

Approximately 15-20 minutes (parallelized)

---

## Build Workflow (`build.yml`)

### Purpose

Builds all packages and applications, verifies artifacts, and tests production
builds.

### When It Runs

- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual dispatch

### Jobs

#### 1. Setup

Same as test workflow

#### 2. Build Packages

- Builds all packages in dependency order
- Uses Turbo for orchestration
- Uploads artifacts

**Duration**: ~5-8 minutes

**Output**:

- `packages/*/dist`
- `packages/*/lib`
- `packages/*/types`

**Common failures**:

- TypeScript compilation errors
- Missing dependencies
- Build script errors

**Fix**:

```bash
pnpm run build:packages
```

#### 3. Build Apps

- Builds each app in parallel
- Includes: api-gateway, api, backend, frontend
- Verifies build artifacts exist

**Duration**: ~8-12 minutes (parallelized)

**Matrix**:

```yaml
- api-gateway (NestJS)
- api (NestJS)
- backend (NestJS)
- frontend (Vite)
```

**Common failures**:

- Build errors
- Missing environment variables
- Asset loading issues

**Fix**:

```bash
pnpm run build:api
pnpm run build:frontend
pnpm run build:backend
pnpm run build:gateway
```

#### 4. Bundle Analysis

- Calculates bundle sizes
- Compares to base branch
- Comments on PR with results

**Duration**: ~1-2 minutes

**Checks**:

- Total bundle size
- JavaScript bundle size
- Fails if >10% increase

**Fix**:

```bash
# Analyze bundle
pnpm run build:analyze

# Check what's in the bundle
npx vite-bundle-analyzer dist
```

#### 5. Production Smoke Test

- Tests that production builds start
- Verifies critical files exist
- Quick sanity check

**Duration**: ~2-3 minutes per app

**Common failures**:

- Build artifacts missing
- Runtime errors on startup

### Total Duration

Approximately 15-20 minutes

---

## Deploy Workflow (`deploy.yml`)

### Purpose

Deploys all services to Railway with health checks and automated rollback.

### When It Runs

- Push to `main` branch
- Git tags matching `v*.*.*`
- Manual dispatch (with environment selection)

### Manual Deployment

```yaml
# Trigger manually
Inputs:
  environment: production | staging
  services: all | api,backend,frontend,gateway
```

### Jobs

#### 1. Pre-Deploy Checks

- Determines environment
- Determines which services to deploy
- Posts deployment info

**Duration**: <1 minute

#### 2. Build and Test

- Runs full test suite
- Must pass before deployment
- Uses test.yml workflow

**Duration**: ~15-20 minutes

#### 3. Build Images

- Builds Docker images for each service
- Pushes to Docker Hub
- Tags with commit SHA and version

**Duration**: ~10-15 minutes

**Matrix**:

```yaml
- api-gateway:3001
- api:3002
- backend:3003
- frontend:3000
```

**Caching**: Uses GitHub Actions cache

#### 4. Deploy to Railway

- Deploys each service to Railway
- Uses Railway CLI
- Runs in parallel

**Duration**: ~5-10 minutes

**Services**:

```yaml
api-gateway → Railway service: api-gateway
api → Railway service: api
backend → Railway service: backend
frontend → Railway service: frontend
```

#### 5. Health Checks

- Waits 30 seconds for startup
- Checks `/health` endpoints
- Retries up to 10 times with 10s delay
- Initiates rollback on failure

**Duration**: ~2-5 minutes

**Health endpoints**:

```
api-gateway: /health
api: /health
backend: /health
frontend: / (200 OK)
```

**Rollback**: Automatic via `railway rollback`

#### 6. Post-Deployment Tests

- Runs smoke tests
- Verifies critical functionality
- Tests API and frontend

**Duration**: ~2-3 minutes

#### 7. Notifications

- Sends Slack notification
- Creates deployment summary
- Posts to GitHub summary

**Duration**: <1 minute

### Total Duration

Approximately 35-50 minutes

### Deployment Strategy

**Zero-Downtime**:

- Railway handles rolling updates
- Health checks before traffic routing
- Old version runs until new version healthy

**Rollback on Failure**:

- Automatic rollback if health checks fail
- Previous version restored
- Notification sent

---

## Quality Gates (`quality.yml`)

### Purpose

Enforces quality standards for code coverage, bundle size, performance, and
security.

### When It Runs

- Pull requests
- Pushes to main
- Weekly on Sundays
- Manual dispatch

### Jobs

#### 1. Coverage Check

- Runs tests with coverage
- Enforces minimum thresholds
- Uploads to Codecov

**Duration**: ~10-15 minutes

**Thresholds**:

- Overall: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

#### 2. Bundle Size Check

- Builds base and PR branches
- Compares bundle sizes
- Comments on PR

**Duration**: ~10-12 minutes

**Checks**:

- Total bundle size
- Size difference
- Percentage change

**Limits**:

- Warning: >5% increase
- Failure: >10% increase

#### 3. Lighthouse CI

- Runs Lighthouse performance tests
- Tests on localhost
- Uploads results

**Duration**: ~5-8 minutes

**Metrics**:

- Performance: >80
- Accessibility: >90
- Best Practices: >90
- SEO: >90

#### 4. Dependency Audit

- Runs `pnpm audit`
- Checks for vulnerabilities
- Fails on critical issues

**Duration**: ~1-2 minutes

**Thresholds**:

- Critical: Fail immediately
- High: Warn if >5

#### 5. Code Quality

- SonarCloud analysis
- Code smells
- Security hotspots
- Maintainability

**Duration**: ~3-5 minutes

#### 6. Circular Dependencies

- Checks for circular imports
- Uses madge
- Reports on all apps and packages

**Duration**: ~2-3 minutes

### Total Duration

Approximately 30-40 minutes

---

## PR Automation (`pr-automation.yml`)

### Purpose

Automates PR management, labeling, reviews, and checks.

### When It Runs

- PR opened, synchronized, reopened, edited
- Labels added/removed
- Review submitted
- Comments created

### Jobs

#### 1. Auto Label

- Labels based on changed files
- Labels based on PR size
- Uses labeler.yml config

**Labels**:

- `frontend`, `backend`, `api`
- `documentation`, `ci`, `testing`
- `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL`

#### 2. Auto Assign Reviewers

- Assigns reviewers based on code ownership
- Uses team assignments
- Skips PR author

**Rules**:

```yaml
apps/frontend/** → frontend-team apps/api/** → backend-team packages/** →
core-team *.md → docs-team
```

#### 3. PR Title Check

- Enforces conventional commits
- Validates format
- Comments if invalid

**Format**: `type(scope): description`

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore

#### 4. Check Description

- Ensures adequate description
- Checks for required sections
- Minimum 50 characters

**Required sections**:

- ## Summary
- ## Changes
- ## Testing

#### 5. Auto-Merge Dependabot

- Auto-approves patch/minor updates
- Auto-merges if tests pass
- Labels major updates

**Conditions**:

- PR author is dependabot[bot]
- Update type is patch or minor
- All checks pass

#### 6. Welcome Contributors

- Detects first-time contributors
- Posts welcome message
- Provides guidelines

#### 7. Update PR Status

- Tracks CI status
- Comments on completion
- Updates PR with status

---

## Dependabot

### Configuration

File: `.github/dependabot.yml`

### Update Schedule

- **Frequency**: Weekly on Mondays at 9:00 AM
- **Open PRs**: Max 10 per ecosystem

### Ecosystems Monitored

1. **npm** (root)
   - All direct and indirect dependencies
   - Groups related updates (React, NestJS, etc.)
2. **npm** (per app)
   - App-specific dependencies
3. **GitHub Actions**
   - Workflow action updates
4. **Docker**
   - Base image updates

### Auto-Merge

- Minor and patch updates: Auto-approved and merged
- Major updates: Labeled `dependencies-major`, requires review

### Groups

```yaml
react: react*, @types/react*
nestjs: @nestjs/*
testing: jest*, @testing-library/*, vitest*
typescript: typescript, @typescript-eslint/*, ts-*
eslint: eslint*, @eslint/*
```

---

## Common Workflow Patterns

### Running Workflows Manually

```bash
# Via GitHub UI
1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Select branch and inputs
5. Click "Run workflow"

# Via GitHub CLI
gh workflow run test.yml
gh workflow run deploy.yml -f environment=staging -f services=frontend
```

### Monitoring Workflow Runs

```bash
# List recent runs
gh run list --workflow=test.yml

# View specific run
gh run view <run-id>

# Watch run in real-time
gh run watch <run-id>

# Download artifacts
gh run download <run-id>
```

### Debugging Failed Workflows

1. **Check workflow logs**:
   - Click on failed job
   - Expand failed step
   - Review error messages

2. **Re-run with debug logging**:

   ```bash
   # Enable debug logs
   gh run rerun <run-id> --debug
   ```

3. **Test locally**:

   ```bash
   # Install act
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Run workflow locally
   act -j test
   ```

### Skipping Workflows

Add to commit message:

```bash
git commit -m "docs: update README [skip ci]"
git commit -m "chore: formatting [ci skip]"
```

---

## Best Practices

### For Contributors

1. **Before opening PR**:
   - Run tests locally
   - Check linting
   - Verify builds

2. **PR description**:
   - Include required sections
   - Provide context
   - Link related issues

3. **During review**:
   - Fix CI failures promptly
   - Respond to feedback
   - Keep PR up to date

### For Maintainers

1. **Reviewing PRs**:
   - Check all CI passes
   - Review coverage reports
   - Check bundle size impacts

2. **Merging**:
   - Use squash merge
   - Edit commit message
   - Ensure conventional format

3. **Deployment**:
   - Monitor health checks
   - Watch for errors
   - Be ready to rollback
