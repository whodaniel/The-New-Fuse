# Railway Redis Setup for Production

## Overview

The New Fuse production deployment on Railway requires Redis for:

- Distributed locking (PR #401)
- LRU caching with TTL (PR #400)
- Session management
- Rate limiting
- Pub/Sub messaging

## Current Status

⚠️ **Redis is currently DISABLED** in production via `REDIS_ENABLED=false`

This is a **temporary fallback** to allow deployments to succeed, but results
in:

- No distributed locking (risk of race conditions)
- No caching (reduced performance)
- No rate limiting (security risk)
- No pub/sub messaging

## Required: Add Redis to Railway

### Step 1: Add Redis Service via Railway Dashboard

1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click "New" → "Database" → "Add Redis"
3. Railway will automatically provision a Redis instance
4. Railway automatically creates a `REDIS_URL` environment variable

### Step 2: Link Redis to Services

The Redis service needs to be linked to these services:

- `api` (api-server)
- `backend` (backend-app)

Railway automatically makes the `REDIS_URL` available to linked services.

### Step 3: Remove Redis Disable Flags

Once Redis is provisioned, remove these lines from `railway.toml`:

```toml
# Remove from [services.api.env]
REDIS_ENABLED = "false"

# Remove from [services.backend.env]
REDIS_ENABLED = "false"
BULL_ENABLED = "false"
CACHE_ENABLED = "false"
```

### Step 4: Update railway.toml

Update the configuration to remove the disable flags:

```toml
# API Service (uses Docker)
[services.api]
builder = "DOCKERFILE"
build = { dockerfilePath = "Dockerfile.railway", dockerBuildArgs = { SERVICE_PATH = "api", SERVICE_NAME = "@the-new-fuse/api-server" } }
deploy = { healthcheckPath = "/health" }
startCommand = "./run-service.sh"
restartPolicyType = "ON_FAILURE"
# Redis service is linked - REDIS_URL will be automatically provided

# Backend Service (uses Docker)
[services.backend]
builder = "DOCKERFILE"
build = { dockerfilePath = "Dockerfile.railway", dockerBuildArgs = { SERVICE_PATH = "backend", SERVICE_NAME = "@the-new-fuse/backend-app" } }
deploy = { healthcheckPath = "/health" }
# Redis service is linked - REDIS_URL will be automatically provided
```

### Step 5: Verify Redis Connection

After deployment, check the logs for:

```
[RedisConfig] Using REDIS_URL: redis.railway.internal:6379 (db: 0)
[CacheService] Redis connected successfully
```

## Alternative: Railway CLI

You can also add Redis via the Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Add Redis
railway add --database redis

# Link Redis to api service
railway link redis --service api

# Link Redis to backend service
railway link redis --service backend
```

## Redis Configuration

Railway Redis uses these defaults:

- **Host**: `redis.railway.internal`
- **Port**: `6379`
- **Connection String**: `redis://redis.railway.internal:6379`
- **Max Memory**: Depends on Railway plan (512MB on Starter)
- **Eviction Policy**: `allkeys-lru` (Least Recently Used)

### Optional: Custom Redis Configuration

If you need custom Redis configuration, you can set additional environment
variables:

```bash
REDIS_POOL_SIZE=20
REDIS_RETRY_ATTEMPTS=5
REDIS_CONNECT_TIMEOUT=10000
REDIS_MAX_RETRIES_PER_REQUEST=3
```

## Cost Considerations

Railway Redis pricing (as of 2024):

- **Starter Plan**: $5/month for 512MB
- **Pro Plan**: Scales with usage

## Testing Redis Connection Locally

To test the production Redis connection locally:

```bash
# Get the REDIS_URL from Railway dashboard
export REDIS_URL="redis://redis.railway.internal:6379"

# Test with redis-cli (requires Railway CLI and proxy)
railway run redis-cli -u $REDIS_URL ping
# Should return: PONG
```

## Troubleshooting

### Issue: "connect ETIMEDOUT"

- **Cause**: Redis service not linked or not provisioned
- **Fix**: Ensure Redis is added and linked to services

### Issue: "[CacheService] Redis is disabled"

- **Cause**: `REDIS_ENABLED=false` is still set
- **Fix**: Remove the environment variable from railway.toml

### Issue: "Redis connection failed"

- **Cause**: Incorrect REDIS_URL or network issue
- **Fix**: Check Railway dashboard for correct Redis URL

## Production Checklist

- [ ] Redis service added to Railway project
- [ ] Redis linked to `api` service
- [ ] Redis linked to `backend` service
- [ ] `REDIS_ENABLED=false` removed from railway.toml
- [ ] Services redeployed
- [ ] Logs show "Redis connected successfully"
- [ ] Test distributed locking functionality
- [ ] Test caching functionality
- [ ] Monitor Redis memory usage

## Important Notes

⚠️ **The current fallback mode (REDIS_ENABLED=false) is NOT suitable for
production!**

Without Redis:

- Race conditions can occur in distributed locking
- No caching = slower response times
- No rate limiting = security vulnerability
- No pub/sub = real-time features won't work

🎯 **Action Required**: Add Redis service to Railway ASAP for production
deployment.
