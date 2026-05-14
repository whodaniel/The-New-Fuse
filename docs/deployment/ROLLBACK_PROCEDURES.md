# Rollback Procedures

Complete guide for rolling back failed deployments.

## Quick Rollback

```bash
# Automatic rollback (if auto-rollback failed or was disabled)
./scripts/deployment/rollback.sh <deployment-id>

# Example
./scripts/deployment/rollback.sh deploy-20231215-143022
```

## Finding Deployment ID

```bash
# List recent deployments
ls -ltr logs/deployment/*-state.json

# View deployment status
cat logs/deployment/deploy-20231215-143022-state.json
```

## Rollback Process

The rollback script performs:

1. **Stops Current Services** - Prepares CloudRuntime services for rollback
2. **Database Rollback** - Restores database from backup (if available)
3. **Code Rollback** - Checks out previous git commit
4. **Restore Artifacts** - Restores previous build artifacts
5. **Redeploy Services** - Deploys services to CloudRuntime
6. **Verify Health** - Checks service health

## Manual Rollback

### 1. Database Rollback

```bash
# Find backup
ls -ltr backups/database/

# Restore PostgreSQL backup
psql $DATABASE_URL < backups/database/backup-deploy-20231215-143022.sql

# Or for compressed backups
gunzip -c backups/database/backup-deploy-20231215-143022.sql.gz | psql $DATABASE_URL
```

### 2. Code Rollback

```bash
# Find previous commit
git log --oneline | head -10

# Checkout previous version
git checkout <commit-hash>

# Rebuild
pnpm install
pnpm run build:cloud_runtime
```

### 3. Service Rollback

```bash
# Redeploy each service
cloud_runtime up --service api-gateway
cloud_runtime up --service backend
cloud_runtime up --service frontend
```

## Rollback Verification

After rollback:

```bash
# Run smoke tests
./scripts/deployment/smoke-tests.sh

# Check service health
cloud_runtime status

# View logs
cloud_runtime logs --service api-gateway
```

## Emergency Rollback

If automated rollback fails:

1. **Immediately notify team**
2. **Check CloudRuntime dashboard** - Manual service restart
3. **Review logs** - Understand failure reason
4. **Database restore** - Manual restore if needed
5. **Contact DevOps** - Escalate if critical

## Prevention

- Enable auto-rollback: `AUTO_ROLLBACK=true`
- Always test in staging first
- Keep backups current
- Monitor deployments closely

## See Also

- [EMERGENCY_PROCEDURES.md](./EMERGENCY_PROCEDURES.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
