# The New Fuse - Final Deployment Steps to CloudRuntime

## ✅ What's Ready

All services are prepared and ready to deploy:
- ✅ Dockerfiles configured for all services
- ✅ cloud_runtime.toml files configured
- ✅ Project linked to TNF (041cee9d-8648-4074-b5a6-0eae436de1d1)
- ✅ Environment configured (production: f706eaae-de9e-4a9b-a970-944dd4a6be41)
- ✅ Services unlinked and ready for fresh deployment

## 📋 Required Manual Steps

### Step 1: Create Services in CloudRuntime Dashboard (5 minutes)

Since CloudRuntime CLI requires interactive input for service creation, you need to create empty services through the web dashboard first.

1. **Open Your CloudRuntime Project**
   - Visit: https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1?environmentId=f706eaae-de9e-4a9b-a970-944dd4a6be41
   - You should see your TNF project dashboard

2. **Create API Service**
   - Click "+ New" button
   - Select "Empty Service"
   - Name it: `api`
   - Click "Create"

3. **Create Backend Service**
   - Click "+ New" button
   - Select "Empty Service"
   - Name it: `backend`
   - Click "Create"

4. **Create API Gateway Service**
   - Click "+ New" button
   - Select "Empty Service"
   - Name it: `api-gateway`
   - Click "Create"

5. **Check Frontend Service**
   - If `frontend` service doesn't exist, create it the same way
   - Click "+ New" → "Empty Service" → Name: `frontend`

6. **Add Databases (if not already added)**
   - Click "+ New" → "Database" → "PostgreSQL" → Wait for provisioning
   - Click "+ New" → "Database" → "Redis" → Wait for provisioning

After this step, you should have 4 services + 2 databases in your CloudRuntime dashboard.

### Step 2: Deploy All Services (15 minutes)

Now that services exist, deploy each one from your terminal:

```bash
cd .

# Deploy API Service
cd apps/api
cloud_runtime link --service api
cloud_runtime up --detach
cd ../..

# Deploy Backend Service
cd apps/backend
cloud_runtime link --service backend
cloud_runtime up --detach
cd ../..

# Deploy API Gateway
cd apps/api-gateway
cloud_runtime link --service api-gateway
cloud_runtime up --detach
cd ../..

# Deploy Frontend
cd apps/frontend
cloud_runtime link --service frontend
cloud_runtime up --detach
cd ../..
```

**Or use this automated script:**

```bash
./deploy-to-services.sh
```

### Step 3: Configure Environment Variables (10 minutes)

While builds are running, configure environment variables for each service.

#### For API Service

1. Go to CloudRuntime Dashboard → Click "api" service → "Variables" tab
2. Add these variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<paste-the-secret-generated-below>
```

Generate JWT Secret:
```bash
openssl rand -base64 32
```

#### For Backend Service

1. Go to CloudRuntime Dashboard → Click "backend" service → "Variables" tab
2. Add these variables:

```env
NODE_ENV=production
PORT=3004
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

#### For API Gateway Service

1. Go to CloudRuntime Dashboard → Click "api-gateway" service → "Variables" tab
2. Add these variables:

```env
NODE_ENV=production
PORT=3002
API_URL=${{api.CLOUD_RUNTIME_PRIVATE_DOMAIN}}
BACKEND_URL=${{backend.CLOUD_RUNTIME_PRIVATE_DOMAIN}}
```

#### For Frontend Service

1. Go to CloudRuntime Dashboard → Click "frontend" service → "Variables" tab
2. Add these variables:

```env
NODE_ENV=production
PORT=3000
VITE_API_URL=https://${{api-gateway.CLOUD_RUNTIME_PUBLIC_DOMAIN}}
```

**Note**: After adding variables, click "Deploy" to restart each service with the new configuration.

### Step 4: Monitor Deployments (ongoing)

Watch build progress for all services:

```bash
# Watch API build
cloud_runtime logs --service api

# Watch Backend build
cloud_runtime logs --service backend

# Watch API Gateway build
cloud_runtime logs --service api-gateway

# Watch Frontend build
cloud_runtime logs --service frontend
```

### Step 5: Verify Deployment (5 minutes)

