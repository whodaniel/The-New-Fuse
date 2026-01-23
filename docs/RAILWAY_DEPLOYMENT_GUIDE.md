# Railway Deployment Guide

Complete guide for deploying The New Fuse platform to Railway with proper environment configuration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Service Configuration](#service-configuration)
  - [PostgreSQL Database](#postgresql-database)
  - [Redis Cache](#redis-cache)
  - [API Service](#api-service)
  - [API Gateway](#api-gateway)
  - [Backend Service](#backend-service)
  - [Frontend Service](#frontend-service)
- [Environment Variables Reference](#environment-variables-reference)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository connected to Railway
3. PostgreSQL and Redis services provisioned in Railway
4. Strong secrets generated for JWT and other security tokens

### Generating Secure Secrets

```bash
# Generate a strong 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate multiple secrets at once
node -e "for(let i=0; i<5; i++) console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Infrastructure Setup

### 1. Create a New Railway Project

1. Go to Railway Dashboard
2. Create a new project: "the-new-fuse-production"
3. Connect your GitHub repository

### 2. Provision Database Services

#### PostgreSQL
1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create `DATABASE_URL` variable
3. Note the internal reference: `${{Postgres.DATABASE_URL}}`

#### Redis
1. Click "New" → "Database" → "Add Redis"
2. Railway will automatically create `REDIS_URL` variable
3. Note the internal reference: `${{Redis.REDIS_URL}}`

## Service Configuration

### API Service

**Service Name:** `api-service`

**Build Configuration:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Root Directory: `/`
- Dockerfile Path: `apps/api/Dockerfile.railway`

**Environment Variables:**

```bash
# Server
NODE_ENV=production
PORT=3001
API_PORT=3001

# Database (use Railway's internal references)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_TYPE=postgres

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secrets (CRITICAL - Generate unique strong secrets)
JWT_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=the-new-fuse-api
JWT_AUDIENCE=the-new-fuse-clients

# CORS (update after frontend deployment)
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.railway.app
FRONTEND_URL=https://your-frontend.vercel.app

# Service URLs (update after other services are deployed)
API_BASE_URL=https://api-service-production.up.railway.app
API_URL=https://api-service-production.up.railway.app

# Rate Limiting
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=100

# Security
MAX_PAYLOAD_SIZE=10485760
LOG_RETENTION_DAYS=30

# Logging
LOG_LEVEL=warn

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_MONITORING=true
ENABLE_ANALYTICS=true

# External Services (Optional - add if needed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SENTRY_DSN=https://...

# Web3Auth (Optional)
WEB3AUTH_CLIENT_ID=
WEB3AUTH_JWT_SECRET=<generate-64-char-secret>
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
EMAIL_FROM_ADDRESS=noreply@thenewfuse.com
```

### API Gateway

**Service Name:** `api-gateway`

**Build Configuration:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Root Directory: `/`
- Dockerfile Path: `apps/api-gateway/Dockerfile`

**Environment Variables:**

```bash
# Server
NODE_ENV=production
PORT=8080

# Backend Service URLs (update with actual Railway URLs)
BACKEND_SERVICE_URL=https://backend-production.up.railway.app
WEBHOOKS_SERVICE_URL=https://webhooks-production.up.railway.app
AGENTS_SERVICE_URL=https://api-service-production.up.railway.app
THEIA_IDE_URL=https://ide-ide-production.up.railway.app

# CORS (update with actual frontend URL)
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.railway.app

# Logging
LOG_LEVEL=info

# Health Check
HEALTH_CHECK_INTERVAL=30000
```

### Backend Service

**Service Name:** `backend-service`

**Build Configuration:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Root Directory: `/`
- Dockerfile Path: `apps/backend/Dockerfile`

**Environment Variables:**

```bash
# Server
NODE_ENV=production
PORT=5000

# JWT (MUST match API service)
JWT_SECRET=<same-as-api-service>

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://your-frontend.vercel.app/auth/google/callback

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@thenewfuse.com

# Blockchain (Optional)
RPC_URL=https://mainnet.infura.io/v3/your-key
AGENT_NFT_CONTRACT_ADDRESS=0x...
MARKETPLACE_CONTRACT_ADDRESS=0x...
```

### Frontend Service

**Recommended:** Deploy to Vercel for better frontend performance

**Alternative: Railway Deployment**

**Service Name:** `frontend`

**Build Configuration:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run preview`
- Root Directory: `/`
- Dockerfile Path: `apps/frontend/Dockerfile.railway`

**Environment Variables:**

```bash
# API Configuration (update with actual API Gateway URL)
VITE_API_URL=https://api-gateway-production.up.railway.app
VITE_API_BASE_URL=/api
VITE_WS_URL=wss://api-gateway-production.up.railway.app

# Service URLs
VITE_FRONTEND_URL=https://frontend-production.up.railway.app
VITE_THEIA_IDE_URL=https://ide-ide-production.up.railway.app

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
VITE_ENABLE_HOT_RELOAD=false

# Security
VITE_ALLOWED_ORIGINS=https://api-gateway-production.up.railway.app

# Firebase (Optional - all required together)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Supabase (Optional - both required together)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Monitoring (Optional)
VITE_SENTRY_DSN=
VITE_GOOGLE_ANALYTICS_ID=

# Build Info
VITE_VERSION=1.0.0
```

## Environment Variables Reference

### Shared Secrets (CRITICAL)

These must be **exactly the same** across all services:

| Variable | Services | Purpose | Generation |
|----------|----------|---------|------------|
| `JWT_SECRET` | API, Backend | JWT token signing | `openssl rand -hex 32` |

### Service Communication URLs

After deploying each service, update these variables:

1. **After API Service deployment:**
   - Copy the Railway URL (e.g., `https://api-service-production-xxxx.up.railway.app`)
   - Update `API_BASE_URL` and `API_URL` in API service
   - Update `AGENTS_SERVICE_URL` in API Gateway

2. **After API Gateway deployment:**
   - Copy the Railway URL
   - Update `VITE_API_URL` in Frontend
   - Update CORS origins in all backend services

3. **After Backend Service deployment:**
   - Copy the Railway URL
   - Update `BACKEND_SERVICE_URL` in API Gateway

4. **After Frontend deployment:**
   - Copy the URL (Railway or Vercel)
   - Update `FRONTEND_URL` in all backend services
   - Update `ALLOWED_ORIGINS` in API service

### Railway Internal References

Use these to reference Railway-provisioned services:

```bash
# PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}
```

Railway automatically replaces these with actual connection strings.

## Post-Deployment

### 1. Database Migration

After API service is deployed, run migrations:

```bash
# From Railway CLI or dashboard
railway run npm run prisma:migrate:deploy
```

### 2. Verify Health Endpoints

Check that all services are healthy:

```bash
# API Gateway
curl https://api-gateway-production.up.railway.app/health

# API Service
curl https://api-service-production.up.railway.app/health

# Backend Service
curl https://backend-production.up.railway.app/health
```

### 3. Test CORS

Ensure frontend can communicate with backend:

```bash
# From browser console on frontend
fetch('https://api-gateway-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

### 4. Monitor Logs

Watch deployment logs in Railway dashboard for:
- Successful startup messages
- No environment validation errors
- Successful database connections

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptom:** Frontend shows CORS errors in console

**Solution:**
- Verify `CORS_ORIGINS` includes exact frontend URL (including `https://`)
- Check `ALLOWED_ORIGINS` in API service
- Ensure no trailing slashes in URLs

#### 2. JWT Authentication Fails

**Symptom:** Token validation errors, 401 responses

**Solution:**
- Ensure `JWT_SECRET` is **identical** in API and Backend services
- Verify secret is at least 32 characters
- Check that secret doesn't contain special characters that need escaping

#### 3. Database Connection Errors

**Symptom:** "Connection refused" or "Cannot connect to database"

**Solution:**
- Verify `DATABASE_URL` uses Railway's internal reference: `${{Postgres.DATABASE_URL}}`
- Check PostgreSQL service is running in Railway dashboard
- Ensure Prisma migrations have been run

#### 4. Service Cannot Reach Other Services

**Symptom:** 502/503 errors when services call each other

**Solution:**
- Verify service URLs are correct (check Railway dashboard → Service → Settings → Domains)
- Use HTTPS URLs for all cross-service communication
- Check that services are deployed and running

#### 5. Environment Variables Not Loading

**Symptom:** "Missing required environment variable" errors

**Solution:**
- Check Railway dashboard → Service → Variables
- Ensure no typos in variable names
- For frontend (Vite), ensure variables start with `VITE_`
- Redeploy after adding/changing variables

### Health Check Failures

If health checks fail during deployment:

1. Check logs for startup errors
2. Verify `PORT` environment variable matches the port your service listens on
3. Ensure health check path exists (e.g., `/health`)
4. Increase `healthcheckTimeout` in `railway.toml` if service takes time to start

### Viewing Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs for a service
railway logs --service api-service
```

## Security Checklist

Before going to production:

- [ ] All JWT secrets are strong (64+ characters) and unique
- [ ] Database credentials are not default values
- [ ] CORS origins are restrictive (no wildcards)
- [ ] API keys for external services are in Railway variables, not code
- [ ] Sensitive data is not logged
- [ ] HTTPS is enforced for all service-to-service communication
- [ ] Rate limiting is enabled
- [ ] Health checks are configured
- [ ] Error messages don't expose sensitive information
- [ ] All services use `NODE_ENV=production`

## Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] Redis cache provisioned
- [ ] API service deployed with correct environment variables
- [ ] Backend service deployed with correct environment variables
- [ ] API Gateway deployed with correct environment variables
- [ ] Frontend deployed (Railway or Vercel)
- [ ] Database migrations run successfully
- [ ] All service URLs updated in respective configurations
- [ ] CORS origins updated with actual frontend URL
- [ ] Health checks passing for all services
- [ ] Test API calls from frontend work
- [ ] Authentication flow tested end-to-end
- [ ] Monitoring/logging verified

## Next Steps

After successful deployment:

1. Set up monitoring (Sentry, New Relic, etc.)
2. Configure custom domains
3. Set up CI/CD pipelines
4. Configure backup strategies for PostgreSQL
5. Set up staging environment
6. Configure auto-scaling if needed
7. Set up alerting for critical errors

## Support

For Railway-specific issues:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

For application issues:
- Check service logs in Railway dashboard
- Review environment validation output
- Verify all environment variables are correctly set
