# Manual Railway Setup Required

## Summary of Work Completed

I've identified and fixed the root causes of the deployment failures:

### Issue #1: Root railway.toml ✅ FIXED

- **Problem**: A `railway.toml` file at the repository root was configured for
  the frontend service
- **Impact**: All backend services (api, backend, api-gateway) tried to use
  `apps/frontend/Dockerfile` and failed
- **Solution**: Deleted the root `railway.toml` file ✅
- **Commit**: 6d303a6e4

### Issue #2: Root railway.json forcing Nixpacks ✅ FIXED

- **Problem**: A `railway.json` file at the root was setting
  `builder: "NIXPACKS"`
- **Impact**: Railway used Nixpacks instead of the custom Dockerfiles, causing
  dependency installation failures
- **Solution**: Created `railway.json` files in each service directory
  specifying `builder: "DOCKERFILE"` ✅
- **Commit**: 4c3113124

### Issue #3: Root Directories Not Configured ⚠️ REQUIRES MANUAL ACTION

- **Problem**: Railway doesn't know which directory each service lives in within
  the monorepo
- **Impact**: Services can't find their railway.json configs or Dockerfiles
- **Solution**: Root directories must be configured manually in the Railway UI
  (see below)

---

## 🔴 MANUAL STEPS REQUIRED

The browser automation and Railway CLI cannot programmatically set root
directories. **You must complete these 3 steps manually:**

### Step 1: Configure Backend Service

1. Navigate to:
   https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/8c7ca8b3-b637-4658-a8ca-153ea1bb000c/settings?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41

2. Scroll to the **"Source"** section

3. Click the **"Add Root Directory"** button

4. Enter: `apps/backend`

5. Click **Save** or **Update**

### Step 2: Configure API Service

1. Navigate to:
   https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/6268e6bc-057a-40fc-97a4-3b7bff6d4251/settings?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41

2. Scroll to the **"Source"** section

3. Click the **"Add Root Directory"** button

4. Enter: `apps/api`

5. Click **Save** or **Update**

### Step 3: Configure API Gateway Service

1. Navigate to:
   https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/02d097a9-dde5-4fea-84c0-c36ccdc2619e/settings?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41

2. Scroll to the **"Source"** section

3. Click the **"Add Root Directory"** button

4. Enter: `apps/api-gateway`

5. Click **Save** or **Update**

---

## What Happens After Setting Root Directories?

Once root directories are configured, Railway will:

1. **Look in the correct directory** for each service
2. **Find the service-specific `railway.json`** file I created (e.g.,
   `apps/backend/railway.json`)
3. **Use the DOCKERFILE builder** instead of Nixpacks
4. **Find the correct Dockerfile** (e.g., `apps/backend/Dockerfile`)
5. **Build successfully** using the multi-stage Docker builds

Each service's `railway.json` now specifies:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

And each service has a `railway.toml` with:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/{service}/Dockerfile"
watchPaths = ["apps/{service}/**", "packages/**"]

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

---

## Expected Build Timeline

After configuring root directories:

- Railway will automatically trigger new deployments
- Each service will build using Docker multi-stage builds
- **Build time**: 40-60 minutes per service (they run in parallel)
- **Total time**: ~60 minutes until all services are live

---

## Service Details

| Service     | Service ID                           | Root Directory     | Dockerfile Path               | Port |
| ----------- | ------------------------------------ | ------------------ | ----------------------------- | ---- |
| backend     | 8c7ca8b3-b637-4658-a8ca-153ea1bb000c | `apps/backend`     | `apps/backend/Dockerfile`     | 3004 |
| api         | 6268e6bc-057a-40fc-97a4-3b7bff6d4251 | `apps/api`         | `apps/api/Dockerfile`         | 3001 |
| api-gateway | 02d097a9-dde5-4fea-84c0-c36ccdc2619e | `apps/api-gateway` | `apps/api-gateway/Dockerfile` | 3002 |

---

## Why This Couldn't Be Automated

I attempted several approaches:

1. ❌ **Browser Automation**: Persistent 30-second WebSocket timeouts when
   clicking UI elements
2. ❌ **Railway GraphQL API**: API calls returned "Problem processing request"
   errors
3. ❌ **Railway CLI**: `railway link` requires interactive terminal input (not
   available)
4. ✅ **Configuration Files**: Successfully created railway.json files
   (committed and pushed)
5. ⚠️ **Root Directory Setting**: Can ONLY be done through the Railway UI

---

## Quick Links

- **Project Dashboard**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41
- **Backend Settings**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/8c7ca8b3-b637-4658-a8ca-153ea1bb000c/settings?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41
- **API Settings**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/6268e6bc-057a-40fc-97a4-3b7bff6d4251/settings?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41
- **API Gateway Settings**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/02d097a9-dde5-4fea-84c0-c36ccdc2619e/settings?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41
- **GitHub Repo**: https://github.com/whodaniel/fuse

---

## Environment Variables (Optional - Can Be Set Later)

After builds succeed, you may want to configure these environment variables:

### API Service

```
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=s5vELO0OEO1486BH7clWx5e00U77F7aoGlwalH9lSIA=
```

### Backend Service

```
NODE_ENV=production
PORT=3004
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### API Gateway

```
NODE_ENV=production
PORT=3002
API_URL=${{api.RAILWAY_PRIVATE_DOMAIN}}
BACKEND_URL=${{backend.RAILWAY_PRIVATE_DOMAIN}}
```

---

## Success Criteria

✅ Root directories configured for all 3 services ✅ New deployments triggered
automatically ✅ Services build using Dockerfiles (not Nixpacks) ✅ All services
show "Active" status ✅ Health checks pass at `/health` endpoints

---

## Troubleshooting

**If builds still fail after setting root directories:**

1. Check the build logs for specific errors
2. Verify the root directory is exactly: `apps/backend`, `apps/api`, or
   `apps/api-gateway` (no leading/trailing slashes)
3. Ensure the GitHub branch is set to `main`
4. Check that the latest commits are present (6d303a6e4 and 4c3113124)

**Check deployment status:**

```bash
railway status
```

**View build logs:**

```bash
railway logs --service backend
railway logs --service api
railway logs --service api-gateway
```

---

**Once you've set the root directories, the deployments should start
automatically and complete successfully! 🚀**
