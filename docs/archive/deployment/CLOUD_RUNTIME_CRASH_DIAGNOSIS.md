# CloudRuntime Backend Crash Diagnosis

> **⚠️ HISTORICAL DOCUMENT — CloudRuntime is no longer used.** TNF has migrated to
> **GCP (Cloud Run) + Cloudflare (Pages/Workers) + Supabase (PostgreSQL) +
> Upstash (Redis)**. This diagnosis is preserved for reference only. See
> `CLOUD_MIGRATION_BLUEPRINT.md` for current infrastructure.

**Date**: December 28, 2025, 8:10 PM EST **Status**: Backend still crashing on
CloudRuntime ⚠️ **Historical — CloudRuntime no longer in use**

---

## 🔍 Current Situation

### Deployment Info

- **CloudRuntime Commit**: `fe7e4f6e` (OLD - from earlier today)
- **Latest Main**: `827579238` (includes all fixes)
- **Status**: Crashed after 35 seconds

### What's Working ✅

Based on the logs, the backend successfully:

1. ✅ Detects CloudRuntime Redis
2. ✅ Forces database to 0 (our fix is working!)
3. ✅ Initializes all modules
4. ✅ Registers 16 MCP tools
5. ✅ Maps all routes (Auth, Cache, Orchestrator, etc.)
6. ✅ Initializes WebSocket gateway

### Where It Crashes ❌

The logs cut off after route mapping, suggesting crash during:

- Database connection attempt
- Final Redis connection
- Application startup completion
- Health check failure

---

## 🎯 Likely Causes

### 1. **CloudRuntime Not Deploying Latest Code**

- CloudRuntime shows commit `fe7e4f6e` (old)
- Our fixes are in `827579238` (new)
- **Solution**: Force redeploy or check CloudRuntime GitHub integration

### 2. **Database Connection Issue**

- Logs show "Database integration not available, using in-memory storage"
- This might cause issues later in startup
- **Solution**: Check DATABASE_URL environment variable

### 3. **Missing Environment Variables**

- Some required env vars might be missing
- **Solution**: Audit CloudRuntime environment variables

### 4. **Port Binding Issue**

- CloudRuntime might be expecting a different port
- **Solution**: Check PORT environment variable

---

## 🔧 Recommended Actions

### Immediate (Priority 1)

1. **Check CloudRuntime Deployment Settings**
   - Verify GitHub integration is working
   - Check if CloudRuntime is watching the correct branch (main)
   - Force a manual redeploy if needed

2. **Verify Environment Variables**
   - DATABASE_URL
   - REDIS_URL
   - PORT
   - NODE_ENV

3. **Check CloudRuntime Logs for Full Error**
   - The logs shown are truncated
   - Need to see the actual error message
   - Look for stack trace

### Short Term (Priority 2)

4. **Add Health Check Endpoint**
   - Ensure `/` or `/health` responds quickly
   - CloudRuntime might be timing out on health checks

5. **Add Startup Logging**
   - Add more detailed logging during startup
   - Log successful database connection
   - Log successful Redis connection
   - Log when server is ready

6. **Check CloudRuntime Build Logs**
   - Ensure build completed successfully
   - Check for any build-time errors

---

## 📝 Next Steps

### To Get Full Error Details:

1. Access CloudRuntime dashboard
2. Go to backend service
3. Click on the crashed deployment
4. View full "Deploy Logs"
5. Look for the actual error message (after the route mapping logs)

### To Force Redeploy:

1. Go to CloudRuntime dashboard
2. Select backend service
3. Click "Redeploy" or trigger a new deployment
4. Ensure it's pulling from latest main branch

### To Check Environment:

1. CloudRuntime dashboard → backend service → Variables
2. Verify all required variables are set:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `PORT` (should be set by CloudRuntime automatically)
   - `NODE_ENV=production`

---

## 🐛 Debugging Commands

If you have CloudRuntime CLI access:

```bash
# Check deployment status
cloud_runtime status

# View logs
cloud_runtime logs

# Redeploy
cloud_runtime up

# Check environment variables
cloud_runtime variables
```

---

## 💡 Hypothesis

**Most Likely**: CloudRuntime is deploying an old commit that doesn't have our Redis
fixes.

**Evidence**:

- CloudRuntime shows commit `fe7e4f6e`
- Our fixes are in commits `ee771a8d6` and `401a05677`
- Latest commit is `827579238`

**Solution**: Force CloudRuntime to redeploy from latest main branch.

---

## ✅ What We Know Works

Our fixes ARE working based on the logs:

- ✅ "🚂 CloudRuntime Redis detected - forcing database to 0"
- ✅ "[Bull Config] Using REDIS_URL: redis.cloud_runtime.internal:6379"
- ✅ All modules initialized successfully
- ✅ No NaN errors in the logs!

The crash is happening AFTER our fixes work, suggesting a different issue
(likely database or final startup).

---

**Recommendation**: Check CloudRuntime dashboard for full error logs and verify
deployment is from latest commit.
