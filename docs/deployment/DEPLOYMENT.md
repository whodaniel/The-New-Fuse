# Deployment Guide: Hybrid Vercel + Railway Setup

This guide covers deploying The New Fuse using a **hybrid approach**:

- **Frontend** → Vercel (optimized for React/static sites)
- **Backend Services** → Railway (optimized for Docker/databases)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐                  ┌─────────────────┐  │
│  │   VERCEL     │                  │    RAILWAY      │  │
│  │              │                  │                 │  │
│  │  Frontend    │◄─────────────────┤  API Gateway    │  │
│  │  (React)     │      API Calls   │  :3002          │  │
│  │              │                  │                 │  │
│  │  Port: 3000  │                  │  Backend        │  │
│  └──────────────┘                  │  :3003          │  │
│                                     │                 │  │
│                                     │  API            │  │
│                                     │  :3001          │  │
│                                     │                 │  │
│                                     │  PostgreSQL     │  │
│                                     │  Redis          │  │
│                                     └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Current Status

| Service         | Platform | Status        | URL                                                                   |
| --------------- | -------- | ------------- | --------------------------------------------------------------------- |
| **Frontend**    | Vercel   | ✅ Deployed   | https://fuse-frontend-j9kcxkge5-daniels-projects-13d7ea71.vercel.app/ |
| **API Gateway** | Railway  | 🔧 Setting up | https://api-gateway-production-XXXX.up.railway.app                    |
| **Backend**     | Railway  | 🔧 Setting up | https://backend-production-XXXX.up.railway.app                        |
| **API**         | Railway  | 🔧 Setting up | https://api-production-XXXX.up.railway.app                            |

---

## 🚀 Railway Setup Guide

### Prerequisites

1. ✅ Railway account: https://railway.app
2. ✅ Railway project created:
   https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1
3. ✅ GitHub repository connected to Railway
4. ✅ Monorepo builds at 98% success

### Step 1: Create Services in Railway

In your Railway project dashboard, create **3 services**:

#### 1.1 API Gateway Service

```bash
Service Name: api-gateway
Build Command: (handled by Dockerfile)
Start Command: (handled by Dockerfile)
Root Directory: /
Dockerfile Path: apps/api-gateway/Dockerfile.railway
```

#### 1.2 Backend Service

```bash
Service Name: backend
Build Command: (handled by Dockerfile)
Start Command: (handled by Dockerfile)
Root Directory: /
Dockerfile Path: apps/backend/Dockerfile.railway
```

#### 1.3 API Service

```bash
Service Name: api
Build Command: (handled by Dockerfile)
Start Command: (handled by Dockerfile)
Root Directory: /
Dockerfile Path: apps/api/Dockerfile.railway
```

### Step 2: Add Databases (Optional)

If your services need databases, add them in Railway:

#### PostgreSQL

```bash
1. Click "+ New" → Database → PostgreSQL
2. Railway will auto-generate connection vars
3. Reference as: ${{Postgres.DATABASE_URL}}
```

#### Redis

```bash
1. Click "+ New" → Database → Redis
2. Railway will auto-generate connection vars
3. Reference as: ${{Redis.REDIS_URL}}
```

---

## 🔑 Environment Variables

### API Gateway Environment Variables

Set these in Railway for the **api-gateway** service:

```bash
# Server Configuration
NODE_ENV=production
PORT=3002

# Database (if using)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (if using)
REDIS_URL=${{Redis.REDIS_URL}}

# API Keys & Secrets
JWT_SECRET=<your-jwt-secret-here>
API_SECRET_KEY=<your-api-secret-here>

# Service URLs
BACKEND_URL=https://backend-production-XXXX.up.railway.app
API_URL=https://api-production-XXXX.up.railway.app
FRONTEND_URL=https://fuse-frontend-j9kcxkge5-daniels-projects-13d7ea71.vercel.app

# CORS
CORS_ORIGIN=https://fuse-frontend-j9kcxkge5-daniels-projects-13d7ea71.vercel.app
```

### Backend Service Environment Variables

Set these in Railway for the **backend** service:

