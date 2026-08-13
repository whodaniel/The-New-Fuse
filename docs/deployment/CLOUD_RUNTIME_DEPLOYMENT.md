> **⚠️ CLOUD_RUNTIME IS NO LONGER USED.** TNF has migrated to GCP (Cloud Run) +
> Cloudflare (Pages/Workers) + Supabase (PostgreSQL) + Upstash (Redis). See
> `/CLOUD_MIGRATION_BLUEPRINT.md` for current infrastructure. This document is
> preserved for historical reference only.

# CloudRuntime Deployment Guide

## Backend Deployment Issue: Redis Connection Failures

### Problem

The backend service is crashing with `ETIMEDOUT` errors when trying to connect
to Redis because CloudRuntime doesn't have a Redis service configured by default.

### Solution Options

#### Option 1: Disable Redis (Quick Fix - Recommended for Testing)

Add the following environment variables to your backend service in CloudRuntime:

```env
REDIS_ENABLED=false
BULL_ENABLED=false
CACHE_ENABLED=false
```

**Steps:**

1. Go to CloudRuntime Dashboard
2. Select your `backend` service
3. Go to "Variables" tab
4. Add each variable listed above
5. Redeploy the service

#### Option 2: Add Redis Service (Recommended for Production)

1. In your CloudRuntime project, click "New Service"
2. Select "Redis" from the templates
3. Once Redis is deployed, CloudRuntime will automatically provide a `REDIS_URL`
   environment variable
4. The backend will automatically use this URL to connect to Redis

### Environment Variables Needed for CloudRuntime

#### Backend Service

```env
# Required
NODE_ENV=production
PORT=3000

# Database (if using)
DATABASE_URL=${{DATABASE.DATABASE_URL}}

# Redis (if using Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# OR disable Redis (if not using Redis service)
REDIS_ENABLED=false
BULL_ENABLED=false
CACHE_ENABLED=false

# Optional
LOG_LEVEL=info
```

#### Frontend Service

```env
# Required
VITE_API_URL=https://your-backend.thenewfuse.com
NODE_ENV=production
```

## Current Deployment Status

- ✅ Frontend: Successfully deployed
- ✅ API: Successfully deployed
- ❌ Backend: Crashing due to Redis connection timeout
- ❌ TheNewFuse: Build failed (fixed - TypeScript issue resolved)

## Next Steps

1. Add Redis service OR disable Redis in backend environment variables
2. Redeploy backend service
3. Verify all services are running correctly

## Monitoring

Check deployment logs in CloudRuntime:

- Backend logs should show "Application started successfully" or similar
- No `ETIMEDOUT` or `ECONNREFUSED` errors related to Redis
