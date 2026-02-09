# Railway Clean Deployment Plan
**Date:** October 25, 2025
**Project:** The New Fuse (TNF)
**Project ID:** 041cee9d-8648-4074-b5a6-0eae436de1d1
**Environment:** production

---

## 📋 Services to Deploy

### Priority 1: Infrastructure Services
These must be deployed first as other services may depend on them.

1. **core-vector-db**
   - Path: `packages/core-vector-db`
   - Port: 50051
   - Type: gRPC Service
   - Dependencies: PostgreSQL with pgvector extension
   - Health Check: `/health`
   - Start Command: `node dist/main.js`

2. **relay-core**
   - Path: `packages/relay-core`
   - Port: 3000
   - Type: WebSocket/HTTP Service
   - Dependencies: Redis
   - Health Check: `/health`
   - Start Command: `node dist/index.js`

### Priority 2: Backend Services
Core backend and API package services.

3. **backend-package**
   - Path: `packages/backend`
   - Port: 3001 (adjust as needed)
   - Type: Backend Service
   - Health Check: `/health`

4. **api-package**
   - Path: `packages/api`
   - Port: 4000 (adjust as needed)
   - Type: API Service
   - Health Check: `/health`

### Priority 3: Application Layer
Main application services.

5. **backend**
   - Path: `apps/backend`
   - Port: 5000 (adjust as needed)
   - Type: Main Backend Application
   - Health Check: `/health`

6. **api**
   - Path: `apps/api`
   - Port: 3000 (adjust as needed)
   - Type: Main API Server
   - Start Command: `node dist/src/index.js`
   - Health Check: `/health`

7. **api-gateway**
   - Path: `apps/api-gateway`
   - Port: 8080 (adjust as needed)
   - Type: API Gateway
   - Health Check: `/health`

### Priority 4: Frontend
The web application frontend.

8. **frontend**
   - Path: `apps/frontend`
   - Port: $PORT (Railway provides this)
   - Type: Vite React Application
   - Build Command: `vite build`
   - Start Command: `vite preview --host 0.0.0.0 --port $PORT`
   - Health Check: `/`

---

## 🚫 Services Excluded from Deployment

The following services are NOT deployed to Railway:

- **browser-hub** (`apps/browser-hub`) - Electron desktop application
- **mcp-servers** (`apps/mcp-servers`) - Local MCP servers
- **relay-server** (`apps/relay-server`) - Local relay server
- **ide-ide** - IDE extension
- **vscode-extension** - VS Code extension
- **chrome-extension** - Chrome browser extension

---

## 📦 Required Railway Resources

### Databases

1. **PostgreSQL**
   - For: core-vector-db, api, backend
   - Extensions Required: pgvector
   - Create with: Railway Dashboard → New → Database → PostgreSQL

2. **Redis**
   - For: relay-core, backend services
   - Create with: Railway Dashboard → New → Database → Redis

### Environment Variables

Each service will need specific environment variables. Common ones include:

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Service URLs (internal Railway URLs)
VECTOR_DB_URL=https://core-vector-db.railway.internal:50051
RELAY_CORE_URL=https://relay-core.railway.internal
API_URL=https://api.railway.internal

# Application
NODE_ENV=production
PORT=$PORT  # Railway provides this

# API Keys (to be added)
OPENAI_API_KEY=...
```

---

## 🚀 Deployment Steps

### Step 1: Ensure All Services Exist in Railway

Before running the deployment script, verify all 8 services exist in the Railway dashboard:

1. Go to: https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
2. Click "+ New" → "Empty Service" for each service that doesn't exist
3. Name them exactly as shown in the service list above

**Service Names Required:**
- core-vector-db
- relay-core
- backend-package
- api-package
- backend
- api
- api-gateway
- frontend

### Step 2: Add Databases

1. Click "+ New" → "Database" → "PostgreSQL"
2. Click "+ New" → "Database" → "Redis"

### Step 3: Run Deployment Script

```bash
cd .
chmod +x railway-clean-deploy.sh
./railway-clean-deploy.sh
```

### Step 4: Configure Environment Variables

For each service, add the required environment variables via:
- Railway Dashboard → Service → Variables

Or use the CLI:
```bash
railway service core-vector-db
railway variables set DATABASE_URL="postgresql://..."
```

### Step 5: Verify Deployments

Check that all services are running:
```bash
railway status
```

View logs for any service:
```bash
railway logs --service core-vector-db
```

---

## 🔧 Build Configuration

All services use one of these build methods:

### Dockerfile-based (Most services)
- Configuration: `railway.toml` specifies `builder = "DOCKERFILE"`
- File: `Dockerfile` in service directory
- Process: Railway builds the Docker image and runs it

### Nixpacks-based (Some services)
- Configuration: `nixpacks.toml` in service directory
- Process: Railway auto-detects and builds with Nixpacks

---

## ✅ Health Checks

All services are configured with health checks:

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

Each service should implement a `/health` endpoint that returns 200 OK when healthy.

---

## 🔄 Deployment Order

Services should be deployed in this order to handle dependencies:

1. Databases (PostgreSQL, Redis)
2. core-vector-db (Priority 1)
3. relay-core (Priority 1)
4. backend-package (Priority 2)
5. api-package (Priority 2)
6. backend (Priority 3)
7. api (Priority 3)
8. api-gateway (Priority 3)
9. frontend (Priority 4)

---

## 📊 Monitoring

After deployment, monitor:

1. **Service Status** - All services should show "Active"
2. **Build Logs** - Check for any build errors
3. **Runtime Logs** - Monitor for runtime errors
4. **Health Checks** - All should be passing
5. **Metrics** - CPU, Memory, Network usage

---

## 🐛 Troubleshooting

### Service won't deploy
- Check build logs in Railway dashboard
- Verify Dockerfile/nixpacks.toml is correct
- Ensure all dependencies are in package.json

### Service builds but won't start
- Check runtime logs
- Verify environment variables are set
- Check that PORT is used correctly (Railway provides $PORT)

### Health check failing
- Implement `/health` endpoint in service
- Verify endpoint returns 200 OK
- Check healthcheckTimeout is sufficient

### Can't connect to database
- Verify DATABASE_URL environment variable
- Check database is running
- Verify network connectivity (Railway provides internal URLs)

---

## 📝 Post-Deployment Tasks

After all services are deployed:

1. Test inter-service communication
2. Verify database connections
3. Test API endpoints
4. Load test frontend
5. Set up monitoring/alerts
6. Configure custom domains (if needed)
7. Set up CI/CD for automatic deployments

---

## 🔗 Useful Links

- **Project Dashboard:** https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
- **Railway Docs:** https://docs.railway.com
- **Railway CLI Docs:** https://docs.railway.com/develop/cli

---

## 📞 Support

For Railway-specific issues:
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.com

For TNF project issues:
- Check service logs: `railway logs --service <name>`
- Review deployment documentation in `/docs/deployment/`
