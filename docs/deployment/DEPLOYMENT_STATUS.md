# 🚂 CloudRuntime Deployment - Current Status & Action Plan

## ✅ Live Production Validation (2026-03-18)

This section reflects the current live state for `thenewfuse.com` and CloudRuntime
production services after the master-clock coherence and visualization updates.

### Production Services (CloudRuntime)

- `TheNewFuse` deployment: `17102f55-945f-4047-9396-f9797e57d215` (`SUCCESS`)
- `api` deployment: `52298d52-c9f4-4147-b384-9ca3804bc492` (`SUCCESS`)
- `api-gateway` deployment: `2ee761a4-cae4-467b-95e8-aee69023bd68` (`SUCCESS`)

### Verified Live Endpoints

- `https://thenewfuse.com/visualizations` -> HTTP `200`
- `https://thenewfuse.com/api/system/master-clock` -> status `ok`,
  `projectionMode: contract-fallback`, `processCount: 5`
- `https://api.thenewfuse.com/api/system/master-clock` -> status `ok`,
  `projectionMode: contract-fallback`, `processCount: 5`

### Visualization and Animation Status

- The visualizations page is live and animated.
- Browser verification confirmed gear rotation updates over time (transform
  values changed between samples).
- Coherence mode now renders as `Projected` when master-clock telemetry is using
  the contract fallback super-cycle.
- Drag-to-mesh placement is active: gears can be repositioned and snapped into
  open sockets on the board.
- Gear overlays now surface `last-run` and `next-fire` timing from live
  telemetry.
- Super-cycle metadata now supports explicit interval contracts per process
  (`intendedIntervalMs`, `intervalSource`, `intervalExact`).

### Operational Meaning of `contract-fallback`

`projectionMode: contract-fallback` means heartbeat telemetry is live but
super-cycle process detail is currently provided by the contract projection
layer. This keeps UX and API contracts coherent while preserving uptime.

### Quick Verification Commands

```bash
curl -s https://thenewfuse.com/api/system/master-clock | jq '{status, projectionMode: .superCycle.projectionMode, processCount: (.superCycle.processes|length), healthy: .superCycle.stats.healthy, stale: .superCycle.stats.stale}'
curl -s https://api.thenewfuse.com/api/system/master-clock | jq '{status, projectionMode: .superCycle.projectionMode, processCount: (.superCycle.processes|length), healthy: .superCycle.stats.healthy, stale: .superCycle.stats.stale}'
curl -s https://thenewfuse.com/api/system/master-clock | jq '.superCycle.processes[] | {processId, intendedIntervalMs, intervalSource, intervalExact, lastRunAt, nextExpectedAt}'
curl -s -o /dev/null -w "%{http_code}\n" https://thenewfuse.com/visualizations
```

## ✅ COMPLETED

### Repository Setup

- ✅ All Netlify references removed
- ✅ Repository organized (500+ files moved to docs/, scripts/, tools/)
- ✅ Clean main branch with professional structure
- ✅ All changes committed to
  `claude/prepare-public-release-011CV5qmykNfFy3h3LGLUHo8`

### CloudRuntime Configuration

- ✅ **cloud_runtime.toml** configured with 4 services
- ✅ **Dockerfile.cloud_runtime** created for each service:
  - `apps/api-gateway/Dockerfile.cloud_runtime` (2.2 KB)
  - `apps/api/Dockerfile.cloud_runtime` (2.4 KB)
  - `apps/backend/Dockerfile.cloud_runtime` (2.4 KB)
  - `apps/frontend/Dockerfile.cloud_runtime` (2.2 KB)
- ✅ CloudRuntime project linked (ID: `041cee9d-8648-4074-b5a6-0eae436de1d1`)
- ✅ Frontend auth fixed (removed Supabase, added local auth)
- ✅ Frontend builds successfully (287KB main bundle, 73KB compressed)

---

## 🎯 CURRENT STATUS

### Branch Information

- **Current Branch**: `claude/prepare-public-release-011CV5qmykNfFy3h3LGLUHo8`
- **Status**: Clean working tree, all committed
- **CloudRuntime Config**: ✅ Modified and ready

