# Deployment Quick Reference

Fast reference guide for common deployment tasks.

## Quick Commands

### Standard Deployment

```bash
# Full automated deployment (blue-green strategy)
./scripts/deployment/orchestrate-deployment.sh

# With specific strategy
./scripts/deployment/orchestrate-deployment.sh --strategy=rolling
./scripts/deployment/orchestrate-deployment.sh --strategy=blue-green
./scripts/deployment/orchestrate-deployment.sh --strategy=canary
```

### Pre-Deployment

```bash
# Validate environment
./scripts/deployment/validate-deployment.sh

# Create database backup
./scripts/deployment/db-backup.sh

# Run database migrations
./scripts/deployment/db-migrate.sh
```

### Post-Deployment

```bash
# Run smoke tests
./scripts/deployment/smoke-tests.sh

# Run health checks
./scripts/deployment/health-check.sh

# Deep health check
./scripts/deployment/health-check.sh --deep
```

### Monitoring

```bash
# Show deployment dashboard
./scripts/deployment/deployment-dashboard.sh

# Auto-refresh dashboard
./scripts/deployment/deployment-dashboard.sh --watch

# View deployment logs
tail -f logs/deployment/deploy-*.log
```

### Rollback

```bash
# View deployment history
./scripts/deployment/deployment-dashboard.sh

# Rollback to previous deployment
./scripts/deployment/rollback.sh <deployment-id>

# Blue-green rollback
./scripts/deployment/blue-green-deploy.sh <service> rollback
```

### Notifications

```bash
# Test notifications
./scripts/deployment/notifications.sh test

# Send custom notification
./scripts/deployment/notifications.sh custom "Title" "Message" "status"
```

### GitHub Actions (gh CLI)

```bash
# List and inspect workflow runs
gh run list --limit 20
gh run view <run-id>
gh run watch

# Trigger deployment workflow manually
gh workflow run deploy.yml -f environment=staging -f services=frontend

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### CloudRuntime CLI (Direct Ops)

```bash
# Deploy or rollback a specific service
cloud_runtime up --service=api-gateway
cloud_runtime rollback --service=api-gateway

# Runtime checks
cloud_runtime status --service=api-gateway
cloud_runtime metrics --service=api-gateway
cloud_runtime logs --service=api-gateway --tail 100 --follow
```

### Local CI Sanity Commands

```bash
pnpm run lint
pnpm run type-check
pnpm run test
pnpm run build
```

## Service-Specific Deployments

```bash
# Deploy single service (blue-green)
./scripts/deployment/blue-green-deploy.sh api-gateway
./scripts/deployment/blue-green-deploy.sh backend
./scripts/deployment/blue-green-deploy.sh frontend
./scripts/deployment/blue-green-deploy.sh api

# Deploy single service (canary)
./scripts/deployment/canary-deploy.sh api-gateway

# Deploy specific services (orchestrated)
./scripts/deployment/orchestrate-deployment.sh --services="api-gateway frontend"
```

## Environment Variables

### Required

```bash
export DATABASE_URL="postgresql://..."
export NODE_ENV="production"
export JWT_SECRET="your-secret"
```

### Optional

```bash
# Notifications
export SLACK_WEBHOOK_URL="https://..."
export DISCORD_WEBHOOK_URL="https://..."
export EMAIL_API_URL="https://..."
export EMAIL_TO="team@example.com"

# CloudRuntime
export CLOUD_RUNTIME_TOKEN="your-token"

# Deployment Config
export DEPLOYMENT_STRATEGY="blue-green"
export SERVICES="api-gateway backend frontend api"
export RUN_MIGRATIONS="true"
export RUN_TESTS="true"
```

## Deployment Strategies

| Strategy | Command | Use Case | Downtime |
|----------|---------|----------|----------|
| **Rolling** | `--strategy=rolling` | Quick updates, low risk | Minimal |
| **Blue-Green** | `--strategy=blue-green` | Zero-downtime, instant rollback | None |
| **Canary** | `--strategy=canary` | High-risk changes, gradual rollout | None |

## Common Workflows

### Standard Production Deployment

```bash
# 1. Validate
./scripts/deployment/validate-deployment.sh

# 2. Deploy
./scripts/deployment/orchestrate-deployment.sh --strategy=blue-green

# 3. Verify
./scripts/deployment/health-check.sh --deep
```

### Emergency Rollback

```bash
# 1. Find deployment ID
./scripts/deployment/deployment-dashboard.sh

# 2. Rollback
./scripts/deployment/rollback.sh <deployment-id>

# 3. Verify
./scripts/deployment/smoke-tests.sh
```

### Database Migration Only

```bash
# 1. Backup
./scripts/deployment/db-backup.sh

# 2. Migrate
./scripts/deployment/db-migrate.sh

# 3. Verify
pnpm drizzle migrate status
```

### Health Check Only

```bash
# Quick check
./scripts/deployment/health-check.sh

# Comprehensive check
./scripts/deployment/health-check.sh --deep

# Minimal check
./scripts/deployment/health-check.sh --minimal
```

## File Locations

### Logs

```
logs/deployment/          # Deployment logs
logs/health-checks/       # Health check logs
logs/canary/              # Canary deployment logs
logs/blue-green/          # Blue-green deployment logs
```

### State Files

```
.deployment-state/        # Deployment state tracking
backups/database/         # Database backups
```

### Scripts

```
scripts/deployment/       # All deployment scripts
```

## Troubleshooting

### Check Service Status

```bash
# CloudRuntime services
cloud_runtime status

# Service logs
cloud_runtime logs --service <service-name>

# Health endpoint
curl https://your-service.thenewfuse.com/health
```

### View Logs

```bash
# Latest deployment log
ls -lt logs/deployment/ | head -2

# View specific log
cat logs/deployment/deploy-20231215-143022.log

# Follow live log
tail -f logs/deployment/deploy-*.log
```

### Check State

```bash
# View deployment state
cat .deployment-state/deploy-*-state.json | jq .

# View blue-green state
cat .deployment-state/api-gateway-state.json | jq .
```

### Database Issues

```bash
# Check connection
pnpm drizzle db execute --stdin <<< "SELECT 1;"

# Migration status
pnpm drizzle migrate status

# List backups
ls -lh backups/database/
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation failed / Deployment failed |
| 130 | User cancelled (Ctrl+C) |

## Keyboard Shortcuts

### During Deployment

- `Ctrl+C` - Cancel deployment (triggers cleanup)
- `Enter` - Confirm prompts (when not auto-confirmed)

### Dashboard

- `Ctrl+C` - Exit dashboard

## Quick Checklists

### Pre-PR

- [ ] `pnpm run lint`
- [ ] `pnpm run type-check`
- [ ] `pnpm run test`
- [ ] `pnpm run build`

### Pre-Deploy

- [ ] CI checks are green on target branch
- [ ] Required CloudRuntime variables are present
- [ ] Database migration plan is confirmed
- [ ] Rollback command path is ready

### Post-Deploy

- [ ] Health endpoints return 200
- [ ] Error rates remain stable
- [ ] Response times remain within target
- [ ] Team notification sent

## Support

For detailed documentation, see:
- [Automated Deployment Guide](AUTOMATED_DEPLOYMENT_GUIDE.md)
- [Emergency Procedures](EMERGENCY_PROCEDURES.md)
- [Rollback Procedures](ROLLBACK_PROCEDURES.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