Once all builds complete:

1. **Check Service Health**
   ```bash
   # Get API URL
   cloud_runtime service --service api
   curl https://<api-url>/health

   # Get Backend URL
   cloud_runtime service --service backend
   curl https://<backend-url>/health

   # Get API Gateway URL
   cloud_runtime service --service api-gateway
   curl https://<api-gateway-url>/health

   # Get Frontend URL
   cloud_runtime service --service frontend
   # Open in browser
   ```

2. **Check CloudRuntime Dashboard**
   - All services should show "Active" status
   - No error logs
   - Metrics showing requests

## 🚀 Automated Deployment Script

I've created `deploy-to-services.sh` for you. After creating services in the dashboard, run:

```bash
./deploy-to-services.sh
```

This will:
- Link each service directory to its CloudRuntime service
- Deploy all services in sequence
- Show deployment URLs and status

## ⏱️ Expected Timeline

| Step | Duration |
|------|----------|
| Create services in dashboard | 5 min |
| Deploy all services (builds) | 40-60 min |
| Configure environment variables | 10 min |
| Verify deployments | 5 min |
| **Total** | **60-80 minutes** |

## 🐛 Troubleshooting

### Build Fails

**Check logs:**
```bash
cloud_runtime logs --service <service-name>
```

**Common issues:**
- Missing dependencies: Check package.json
- Build timeout: CloudRuntime has 15-minute limit (should be fine)
- Out of memory: Services use ~512MB each

### Service Won't Start

**Check:**
- Environment variables are set correctly
- DATABASE_URL uses CloudRuntime template syntax
- Port matches the service configuration

### Cannot Link Service

**If `cloud_runtime link --service <name>` fails:**
- Verify service exists in dashboard
- Use exact service name (case-sensitive)
- Make sure you're in the correct project

## ✅ Success Checklist

- [ ] All 4 services created in CloudRuntime dashboard
- [ ] PostgreSQL database added and running
- [ ] Redis database added and running
- [ ] API service deployed and building
- [ ] Backend service deployed and building
- [ ] API Gateway deployed and building
- [ ] Frontend service deployed and building
- [ ] All environment variables configured
- [ ] All services showing "Active" in dashboard
- [ ] Health checks passing (API, Backend, API Gateway)
- [ ] Frontend loads in browser
- [ ] No errors in service logs

## 📊 Service URLs

After deployment, get your service URLs:

```bash
# API Service
cloud_runtime service --service api

# Backend Service
cloud_runtime service --service backend

# API Gateway
cloud_runtime service --service api-gateway

# Frontend
cloud_runtime service --service frontend
```

Save these URLs - you'll need them for testing and integration.

## 💰 Cost Estimate

**CloudRuntime Hobby Plan ($5/month):**
- 4 services × ~512MB RAM = ~2GB
- PostgreSQL: ~256MB
- Redis: ~128MB
- **Total**: ~2.4GB RAM
- **Estimated**: $5-10/month

## 🎯 Next Steps After Deployment

1. **Custom Domains** (Optional)
   - Add custom domain in CloudRuntime service settings
   - Configure DNS records

2. **Monitoring**
   - Set up CloudRuntime alerts
   - Monitor resource usage
   - Check error logs daily

3. **CI/CD** (Recommended)
   - Connect GitHub repository
   - Enable auto-deploy on push to main
   - Configure preview deployments for PRs

4. **Security**
   - Rotate JWT_SECRET regularly
   - Enable CloudRuntime private networking
   - Review access controls

## 📚 Additional Resources

- **Project Dashboard**: https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- **CloudRuntime Docs**: https://docs.thenewfuse.com
- **Support**: https://discord.gg/cloud_runtime
- **Local Guide**: See `CLOUD_RUNTIME_DEPLOYMENT_INSTRUCTIONS.md`

---

**Ready to Deploy?**

1. Create services in CloudRuntime dashboard (Step 1)
2. Run `./deploy-to-services.sh`
3. Configure environment variables (Step 3)
4. Monitor and verify (Steps 4-5)

**Questions or Issues?**

Check the logs:
```bash
cloud_runtime logs --service <service-name>
```

Or visit the dashboard:
https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1
