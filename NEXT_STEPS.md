# Railway Deployment - NEXT STEPS

## ✅ What's Complete

All 8 SAAS services have been successfully deployed to Railway:

1. ✅ core-vector-db (packages/core-vector-db)
2. ✅ relay-core (packages/relay-core)
3. ✅ backend-package (packages/backend)
4. ✅ api-package (packages/api)
5. ✅ backend (apps/backend)
6. ✅ api (apps/api)
7. ✅ api-gateway (apps/api-gateway)
8. ✅ frontend (apps/frontend)

---

## 🔥 Critical Next Steps

### 1. Add Databases

**PostgreSQL:**
```bash
# In Railway Dashboard:
1. Click "+ New" → "Database" → "PostgreSQL"
2. Wait for provisioning
3. Copy DATABASE_URL from PostgreSQL service variables
```

**Redis:**
```bash
# In Railway Dashboard:
1. Click "+ New" → "Database" → "Redis"
2. Wait for provisioning
3. Copy REDIS_URL from Redis service variables
```

### 2. Configure Environment Variables

For each service, add these variables in Railway Dashboard → Service → Variables:

**core-vector-db:**
```
DATABASE_URL=${Postgres.DATABASE_URL}
PORT=50051
NODE_ENV=production
```

**relay-core:**
```
REDIS_URL=${Redis.REDIS_URL}
PORT=3000
NODE_ENV=production
```

**backend (both package & app):**
```
DATABASE_URL=${Postgres.DATABASE_URL}
REDIS_URL=${Redis.REDIS_URL}
PORT=5000
NODE_ENV=production
```

**api (both package & app):**
```
DATABASE_URL=${Postgres.DATABASE_URL}
PORT=3000
NODE_ENV=production
```

**api-gateway:**
```
PORT=8080
NODE_ENV=production
```

**frontend:**
```
PORT=$PORT
VITE_API_URL=${api-gateway.RAILWAY_PUBLIC_DOMAIN}
```

### 3. Verify Builds Are Successful

```bash
# Check build status for each service
cd packages/core-vector-db && railway logs
cd ../relay-core && railway logs
cd ../../apps/api && railway logs
cd ../backend && railway logs
cd ../api-gateway && railway logs
cd ../frontend && railway logs
```

Or use the provided script:
```bash
./check-services.sh
```

---

## 🔧 Troubleshooting Build Failures

If any service fails to build, common issues are:

### Missing Dependencies

Check that all workspace dependencies are properly linked in package.json:
```json
{
  "dependencies": {
    "@the-new-fuse/types": "workspace:*"
  }
}
```

### Build Errors

View full build logs in Railway dashboard or:
```bash
cd [service-path]
railway logs --deployment [deployment-id]
```

### Dockerfile Issues

Verify Dockerfile exists and is properly configured:
```bash
# Each Dockerfile should:
# 1. Install pnpm
# 2. Copy workspace files
# 3. Install dependencies
# 4. Build the monorepo
# 5. Start the specific service
```

---

## 📊 Monitor Service Health

### Check Service Status
```bash
railway status
```

### View Service Logs
```bash
railway logs --service [name]
```

### Check Health Endpoints

Once services are running with environment variables configured:
```bash
curl https://[service-url]/health
```

---

## 🌐 Configure Networking

### Generate Public URLs

For services that need public access (api-gateway, frontend):

1. Go to Railway Dashboard
2. Click on service
3. Settings → Networking → "Generate Domain"
4. Copy the generated URL

### Internal Service Communication

Use Railway's internal DNS:
```
https://[service-name].railway.internal
```

Example:
```
API_GATEWAY_URL=https://api-gateway.railway.internal
```

---

## 🚀 Final Verification Checklist

- [ ] All services show "Active" status
- [ ] No build errors in logs
- [ ] PostgreSQL database created and connected
- [ ] Redis database created and connected
- [ ] Environment variables set for all services
- [ ] Health endpoints responding (if implemented)
- [ ] Frontend can connect to API
- [ ] API can connect to backend services
- [ ] Inter-service communication working

---

## 📚 Useful Commands

```bash
# View all services in project
railway service

# Switch to a specific service
railway service [name]

# View recent logs
railway logs --limit 100

# View live logs (streaming)
railway logs --follow

# Redeploy a service
railway up

# View environment variables
railway variables

# Set an environment variable
railway variables set KEY=value

# Open Railway dashboard
railway open
```

---

## 🔗 Quick Links

- **Project Dashboard:** https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- **Deployment Scripts:**
  - `railway-auto-deploy.sh` - Redeploy all services
  - `check-services.sh` - Check status of all services
- **Documentation:**
  - `DEPLOYMENT_SUCCESS_SUMMARY.md` - Full deployment details
  - `RAILWAY_CLEAN_DEPLOYMENT_PLAN.md` - Deployment guide

---

## 💡 Pro Tips

1. **Use Railway Variables for Cross-Service References:**
   ```
   DATABASE_URL=${Postgres.DATABASE_URL}
   API_URL=${api.RAILWAY_PUBLIC_DOMAIN}
   ```

2. **Enable Metrics in Railway Dashboard** for each service to monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request latency

3. **Set Up Health Checks** in your services:
   ```typescript
   app.get('/health', (req, res) => {
     res.status(200).json({ status: 'healthy', timestamp: Date.now() });
   });
   ```

4. **Use Structured Logging:**
   ```typescript
   console.log(JSON.stringify({ level: 'info', message: 'Server started', port: PORT }));
   ```

---

**Ready to proceed?** Add the databases and configure environment variables!
