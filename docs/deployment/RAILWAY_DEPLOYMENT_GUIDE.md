# 🚂 Railway Multi-Service Deployment Guide

## ✅ What's Been Configured

All services are now ready to deploy to Railway with proper Docker configurations:

### Services Ready:

1. **Frontend** (Port 8080)
   - Vite React app served with nginx
   - Dockerfile: `apps/frontend/Dockerfile.railway`
   - Health check: `/health`
   - **No Supabase required** - uses local auth system

2. **API Service** (Port 3001)
   - NestJS backend API
   - Dockerfile: `apps/api/Dockerfile.railway`
   - Health check: `/health`
   - Requires: PostgreSQL database

3. **API Gateway** (Port 3002)
   - API Gateway service
   - Dockerfile: `apps/api-gateway/Dockerfile.railway`
   - Health check: `/health`

4. **Backend Service** (Port 3003)
   - Main backend service
   - Dockerfile: `apps/backend/Dockerfile.railway`
   - Health check: `/health`
   - Requires: PostgreSQL database

---

## 🚀 Deploy to Railway

### Option 1: Automatic Multi-Service Deploy (Recommended)

Railway should automatically detect your `railway.toml` and create all 4 services.

1. **Connect Repository**
   - Go to https://railway.app/dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `whodaniel/fuse`
   - Select branch: `claude/fix-railway-deployment-saas-011CV5qmykNfFy3h3LGLUHo8`

2. **Railway will create services automatically:**
   - ✅ frontend (nginx on port 8080)
   - ✅ api (Node.js on port 3001)
   - ✅ api-gateway (Node.js on port 3002)
   - ✅ backend (Node.js on port 3003)

### Option 2: Manual Service Creation

If Railway doesn't auto-detect, create each service manually:

#### For each service (frontend, api, api-gateway, backend):

1. Click "+ New" in your Railway project
2. Select "GitHub Repo" → `whodaniel/fuse`
3. Configure:
   - **Root Directory**: Leave empty (builds from root)
   - **Dockerfile Path**: `apps/[service-name]/Dockerfile.railway`
   - **Branch**: `claude/fix-railway-deployment-saas-011CV5qmykNfFy3h3LGLUHo8`

---

## ⚙️ Environment Variables

### Required for ALL Services:

```bash
NODE_ENV=production
```

### Frontend Service:

```bash
PORT=8080
VITE_API_URL=https://your-api-service.railway.app
VITE_WS_URL=wss://your-api-service.railway.app
```

### API Service:

```bash
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-frontend.railway.app
```

### API Gateway:

```bash
PORT=3002
API_SERVICE_URL=https://your-api-service.railway.app
BACKEND_SERVICE_URL=https://your-backend-service.railway.app
```

### Backend Service:

```bash
PORT=3003
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://default:password@host:6379
```

---

## 📦 Add Database (PostgreSQL)

Railway can provision a PostgreSQL database:

1. In your project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will create `DATABASE_URL` automatically
4. **Connect it to services:**
   - Go to each service (api, backend)
   - Click "Variables" tab
   - Reference the database: `${{Postgres.DATABASE_URL}}`

---

## 🔗 Custom Domain Setup

### Set up www.thenewfuse.com:

1. Go to **Frontend Service** in Railway
2. Click "Settings" → "Domains"
3. Click "Custom Domain"
4. Enter: `www.thenewfuse.com`
5. Add the provided CNAME record to your domain DNS:
   ```
   Type: CNAME
   Name: www
   Value: [railway-provided-value].railway.app
   TTL: 300
   ```

---

## 🏗️ Build Order & Dependencies

Railway will build in this order:

1. **Database** (if added) - Starts first
2. **Backend Services** (api, api-gateway, backend) - Build in parallel
3. **Frontend** - Builds last (needs to know API URLs)

### Each Dockerfile builds:

```
1. Install workspace dependencies (pnpm)
2. Build required packages (@the-new-fuse/*)
3. Build the service
4. Copy to production image
5. Start service
```

---

## 🔍 Monitor Deployments

### Check Build Logs:

1. Click on each service in Railway
2. Go to "Deployments" tab
3. Click latest deployment to see logs

### Common Issues:

**Build fails with "Cannot find module":**
- Workspace packages didn't build
- Check logs for which package failed
- May need to add `|| echo "build failed"` to continue

**Health check failing:**
- Service isn't responding on the correct port
- Check `PORT` environment variable matches Dockerfile `EXPOSE`

**Connection errors between services:**
- Services can't reach each other
- Use Railway's internal URLs: `${{SERVICE_NAME.RAILWAY_PRIVATE_DOMAIN}}`

---

## ✅ Verify Deployment

Once deployed, test each service:

### Frontend:
```bash
curl https://www.thenewfuse.com
# Should return HTML
```

### API:
```bash
curl https://your-api.railway.app/health
# Should return: {"status":"ok"}
```

### API Gateway:
```bash
curl https://your-gateway.railway.app/health
# Should return: {"status":"ok"}
```

### Backend:
```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok"}
```

---

## 🎯 Next Steps After Deployment

1. **Test the Frontend** - Visit www.thenewfuse.com
2. **Test Auth** - Try signing up/logging in (uses local auth, no Supabase)
3. **Check Service Communication** - Ensure frontend can reach API
4. **Set up Monitoring** - Use Railway's built-in metrics
5. **Configure Auto-Deploy** - Push to branch will auto-deploy

---

## 🐛 Troubleshooting

### Frontend shows blank page:
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check nginx logs in Railway

### API returns 502/503:
- Service crashed after start
- Check logs for runtime errors
- Verify DATABASE_URL is correct

### Build takes too long / times out:
- Railway has 30min build timeout
- Monorepo builds can be slow
- Consider splitting into smaller services

### Can't connect to database:
- Check `DATABASE_URL` format
- Ensure database service is running
- Verify Prisma migrations ran

---

## 📞 Railway CLI Commands

Install Railway CLI:
```bash
npm install -g @railway/cli
railway login
```

Link to project:
```bash
railway link
```

View logs:
```bash
railway logs
```

Run commands in Railway environment:
```bash
railway run node --version
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All 4 services show "Active" in Railway
- ✅ Health checks pass for all backend services
- ✅ Frontend loads at www.thenewfuse.com
- ✅ You can sign up and log in
- ✅ No errors in browser console
- ✅ API calls work from frontend

**Your SaaS is LIVE!** 🚀