```bash
# Server Configuration
NODE_ENV=production
PORT=3003

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Drizzle
DRIZZLE_HIDE_UPDATE_MESSAGE=true

# API Gateway
API_GATEWAY_URL=https://api-gateway-production-XXXX.up.railway.app

# Authentication
JWT_SECRET=<your-jwt-secret-here>
SESSION_SECRET=<your-session-secret-here>

# External Services (if needed)
OPENAI_API_KEY=<your-openai-key>
STRIPE_SECRET_KEY=<your-stripe-key>
```

### API Service Environment Variables

Set these in Railway for the **api** service:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Authentication
JWT_SECRET=<your-jwt-secret-here>

# Service URLs
API_GATEWAY_URL=https://api-gateway-production-XXXX.up.railway.app
BACKEND_URL=https://backend-production-XXXX.up.railway.app
```

---

## 📦 Vercel Setup Guide

### Current Status

✅ **Vercel is already deployed!**

- Working URL:
  https://fuse-frontend-j9kcxkge5-daniels-projects-13d7ea71.vercel.app/

### Vercel Environment Variables

Add these in Vercel dashboard → Project Settings → Environment Variables:

```bash
# API Endpoints
NEXT_PUBLIC_API_GATEWAY_URL=https://api-gateway-production-XXXX.up.railway.app
NEXT_PUBLIC_API_URL=https://api-production-XXXX.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://backend-production-XXXX.up.railway.app

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Other configs (if needed)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

### Vercel Build Configuration

Ensure your `vercel.json` or project settings have:

```json
{
  "buildCommand": "cd apps/frontend && pnpm build",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "pnpm install",
  "framework": "vite"
}
```

---

## 🔄 Deployment Workflow

### Automatic Deployments

#### Vercel (Frontend)

- ✅ **Trigger**: Push to `main` branch
- ✅ **Build**: Automatic via Vercel GitHub integration
- ✅ **Preview**: Every PR gets a preview URL

#### Railway (Backend)

- ✅ **Trigger**: Push to `main` branch
- ✅ **Build**: Automatic via Railway GitHub integration
- ✅ **Deploy**: All 3 services deploy in parallel

### Manual Deployment

#### Railway CLI (if needed)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link 041cee9d-8648-4074-b5a6-0eae436de1d1

# Deploy specific service
railway up --service api-gateway
railway up --service backend
railway up --service api
```

---

## 🧪 Testing Deployments

### Health Checks

Test each service is running:

```bash
# API Gateway
curl https://api-gateway-production-XXXX.up.railway.app/health

# Backend
curl https://backend-production-XXXX.up.railway.app/health

# API
curl https://api-production-XXXX.up.railway.app/health

# Frontend (in browser)
https://fuse-frontend-j9kcxkge5-daniels-projects-13d7ea71.vercel.app/
```

### End-to-End Test

1. **Open Frontend**: Visit Vercel URL
2. **Login/Signup**: Test authentication flow
3. **Check Network Tab**: Verify API calls go to Railway URLs
4. **Test Features**: Ensure backend integration works

---

## 🧰 Alternative Deployment Modes

In addition to the hybrid Vercel + Railway path, these operational modes remain
available when needed for specific environments.

### Docker-Based Deployment

```bash
yarn clean
yarn install
yarn build
yarn start

# Unified script option
./scripts/build-and-launch.sh production
```

### Kubernetes Deployment

```bash
kubectl create namespace fuse
helm install fuse-infra ./helm/infrastructure
helm install fuse ./helm/fuse
```

### Manual Monorepo Deployment

```bash
yarn workspace @the-new-fuse/types build
yarn workspace @the-new-fuse/utils build
yarn workspace @the-new-fuse/core build
yarn workspace @the-new-fuse/database build
yarn workspace @the-new-fuse/database generate
yarn workspace @the-new-fuse/database migrate:deploy
```

### Additional Post-Deploy Checks

- `/health` for base service readiness
- `/metrics` for monitoring scrape validation
- `/status` for detailed runtime checks

---

## 🐛 Troubleshooting

### Railway Build Failing

**Issue**: Build fails with package errors

**Solution**:

```bash
# Check if monorepo builds locally
pnpm build

# If types package fails
cd packages/types && pnpm build

