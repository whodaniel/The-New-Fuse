# CI/CD Quick Reference

Quick reference for common CI/CD operations and commands.

## GitHub CLI Commands

### Viewing Workflows

```bash
# List recent runs
gh run list

# List runs for specific workflow
gh run list --workflow=test.yml

# View specific run
gh run view <run-id>

# Watch run in real-time
gh run watch

# View failed jobs
gh run list --status=failed

# Download artifacts
gh run download <run-id>
```

### Managing Workflows

```bash
# Run workflow manually
gh workflow run deploy.yml

# Run with inputs
gh workflow run deploy.yml -f environment=staging -f services=frontend

# List all workflows
gh workflow list

# View workflow details
gh workflow view test.yml

# Enable/disable workflow
gh workflow enable test.yml
gh workflow disable test.yml
```

### Re-running Workflows

```bash
# Re-run all jobs
gh run rerun <run-id>

# Re-run only failed jobs
gh run rerun <run-id> --failed

# Cancel running workflow
gh run cancel <run-id>
```

### Managing Secrets

```bash
# List secrets
gh secret list

# Set secret
gh secret set RAILWAY_TOKEN

# Set from file
gh secret set -f .env.secrets

# Remove secret
gh secret remove RAILWAY_TOKEN
```

## Railway CLI Commands

### Service Management

```bash
# Login
railway login

# Link to project
railway link

# List services
railway service

# Select service
railway service api-gateway

# Service status
railway status

# Service metrics
railway metrics

# Restart service
railway restart

# Environment variables
railway variables
railway variables set KEY=value
railway variables unset KEY
```

### Deployment

```bash
# Deploy current service
railway up

# Deploy specific service
railway up --service=api-gateway

# Deploy with detach
railway up --detach

# View deployments
railway deployments

# Rollback
railway rollback

# Rollback to specific deployment
railway rollback <deployment-id>
```

### Logs

```bash
# View logs
railway logs

# Follow logs
railway logs --tail 100 --follow

# Logs for specific service
railway logs --service=api-gateway

# Filter logs
railway logs --filter error
```

### Shell Access

```bash
# SSH into service
railway shell

# Run command
railway run -- pnpm run migrate

# Run with environment
railway run --service=backend -- pnpm run db:migrate
```

## pnpm Commands

### Testing

```bash
# Run all tests
pnpm run test

# Run unit tests
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run E2E tests
pnpm run test:e2e

# Run with coverage
pnpm run test:coverage

# Run specific test file
pnpm run test -- path/to/test.spec.ts

# Watch mode
pnpm run test -- --watch
```

### Building

```bash
# Build all
pnpm run build

# Build packages
pnpm run build:packages

# Build apps
pnpm run build:apps

# Build specific app
pnpm run build:frontend
pnpm run build:api
pnpm run build:backend
pnpm run build:gateway

# Clean and build
pnpm run clean
pnpm run build

# Memory-optimized build
pnpm run build:memory-optimized
```

### Linting

```bash
# Check linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format

# Type check
pnpm run type-check
```

### Development

```bash
# Start all services
pnpm run dev

# Start specific service
pnpm run dev:frontend
pnpm run dev:api
pnpm run dev:backend
pnpm run dev:gateway

# Clear ports
pnpm run clear-ports
```

## Docker Commands

### Building Images

```bash
# Build image
docker build -f apps/api/Dockerfile.railway -t fuse-api .

# Build with no cache
docker build --no-cache -f Dockerfile.railway -t fuse-api .

# Build all services
for service in api-gateway api backend frontend; do
  docker build -f apps/$service/Dockerfile.railway -t fuse-$service .
done
```

### Running Locally

```bash
# Run container
docker run -p 3001:3001 fuse-api

# Run with environment variables
docker run -p 3001:3001 --env-file .env fuse-api

# Run in background
docker run -d -p 3001:3001 fuse-api

# View logs
docker logs <container-id>

# Shell into container
docker exec -it <container-id> /bin/sh
```

### Docker Compose

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart api
```

## Git Commands

### Conventional Commits

```bash
# Feature
git commit -m "feat(frontend): add user dashboard"

# Bug fix
git commit -m "fix(api): resolve authentication issue"

# Documentation
git commit -m "docs: update API documentation"

# Chore
git commit -m "chore(deps): update dependencies"

# Style
git commit -m "style: fix linting errors"

# Refactor
git commit -m "refactor(backend): improve error handling"

# Performance
git commit -m "perf(frontend): optimize bundle size"

# Test
git commit -m "test(api): add integration tests"
```

### Tagging Releases

```bash
# Create tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# Push tag
git push origin v1.2.3

# List tags
git tag -l

# Delete tag
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
```

## Turbo Commands

```bash
# Run task
turbo run build

# Run with filter
turbo run build --filter=@the-new-fuse/frontend-app

