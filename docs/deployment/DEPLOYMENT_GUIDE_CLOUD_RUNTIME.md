> **⚠️ CLOUD_RUNTIME IS NO LONGER USED.** TNF has migrated to GCP (Cloud Run) +
> Cloudflare (Pages/Workers) + Supabase (PostgreSQL) + Upstash (Redis). See
> `/CLOUD_MIGRATION_BLUEPRINT.md` for current infrastructure. This document is
> preserved for historical reference only.

# The New Fuse - CloudRuntime Deployment Guide

This guide will help you deploy The New Fuse AI Agent Orchestration Platform to
CloudRuntime using Docker.

## Prerequisites

- CloudRuntime account (sign up at https://cloud_runtime.app)
- CloudRuntime CLI installed: `npm install -g @cloud_runtime/cli`
- Docker Desktop running locally (for testing)
- Git repository connected to CloudRuntime

## Architecture Overview

The New Fuse consists of these core services:

1. **Frontend** (Port 3000) - React/Vite UI
2. **API Gateway** (Port 3002) - Request routing and orchestration
3. **API Service** (Port 3001) - Main backend API
4. **Backend Service** (Port 3004) - Additional backend services
5. **PostgreSQL Database** - Managed by CloudRuntime
6. **Redis Cache** - Managed by CloudRuntime

## Quick Start: Deploy to CloudRuntime

### Step 1: Install CloudRuntime CLI

```bash
npm install -g @cloud_runtime/cli
cloud_runtime login
```

### Step 2: Create a New CloudRuntime Project

```bash
cd .
cloud_runtime init
```

### Step 3: Add Database Services

In CloudRuntime Dashboard:

1. Click "New" → "Database" → "PostgreSQL"
2. Click "New" → "Database" → "Redis"

Note the connection strings provided by CloudRuntime.

### Step 4: Deploy Each Service

CloudRuntime will automatically detect your `cloud_runtime.toml` files and deploy each
service.

#### Deploy Frontend

```bash
cloud_runtime up --service frontend
```

#### Deploy API Gateway

```bash
cloud_runtime up --service api-gateway
```

#### Deploy API Service

```bash
cloud_runtime up --service api
```

#### Deploy Backend Service

```bash
cloud_runtime up --service backend
```

### Step 5: Configure Environment Variables

For each service, set these environment variables in CloudRuntime Dashboard:

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
cloud_runtime service create frontend
cloud_runtime link <project-id>
cd apps/frontend
cloud_runtime up
```

### 2. Create API Gateway Service

```bash
cloud_runtime service create api-gateway
cloud_runtime link <project-id>
cd apps/api-gateway
cloud_runtime up
```

### 3. Create API Service

```bash
cloud_runtime service create api
cloud_runtime link <project-id>
cd apps/api
cloud_runtime up
```

### 4. Create Backend Service

```bash
cloud_runtime service create backend
cloud_runtime link <project-id>
cd apps/backend
cloud_runtime up
```

## Testing Locally with Docker

Before deploying to CloudRuntime, test your Docker setup locally:

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

**Problem**: CloudRuntime deployment times out

**Solution**: Increase health check timeout in `cloud_runtime.toml`:

```toml
[deploy]
healthcheckTimeout = 600  # Increase to 10 minutes
```

**Problem**: Service crashes on startup

**Solution**: Check CloudRuntime logs:

```bash
cloud_runtime logs --service <service-name>
```

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solution**:

1. Verify `DATABASE_URL` environment variable is set correctly
2. Use CloudRuntime's template variables: `${{Postgres.DATABASE_URL}}`
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
cloud_runtime logs --service frontend
cloud_runtime logs --service api-gateway
cloud_runtime logs --service api
cloud_runtime logs --service backend
```

### Monitor Service Health

CloudRuntime Dashboard → Service → Metrics

### Database Monitoring

CloudRuntime Dashboard → PostgreSQL → Metrics

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
cloud_runtime rollback --service <service-name>

# Or deploy a specific version
cloud_runtime deploy --service <service-name> --commit <git-sha>
```

## Next Steps

1. Set up custom domain in CloudRuntime Dashboard
2. Enable HTTPS (automatic with CloudRuntime)
3. Configure CI/CD with GitHub Actions
4. Set up monitoring with CloudRuntime's built-in metrics
5. Configure alerts for service failures

## Support

- CloudRuntime Docs: https://docs.thenewfuse.com
- CloudRuntime Discord: https://discord.gg/cloud_runtime
- Project Issues: https://github.com/anthropics/claude-code/issues

## Additional Resources

- `docker-compose.prod.yml` - Local testing configuration
- Individual `Dockerfile` in each `apps/` directory
- `cloud_runtime.toml` in each service directory
