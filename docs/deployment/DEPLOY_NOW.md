# Deploy The New Fuse to CloudRuntime - Step-by-Step Guide

**Status**: ✅ CloudRuntime CLI installed and you're logged in!

## Quick Deploy (Follow These Steps)

### Step 1: Navigate to Your Project
```bash
cd .
```

### Step 2: Create CloudRuntime Project

**Option A: Use CloudRuntime Dashboard (Recommended)**
1. Go to https://cloud_runtime.app/new
2. Click "Deploy from GitHub repo" or "Empty Project"
3. Name it "the-new-fuse"

**Option B: Use CLI**
```bash
cloud_runtime init
# Follow prompts to create new project
```

### Step 3: Add Database in CloudRuntime Dashboard

1. Open your project: https://cloud_runtime.app/dashboard
2. Click "+ New" → "Database" → "PostgreSQL"
3. Wait for it to provision (takes ~30 seconds)

### Step 4: Deploy API Service (Backend)

```bash
# Navigate to API directory
cd apps/api

# Deploy to CloudRuntime
cloud_runtime up

# CloudRuntime will:
# - Detect the Dockerfile
# - Build the image
# - Deploy the service
# - Give you a URL

cd ../..
```

### Step 5: Deploy Frontend

```bash
# Navigate to Frontend directory
cd apps/frontend

# Deploy to CloudRuntime
cloud_runtime up

cd ../..
```

### Step 6: Configure Environment Variables

In CloudRuntime Dashboard (https://cloud_runtime.app/dashboard):

**For API Service:**
1. Click on the API service
2. Go to "Variables" tab
3. Add these:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<run: openssl rand -base64 32>
   ```

**For Frontend Service:**
1. Click on the Frontend service
2. Go to "Variables" tab
3. Add these:
   ```
   NODE_ENV=production
   PORT=3000
   VITE_API_URL=<your-api-service-url-from-cloud_runtime>
   ```

### Step 7: Get Your URLs

After deployment, CloudRuntime will give you URLs for each service:

- API Service: `https://<your-api-service>.thenewfuse.com`
- Frontend: `https://<your-frontend>.thenewfuse.com`

Visit the Frontend URL to see your app!

## Minimal Viable Deployment

If you want the absolute minimum to get started:

**Deploy only these 2 services:**
1. API Service (backend)
2. Frontend (UI)

**Plus:**
- PostgreSQL database (from CloudRuntime)

This gives you a working application with less complexity.

## If Something Goes Wrong

### Check Build Logs
```bash
cloud_runtime logs --service api
cloud_runtime logs --service frontend
```

### Check Service Status
```bash
cloud_runtime status
```

### Redeploy if needed
```bash
cd apps/api
cloud_runtime up --detach
```

## Alternative: Simplified CloudRuntime Deployment Script

I've created a script for you. Run this:

```bash
./cloud_runtime-simple-deploy.sh
```

This script will:
1. Create the project if needed
2. Deploy API service
3. Deploy Frontend
4. Show you next steps

## What's Already Done

✅ Dockerfiles created and optimized
✅ CloudRuntime configuration files updated
✅ All services configured for production
✅ You're logged into CloudRuntime

## What You Need to Do

1. **Create CloudRuntime project** (Step 2)
2. **Add PostgreSQL** (Step 3)
3. **Deploy API** (Step 4)
4. **Deploy Frontend** (Step 5)
5. **Set environment variables** (Step 6)

## Expected Timeline

- Project setup: 2 minutes
- Database provision: 30 seconds
- API build & deploy: 10-15 minutes (first time)
- Frontend build & deploy: 5-10 minutes (first time)

**Total: ~20-30 minutes**

## Cost

- **Free Trial**: 500 execution hours/month
- **Hobby Plan**: $5/month (recommended for continuous uptime)
- **Pro Plan**: $20/month (for production)

Your current setup will likely use:
- API Service: ~512MB RAM
- Frontend: ~256MB RAM
- PostgreSQL: ~256MB RAM
**Total: ~1GB RAM** (fits in Hobby plan)

## Need Help?

1. Check CloudRuntime status: `cloud_runtime status`
2. View logs: `cloud_runtime logs`
3. Open dashboard: `cloud_runtime open`
4. CloudRuntime docs: https://docs.thenewfuse.com

## Next: Run This Command

```bash
cd .
cloud_runtime init
```

Then follow Steps 3-6 above!
