# The New Fuse - Railway Deployment Guide

This guide will help you deploy The New Fuse AI Agent Orchestration Platform to
Railway using Docker.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`
- Docker Desktop running locally (for testing)
- Git repository connected to Railway

## Architecture Overview

The New Fuse consists of these core services:

1. **Frontend** (Port 3000) - React/Vite UI
2. **API Gateway** (Port 3002) - Request routing and orchestration
3. **API Service** (Port 3001) - Main backend API
4. **Backend Service** (Port 3004) - Additional backend services
5. **PostgreSQL Database** - Managed by Railway
6. **Redis Cache** - Managed by Railway

## Quick Start: Deploy to Railway

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Create a New Railway Project

```bash
cd .
railway init
```

### Step 3: Add Database Services

In Railway Dashboard:

1. Click "New" → "Database" → "PostgreSQL"
2. Click "New" → "Database" → "Redis"

Note the connection strings provided by Railway.

### Step 4: Deploy Each Service

Railway will automatically detect your `railway.toml` files and deploy each
service.

#### Deploy Frontend

```bash
railway up --service frontend
```

#### Deploy API Gateway

```bash
railway up --service api-gateway
```

#### Deploy API Service

```bash
railway up --service api
```

#### Deploy Backend Service

```bash
railway up --service backend
```

### Step 5: Configure Environment Variables

For each service, set these environment variables in Railway Dashboard:

#### Frontend Service

```
NODE_ENV=production
PORT=3000
VITE_API_URL=<your-api-gateway-url>
```

#### API Gateway Service

```
NODE_ENV=production
PORT=3002
API_URL=<your-api-service-url>
```

#### API Service

```
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-a-secure-secret>
```

#### Backend Service

```
NODE_ENV=production
PORT=3004
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

## Alternative: Manual Service Creation

If automatic detection doesn't work, create services manually:

### 1. Create Frontend Service

```bash
railway service create frontend
railway link <project-id>
cd apps/frontend
railway up
```

### 2. Create API Gateway Service

```bash
railway service create api-gateway
railway link <project-id>
cd apps/api-gateway
railway up
```

### 3. Create API Service

```bash
railway service create api
railway link <project-id>
cd apps/api
railway up
```

### 4. Create Backend Service

```bash
railway service create backend
railway link <project-id>
cd apps/backend
railway up
```

## Testing Locally with Docker

Before deploying to Railway, test your Docker setup locally:

### Build and Test Individual Services

```bash
# Test Frontend
docker build -f apps/frontend/Dockerfile -t tnf-frontend .
docker run -p 3000:3000 tnf-frontend

# Test API Gateway
docker build -f apps/api-gateway/Dockerfile -t tnf-api-gateway .
docker run -p 3002:3002 tnf-api-gateway

# Test API Service
docker build -f apps/api/Dockerfile -t tnf-api .
docker run -p 3001:3001 -e DATABASE_URL=<db-url> tnf-api

# Test Backend Service
docker build -f apps/backend/Dockerfile -t tnf-backend .
docker run -p 3004:3004 -e DATABASE_URL=<db-url> tnf-backend
```

### Test Full Stack with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up --build

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Build Failures

**Problem**: Docker build fails during dependency installation

**Solution**:

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild with no cache
docker build --no-cache -f apps/<service>/Dockerfile -t <service> .
```

**Problem**: Workspace dependencies not found

**Solution**: Ensure all `package.json` files are copied in the Dockerfile deps
stage.

### Deployment Failures

**Problem**: Railway deployment times out

**Solution**: Increase health check timeout in `railway.toml`:

```toml
[deploy]
healthcheckTimeout = 600  # Increase to 10 minutes
```

**Problem**: Service crashes on startup

**Solution**: Check Railway logs:

```bash
railway logs --service <service-name>
```

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solution**:

1. Verify `DATABASE_URL` environment variable is set correctly
2. Use Railway's template variables: `${{Postgres.DATABASE_URL}}`
3. Ensure database service is healthy before app starts

## Environment Variables Reference

### Required Variables

All services need:

- `NODE_ENV=production`
- `PORT=<service-port>`

Services with database access need:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

Frontend needs:

- `VITE_API_URL` - URL of API Gateway service

### Optional Variables

- `JWT_SECRET` - For authentication (generate with: `openssl rand -base64 32`)
- `LOG_LEVEL` - Logging verbosity (`debug`, `info`, `warn`, `error`)
- `MAX_REQUEST_SIZE` - Maximum request body size (default: `10mb`)

## Monitoring and Logs

### View Service Logs

```bash
railway logs --service frontend
railway logs --service api-gateway
railway logs --service api
railway logs --service backend
```

### Monitor Service Health

Railway Dashboard → Service → Metrics

### Database Monitoring

Railway Dashboard → PostgreSQL → Metrics

## Cost Optimization

### Development Setup

- Use shared PostgreSQL instance
- Use shared Redis instance
- Scale down to 1 replica per service

### Production Setup

- Dedicated PostgreSQL instance (Hobby plan minimum)
- Dedicated Redis instance
- Auto-scaling enabled (2-4 replicas per service)
- Enable health checks and auto-restart

## Rollback Strategy

If deployment fails:

```bash
# Rollback to previous deployment
railway rollback --service <service-name>

# Or deploy a specific version
railway deploy --service <service-name> --commit <git-sha>
```

## Next Steps

1. Set up custom domain in Railway Dashboard
2. Enable HTTPS (automatic with Railway)
3. Configure CI/CD with GitHub Actions
4. Set up monitoring with Railway's built-in metrics
5. Configure alerts for service failures

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: https://github.com/anthropics/claude-code/issues

## Additional Resources

- `docker-compose.prod.yml` - Local testing configuration
- Individual `Dockerfile` in each `apps/` directory
- `railway.toml` in each service directory