### Services Configuration

#### 1. **Frontend Service** (Port 8080)

```toml
[services.frontend.build]
dockerfilePath = "apps/frontend/Dockerfile.cloud_runtime"
watchPaths = ["apps/frontend/**", "packages/**"]

[services.frontend.deploy]
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

**Status**: ✅ Dockerfile ready, uses nginx, no Supabase required

#### 2. **API Service** (Port 3001)

```toml
[services.api.build]
dockerfilePath = "apps/api/Dockerfile.cloud_runtime"
watchPaths = ["apps/api/**", "packages/**", "drizzle/**"]

[services.api.deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

**Status**: ✅ Dockerfile ready, includes Drizzle

#### 3. **API Gateway** (Port 3002)

```toml
[services.api-gateway.build]
dockerfilePath = "apps/api-gateway/Dockerfile.cloud_runtime"
watchPaths = ["apps/api-gateway/**", "packages/**"]

[services.api-gateway.deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

**Status**: ✅ Dockerfile ready

#### 4. **Backend Service** (Port 3003)

```toml
[services.backend.build]
dockerfilePath = "apps/backend/Dockerfile.cloud_runtime"
watchPaths = ["apps/backend/**", "packages/**", "drizzle/**"]

[services.backend.deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

**Status**: ✅ Dockerfile ready, includes Drizzle

---

## 🚀 DEPLOYMENT ACTION PLAN

### Step 1: Push Branch to Main (REQUIRED)

The current branch needs to be merged to main for CloudRuntime to deploy:

**Option A: Create Pull Request**

```bash
# Go to GitHub and create PR:
https://github.com/whodaniel/fuse/pull/new/claude/prepare-public-release-011CV5qmykNfFy3h3LGLUHo8

# Merge PR to main
# CloudRuntime will auto-detect and deploy
```

**Option B: Direct Push (if you have permissions)**

```bash
git checkout main
git merge claude/prepare-public-release-011CV5qmykNfFy3h3LGLUHo8
git push origin main
```

### Step 2: Configure CloudRuntime Project

#### 2a. Add PostgreSQL Database

1. Go to CloudRuntime dashboard:
   https://cloud_runtime.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
2. Click "+ New" → "Database" → "PostgreSQL"
3. CloudRuntime will auto-create `DATABASE_URL`
4. Connect to services that need it (api, backend)

#### 2b. Add Redis (Optional but Recommended)

1. Click "+ New" → "Database" → "Redis"
2. CloudRuntime will auto-create `REDIS_URL`
3. Connect to backend service

#### 2c. Set Environment Variables

**For Frontend Service:**

```bash
NODE_ENV=production
PORT=8080
VITE_API_URL=https://your-api-service.thenewfuse.com
VITE_WS_URL=wss://your-api-service.thenewfuse.com
```

**For API Service:**

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=https://your-frontend.thenewfuse.com
```

**For API Gateway:**

```bash
NODE_ENV=production
PORT=3002
API_SERVICE_URL=https://your-api-service.thenewfuse.com
BACKEND_SERVICE_URL=https://your-backend-service.thenewfuse.com
```

**For Backend Service:**

```bash
NODE_ENV=production
PORT=3003
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Step 3: Deploy Services

CloudRuntime should auto-deploy when you push to main. Monitor in the dashboard:

1. **Watch Build Logs**: Each service will show build progress
2. **Check Health**: Services should pass health checks at `/health`
3. **Get URLs**: CloudRuntime will assign URLs to each service
4. **Update Environment**: Use the URLs to update cross-service communication

### Step 4: Configure Custom Domain (www.thenewfuse.com)

1. Go to **Frontend Service** in CloudRuntime
2. Click **Settings** → **Domains**
3. Click **+ Custom Domain**
4. Enter: `www.thenewfuse.com`
5. Add CNAME record to your DNS:
   ```
   Type: CNAME
   Name: www
   Value: [provided by CloudRuntime]
   TTL: 300
   ```

---

## 🔍 TROUBLESHOOTING GUIDE

### Issue: CloudRuntime Doesn't Auto-Deploy

**Solution:** CloudRuntime may not detect `cloud_runtime.toml` if it's not on main branch.

```bash
# Make sure changes are on main
git checkout main
git merge claude/prepare-public-release-011CV5qmykNfFy3h3LGLUHo8
git push origin main
```

### Issue: Service Won't Build

**Check These:**

1. **Dockerfile path**: Verify `apps/[service]/Dockerfile.cloud_runtime` exists
2. **Build logs**: Look for missing dependencies or path issues
3. **pnpm version**: Should be 10.20.0 in Dockerfiles

**Common Fix:**

```bash
# In CloudRuntime dashboard, go to service settings
# Check "Builder" is set to "Dockerfile"
# Check "Dockerfile Path" is correct
```

### Issue: Service Crashes After Build

**Check:**

1. **Environment Variables**: Are they all set?
2. **Database Connection**: Is `DATABASE_URL` configured?
3. **Health Check**: Is the service responding on the health endpoint?

**Debug:**

```bash
# View logs in CloudRuntime dashboard
# Look for:
# - Missing environment variables
# - Database connection errors
# - Port binding issues
```

### Issue: Services Can't Communicate

CloudRuntime services should use internal URLs for communication:

```bash
# Instead of:
VITE_API_URL=https://api-production-abc123.thenewfuse.com

# Use CloudRuntime's internal networking:
VITE_API_URL=${{API.CLOUD_RUNTIME_PRIVATE_DOMAIN}}
```

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Branch merged to main
- [ ] All services have Dockerfile.cloud_runtime
- [ ] cloud_runtime.toml configured correctly
- [ ] Frontend builds successfully locally

### CloudRuntime Setup

- [ ] Project linked (ID: 041cee9d-8648-4074-b5a6-0eae436de1d1)
- [ ] PostgreSQL database added
- [ ] Redis added (optional)
- [ ] Environment variables configured for all services

### Deployment

- [ ] All 4 services deployed
- [ ] Health checks passing
- [ ] Services can communicate
- [ ] Frontend loads without errors

### Post-Deployment

- [ ] Custom domain configured (www.thenewfuse.com)
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] All features tested in production

---

## 🎯 NEXT IMMEDIATE STEPS

1. **Merge to Main** ⚠️ CRITICAL

   ```bash
   # Create PR or merge directly
   # CloudRuntime needs main branch for auto-deploy
   ```

2. **Configure CloudRuntime Dashboard**
   - Add PostgreSQL
   - Set environment variables
   - Deploy services

3. **Monitor Deployment**
   - Watch build logs
   - Check health endpoints
   - Test service communication

4. **Configure Domain**
   - Add www.thenewfuse.com
   - Update DNS records
   - Verify SSL

---

## 📞 GETTING SERVICE URLs

Once deployed, get your URLs:

**Method 1: CloudRuntime Dashboard**

```
https://cloud_runtime.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
Click each service → Settings → Domains
```

**Method 2: CloudRuntime CLI**

```bash
cloud_runtime service list
cloud_runtime domain
```

**Method 3: Use Helper Script**

```bash
./scripts/cloud_runtime/get-cloud_runtime-urls.sh
```

---

## 🎉 SUCCESS CRITERIA

Your deployment is successful when:

✅ All 4 services show "Active" in CloudRuntime ✅ Health checks pass for backend
services ✅ Frontend loads at www.thenewfuse.com ✅ You can sign up and log in
✅ No errors in browser console ✅ API calls work from frontend

---

## 📚 Additional Resources

- **CloudRuntime Dashboard**:
  https://cloud_runtime.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- **Deployment Guide**: `docs/deployment/CLOUD_RUNTIME_DEPLOYMENT_GUIDE.md`
- **CloudRuntime Docs**: https://docs.thenewfuse.com
- **Get Service URLs**: `scripts/cloud_runtime/get-cloud_runtime-urls.sh`

**Your deployment is 95% ready - just needs to be pushed to main!** 🚀
