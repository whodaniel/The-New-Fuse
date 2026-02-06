# The New Fuse - Docker Hub Cloud Build & Railway Deployment Guide

## Overview

This guide covers building The New Fuse using Docker Hub Cloud and deploying to
Railway for public release.

---

## Prerequisites

- Docker Desktop with buildx installed
- Docker Hub account (bizsynth)
- GitHub repository access
- Railway account
- Access to Docker Hub Cloud builder: `bizsynth/tnf`

---

## Part 1: Docker Hub Cloud Build Setup

### Step 1: Connect to Docker Hub Cloud Builder

```bash
# Make scripts executable
chmod +x docker-buildx-setup.sh docker-build-*.sh

# Setup cloud builder
./docker-buildx-setup.sh
```

**What this does:**

- Creates Docker Hub Cloud builder instance
- Connects to `bizsynth/tnf` cloud builder
- Enables multi-platform builds (AMD64 + ARM64)
- Sets up build caching

**Output:**

```
✅ Docker Hub Cloud Builder setup complete!

Builder name: cloud-bizsynth-tnf
Driver: cloud (bizsynth/tnf)
```

---

### Step 2: Manual Docker Hub Cloud Builds

#### Build API Service

```bash
# Build latest
./docker-build-api.sh

# Build with specific tag
./docker-build-api.sh v1.0.0
```

**Resulting images:**

- `bizsynth/the-new-fuse-api:latest`
- `bizsynth/the-new-fuse-api:<git-sha>`

#### Build Frontend Service

```bash
# Build latest
./docker-build-frontend.sh

# Build with specific tag
./docker-build-frontend.sh v1.0.0
```

**Resulting images:**

- `bizsynth/the-new-fuse-frontend:latest`
- `bizsynth/the-new-fuse-frontend:<git-sha>`

#### Build All Services

```bash
# Build everything in parallel
./docker-build-all.sh

# With custom tag
./docker-build-all.sh v1.0.0
```

---

### Step 3: GitHub Actions Automation

#### Setup GitHub Secrets

1. Go to:
   https://app.docker.com/accounts/bizsynth/cloud/integrations/gha?builder=tnf
2. Generate Docker Hub token
3. Add to GitHub Secrets:
   - `DOCKER_HUB_TOKEN` = your Docker Hub token

#### Automated Builds Trigger

Builds automatically trigger on:

- ✅ Push to `main` branch → `latest` tag
- ✅ Push to `project-reconstruction` → `project-reconstruction` tag
- ✅ Git tags (e.g., `v1.0.0`) → `1.0.0` tag
- ✅ Pull requests → `pr-<number>` tag
- ✅ Manual dispatch → custom tag

#### Manual GitHub Actions Trigger

```bash
# Trigger via GitHub CLI
gh workflow run docker-build.yml -f tag=v1.0.0

# Or via GitHub UI
# Go to Actions → Docker Hub Cloud Build → Run workflow
```

---

## Part 2: Railway Deployment

### Step 1: Railway CLI Setup

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project (or create new)
railway init
```

### Step 2: Deploy Services

#### Option A: Deploy from Docker Hub (Recommended)

```bash
# Deploy API from Docker Hub
railway up --service api

# Deploy Frontend from Docker Hub
railway up --service frontend
```

#### Option B: Deploy with Railway Configuration

```bash
# Deploy all services using railway.toml
railway up

# Or deploy specific service
railway up api
railway up frontend
```

---

### Step 3: Configure Environment Variables

#### Required Variables

**API Service:**

```bash
railway variables set \
  DATABASE_URL="$RAILWAY_POSTGRES_URL" \
  REDIS_URL="$RAILWAY_REDIS_URL" \
  ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  NODE_ENV="production" \
  PORT="3000"
```

**Frontend Service:**

```bash
railway variables set \
  VITE_API_URL="https://$API_DOMAIN" \
  NODE_ENV="production"
```

#### Optional Variables

```bash
railway variables set \
  LOG_LEVEL="info" \
  ENABLE_SWAGGER="false" \
  ENABLE_CORS="true" \
  MAX_UPLOAD_SIZE="10485760"
```

---

### Step 4: Database Setup

#### Run Migrations

```bash
# Connect to API service
railway run --service api bash

# Inside the container
npx drizzle migrate deploy

# Optional: Seed initial data
npx drizzle db seed
```

#### Verify Database

```bash
# Check tables
railway run --service api npx drizzle studio

# Or connect directly
railway connect postgres
```

---

### Step 5: Health Checks

#### API Health Check

```bash
# Get API URL
API_URL=$(railway domain --service api)

# Check health
curl https://$API_URL/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-20T...","database":"connected"}
```

#### Frontend Health Check

```bash
# Get frontend URL
FRONTEND_URL=$(railway domain --service frontend)

# Check frontend
curl -I https://$FRONTEND_URL

# Expected: HTTP 200 OK
```

---

## Part 3: Production Checklist

### Pre-Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] Docker images built successfully
- [ ] Images pushed to Docker Hub
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates configured (automatic with Railway)

### Deployment

- [ ] API service deployed
- [ ] Frontend service deployed
- [ ] PostgreSQL database provisioned
- [ ] Redis cache provisioned
- [ ] Database migrations executed
- [ ] Health checks passing

### Post-Deployment

- [ ] Monitoring enabled (Prometheus + Grafana)
- [ ] Error tracking configured
- [ ] Backups scheduled
- [ ] Scaling policies set (HPA)
- [ ] Custom domain configured (optional)
- [ ] CDN configured for frontend (optional)

---

## Part 4: Monitoring & Operations

### Railway Dashboard

- **URL**: https://railway.app/dashboard
- **Metrics**: CPU, Memory, Network, Requests
- **Logs**: Real-time log streaming
- **Deployments**: Version history and rollbacks

### Custom Monitoring

```bash
# View logs
railway logs --service api
railway logs --service frontend

