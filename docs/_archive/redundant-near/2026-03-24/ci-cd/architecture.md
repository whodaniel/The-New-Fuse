# CI/CD Architecture

## Overview

The New Fuse CI/CD pipeline is built on GitHub Actions and integrates with Railway for deployment. The architecture is designed for:

- **Speed**: Parallel execution and intelligent caching
- **Reliability**: Comprehensive testing and health checks
- **Quality**: Multiple quality gates and automated checks
- **Automation**: Minimal manual intervention required

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer                                │
│                            ↓                                     │
│                      Push/PR Created                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Triggers                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                ┌─────────────┴─────────────┐
                ↓                           ↓
┌───────────────────────┐      ┌──────────────────────┐
│   PR Automation       │      │   Test Workflow      │
│   - Auto-label        │      │   - Lint             │
│   - Assign reviewers  │      │   - Type check       │
│   - Check title       │      │   - Unit tests       │
│   - Welcome message   │      │   - Integration      │
└───────────────────────┘      │   - E2E tests        │
                               │   - Security scan    │
                               └──────────────────────┘
                                          ↓
                               ┌──────────────────────┐
                               │  Quality Gates       │
                               │  - Coverage check    │
                               │  - Bundle size       │
                               │  - Lighthouse CI     │
                               │  - Security audit    │
                               │  - Code quality      │
                               └──────────────────────┘
                                          ↓
                               ┌──────────────────────┐
                               │  Build Workflow      │
                               │  - Build packages    │
                               │  - Build apps        │
                               │  - Verify artifacts  │
                               │  - Smoke tests       │
                               └──────────────────────┘
                                          ↓
                          (On merge to main)
                                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Deploy Workflow                              │
│                                                                  │
│   ┌──────────────────┐                                          │
│   │ Pre-Deploy Check │                                          │
│   └────────┬─────────┘                                          │
│            ↓                                                     │
│   ┌──────────────────┐                                          │
│   │ Build & Test     │                                          │
│   └────────┬─────────┘                                          │
│            ↓                                                     │
│   ┌──────────────────────────────────────┐                     │
│   │ Build Docker Images (Parallel)       │                     │
│   │ - api-gateway                        │                     │
│   │ - api                                │                     │
│   │ - backend                            │                     │
│   │ - frontend                           │                     │
│   └────────┬─────────────────────────────┘                     │
│            ↓                                                     │
│   ┌──────────────────────────────────────┐                     │
│   │ Deploy to Railway (Parallel)         │                     │
│   │ - api-gateway → Railway              │                     │
│   │ - api → Railway                      │                     │
│   │ - backend → Railway                  │                     │
│   │ - frontend → Railway                 │                     │
│   └────────┬─────────────────────────────┘                     │
│            ↓                                                     │
│   ┌──────────────────────────────────────┐                     │
│   │ Health Checks (Parallel)             │                     │
│   │ - Check /health endpoints            │                     │
│   │ - Retry with backoff                 │                     │
│   │ - Rollback on failure                │                     │
│   └────────┬─────────────────────────────┘                     │
│            ↓                                                     │
│   ┌──────────────────┐                                          │
│   │ Smoke Tests      │                                          │
│   └────────┬─────────┘                                          │
│            ↓                                                     │
│   ┌──────────────────┐                                          │
│   │ Notifications    │                                          │
│   │ - Slack          │                                          │
│   │ - GitHub Summary │                                          │
│   └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Components

### 1. Test Workflow (`test.yml`)

**Triggers**: PR creation, commits to PR, push to main/develop

**Jobs**:
- **Setup**: Install dependencies, cache node_modules
- **Lint**: ESLint and Prettier checks
- **Type Check**: TypeScript compilation
- **Unit Tests**: Run in 4 parallel shards for speed
- **Integration Tests**: With Postgres and Redis services
- **E2E Tests**: Playwright tests with browser automation
- **Security Scan**: Trivy and npm audit
- **Coverage**: Aggregate and upload to Codecov

**Parallelization**: 4 unit test shards run simultaneously

**Caching**:
- pnpm store cache
- Turbo build cache
- node_modules cache

### 2. Build Workflow (`build.yml`)

**Triggers**: PR creation, commits to PR, push to main/develop

