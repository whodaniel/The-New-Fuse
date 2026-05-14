# Deployment Procedures

Complete guide for deploying The New Fuse to production and staging environments.

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Automated Deployment](#automated-deployment)
- [Manual Deployment](#manual-deployment)
- [Emergency Procedures](#emergency-procedures)
- [Post-Deployment](#post-deployment)
- [Rollback Procedures](#rollback-procedures)

## Overview

The New Fuse uses automated deployment to CloudRuntime with the following characteristics:

- **Platform**: CloudRuntime
- **Strategy**: Zero-downtime rolling updates
- **Services**: 4 (api-gateway, api, backend, frontend)
- **Environments**: Production, Staging
- **Automation**: GitHub Actions
- **Health Checks**: Automated with retry
- **Rollback**: Automatic on failure

## Pre-Deployment Checklist

Before any deployment, ensure:

### Code Quality
- [ ] All tests pass locally
- [ ] Code coverage meets requirements (>70%)
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] Bundle size is acceptable

### Review
- [ ] PR approved by required reviewers
- [ ] All CI checks pass
- [ ] Breaking changes documented
- [ ] Migration scripts ready (if needed)

### Configuration
- [ ] Environment variables updated in CloudRuntime
- [ ] Database migrations prepared
- [ ] Feature flags configured
- [ ] Third-party services notified (if needed)

### Communication
- [ ] Team notified of deployment
- [ ] Deployment window scheduled
- [ ] Stakeholders informed
- [ ] Rollback plan ready

## Automated Deployment

### Production Deployment

Automatic deployment triggers on push to `main`:

```bash
# 1. Merge PR to main
git checkout main
git pull origin main

# 2. Deployment starts automatically
# Monitor at: https://github.com/your-org/fuse/actions

# 3. Watch workflow progress
gh run watch
```

**Timeline**:
1. Tests run (15-20 min)
2. Docker images build (10-15 min)
3. CloudRuntime deployment (5-10 min)
4. Health checks (2-5 min)
5. Smoke tests (2-3 min)

**Total**: ~35-50 minutes

### Tagged Release Deployment

For version releases:

```bash
# 1. Create and push tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3

# 2. Deployment starts automatically
# 3. Monitor at GitHub Actions
```

**Tag format**: `v{major}.{minor}.{patch}`

### Staging Deployment

Manual dispatch to staging:

1. Go to GitHub Actions
2. Select "Deploy to CloudRuntime"
3. Click "Run workflow"
4. Select:
   - Branch: `develop` or feature branch
   - Environment: `staging`
   - Services: `all` or specific services
5. Click "Run workflow"

## Manual Deployment

### Using CloudRuntime CLI

```bash
# Install CloudRuntime CLI
npm install -g @cloud_runtime/cli

# Login
cloud_runtime login

# Link to project
cloud_runtime link

# Deploy specific service
cloud_runtime up --service=api-gateway

# Deploy all services
cloud_runtime up --service=api-gateway & \
cloud_runtime up --service=api & \
cloud_runtime up --service=backend & \
cloud_runtime up --service=frontend
```

### Using Docker

```bash
# Build images
docker build -f apps/api-gateway/Dockerfile.cloud_runtime -t fuse-api-gateway .
docker build -f apps/api/Dockerfile.cloud_runtime -t fuse-api .
docker build -f apps/backend/Dockerfile.cloud_runtime -t fuse-backend .
docker build -f apps/frontend/Dockerfile.cloud_runtime -t fuse-frontend .

# Tag for registry
docker tag fuse-api-gateway registry.thenewfuse.com/fuse-api-gateway:latest
# ... repeat for other services

# Push to registry
docker push registry.thenewfuse.com/fuse-api-gateway:latest
# ... repeat for other services
```

### Deploying Single Service

```bash
# Via GitHub Actions manual dispatch
# Select specific service:
gh workflow run deploy.yml -f environment=production -f services=frontend
```

## Emergency Procedures

### Hotfix Deployment

For critical bugs in production:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-bug-fix

# 2. Make minimal fix
# 3. Test thoroughly

# 4. Create PR
gh pr create --title "hotfix: fix critical bug" --base main

# 5. Get expedited review
# 6. Merge immediately after approval

# 7. Monitor deployment
gh run watch
```

**Timeline**: As fast as possible (tests + deployment ~30-40 min)

### Emergency Rollback

If deployment causes issues:

```bash
# 1. Via GitHub Actions
# Trigger rollback manually

# 2. Via CloudRuntime CLI
cloud_runtime rollback --service=api-gateway
cloud_runtime rollback --service=api
cloud_runtime rollback --service=backend
cloud_runtime rollback --service=frontend

# 3. Verify services are healthy
cloud_runtime status --service=api-gateway
```

**Timeline**: 5-10 minutes

### Emergency Database Rollback

For database migrations:

```bash
# 1. Connect to CloudRuntime
cloud_runtime shell

# 2. Run migration rollback
pnpm run db:migrate:rollback

# 3. Verify database state
pnpm run db:studio
```

### Disabling Features

Use feature flags:

```bash
# Update environment variables
cloud_runtime variables set FEATURE_NEW_UI=false --service=frontend

# Restart service
cloud_runtime restart --service=frontend
```

## Post-Deployment

### Verification Steps

#### 1. Health Checks

```bash
# Check all services
curl https://api-gateway.thenewfuse.com/health
curl https://api.thenewfuse.com/health
curl https://backend.thenewfuse.com/health
curl https://frontend.thenewfuse.com/

# Expected: All return 200 OK
```

#### 2. Smoke Tests

```bash
# Run automated smoke tests
pnpm run test:smoke:production

# Manual checks
# - Login flow
# - Create resource
# - API endpoints
# - WebSocket connections
```

#### 3. Monitor Metrics

```bash
# Check CloudRuntime metrics
cloud_runtime logs --service=api-gateway --tail 100

# Check error rates
cloud_runtime metrics --service=api-gateway

# Monitor dashboards
# - CloudRuntime dashboard
# - Application monitoring
# - Error tracking (Sentry)
```

#### 4. Database Verification

```bash
# Check migrations applied
cloud_runtime run -- pnpm run db:migrate:status

# Verify data integrity
cloud_runtime run -- pnpm run db:verify
```

### Communication

After successful deployment:

1. **Notify team**:
   ```
   ✅ Deployment successful
   Version: v1.2.3
   Services: All
   Time: 2025-01-15 14:30 UTC
   Health: All systems operational
   ```

2. **Update status page**: Mark deployment complete

3. **Document changes**: Update changelog

4. **Close tickets**: Mark deployed issues as complete

### Monitoring Period

Monitor for 30-60 minutes after deployment:

- **Error rates**: Should remain normal
- **Response times**: Should be acceptable
- **Resource usage**: CPU, memory within limits
- **User reports**: No increase in issues

## Rollback Procedures

### Automatic Rollback

Handled by CI/CD if health checks fail:

1. Health check fails after 10 retries
2. CloudRuntime rollback triggered
3. Previous version restored
4. Notification sent
5. Deployment marked as failed

### Manual Rollback

#### Via CloudRuntime Dashboard

1. Go to CloudRuntime dashboard
2. Select service
3. Click "Deployments"
4. Find previous successful deployment
5. Click "Redeploy"

#### Via CloudRuntime CLI

```bash
# Rollback to previous deployment
cloud_runtime rollback --service=api-gateway

# Rollback to specific deployment
cloud_runtime rollback <deployment-id> --service=api-gateway

# Verify rollback
cloud_runtime status --service=api-gateway
```

#### Via Git

```bash
# 1. Revert merge commit
git revert HEAD -m 1

# 2. Push to trigger deployment
git push origin main

# 3. Monitor deployment
gh run watch
```

### Database Rollback

If migrations were applied:

```bash
# 1. Rollback migrations
cloud_runtime run -- pnpm run db:migrate:rollback

# 2. Verify schema
cloud_runtime run -- pnpm run db:migrate:status

# 3. Test application
curl https://api.thenewfuse.com/health
```

### Partial Rollback

Rollback single service:

```bash
# Rollback only frontend
cloud_runtime rollback --service=frontend

# Keep other services on new version
cloud_runtime status --service=api-gateway
cloud_runtime status --service=api
cloud_runtime status --service=backend
```

### Rollback Verification

After rollback:

1. **Check health endpoints**: All should return 200
2. **Verify functionality**: Critical paths work
3. **Monitor errors**: Error rate returns to normal
4. **Check metrics**: Performance acceptable
5. **Test features**: Key features operational

### Post-Rollback

1. **Notify team**: Rollback complete
2. **Create incident report**: Document issue
3. **Fix root cause**: Address problem
4. **Plan re-deployment**: When fix ready
5. **Update runbook**: Add learnings

## Deployment Environments

### Production

- **URL**: https://app.fuse.com
- **CloudRuntime Project**: fuse-production
- **Branch**: `main`
- **Database**: Production PostgreSQL
- **Monitoring**: Full monitoring enabled

**Access**:
```bash
cloud_runtime link fuse-production
cloud_runtime shell
```

### Staging

- **URL**: https://staging.fuse.com
- **CloudRuntime Project**: fuse-staging
- **Branch**: `develop`
- **Database**: Staging PostgreSQL
- **Monitoring**: Basic monitoring

**Access**:
```bash
cloud_runtime link fuse-staging
cloud_runtime shell
```

## Database Migrations

### Running Migrations

```bash
# Generate migration
pnpm run db:generate

# Review migration
cat drizzle/migrations/*/migration.sql

# Apply to staging
cloud_runtime run --service=backend -- pnpm run db:migrate

# Verify
cloud_runtime run --service=backend -- pnpm run db:migrate:status
```

### Migration Best Practices

1. **Test in staging first**: Always test migrations in staging
2. **Backup database**: Before running migrations
3. **Reversible migrations**: Write DOWN migrations
4. **Small changes**: Break large migrations into steps
5. **Monitor performance**: Check migration duration

### Migration Rollback

```bash
# Rollback last migration
cloud_runtime run --service=backend -- pnpm run db:migrate:rollback

# Rollback to specific version
cloud_runtime run --service=backend -- pnpm run db:migrate:rollback --to 20250115000000
```

## Deployment Metrics

Track these metrics for each deployment:

### Lead Time
- Time from commit to production
- Target: <1 hour for hotfixes, <4 hours for features

### Deployment Frequency
- How often we deploy
- Target: Multiple times per day

### Change Failure Rate
- Percentage of deployments causing issues
- Target: <5%

### Mean Time to Recovery
- Time to recover from failed deployment
- Target: <30 minutes

### Success Rate
- Percentage of successful deployments
- Target: >95%

## Troubleshooting Deployments

See [Troubleshooting Guide](./troubleshooting.md) for detailed solutions to common deployment issues.

## Additional Resources

- [CloudRuntime Documentation](https://docs.thenewfuse.com)
- [Docker Documentation](https://docs.docker.com)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Troubleshooting Guide](./troubleshooting.md)
