# CI/CD Troubleshooting Guide

Common issues and solutions for The New Fuse CI/CD pipeline.

## Table of Contents

- [Test Failures](#test-failures)
- [Build Failures](#build-failures)
- [Deployment Failures](#deployment-failures)
- [Quality Gate Failures](#quality-gate-failures)
- [Performance Issues](#performance-issues)
- [Infrastructure Issues](#infrastructure-issues)

## Test Failures

### Lint Failures

**Symptom**: ESLint or Prettier errors

**Error**:
```
Error: Expected 1 space after semicolon (semi-spacing)
Error: Delete `·` (prettier/prettier)
```

**Solution**:
```bash
# Auto-fix linting issues
pnpm run lint:fix

# Auto-fix formatting
pnpm run format

# Check what would be fixed
pnpm run lint
```

**Prevention**:
- Set up pre-commit hooks
- Configure editor to auto-format
- Use Prettier extension

---

### Type Check Failures

**Symptom**: TypeScript compilation errors

**Error**:
```
apps/frontend/src/App.tsx:45:12 - error TS2345:
Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution**:
```bash
# Run type check locally
pnpm run type-check

# Check specific package
cd apps/frontend
pnpm run type-check

# Clean and rebuild
pnpm run clean
pnpm install
pnpm run type-check
```

**Common causes**:
- Missing type definitions
- Incompatible package versions
- Import path issues

**Debug**:
```bash
# Check TypeScript version
pnpm list typescript

# Verify tsconfig
cat tsconfig.json

# Clear TypeScript cache
rm -rf **/*.tsbuildinfo
```

---

### Unit Test Failures

**Symptom**: Test assertions fail

**Error**:
```
FAIL packages/api/src/auth/auth.service.test.ts
  ● AuthService › should validate token

    expect(received).toBe(expected)

    Expected: true
    Received: false
```

**Solution**:
```bash
# Run failing test locally
pnpm run test:unit -- auth.service.test.ts

# Run in watch mode
pnpm run test:unit -- --watch

# Run with verbose output
pnpm run test:unit -- --verbose

# Update snapshots if needed
pnpm run test:unit -- -u
```

**Common causes**:
- Outdated mocks
- Environment differences
- Timing issues
- Missing setup/teardown

**Debug**:
```bash
# Run single test
pnpm run test:unit -- -t "should validate token"

# Show console logs
pnpm run test:unit -- --silent=false

# Increase timeout
pnpm run test:unit -- --testTimeout=10000
```

---

### Integration Test Failures

**Symptom**: Database or API tests fail

**Error**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check Docker services
docker ps
pnpm run docker:status

# Start services
pnpm run docker:start

# Check logs
pnpm run docker:logs

# Run tests
pnpm run test:integration
```

**Common causes**:
- Services not running
- Wrong connection strings
- Database not seeded
- Port conflicts

**Debug**:
```bash
# Test database connection
pnpm run db:test-connection

# Check environment variables
echo $DATABASE_URL

# Restart services
pnpm run docker:stop
pnpm run docker:start
sleep 10
pnpm run test:integration
```

---

### E2E Test Failures

**Symptom**: Playwright tests timeout or fail

**Error**:
```
Error: Timeout 30000ms exceeded.
waiting for selector "button[data-testid='submit']"
```

**Solution**:
```bash
# Run E2E tests locally
pnpm run test:e2e

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Debug mode
pnpm exec playwright test --debug

# Update snapshots
pnpm exec playwright test --update-snapshots

# Show report
pnpm exec playwright show-report
```

**Common causes**:
- Elements not rendered
- Wrong selectors
- Network delays
- Application not started

**Debug**:
```bash
# Run specific test
pnpm exec playwright test login.spec.ts

# Increase timeout
pnpm exec playwright test --timeout=60000

# Trace mode
pnpm exec playwright test --trace on

# Open trace viewer
pnpm exec playwright show-trace trace.zip
```

---

### Coverage Failures

**Symptom**: Coverage below threshold

**Error**:
```
Error: Coverage for statements (65%) does not meet threshold (70%)
```

**Solution**:
```bash
# Generate coverage report
pnpm run test:coverage

# View detailed report
open coverage/lcov-report/index.html

# Find uncovered lines
cat coverage/coverage-summary.json
```

**Fix**:
- Add tests for uncovered code
- Remove dead code
- Exclude test files from coverage
- Adjust thresholds (if justified)

**Configuration**:
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

---

## Build Failures

### Package Build Failures

**Symptom**: Package fails to compile

**Error**:
```
ERROR in src/index.ts
Module not found: Error: Can't resolve '@the-new-fuse/types'
```

**Solution**:
```bash
# Build dependencies first
pnpm run build:packages

# Build specific package
cd packages/types
pnpm run build

# Check for circular dependencies
pnpm run analyze:circular

# Clean and rebuild
pnpm run clean
pnpm install
pnpm run build:packages
```

**Common causes**:
- Missing dependencies
- Circular dependencies
- Build order issues
- Misconfigured tsconfig

**Debug**:
```bash
# Check package dependencies
cat packages/api/package.json | grep dependencies

# Verify build script
cat packages/api/package.json | grep '"build"'

# Check TypeScript references
cat packages/api/tsconfig.json
```

---

### App Build Failures

**Symptom**: Application build fails

**Error**:
```
✘ [ERROR] Could not resolve "process/browser"
```

**Solution**:
```bash
# Clean node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Build with verbose logging
BUILD_VERBOSE=true pnpm run build:frontend

# Check for environment variables
cat apps/frontend/.env.example
```

**For Vite (Frontend)**:
```bash
# Clear Vite cache
rm -rf apps/frontend/node_modules/.vite

# Build with source maps
pnpm run build:frontend -- --sourcemap

# Analyze bundle
pnpm run build:analyze
```

**For NestJS (Backend)**:
```bash
# Clean dist
rm -rf apps/api/dist

# Build with watch
cd apps/api
pnpm run build --watch
```

---

### Memory Issues

**Symptom**: Build runs out of memory

**Error**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Use memory-optimized build
pnpm run build:memory-optimized

# Build with low concurrency
BUILD_CONCURRENCY=1 pnpm run build

# Build sequentially
pnpm run build:staged
```

**For CI/CD**:
```yaml
# In workflow file
env:
  NODE_OPTIONS: '--max-old-space-size=8192'
  BUILD_CONCURRENCY: 2
```

---

### Cache Issues

**Symptom**: Stale cache causing build issues

**Solution**:
```bash
# Clear Turbo cache
pnpm run clean:cache

# Clear all caches
pnpm run clean:all

# Clear GitHub Actions cache
gh cache list
gh cache delete <cache-key>
```

**Force fresh build**:
```bash
# Disable cache
TURBO_FORCE=true pnpm run build

# In CI/CD, invalidate cache by changing cache key
```

---

## Deployment Failures

### CloudRuntime Deployment Failed

**Symptom**: Deployment fails on CloudRuntime

**Error**:
```
Error: Failed to deploy service api-gateway
```

**Solution**:
```bash
# Check CloudRuntime status
cloud_runtime status

# View deployment logs
cloud_runtime logs

# Check recent deployments
cloud_runtime deployments

# Redeploy
cloud_runtime up --service=api-gateway
```

**Common causes**:
- Build errors
- Missing environment variables
- Dockerfile issues
- Resource limits

**Debug**:
```bash
# Test Dockerfile locally
docker build -f apps/api-gateway/Dockerfile.cloud_runtime -t test .
docker run -p 3001:3001 test

# Check environment variables
cloud_runtime variables

# Increase resources
# Go to CloudRuntime dashboard → Settings → Resources
```

---

### Health Check Failed

**Symptom**: Health checks fail after deployment

**Error**:
```
Health check failed with code 502
```

**Solution**:
```bash
# Check service logs
cloud_runtime logs --service=api-gateway

# Test health endpoint locally
curl https://api-gateway.thenewfuse.com/health

# Check if service is running
cloud_runtime ps

# Restart service
cloud_runtime restart --service=api-gateway
```

**Common causes**:
- Service not started
- Wrong health check path
- Port mismatch
- Database connection issues

**Debug**:
```bash
# SSH into service
cloud_runtime shell

# Check process
ps aux | grep node

# Test locally
curl localhost:3001/health

# Check database connection
cloud_runtime run -- pnpm run db:test-connection
```

---

### Database Migration Failed

**Symptom**: Migrations fail during deployment

**Error**:
```
Error: Migration failed: duplicate column name
```

**Solution**:
```bash
# Check migration status
cloud_runtime run -- pnpm run db:migrate:status

# Rollback migration
cloud_runtime run -- pnpm run db:migrate:rollback

# Apply migrations manually
cloud_runtime run -- pnpm run db:migrate

# Verify schema
cloud_runtime run -- pnpm run db:studio
```

**Prevention**:
- Test migrations in staging
- Write reversible migrations
- Backup database before migrations

---

### Docker Build Failed

**Symptom**: Docker image build fails

**Error**:
```
ERROR: failed to solve: process "/bin/sh -c pnpm install" did not complete successfully
```

**Solution**:
```bash
# Test Dockerfile locally
docker build -f Dockerfile.cloud_runtime .

# Clear Docker cache
docker builder prune

# Build with no cache
docker build --no-cache -f Dockerfile.cloud_runtime .

# Check Dockerfile syntax
docker build --progress=plain -f Dockerfile.cloud_runtime .
```

**Common issues**:
- Wrong COPY paths
- Missing .dockerignore
- Invalid build args
- Multi-stage build issues

---

## Quality Gate Failures

### Bundle Size Too Large

**Symptom**: Bundle size exceeded limit

**Error**:
```
Bundle size increased by more than 10% (12.5%)
```

**Solution**:
```bash
# Analyze bundle
pnpm run build:analyze

# Check what's in bundle
npx vite-bundle-analyzer dist

# Find large dependencies
npx bundle-phobia <package-name>
```

**Fix strategies**:
1. **Code splitting**:
   ```typescript
   const Component = lazy(() => import('./Component'));
   ```

2. **Tree shaking**:
   ```javascript
   import { specific } from 'library'; // Instead of import * as lib
   ```

3. **Remove unused dependencies**:
   ```bash
   npx depcheck
   ```

4. **Use lighter alternatives**:
   - moment → date-fns
   - lodash → lodash-es

---

### Lighthouse Score Too Low

**Symptom**: Performance score below threshold

**Error**:
```
Performance score: 65 (expected: >80)
```

**Solution**:
```bash
# Run Lighthouse locally
npx lighthouse http://localhost:3000 --view

# Check specific metrics
npx lighthouse http://localhost:3000 --only-categories=performance
```

**Common issues**:
- Large images
- Blocking resources
- Unoptimized JavaScript
- No lazy loading

**Fixes**:
1. **Optimize images**: Use WebP, lazy load
2. **Code splitting**: Split large bundles
3. **Defer scripts**: Non-critical JavaScript
4. **Enable compression**: gzip/brotli
5. **Use CDN**: For static assets

---

### Security Vulnerabilities

**Symptom**: npm audit finds vulnerabilities

**Error**:
```
found 5 vulnerabilities (3 moderate, 2 high)
```

**Solution**:
```bash
# Check vulnerabilities
pnpm audit

# Fix automatically
pnpm audit fix

# Force updates
pnpm audit fix --force

# Check specific package
pnpm why <package-name>
```

**For unfixable vulnerabilities**:
1. Check if vulnerability affects your usage
2. Look for alternative packages
3. Pin to safe version
4. Add to audit exceptions (if justified)

---

## Performance Issues

### Slow CI/CD Runs

**Symptom**: Workflows take too long

**Solution**:
```bash
# Check cache hit rate
# In workflow logs, look for "Cache restored from key"

# Optimize caching
# Ensure proper cache keys
# Cache node_modules separately

# Reduce test time
# Run tests in parallel
# Skip unnecessary tests in CI

# Use matrix strategy
# Parallelize across multiple jobs
```

**Example optimization**:
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
run: pnpm run test --shard=${{ matrix.shard }}/4
```

---

### Slow Build Times

**Symptom**: Builds take too long

**Solution**:
```bash
# Use Turbo cache
export TURBO_TOKEN=<token>
export TURBO_TEAM=<team>

# Enable remote caching
turbo link

# Analyze build performance
pnpm run build --summarize

# Check for bottlenecks
pnpm run build --graph
```

---

## Infrastructure Issues

### GitHub Actions Quota Exceeded

**Symptom**: Workflows don't start

**Error**:
```
You have exceeded your GitHub Actions quota
```

**Solution**:
1. Check usage: Settings → Billing
2. Optimize workflows (reduce runs)
3. Use self-hosted runners
4. Upgrade plan

---

### CloudRuntime Resource Limits

**Symptom**: Service crashes due to resources

**Error**:
```
Error: Service killed due to memory limit
```

**Solution**:
```bash
# Check resource usage
cloud_runtime metrics --service=api-gateway

# Increase limits in CloudRuntime dashboard
# Settings → Resources → Increase memory/CPU

# Optimize application
# - Reduce memory usage
# - Improve caching
# - Fix memory leaks
```

---

## Getting Help

If you can't resolve an issue:

1. **Check logs**: Always start with logs
   ```bash
   gh run view <run-id>
   cloud_runtime logs --service=<service>
   ```

2. **Search for similar issues**: GitHub Issues

3. **Ask team**: Slack #devops channel

4. **Create incident**: For production issues

5. **Update docs**: Add solution to this guide

## Quick Reference

### Useful Commands

```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id>

# Cancel running workflow
gh run cancel <run-id>

# CloudRuntime status
cloud_runtime status

# CloudRuntime logs
cloud_runtime logs --tail 100

# CloudRuntime shell
cloud_runtime shell

# Test locally
pnpm run test
pnpm run build
pnpm run lint
```

### Emergency Contacts

- **DevOps Lead**: [email]
- **On-Call**: [pager]
- **Slack**: #devops-emergency
