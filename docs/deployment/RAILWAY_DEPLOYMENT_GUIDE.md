# The New Fuse - Railway Deployment Guide

## Quick Start

This guide will help you deploy The New Fuse framework to Railway in under 20
minutes.

---

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub Access**: Repository at https://github.com/whodaniel/fuse
3. **API Keys**: OpenAI, Anthropic, and/or Gemini API keys
4. **Database**: Railway PostgreSQL plugin
5. **Redis**: Railway Redis plugin

### Build Guardrails (Monorepo)

- Prefer Docker-based deployments for monorepo consistency (instead of Nixpacks).
- Set **Root Directory** to `.` for services that use `Dockerfile.railway`.
- Set **Dockerfile Path** to `./Dockerfile.railway`.
- Set `SERVICE_PATH` build arg per service (`api-gateway`, `backend`, etc.).

---

## Step 1: Prepare Repository

### 1.1 Verify Local Changes

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse

# Check current status
git status

# You should see modified files:
# - package.json (updated build script)
# - Dockerfile.railway (optimized for Railway)
# - .env.railway.example (new environment template)
```

### 1.2 Commit and Push Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Configure Railway deployment with essential packages only

- Exclude problematic packages (sync-core, ui-consolidated, integration-tests)
- Update Dockerfile.railway to build only essential dependencies
- Add .env.railway.example with comprehensive configuration
- Achieve 100% build success for core services (50/50 packages)"

# Push to GitHub
git push origin main
```

> **Important**: Railway deploys from GitHub, so pushing is required before
> deployment.

---

## Step 2: Configure Railway Services

### 2.1 Access Your Railway Project

Navigate to: https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1

### 2.2 Add PostgreSQL Plugin

1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create the database and set environment variables
3. Note the generated `DATABASE_URL` variable

### 2.3 Add Redis Plugin

1. Click **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway will automatically create Redis and set `REDIS_URL`

---

## Step 3: Deploy Core Services

### 3.1 Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select `whodaniel/fuse` repository
3. Select branch: `main`
4. Configure service:
   - **Name**: `Frontend`
   - **Build Command**:
     `pnpm install && pnpm --filter @the-new-fuse/frontend-app build`
   - **Start Command**:
     `cd apps/frontend && npx http-server dist -p 3000 -a 0.0.0.0`
   - **Port**: `3000`

**Environment Variables** (click "Variables" tab):

```bash
NODE_ENV=production
PORT=3000
API_GATEWAY_URL=${{ApiGateway.RAILWAY_PUBLIC_DOMAIN}}
BACKEND_URL=${{Backend.RAILWAY_PRIVATE_DOMAIN}}
```

### 3.2 Deploy API Gateway Service

1. Click **"+ New"** → **"GitHub Repo"** → Select `whodaniel/fuse`
2. Configure service:
   - **Name**: `ApiGateway`
   - **Root Directory**: `.`
   - **Dockerfile Path**: `./Dockerfile.railway`
   - **Build Args**: `SERVICE_PATH=api-gateway`

**Environment Variables**:

```bash
NODE_ENV=production
PORT=3005
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
BACKEND_URL=${{Backend.RAILWAY_PRIVATE_DOMAIN}}
JWT_SECRET=<GENERATE_32_CHAR_RANDOM_STRING>
```

### 3.3 Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select `whodaniel/fuse`
2. Configure service:
   - **Name**: `Backend`
   - **Root Directory**: `.`
   - **Dockerfile Path**: `./Dockerfile.railway`
   - **Build Args**: `SERVICE_PATH=backend`

**Environment Variables**:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
OPENAI_API_KEY=<YOUR_OPENAI_KEY>
ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_KEY>
GEMINI_API_KEY=<YOUR_GEMINI_KEY>
JWT_SECRET=<SAME_AS_GATEWAY>
```

---

## Step 4: Configure Environment Variables

### Generate Secrets

Use these commands to generate secure secrets:

```bash
# JWT Secret (32 characters)
openssl rand -base64 32