# Run in specific packages
turbo run test --filter=./packages/*

# Force rebuild (skip cache)
turbo run build --force

# Dry run
turbo run build --dry-run

# Generate graph
turbo run build --graph

# Login for remote caching
turbo login

# Link to team
turbo link
```

## Common Workflows

### Creating a Feature

```bash
# 1. Create branch
git checkout -b feat/new-feature

# 2. Make changes
# ... code changes ...

# 3. Test locally
pnpm run test
pnpm run lint
pnpm run build

# 4. Commit
git add .
git commit -m "feat: add new feature"

# 5. Push
git push origin feat/new-feature

# 6. Create PR
gh pr create --title "feat: add new feature" --body "Description"
```

### Fixing CI Failures

```bash
# 1. View failed run
gh run list --status=failed
gh run view <run-id>

# 2. Download logs
gh run download <run-id>

# 3. Fix issues locally
pnpm run test
pnpm run lint:fix

# 4. Commit and push
git add .
git commit -m "fix: resolve CI failures"
git push
```

### Deploying to Production

```bash
# 1. Merge PR to main
# (via GitHub UI)

# 2. Monitor deployment
gh run watch

# 3. Check health
curl https://api.railway.app/health

# 4. Verify in Railway
railway status

# 5. Check logs
railway logs --tail 100
```

### Rolling Back Deployment

```bash
# 1. Via Railway
railway rollback --service=api-gateway

# 2. Via Git revert
git revert HEAD
git push origin main

# 3. Monitor rollback
gh run watch
railway status
```

### Updating Dependencies

```bash
# 1. Check for updates
pnpm outdated

# 2. Update specific package
pnpm update <package-name>

# 3. Update all
pnpm update

# 4. Test
pnpm run test

# 5. Commit
git commit -m "chore(deps): update dependencies"
```

## Troubleshooting Commands

### Clear All Caches

```bash
# pnpm cache
pnpm store prune

# Turbo cache
pnpm run clean:cache

# Node modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Build outputs
pnpm run clean

# Docker cache
docker builder prune -af

# GitHub Actions cache
gh cache list
gh cache delete <cache-key>
```

### Debug Build Issues

```bash
# Verbose build
BUILD_VERBOSE=true pnpm run build

# Check dependencies
pnpm list

# Verify TypeScript config
cat tsconfig.json

# Check for circular dependencies
pnpm run analyze:circular

# Build with monitoring
pnpm run build:monitor
```

### Debug Test Issues

```bash
# Run single test
pnpm run test -- -t "test name"

# Run with logs
pnpm run test -- --silent=false

# Update snapshots
pnpm run test -- -u

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Check System Health

```bash
# Node version
node --version

# pnpm version
pnpm --version

# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep node

# Kill port
lsof -ti:3000 | xargs kill -9
```

## Environment Variables

### Development

```bash
# Load from .env
export $(cat .env | xargs)

# Check variable
echo $DATABASE_URL

# Set temporarily
DATABASE_URL=postgres://... pnpm run dev

# Unset
unset DATABASE_URL
```

### Railway

```bash
# List variables
railway variables

# Set variable
railway variables set DATABASE_URL=postgres://...

# Unset variable
railway variables unset OLD_VAR

# Set from file
railway variables set --from-file .env.production
```

## Monitoring Commands

### Check CI/CD Health

```bash
# Recent workflow runs
gh run list --limit 20

# Success rate
gh run list --status completed --limit 100 | wc -l
gh run list --status failed --limit 100 | wc -l

# Average duration
gh run list --workflow=test.yml --limit 10
```

### Check Deployment Health

```bash
# All services status
railway status

# Service logs
railway logs --service=api-gateway --tail 100

# Metrics
railway metrics --service=api-gateway

# Database status
railway run -- pnpm run db:migrate:status
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# GitHub
alias ghrl='gh run list'
alias ghrv='gh run view'
alias ghrw='gh run watch'
alias ghpc='gh pr create'
alias ghpv='gh pr view'

# Railway
alias rws='railway status'
alias rwl='railway logs'
alias rwsh='railway shell'
alias rwd='railway deployments'
alias rwu='railway up'

# pnpm
alias pt='pnpm run test'
alias pb='pnpm run build'
alias pl='pnpm run lint'
alias pf='pnpm run format'
alias pd='pnpm run dev'

# Git
alias gcm='git commit -m'
alias gca='git commit --amend'
alias gp='git push'
alias gpl='git pull'
alias gs='git status'
```

## Quick Checks

### Pre-PR Checklist

```bash
✓ pnpm run lint
✓ pnpm run type-check
✓ pnpm run test
✓ pnpm run build
✓ git push
✓ gh pr create
```

### Pre-Deploy Checklist

```bash
✓ All tests pass
✓ PR approved
✓ Railway variables set
✓ Database migrations ready
✓ Monitoring alerts configured
```

### Post-Deploy Checklist

```bash
✓ Health checks pass
✓ No error spikes
✓ Performance acceptable
✓ Team notified
✓ Changelog updated
```

---

**Pro Tip**: Bookmark this page for quick reference!