# Check Dockerfile paths in railway.toml
cat railway.toml
```

### CORS Errors

**Issue**: Frontend can't call backend APIs

**Solution**: Add CORS origin in Railway env vars:

```bash
CORS_ORIGIN=https://fuse-frontend-j9kcxkge5-daniels-projects-13d7ea71.vercel.app
```

### Database Connection Errors

**Issue**: Services can't connect to PostgreSQL

**Solution**:

1. Verify `DATABASE_URL` is set in Railway
2. Check PostgreSQL service is running
3. Use Railway's internal references: `${{Postgres.DATABASE_URL}}`

### Service Not Starting

**Issue**: Railway service crashes on start

**Solution**:

```bash
# Check Railway logs
railway logs --service api-gateway

# Check for missing env vars
railway variables --service api-gateway

# Verify Dockerfile builds locally
docker build -f apps/api-gateway/Dockerfile.railway .
```

---

## 📊 Monitoring & Logs

### Railway Logs

View logs for each service:

```bash
# Via Dashboard
https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1

# Via CLI
railway logs --service api-gateway
railway logs --service backend
railway logs --service api
```

### Vercel Logs

View frontend logs:

```bash
# Via Dashboard
https://vercel.com/dashboard

# Via CLI
vercel logs <deployment-url>
```

---

## 💰 Cost Estimation

### Railway (Backend)

- **Free Tier**: $5/month credit
- **Hobby Plan**: $5/month per service
- **Estimated**: ~$15-20/month (3 services + database)

### Vercel (Frontend)

- **Free Tier**: Generous (100GB bandwidth, unlimited deployments)
- **Pro**: $20/month (if needed for team features)
- **Estimated**: $0-20/month

**Total Estimated Cost**: $15-40/month

---

## 🎯 Next Steps

### After Initial Deployment

1. ✅ **Test all endpoints** - Verify health checks pass
2. ✅ **Update Vercel env vars** - Point to Railway URLs
3. ✅ **Test E2E flow** - Login, API calls, database
4. ✅ **Set up monitoring** - Add error tracking (Sentry, etc.)
5. ✅ **Configure custom domains** - Add your own domain
6. ✅ **Enable HTTPS** - Ensure all services use SSL
7. ✅ **Set up CI/CD** - Automated tests before deploy

### Production Readiness Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] CORS configured correctly
- [ ] Health checks passing
- [ ] Error monitoring enabled
- [ ] Backup strategy defined
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Rate limiting configured
- [ ] Security headers set

### CI/CD Runbook Addendum

Use this checklist-oriented flow for routine and emergency releases.

#### Pre-Deployment Checks

- [ ] `pnpm run lint && pnpm run type-check && pnpm run test && pnpm run build` all pass
- [ ] PR approvals and CI checks are complete
- [ ] Railway environment variables and migration plan are confirmed
- [ ] Team/stakeholders are notified for the deployment window

#### Release Paths

- **Production (default)**: merge to `main`, then monitor GitHub Actions (`gh run watch`)
- **Tagged release**: `git tag -a vX.Y.Z -m "Release vX.Y.Z"` and `git push origin vX.Y.Z`
- **Staging**: manual workflow dispatch (`gh workflow run deploy.yml -f environment=staging`)

#### Hotfix and Rollback

```bash
# Hotfix branch
git checkout main && git pull
git checkout -b hotfix/<issue>

# Rollback (service-level)
railway rollback --service=api-gateway
railway rollback --service=api
railway rollback --service=backend
railway rollback --service=frontend

# Rollback (git-level)
git revert <merge-commit-sha> -m 1
git push origin main
```

#### Deployment Metrics to Track

- **Lead time for changes**: commit/merge to production
- **Deployment frequency**: number of successful production deploys
- **Change failure rate**: percent of deploys that require rollback or hotfix
- **MTTR**: time to recover from failed deploys
- **Success rate**: percent of deploys completing with healthy checks

---

## 🔗 Useful Links

- **Railway Project**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- **Railway Docs**: https://docs.railway.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Repository**: https://github.com/whodaniel/fuse

---

## 📞 Support

If you encounter issues:

1. Check Railway logs first
2. Review Vercel deployment logs
3. Test services individually
4. Check environment variables
5. Verify database connections

**Remember**: Vercel handles frontend, Railway handles everything else! 🚀