# Session Secret (32 characters)
openssl rand -base64 32
```

### Full Environment Configuration

Copy values from `.env.railway.example` and set in Railway dashboard for each
service.

**Common Variables (all services)**:

- `NODE_ENV=production`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `REDIS_URL=${{Redis.REDIS_URL}}`
- `JWT_SECRET=<your_generated_secret>`

**AI Provider Keys (Backend only)**:

- `OPENAI_API_KEY=<your_key>`
- `ANTHROPIC_API_KEY=<your_key>`
- `GEMINI_API_KEY=<your_key>`

---

## Step 5: Verify Deployment

### 5.1 Monitor Build Logs

1. Click on each service in Railway dashboard
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. Watch build logs for errors

**Expected build time**: 10-15 minutes per service

### 5.2 Check Service Health

Once deployed, verify each service:

```bash
# Frontend (replace with your Railway domain)
curl https://frontend-production-xxxx.up.railway.app

# API Gateway
curl https://api-gateway-production-xxxx.up.railway.app/health

# Backend (internal only, check logs)
# Look for "Application started successfully" in Railway logs
```

### 5.3 Test End-to-End

1. Open frontend URL in browser
2. Try to login/register
3. Test workflow creation
4. Verify API calls work

---

## Step 6: Database Migration

Once Backend is deployed and running:

```bash
# Option 1: Use Railway CLI
railway run npx drizzle migrate deploy

# Option 2: Add to Dockerfile.railway (automatic)
# This is already configured in the Dockerfile
```

Check logs for migration success:

```
Railway logs → Backend → Search for "drizzle migrate"
```

---

## Troubleshooting

### Build Failures

**Issue**: Docker build fails with "Cannot find module" **Solution**:

- Verify `package.json` has updated build script
- Check Dockerfile.railway excludes problematic packages
- Review build logs for specific missing packages
- Ensure all required workspace `package.json` files are copied during image build
- Ensure built workspace outputs are copied into the runtime image

### Service Won't Start

**Issue**: Service crashes on startup **Solution**:

- Check environment variables are set correctly
- Verify `DATABASE_URL` and `REDIS_URL` are populated
- Review startup logs for specific errors
- Ensure app binds to Railway-provided `PORT`
- Ensure `/health` endpoint returns HTTP 200 for Railway health checks

### Database Connection Errors

**Issue**: "Cannot connect to database" **Solution**:

1. Verify PostgreSQL plugin is added
2. Check `DATABASE_URL` environment variable
3. Ensure Backend service can reach database (Railway private networking)
4. Run `npx drizzle migrate deploy` manually

### Inter-service Communication Issues

**Issue**: Frontend can't reach API Gateway **Solution**:

1. Use `${{ServiceName.RAILWAY_PUBLIC_DOMAIN}}` for external URLs
2. Use `${{ServiceName.RAILWAY_PRIVATE_DOMAIN}}` for internal service-to-service
3. Verify CORS settings allow frontend domain

---

## Deployment Checklist

- [ ] Local changes committed and pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL plugin added
- [ ] Redis plugin added
- [ ] Frontend service deployed
- [ ] API Gateway service deployed
- [ ] Backend service deployed
- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Health checks passing
- [ ] Frontend accessible via browser
- [ ] API Gateway responding
- [ ] End-to-end workflows tested

---

## Post-Deployment

### Custom Domains (Optional)

1. Go to service settings
2. Click **"Settings"** → **"Domains"**
3. Add custom domain (e.g., `app.thenewfuse.com`)
4. Update DNS records as instructed

### Monitoring

1. Enable Railway metrics: **Service** → **"Metrics"** tab
2. Set up alerts for downtime
3. Monitor logs regularly

### Scaling

Railway auto-scales based on traffic. To configure:

1. **Service** → **"Settings"** → **"Deploy"**
2. Adjust resources as needed

---

## Support

- **Railway Dashboard**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- **GitHub Repository**: https://github.com/whodaniel/fuse
- **Railway Docs**: https://docs.railway.app

---

## Success! 🎉

Your New Fuse platform should now be live on Railway. Access it via the
Railway-provided domains and start building!