# Monitor metrics
railway metrics --service api

# Check deployment status
railway status
```

### Prometheus Metrics

Access Prometheus at: `https://<api-domain>/metrics`

**Key Metrics:**

- `http_requests_total`
- `http_request_duration_seconds`
- `database_query_duration_seconds`
- `active_connections`
- `error_rate`

---

## Part 5: Scaling & Performance

### Horizontal Scaling

```bash
# Scale API replicas
railway scale --service api --replicas 3

# Scale frontend replicas
railway scale --service frontend --replicas 2
```

### Auto-Scaling (HPA)

Deploy Kubernetes HPA manifest:

```bash
kubectl apply -f deploy/k8s/hpa.yaml
```

**Scaling rules:**

- CPU > 70% → scale up
- CPU < 30% → scale down
- Min replicas: 2
- Max replicas: 10

### Performance Optimization

**API:**

- Enable Redis caching
- Connection pooling (default: 10 connections)
- Query optimization with indexes
- Response compression (gzip)

**Frontend:**

- CDN for static assets
- Image optimization
- Code splitting
- Service worker caching

---

## Part 6: Disaster Recovery

### Backup Strategy

**Database (PostgreSQL):**

```bash
# Automated daily backups (Railway)
# Manual backup
railway backup create postgres
```

**Restore:**

```bash
railway backup restore postgres <backup-id>
```

### Rollback Deployment

```bash
# List deployments
railway deployments --service api

# Rollback to previous version
railway rollback --service api <deployment-id>
```

---

## Part 7: Security

### SSL/TLS

- ✅ Automatic SSL certificates (Railway)
- ✅ Force HTTPS redirect
- ✅ HSTS headers enabled

### Secrets Management

```bash
# Rotate encryption key
railway variables set ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Rotate JWT secret
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Run key rotation migration
railway run --service api npm run migrate:rotate-keys
```

### Network Security

- ✅ Network policies (Kubernetes)
- ✅ RBAC rules (Kubernetes)
- ✅ Private networking (Railway)
- ✅ DDoS protection (Railway)

---

## Part 8: Cost Optimization

### Railway Pricing Tiers

**Starter ($5/month):**

- Good for development/staging
- Shared resources

**Pro ($20/month):**

- **Recommended for production**
- Dedicated resources
- Priority support

**Enterprise (Custom):**

- High availability
- SLA guarantees
- Dedicated account manager

### Optimization Tips

1. **Right-size services**: Monitor and adjust CPU/RAM
2. **Use caching**: Reduce database queries
3. **Optimize images**: Multi-stage builds, Alpine base
4. **Enable auto-scaling**: Scale down during low traffic
5. **Database pooling**: Reuse connections

**Estimated Monthly Cost:**

```
API (2 instances):     $40
Frontend (1 instance): $20
PostgreSQL (shared):   $10
Redis (shared):        $10
Total:                 $80/month
```

---

## Quick Reference Commands

### Docker Hub Cloud Build

```bash
# Setup
./docker-buildx-setup.sh

# Build all
./docker-build-all.sh

# Build API only
./docker-build-api.sh

# Build Frontend only
./docker-build-frontend.sh
```

### Railway Deployment

```bash
# Deploy
railway up

# Logs
railway logs

# Restart
railway restart

# Scale
railway scale --replicas 3

# Variables
railway variables set KEY=VALUE

# Connect to DB
railway connect postgres
```

### Health Checks

```bash
# API
curl https://the-new-fuse-api.railway.app/api/health

# Frontend
curl https://the-new-fuse.railway.app/
```

---

## Troubleshooting

### Build Fails

```bash
# Check builder status
docker buildx inspect cloud-bizsynth-tnf

# Recreate builder
docker buildx rm cloud-bizsynth-tnf
./docker-buildx-setup.sh
```

### Deployment Fails

```bash
# Check logs
railway logs --service api --tail 100

# Check environment
railway variables --service api

# Verify database connection
railway run --service api pnpm run d:check
```

### Database Migration Issues

```bash
# Reset database (CAUTION: deletes all data)
railway run --service api npx drizzle migrate reset

# Apply pending migrations
railway run --service api npx drizzle migrate deploy

# Verify schema
railway run --service api npx drizzle db pull
```

---

## Support & Resources

### Documentation

- Railway: https://docs.railway.app/
- Docker Buildx: https://docs.docker.com/buildx/
- Drizzle: https://www.drizzle.io/docs/

### Community

- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/whodaniel/fuse/issues

### Monitoring

- Railway Dashboard: https://railway.app/dashboard
- Docker Hub: https://hub.docker.com/u/bizsynth
- GitHub Actions: https://github.com/whodaniel/fuse/actions

---

## Success Criteria

✅ **Build Phase**

- [ ] Docker images build successfully on Docker Hub Cloud
- [ ] Multi-platform support (AMD64 + ARM64)
- [ ] Images tagged correctly (latest, git SHA, version)
- [ ] Build cache working efficiently

✅ **Deployment Phase**

- [ ] API deployed and responding
- [ ] Frontend deployed and accessible
- [ ] Database connected and migrated
- [ ] Redis cache operational
- [ ] Health checks passing

✅ **Production Readiness**

- [ ] SSL/TLS enabled
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Scaling policies active
- [ ] Error tracking enabled
- [ ] Performance optimized

---

**Status**: Ready for Production Deployment **Last Updated**: 2025-01-20
**Version**: 1.0.0
