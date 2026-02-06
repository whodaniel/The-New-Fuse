# Complete Railway Deployment Instructions

## Current Status

- **Project ID**: `041cee9d-8648-4074-b5a6-0eae436de1d1`
- **Environment ID**: `f706eaae-de9e-4a9b-a970-944dd4a6be41`
- **Project URL**:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41

## Services to Deploy

1. **Frontend** (`apps/frontend`) - Port 3000
2. **API** (`apps/api`) - Port 3001
3. **Backend** (`apps/backend`) - Port 3004
4. **API Gateway** (`apps/api-gateway`) - Port 3002

All services have:

- ✅ Dockerfile configured
- ✅ railway.toml configured
- ✅ Health checks configured
- ✅ Multi-stage builds for optimization

## Step-by-Step Deployment

### Option A: Quick Deployment (Recommended)

This uses the Railway dashboard to create services, then deploys via CLI.

#### 1. Create Services in Railway Dashboard

Visit: https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1

For each service (api, backend, api-gateway, frontend):

1. Click **"+ New"**
2. Select **"Empty Service"**
3. Name it exactly as shown:
   - `api`
   - `backend`
   - `api-gateway`
   - `frontend`
4. Click **"Create"**

#### 2. Deploy All Services

Run from the project root:

```bash
cd .

# Deploy API
cd apps/api
RAILWAY_SERVICE=api railway up --detach
cd ../..

# Deploy Backend
cd apps/backend
RAILWAY_SERVICE=backend railway up --detach
cd ../..

# Deploy API Gateway
cd apps/api-gateway
RAILWAY_SERVICE=api-gateway railway up --detach
cd ../..

# Deploy Frontend
cd apps/frontend
RAILWAY_SERVICE=frontend railway up --detach
cd ../..
```

Or use the automated script:

```bash
./deploy-all-services.sh
```

### Option B: Using nixpacks.toml (Alternative)

If you want Railway to auto-detect and deploy all services at once:

1. Ensure `nixpacks.toml` exists in the root with multi-service configuration
2. Push to GitHub and connect Railway to the repository
3. Railway will automatically detect and deploy all services

### Option C: GitHub Integration (Best for CI/CD)

1. **Connect Repository to Railway**
   - Go to Railway Dashboard
   - Click "+ New"
   - Select "GitHub Repo"
   - Choose the `whodaniel/fuse` repository

2. **Configure Service Detection**
   - Railway will scan for Dockerfiles
   - It should auto-detect all 4 services
   - Confirm each service creation

3. **Automatic Deployments**
   - Every git push to `main` will auto-deploy
   - Pull requests create preview deployments

## Environment Variables

After deployment, configure these variables in the Railway Dashboard:

### API Service

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate with: openssl rand -base64 32>
```

### Backend Service

```env
NODE_ENV=production
PORT=3004
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### API Gateway Service

```env
NODE_ENV=production
PORT=3002
API_URL=${{api.RAILWAY_PRIVATE_DOMAIN}}:3001
BACKEND_URL=${{backend.RAILWAY_PRIVATE_DOMAIN}}:3004
```

### Frontend Service

```env
NODE_ENV=production
PORT=3000
VITE_API_URL=https://${{api-gateway.RAILWAY_PUBLIC_DOMAIN}}
```

## Add Required Databases

If not already added:

1. **PostgreSQL**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Wait for provisioning (~30 seconds)

2. **Redis**
   - Click "+ New"
   - Select "Database" → "Redis"
   - Wait for provisioning (~30 seconds)

## Deployment Monitoring

### Check Build Status

```bash
# View API logs
railway logs --service api

# View Backend logs
railway logs --service backend

# View API Gateway logs
railway logs --service api-gateway

# View Frontend logs
railway logs --service frontend
```

### Open Services

```bash
# Open Railway dashboard
railway open

# Get service URLs
railway service --service api
railway service --service frontend
```

### Health Checks

All services have health endpoints:

- API: `https://<api-url>/health`
- Backend: `https://<backend-url>/health`
- API Gateway: `https://<api-gateway-url>/health`
- Frontend: `https://<frontend-url>/` (root path)

## Expected Timeline

| Task                            | Duration          |
| ------------------------------- | ----------------- |
| Create services in dashboard    | 5 minutes         |
| Deploy API service              | 10-15 minutes     |
| Deploy Backend service          | 10-15 minutes     |
| Deploy API Gateway service      | 8-12 minutes      |
| Deploy Frontend service         | 8-12 minutes      |
| Configure environment variables | 10 minutes        |
| **Total**                       | **50-70 minutes** |

## Troubleshooting

### Build Failures

**Symptom**: Build fails with dependency errors

**Solution**:

```bash
# Check if pnpm-lock.yaml is committed
git ls-files | grep pnpm-lock.yaml

# Ensure all package.json files exist
find . -name "package.json" | grep -E "(apps|packages)"
```

### Service Won't Start

**Symptom**: Build succeeds but service crashes

**Solution**:

1. Check environment variables are set
2. Verify DATABASE_URL format
3. Check Railway logs for specific errors

### Port Conflicts

**Symptom**: Port already in use errors

**Solution**: Railway automatically assigns ports. Ensure your app reads from
`process.env.PORT`

### Database Connection Issues

**Symptom**: Cannot connect to Postgres/Redis

**Solution**:

1. Verify database services are running
2. Use Railway template variables: `${{Postgres.DATABASE_URL}}`
3. Check internal networking is enabled

## Cost Estimate

### Hobby Plan ($5/month)

- 4 services × ~512MB RAM = ~2GB total
- PostgreSQL: ~256MB
- Redis: ~128MB
- **Total**: ~2.4GB RAM
- Estimated cost: $5-10/month

### Pro Plan ($20/month)

- Higher limits and priority builds
- Recommended for production

## Post-Deployment Checklist

- [ ] All 4 services deployed and running
- [ ] PostgreSQL database connected
- [ ] Redis cache connected
- [ ] Environment variables configured for all services
- [ ] Health checks passing
- [ ] Frontend loads in browser
- [ ] API endpoints responding
- [ ] No errors in logs
- [ ] Custom domains configured (optional)
- [ ] Monitoring alerts set up (optional)

## Quick Commands

```bash
# Check overall status
railway status

# Redeploy a specific service
cd apps/api && railway up --detach

# View recent deployments
railway list

# Get service info
railway variables --service api

# Restart a service
railway service restart api
```

## Support Resources

- Railway Dashboard:
  https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Repo: https://github.com/whodaniel/fuse

## Success Criteria

Your deployment is successful when:

1. ✅ All 4 services show "Active" in Railway dashboard
2. ✅ All health checks are green
3. ✅ Frontend loads and displays UI
4. ✅ Frontend can communicate with API Gateway
5. ✅ API Gateway routes to API and Backend
6. ✅ Database connections work
7. ✅ No critical errors in any service logs