**Jobs**:
- **Setup**: Dependencies and caching
- **Build Packages**: Build all packages in dependency order
- **Build Apps**: Build each app in parallel (api-gateway, api, backend, frontend)
- **Bundle Analysis**: Analyze and report bundle sizes on PRs
- **Production Smoke Test**: Verify builds start correctly

**Artifacts**: Build outputs stored for 7 days

### 3. Deploy Workflow (`deploy.yml`)

**Triggers**:
- Push to main
- Git tags (v*.*.*)
- Manual dispatch with environment selection

**Jobs**:
- **Pre-Deploy Checks**: Determine environment and services to deploy
- **Build and Test**: Runs full test suite
- **Build Images**: Build Docker images for each service
- **Deploy to Railway**: Deploy services with Railway CLI
- **Health Checks**: Verify deployments with retries
- **Post-Deployment Tests**: Run smoke tests
- **Notify**: Send Slack notifications

**Environments**: Production and Staging

**Rollback Strategy**: Automatic rollback on health check failure

### 4. Quality Gates (`quality.yml`)

**Triggers**: PRs, pushes to main, weekly schedule

**Jobs**:
- **Coverage Check**: Enforce minimum 70% coverage
- **Bundle Size Check**: Compare bundle sizes, fail if >10% increase
- **Lighthouse CI**: Performance, accessibility, SEO checks
- **Dependency Audit**: Security vulnerability scanning
- **Code Quality**: SonarCloud integration
- **Circular Dependencies**: Detect circular imports

**Thresholds**:
- Coverage: 70% minimum
- Bundle size: <10% increase
- Performance: >80 Lighthouse score
- Accessibility: >90 Lighthouse score

### 5. PR Automation (`pr-automation.yml`)

**Triggers**: PR events, reviews, comments

**Jobs**:
- **Auto-Label**: Label based on changed files and PR size
- **Auto-Assign Reviewers**: Based on code ownership
- **PR Title Check**: Enforce conventional commits
- **Check Description**: Ensure adequate PR description
- **Auto-Merge Dependabot**: Auto-approve and merge minor/patch updates
- **Welcome Contributors**: Welcome first-time contributors
- **Update Status**: Track and report CI status

## Caching Strategy

### pnpm Cache
```yaml
~/.cache/pnpm
node_modules
apps/*/node_modules
packages/*/node_modules
```

**Key**: `${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`

### Turbo Cache
```yaml
.turbo
```

**Key**: Per-job, includes job name and git SHA

### Build Artifacts
- Packages: 7-day retention
- Apps: 7-day retention
- Test reports: 7-day retention

## Resource Optimization

### Memory Management
- Build jobs: 4GB Node heap (`--max-old-space-size=4096`)
- Test jobs: 4GB Node heap
- Build concurrency: Limited to 2 concurrent builds

### Parallel Execution
- Unit tests: 4 parallel shards
- App builds: All apps build in parallel
- Deployments: All services deploy in parallel
- Health checks: All services checked in parallel

## Security

### Secrets Management
All secrets stored in GitHub Secrets:
- `RAILWAY_TOKEN`: Railway API token
- `CODECOV_TOKEN`: Codecov upload token
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `SLACK_WEBHOOK`: Slack notification webhook
- `SONAR_TOKEN`: SonarCloud token
- `TURBO_TOKEN`: Turborepo remote cache token

### Security Scanning
- **Trivy**: Container and filesystem scanning
- **npm audit**: Dependency vulnerability scanning
- **SonarCloud**: Code quality and security analysis
- **Dependabot**: Automated security updates

## Monitoring & Observability

### Build Metrics
- Build duration
- Test duration
- Cache hit rates
- Artifact sizes

### Deployment Metrics
- Deployment frequency
- Deployment success rate
- Rollback frequency
- Health check response times

### Quality Metrics
- Test coverage trends
- Bundle size trends
- Lighthouse score trends
- Security vulnerabilities

## Disaster Recovery

### Rollback Procedures
1. Automatic rollback on health check failure
2. Manual rollback via Railway CLI
3. Deploy previous tag/commit

### Backup Strategies
- Git history provides code backup
- Docker images tagged with commit SHA
- Build artifacts retained for 7 days

## Continuous Improvement

### Metrics to Monitor
- CI/CD execution time
- Test flakiness
- Deployment success rate
- Quality gate pass rate

### Optimization Opportunities
- Further parallelize test execution
- Optimize cache strategies
- Reduce Docker image sizes
- Improve test execution speed
