# Manual Deployment Steps - CloudRuntime Dashboard Configuration

## Current Status

✅ **Completed**:
- CloudRuntime project created: `the-new-fuse`
- PostgreSQL database provisioned
- API service created with environment variables
- Frontend service created with environment variables
- Code uploaded to CloudRuntime
- Dockerfiles are ready

⚠️ **Issue**: CloudRuntime's CLI doesn't trigger builds automatically when using `cloud_runtime.toml` for multiple services in a monorepo. We need to configure each service in the CloudRuntime dashboard.

---

## 🎯 Complete These Steps in CloudRuntime Dashboard

### Step 1: Open Your CloudRuntime Dashboard

Open this URL in your browser:
```
https://thenewfuse.com/project/453fe77c-a788-412d-8507-bc3e7bc548c3
```

You should see three services:
- **Postgres** (running)
- **api** (not deployed yet)
- **frontend** (not deployed yet)

---

### Step 2: Configure API Service

1. **Click on the `api` service** in the dashboard

2. **Go to the "Settings" tab**

3. **Scroll to "Build" section** and configure:
   - **Builder**: Select `Dockerfile`
   - **Dockerfile Path**: Enter `apps/api/Dockerfile`
   - **Root Directory**: Leave as `/` (the monorepo root)

4. **Scroll to "Deploy" section** and configure:
   - **Health Check Path**: `/health`
   - **Health Check Timeout**: `300`
   - **Restart Policy**: `On Failure`
   - **Max Retries**: `10`

5. **Click "Deploy"** button at the top or wait for auto-deploy

---

### Step 3: Configure Frontend Service

1. **Click on the `frontend` service** in the dashboard

2. **Go to the "Settings" tab**

3. **Scroll to "Build" section** and configure:
   - **Builder**: Select `Dockerfile`
   - **Dockerfile Path**: Enter `apps/frontend/Dockerfile`
   - **Root Directory**: Leave as `/` (the monorepo root)

4. **Scroll to "Deploy" section** and configure:
   - **Restart Policy**: `On Failure`
   - **Max Retries**: `10`

5. **Click "Deploy"** button at the top or wait for auto-deploy

---

### Step 4: Verify Environment Variables

#### For API Service:
1. Click on **api** service
2. Go to **Variables** tab
3. Verify these variables exist:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=QP3TdsL7K+rBJe2YllN6+p8onci754qaaPnPcvppMW8=
   NODE_ENV=production
   PORT=3001
   ```

#### For Frontend Service:
1. Click on **frontend** service
2. Go to **Variables** tab
3. Verify these variables exist:
   ```
   NODE_ENV=production
   PORT=3000
   ```
4. **Note**: `VITE_API_URL` will be added after the API deploys

---

### Step 5: Monitor Builds

After configuring both services:

1. **Click on "Deployments" tab** for each service
2. **Watch the build logs** in real-time
3. **Builds should take 10-15 minutes** for first deployment

You'll see:
- Dockerfile build stages
- Dependencies installing
- TypeScript compilation
- Docker image creation
- Service starting

---

### Step 6: Get API URL (After API Build Completes)

1. **Click on the `api` service**
2. **Go to "Settings" tab**
3. **Scroll to "Domains" section**
4. **Click "Generate Domain"** if no domain exists
5. **Copy the generated URL** (e.g., `https://api-production-xxxx.thenewfuse.com`)

---

### Step 7: Add API URL to Frontend

1. **Click on the `frontend` service**
2. **Go to "Variables" tab**
3. **Click "+ New Variable"**
4. **Add**:
   - Variable: `VITE_API_URL`
   - Value: `<paste-the-api-url-from-step-6>`
5. **Click "Add"**

This will trigger a **redeploy** of the frontend with the API URL.

---

### Step 8: Generate Frontend Domain

1. **Click on the `frontend` service**
2. **Go to "Settings" tab**
3. **Scroll to "Domains" section**
4. **Click "Generate Domain"**
5. **Copy the URL** (e.g., `https://frontend-production-xxxx.thenewfuse.com`)

---

### Step 9: Test Your Deployment

1. **Open the API URL** in your browser:
   ```
   https://your-api-url.thenewfuse.com/health
   ```
   You should see a health check response.

2. **Open the Frontend URL** in your browser:
   ```
   https://your-frontend-url.thenewfuse.com
   ```
   Your frontend should load and connect to the API.

---

## Alternative: Use CloudRuntime CLI with Direct Deployment

If you prefer to use the CLI, you can try this approach:

### For API Service:

```bash
cd .

# Ensure cloud_runtime.toml points to API
cat > cloud_runtime.toml << 'EOF'
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/api/Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
EOF

# Deploy
cloud_runtime up --service api
```

### For Frontend Service:

```bash
cd .

# Update cloud_runtime.toml for frontend
cat > cloud_runtime.toml << 'EOF'
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/frontend/Dockerfile"

[deploy]
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
EOF

# Deploy
cloud_runtime up --service frontend
```

---

## 🔍 Troubleshooting

### If builds don't start:
1. Check that Dockerfile paths are correct in service settings
2. Verify the root directory is `/` (not `apps/api` or `apps/frontend`)
3. Try clicking "Deploy" manually in the dashboard

### If builds fail:
1. Check build logs for specific errors
2. Verify Dockerfiles are valid
3. Check that all dependencies are in `pnpm-lock.yaml`

### If services won't start:
1. Check deployment logs for runtime errors
2. Verify environment variables are set correctly
3. Check that DATABASE_URL points to the Postgres service

---

## 📊 Expected Timeline

| Step | Time |
|------|------|
| Configure services in dashboard | 5 min |
| API build | 10-15 min |
| Frontend build | 5-10 min |
| Configure frontend with API URL | 2 min |
| Frontend redeploy | 5 min |
| **Total** | **~30-40 min** |

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Both services show "Active" in CloudRuntime dashboard
2. ✅ API health check returns 200 OK
3. ✅ Frontend loads in browser
4. ✅ Frontend can communicate with API
5. ✅ No errors in deployment logs

---

## 🎉 Summary

The CloudRuntime CLI uploaded your code successfully, but multi-service monorepo deployments in CloudRuntime work best when configured through the dashboard UI. Follow the steps above to complete your deployment!

**Dashboard URL**: https://thenewfuse.com/project/453fe77c-a788-412d-8507-bc3e7bc548c3

---

## 📞 Need Help?

- **CloudRuntime Discord**: https://discord.gg/cloud_runtime
- **CloudRuntime Docs**: https://docs.thenewfuse.com
- **Check service logs**: Click on service → Deployments tab → View logs

---

*The code is ready, Docker configuration is perfect, environment variables are set. You just need to configure the build settings in the CloudRuntime dashboard!*
