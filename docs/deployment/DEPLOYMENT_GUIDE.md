# The New Fuse - Deployment Guide

Complete guide for deploying The New Fuse application to production using our automated deployment system.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

For a standard production deployment:

```bash
# 1. Validate environment
./scripts/deployment/validate-deployment.sh

# 2. Run full automated deployment
./scripts/deployment/deploy-automated.sh

# 3. Verify deployment
./scripts/deployment/smoke-tests.sh
```

## Prerequisites

### Required Tools

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **Railway CLI** (for Railway deployments)
- **Git**
- **jq** (for JSON processing)

### Installation

```bash
# Install pnpm
npm install -g pnpm

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your Railway project
railway link
```

### Environment Variables

Create environment files for each environment:

```bash
cp .env.example .env.production
cp .env.example .env.staging
```

Edit the files and set:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `API_PORT`, `FRONTEND_PORT`, etc.

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Full automated deployment with validation, rollback, and monitoring:

```bash
./scripts/deployment/deploy-automated.sh
```

Features:
-  Pre-deployment validation
-  Automated testing
-  Database migrations with backup
-  Zero-downtime deployment
-  Automatic rollback on failure
-  Post-deployment smoke tests

### Method 2: Railway-Specific Deployment

Deploy directly to Railway:

```bash
# Deploy all services
./scripts/deployment/railway-deploy.sh all

# Deploy specific service
./scripts/deployment/railway-deploy.sh deploy api-gateway

# Watch deployment logs
./scripts/deployment/railway-deploy.sh watch api-gateway
```

### Method 3: Manual Deployment

For more control over the deployment process:

```bash
# 1. Validate
./scripts/deployment/validate-deployment.sh

# 2. Backup database
./scripts/deployment/db-backup.sh

# 3. Run migrations
./scripts/deployment/db-migrate.sh

# 4. Build services
pnpm run build:railway

# 5. Deploy to Railway
railway up --service api-gateway
railway up --service backend
railway up --service frontend

# 6. Verify
./scripts/deployment/smoke-tests.sh
```

## Configuration

Edit `.deployment-config` to customize deployment behavior:

```bash
# Deployment strategy (rolling, blue-green, canary)
DEPLOYMENT_STRATEGY=rolling

# Auto-rollback on failure
AUTO_ROLLBACK=true

# Testing
SKIP_TESTS=false
ALLOW_TEST_FAILURES=false

# Database
BACKUP_BEFORE_MIGRATE=true
COMPRESS_BACKUPS=true
BACKUP_RETENTION_DAYS=30
```

## Deployment Strategies

### Rolling Deployment (Default)

Services are updated one at a time:

```bash
DEPLOYMENT_STRATEGY=rolling ./scripts/deployment/deploy-automated.sh
```

### Blue-Green Deployment

Deploy to new environment, then switch traffic:

```bash
DEPLOYMENT_STRATEGY=blue-green ./scripts/deployment/deploy-automated.sh
```

### Canary Deployment

Gradually shift traffic to new version:

```bash
DEPLOYMENT_STRATEGY=canary ./scripts/deployment/deploy-automated.sh
```

## Best Practices

1. **Always validate before deploying**
2. **Test in staging first**
3. **Monitor deployments closely**
4. **Have rollback plan ready**
5. **Communicate with team**

## Support

- See [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md)
- See [EMERGENCY_PROCEDURES.md](./EMERGENCY_PROCEDURES.md)
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Last Updated:** 2024-11-18
