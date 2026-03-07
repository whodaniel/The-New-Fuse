# Deploy The New Fuse to Railway - Step-by-Step Guide

**Status**: ✅ Railway CLI installed and you're logged in!

## Quick Deploy (Follow These Steps)

### Step 1: Navigate to Your Project
```bash
cd .
```

### Step 2: Create Railway Project

**Option A: Use Railway Dashboard (Recommended)**
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo" or "Empty Project"
3. Name it "the-new-fuse"

**Option B: Use CLI**
```bash
railway init
# Follow prompts to create new project
```

### Step 3: Add Database in Railway Dashboard

1. Open your project: https://railway.app/dashboard
2. Click "+ New" → "Database" → "PostgreSQL"
3. Wait for it to provision (takes ~30 seconds)

### Step 4: Deploy API Service (Backend)

```bash
# Navigate to API directory
cd apps/api

# Deploy to Railway
railway up

# Railway will:
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

# Deploy to Railway
railway up

cd ../..
```

### Step 6: Configure Environment Variables

In Railway Dashboard (https://railway.app/dashboard):

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
   VITE_API_URL=<your-api-service-url-from-railway>
   ```

### Step 7: Get Your URLs

After deployment, Railway will give you URLs for each service:

- API Service: `https://<your-api-service>.up.railway.app`
- Frontend: `https://<your-frontend>.up.railway.app`

Visit the Frontend URL to see your app!

## Minimal Viable Deployment

If you want the absolute minimum to get started:

**Deploy only these 2 services:**
1. API Service (backend)
2. Frontend (UI)

**Plus:**
- PostgreSQL database (from Railway)

This gives you a working application with less complexity.

## If Something Goes Wrong

### Check Build Logs
```bash
railway logs --service api
railway logs --service frontend
```

### Check Service Status
```bash
railway status
```

### Redeploy if needed
```bash
cd apps/api
railway up --detach
```

## Alternative: Simplified Railway Deployment Script

I've created a script for you. Run this:

```bash
./railway-simple-deploy.sh
```

This script will:
1. Create the project if needed
2. Deploy API service
3. Deploy Frontend
4. Show you next steps

## What's Already Done

✅ Dockerfiles created and optimized
✅ Railway configuration files updated
✅ All services configured for production
✅ You're logged into Railway

## What You Need to Do

1. **Create Railway project** (Step 2)
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

1. Check Railway status: `railway status`
2. View logs: `railway logs`
3. Open dashboard: `railway open`
4. Railway docs: https://docs.railway.app

## Next: Run This Command

```bash
cd .
railway init
```

Then follow Steps 3-6 above!
