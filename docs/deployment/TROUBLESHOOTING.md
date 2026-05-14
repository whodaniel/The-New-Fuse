# Deployment Troubleshooting Guide

Common deployment issues and solutions.

## Build Failures

### Issue: `pnpm install` fails

**Symptoms:**
- Dependency installation errors
- Network timeouts
- Permission errors

**Solutions:**
```bash
# Clear pnpm cache
pnpm store prune

# Retry with clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Use offline mode
pnpm install --offline

# Check pnpm version
pnpm --version  # Should be >= 8.x
```

### Issue: TypeScript build errors

**Symptoms:**
- Type errors during build
- Missing type definitions

**Solutions:**
```bash
# Clear TypeScript cache
rm -rf **/*.tsbuildinfo

# Regenerate Drizzle client
pnpm drizzle generate

# Type check
pnpm run type-check

# Full rebuild
pnpm run clean && pnpm run build
```

### Issue: Turbo build fails

**Symptoms:**
- Build times out
- Memory errors
- Concurrent build issues

**Solutions:**
```bash
# Use memory-optimized build
BUILD_MEMORY_LIMIT=2048 BUILD_CONCURRENCY=2 pnpm run build:memory-optimized

# Clear turbo cache
turbo daemon stop
rm -rf .turbo

# Sequential build
pnpm run build --concurrency=1
```

## CloudRuntime Deployment Issues

### Issue: CloudRuntime CLI not authenticated

**Symptoms:**
- "Not logged in" errors
- Authentication failures

**Solutions:**
```bash
# Login to CloudRuntime
cloud_runtime login

# Verify authentication
cloud_runtime whoami

# Link to project
cloud_runtime link
```

### Issue: Service fails to start

**Symptoms:**
- Service shows as "crashed"
- Health checks fail

**Solutions:**
```bash
# Check service logs
cloud_runtime logs --service <service-name>

# Check environment variables
cloud_runtime variables --service <service-name>

# Restart service
cloud_runtime restart --service <service-name>

# Verify Dockerfile
cat apps/<service>/Dockerfile
```

### Issue: Build timeout on CloudRuntime

**Symptoms:**
- Deployment exceeds time limit
- Build killed mid-process

**Solutions:**
```bash
# Use CloudRuntime-optimized build
BUILD_FRONTEND=false pnpm run build:cloud_runtime

# Reduce build scope
# Edit cloud_runtime.toml to exclude dev dependencies

# Increase CloudRuntime plan limits (if possible)
```

## Database Issues

### Issue: Migration fails

**Symptoms:**
- `drizzle migrate deploy` errors
- Schema mismatch
- Connection timeouts

**Solutions:**
```bash
# Check database connection
pnpm drizzle db execute --stdin <<< "SELECT 1;"

# View migration status
pnpm drizzle migrate status

# Force migration (CAUTION)
pnpm drizzle migrate resolve --applied <migration-name>

# Reset database (DEVELOPMENT ONLY)
pnpm drizzle migrate reset
```

### Issue: Database connection errors

**Symptoms:**
- "Connection refused"
- "Too many connections"
- Timeout errors

**Solutions:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Check CloudRuntime database status
cloud_runtime status

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Connection pooling (add to DATABASE_URL)
?connection_limit=10&pool_timeout=20
```

## Environment Variable Issues

### Issue: Missing environment variables

**Symptoms:**
- "Environment variable not set" errors
- Services crash on startup

**Solutions:**
```bash
# Validate environment
./scripts/deployment/validate-deployment.sh

# Check CloudRuntime variables
cloud_runtime variables

# Set missing variables
cloud_runtime variables --set VAR_NAME=value

# Load from .env file
./scripts/deployment/cloud_runtime-deploy.sh sync-env
```

## Rollback Issues

### Issue: Automatic rollback fails

**Symptoms:**
- Rollback script errors
- Services still in failed state

**Solutions:**
```bash
# Manual rollback
./scripts/deployment/rollback.sh <deployment-id>

# Check rollback logs
tail -f logs/deployment/rollback-*.log

# Force rollback
AUTO_CONFIRM=true ./scripts/deployment/rollback.sh <deployment-id>

# Manual service restore
cloud_runtime up --service <service-name>
```

## Performance Issues

### Issue: Slow deployment

**Symptoms:**
- Deployment takes > 15 minutes
- Timeouts during deployment

**Solutions:**
```bash
# Use parallel deployment
PARALLEL_DEPLOYMENTS=true ./scripts/deployment/deploy-automated.sh

# Skip tests
SKIP_TESTS=true ./scripts/deployment/deploy-automated.sh

# Skip migrations
SKIP_MIGRATIONS=true ./scripts/deployment/deploy-automated.sh

# Optimize build
pnpm run build:memory-optimized
```

### Issue: High memory usage during build

**Symptoms:**
- "JavaScript heap out of memory"
- Build process killed

**Solutions:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Use low-memory build
pnpm run build:low-memory

# Build in stages
pnpm run build:staged
```

## Health Check Failures

### Issue: Smoke tests fail after deployment

**Symptoms:**
- Health endpoints return 500
- Services not responding

**Solutions:**
```bash
# Check service logs
cloud_runtime logs --service <service-name>

# Verify service is running
cloud_runtime status --service <service-name>

# Test health endpoint manually
curl https://<service-url>/health

# Increase health check timeout
HEALTH_CHECK_TIMEOUT=60 ./scripts/deployment/smoke-tests.sh
```

## Common Error Messages

### "ECONNREFUSED"

**Cause:** Service not running or wrong port

**Solution:**
```bash
# Check service status
cloud_runtime status

# Verify port configuration
cloud_runtime variables | grep PORT
```

### "ETIMEDOUT"

**Cause:** Network issues or slow service

**Solution:**
```bash
# Increase timeout
TIMEOUT=60 ./scripts/deployment/smoke-tests.sh

# Check CloudRuntime network status
cloud_runtime status
```

### "Permission denied"

**Cause:** File permissions or authentication

**Solution:**
```bash
# Fix script permissions
chmod +x scripts/deployment/*.sh

# Verify CloudRuntime authentication
cloud_runtime whoami
```

## Monitoring-Led Troubleshooting

### High API Latency

```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

```bash
redis-cli INFO | grep connected_clients
```

### Memory Pressure Signals

```bash
# Kubernetes resource check (if running in k8s)
kubectl top pods -n production

# Node heap diagnostics
node --heapsnapshot
```

## Getting Help

### Logs to Collect

When reporting issues, include:

1. **Deployment logs**
   ```bash
   cat logs/deployment/deploy-*.log
   ```

2. **CloudRuntime logs**
   ```bash
   cloud_runtime logs --service <service-name>
   ```

3. **Build output**
   ```bash
   pnpm run build 2>&1 | tee build.log
   ```

4. **Environment info**
   ```bash
   node --version
   pnpm --version
   cloud_runtime --version
   ```

### Support Channels

1. Check this troubleshooting guide
2. Review deployment logs
3. Search team documentation
4. Ask in team chat
5. Create incident ticket

---

**Last Updated:** 2024-11-18
