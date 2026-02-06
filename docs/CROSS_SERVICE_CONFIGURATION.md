# Cross-Service Configuration Guide

This document explains how services communicate and what environment variables
must match across services for proper operation.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Service Dependencies](#service-dependencies)
- [Shared Configuration](#shared-configuration)
- [Service Communication](#service-communication)
- [Configuration Validation](#configuration-validation)
- [Common Issues](#common-issues)

## Architecture Overview

```
┌─────────────┐
│   Frontend  │ (Vite/React)
│   :3000     │
└──────┬──────┘
       │ HTTP/WS
       ▼
┌─────────────┐
│ API Gateway │ (NestJS)
│   :8080     │
└──────┬──────┘
       │
       ├─────────► API Service (NestJS) :3001
       │
       ├─────────► Backend Service (Express) :5000
       │
       └─────────► Webhooks Service :3002

         │
         ▼
  ┌──────────────┐
  │  PostgreSQL  │
  │    :5432     │
  └──────────────┘
         │
         ▼
  ┌──────────────┐
  │    Redis     │
  │    :6379     │
  └──────────────┘
```

## Service Dependencies

### Frontend Dependencies

**Depends on:**

- API Gateway (or direct API Service)
- WebSocket server

**Required Environment Variables:**

```bash
VITE_API_URL=<API_Gateway_URL>
VITE_WS_URL=<WebSocket_Server_URL>
```

**Configuration Points:**

- `/home/user/fuse/apps/frontend/src/config/api.ts`
- `/home/user/fuse/apps/frontend/src/config/ports.ts`
- `/home/user/fuse/apps/frontend/src/hooks/useApi.ts`

### API Gateway Dependencies

**Depends on:**

- Backend Service
- API Service
- Webhooks Service
- SkIDEancer IDE (optional)

**Required Environment Variables:**

```bash
BACKEND_SERVICE_URL=<Backend_URL>
AGENTS_SERVICE_URL=<API_Service_URL>
WEBHOOKS_SERVICE_URL=<Webhooks_URL>
THEIA_IDE_URL=<IDE_URL>
CORS_ORIGINS=<Frontend_URL>
```

**Configuration Points:**

- `/home/user/fuse/apps/api-gateway/src/proxy/proxy.service.ts`

### API Service Dependencies

**Depends on:**

- PostgreSQL
- Redis
- External AI services (optional)

**Required Environment Variables:**

```bash
DATABASE_URL=<PostgreSQL_Connection>
REDIS_URL=<Redis_Connection>
JWT_SECRET=<Must_Match_Backend>
ALLOWED_ORIGINS=<Frontend_URL>
```

**Configuration Points:**

- `/home/user/fuse/apps/api/src/config.ts`
- `/home/user/fuse/apps/api/src/config/security.config.ts`

### Backend Service Dependencies

**Depends on:**

- PostgreSQL
- Redis
- Frontend (for CORS)

**Required Environment Variables:**

```bash
DATABASE_URL=<PostgreSQL_Connection>
REDIS_URL=<Redis_Connection>
JWT_SECRET=<Must_Match_API>
FRONTEND_URL=<Frontend_URL>
```

**Configuration Points:**

- `/home/user/fuse/apps/backend/src/config/passport.ts`
- `/home/user/fuse/apps/backend/src/server.ts`

## Shared Configuration

### MUST BE IDENTICAL

These environment variables **must have the exact same value** across multiple
services:

#### 1. JWT_SECRET

**Services:** API Service, Backend Service

**Purpose:** Ensures JWT tokens signed by one service can be verified by
another.

**Critical:** If these don't match:

- Authentication will fail
- Users will get logged out randomly
- Cross-service API calls will fail with 401 errors

**Setup:**

```bash
# Generate once
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set in API Service
# Railway: api-service → Variables
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0...

# Set in Backend Service (SAME VALUE)
# Railway: backend-service → Variables
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0...
```

**Verification:**

```bash
# Compare in Railway dashboard
api-service → Variables → JWT_SECRET
backend-service → Variables → JWT_SECRET

# Should be identical
```

#### 2. DATABASE_URL

**Services:** API Service, Backend Service

**Purpose:** Both services access the same database for consistency.

**Setup (Railway):**

```bash
# Both services should reference the same PostgreSQL instance
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Important:** While the value is the same, each service might use different
database operations or schemas. Ensure migrations are run from one service only.

#### 3. REDIS_URL

**Services:** API Service, Backend Service

**Purpose:** Shared caching, session storage, and pub/sub messaging.

**Setup (Railway):**

```bash
# Both services should reference the same Redis instance
REDIS_URL=${{Redis.REDIS_URL}}
```

### MUST REFERENCE EACH OTHER

These variables create the communication links between services:

#### Frontend → API Gateway/API

**Frontend Configuration:**

```bash
VITE_API_URL=https://api-gateway-production.up.railway.app
VITE_WS_URL=wss://api-gateway-production.up.railway.app
```

**API Gateway Configuration:**

```bash
# Must include frontend URL for CORS
CORS_ORIGINS=https://frontend-production.up.railway.app,https://app.thenewfuse.com
```

**API Service Configuration:**

```bash
# Must include frontend URL for CORS
ALLOWED_ORIGINS=https://frontend-production.up.railway.app,https://app.thenewfuse.com
FRONTEND_URL=https://app.thenewfuse.com
```

#### API Gateway → Backend Services

**API Gateway Configuration:**

```bash
BACKEND_SERVICE_URL=https://backend-production.up.railway.app
AGENTS_SERVICE_URL=https://api-service-production.up.railway.app
WEBHOOKS_SERVICE_URL=https://webhooks-production.up.railway.app
```

**Verification:** These URLs should match the actual deployed URLs in Railway
dashboard.

## Service Communication

### HTTP Communication Flow

1. **Frontend → API Gateway**

   ```typescript
   // Frontend code
   const API_URL = import.meta.env.VITE_API_URL;
   fetch(`${API_URL}/api/users`);
   ```

2. **API Gateway → Backend Services**

   ```typescript
   // API Gateway proxy
   const backendUrl = this.configService.get('BACKEND_SERVICE_URL');
   this.httpService.get(`${backendUrl}/internal/users`);
   ```

3. **Backend Services → Database**
   ```typescript
   // Uses DATABASE_URL automatically
   await drizzle.user.findMany();
   ```

### WebSocket Communication

1. **Frontend Connection**

   ```typescript
   const wsUrl = import.meta.env.VITE_WS_URL;
   const socket = io(wsUrl);
   ```

2. **Backend WebSocket Gateway**
   ```typescript
   @WebSocketGateway({
     cors: {
       origin: process.env.FRONTEND_URL,
     }
   })
   ```

### Authentication Flow

```
┌──────────┐                  ┌─────────────┐                  ┌─────────┐
│ Frontend │                  │ API Service │                  │ Backend │
└────┬─────┘                  └──────┬──────┘                  └────┬────┘
     │                               │                              │
     │ 1. Login Request              │                              │
     │─────────────────────────────► │                              │
     │                               │                              │
     │                               │ 2. Sign JWT                  │
     │                               │    (JWT_SECRET)              │
     │                               │                              │
     │ 3. JWT Token                  │                              │
     │◄───────────────────────────── │                              │
     │                               │                              │
     │ 4. Request with JWT           │                              │
     │───────────────────────────────┼─────────────────────────────►│
     │                               │                              │
     │                               │                              │ 5. Verify JWT
     │                               │                              │    (JWT_SECRET)
     │                               │                              │    ✓ Must match!
     │                               │                              │
     │ 6. Response                   │                              │
     │◄──────────────────────────────┼──────────────────────────────│
     │                               │                              │
```

**Critical:** JWT_SECRET must match in step 2 and 5, or verification fails.

## Configuration Validation

### Deployment Order

1. **Database Services First**

   ```
   1. PostgreSQL
   2. Redis
   ```

2. **Backend Services**

   ```
   3. API Service (depends on DB)
   4. Backend Service (depends on DB)
   ```

3. **Gateway Layer**

   ```
   5. API Gateway (depends on Backend Services)
   ```

4. **Frontend Last**
   ```
   6. Frontend (depends on API Gateway)
   ```

### Post-Deployment Validation

After each service deployment, verify configuration:

#### 1. Check Service URLs

```bash
# Get actual Railway URLs
railway status --service api-service
railway status --service backend-service
railway status --service api-gateway
```

#### 2. Update Dependent Services

```bash
# After API Service deploys
# Update in API Gateway:
AGENTS_SERVICE_URL=<api_service_url>

# After API Gateway deploys
# Update in Frontend:
VITE_API_URL=<api_gateway_url>
```

#### 3. Verify CORS Configuration

```bash
# Test from frontend origin
curl -H "Origin: https://app.thenewfuse.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api-gateway-production.up.railway.app/api/users

# Should return Access-Control-Allow-Origin header
```

#### 4. Test JWT Flow

```bash
# 1. Login through API Service
curl -X POST https://api-service-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Returns JWT token

# 2. Use token with Backend Service
curl https://backend-production.up.railway.app/api/protected \
  -H "Authorization: Bearer <jwt_token>"

# Should succeed if JWT_SECRET matches
```

### Configuration Checklist

Use this checklist when deploying or updating services:

```markdown
## Service Configuration Checklist

### Shared Secrets

- [ ] JWT_SECRET is identical in API and Backend services
- [ ] JWT_SECRET is at least 64 characters
- [ ] JWT_REFRESH_SECRET is set in API service

### Database Configuration

- [ ] DATABASE_URL references same PostgreSQL in all services
- [ ] REDIS_URL references same Redis in all services
- [ ] Database migrations have been run

### Service URLs

- [ ] VITE_API_URL in Frontend points to API Gateway
- [ ] VITE_WS_URL in Frontend points to WebSocket server
- [ ] BACKEND_SERVICE_URL in API Gateway points to Backend
- [ ] AGENTS_SERVICE_URL in API Gateway points to API Service

### CORS Configuration

- [ ] CORS_ORIGINS in API Gateway includes Frontend URL
- [ ] ALLOWED_ORIGINS in API Service includes Frontend URL
- [ ] FRONTEND_URL in Backend Service matches actual Frontend
- [ ] All URLs use https:// in production
- [ ] No trailing slashes in URLs

### Security

- [ ] All secrets are properly generated (not defaults)
- [ ] CORS origins don't use wildcards
- [ ] HTTPS is enforced in production
- [ ] Rate limiting is configured

### Testing

- [ ] Health endpoints return 200
- [ ] Frontend can fetch from API
- [ ] WebSocket connection succeeds
- [ ] Authentication flow works end-to-end
- [ ] CORS preflight requests succeed
```

## Common Issues

### Issue 1: CORS Errors

**Symptom:**

```
Access to fetch at 'https://api.example.com' from origin 'https://app.example.com'
has been blocked by CORS policy
```

**Causes:**

- Frontend URL not in `CORS_ORIGINS` or `ALLOWED_ORIGINS`
- Typo in URL (trailing slash, http vs https)
- Service not receiving environment variable

**Solutions:**

1. **Check exact URL match:**

   ```bash
   # Frontend URL
   echo $VITE_FRONTEND_URL

   # API CORS config (must match exactly)
   echo $ALLOWED_ORIGINS
   ```

2. **Include protocol:**

   ```bash
   # ✓ Correct
   ALLOWED_ORIGINS=https://app.thenewfuse.com

   # ✗ Wrong
   ALLOWED_ORIGINS=app.thenewfuse.com
   ```

3. **No trailing slashes:**

   ```bash
   # ✓ Correct
   ALLOWED_ORIGINS=https://app.thenewfuse.com

   # ✗ Wrong
   ALLOWED_ORIGINS=https://app.thenewfuse.com/
   ```

4. **Restart service after changing:**
   ```bash
   # Changes to environment variables require restart
   railway redeploy --service api-service
   ```

### Issue 2: JWT Verification Fails

**Symptom:**

```
Error: invalid signature
401 Unauthorized
```

**Cause:** JWT_SECRET doesn't match between services

**Solution:**

1. **Generate secret once:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Set in both services (Railway):**

   ```bash
   # api-service → Variables
   JWT_SECRET=<generated_secret>

   # backend-service → Variables
   JWT_SECRET=<same_generated_secret>
   ```

3. **Verify they match:**

   ```bash
   # In Railway dashboard, visually compare
   # Or use Railway CLI
   railway variables --service api-service | grep JWT_SECRET
   railway variables --service backend-service | grep JWT_SECRET
   ```

4. **Restart both services:**
   ```bash
   railway redeploy --service api-service
   railway redeploy --service backend-service
   ```

### Issue 3: Service Can't Reach Another Service

**Symptom:**

```
Error: connect ECONNREFUSED
Failed to fetch from backend service
```

**Causes:**

- Incorrect service URL
- Service not deployed
- Service crashed during startup

**Solutions:**

1. **Verify service is running:**

   ```bash
   railway status --service backend-service
   ```

2. **Check service URL:**

   ```bash
   # Get actual URL from Railway
   railway status --service backend-service

   # Should match BACKEND_SERVICE_URL in API Gateway
   ```

3. **Check service health:**

   ```bash
   curl https://backend-production.up.railway.app/health
   ```

4. **Update and restart:**

   ```bash
   # Update API Gateway with correct URL
   railway variables set BACKEND_SERVICE_URL=<correct_url> --service api-gateway

   # Restart API Gateway
   railway redeploy --service api-gateway
   ```

### Issue 4: Environment Variables Not Loading

**Symptom:**

```
Missing required environment variable: JWT_SECRET
```

**Causes:**

- Variable not set in Railway dashboard
- Typo in variable name
- Service not redeployed after adding variable

**Solutions:**

1. **Verify variable exists:**

   ```bash
   railway variables --service api-service
   ```

2. **Check for typos:**

   ```bash
   # Variable names are case-sensitive
   # JWT_SECRET ≠ jwt_secret ≠ JWT_Secret
   ```

3. **Redeploy after adding:**

   ```bash
   railway redeploy --service api-service
   ```

4. **Check startup logs:**
   ```bash
   railway logs --service api-service
   # Look for validation errors
   ```

### Issue 5: WebSocket Connection Fails

**Symptom:**

```
WebSocket connection failed
Error: unexpected response code: 400
```

**Causes:**

- WS URL doesn't match server
- CORS not configured for WebSocket
- Using HTTP instead of HTTPS (should use WS vs WSS)

**Solutions:**

1. **Use correct protocol:**

   ```bash
   # Development
   VITE_WS_URL=ws://localhost:3001

   # Production
   VITE_WS_URL=wss://api-gateway-production.up.railway.app
   ```

2. **Match API URL:**

   ```bash
   # If API is at https://api.example.com
   # WebSocket should be wss://api.example.com
   ```

3. **Configure CORS for WebSocket:**
   ```typescript
   @WebSocketGateway({
     cors: {
       origin: process.env.FRONTEND_URL,
       credentials: true
     }
   })
   ```

## Configuration Templates

### Development (.env.local)

```bash
# API Service
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuse
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-characters-long
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
FRONTEND_URL=http://localhost:3000

# API Gateway
PORT=8080
BACKEND_SERVICE_URL=http://localhost:5000
AGENTS_SERVICE_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Backend
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuse
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-min-32-characters-long
FRONTEND_URL=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### Production (Railway)

```bash
# Generate secrets first
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# API Service
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generated_secret>
JWT_REFRESH_SECRET=<generated_secret_2>
ALLOWED_ORIGINS=https://app.thenewfuse.com
FRONTEND_URL=https://app.thenewfuse.com

# API Gateway
BACKEND_SERVICE_URL=https://backend-production.up.railway.app
AGENTS_SERVICE_URL=https://api-service-production.up.railway.app
CORS_ORIGINS=https://app.thenewfuse.com

# Backend
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<same_generated_secret_as_api>
FRONTEND_URL=https://app.thenewfuse.com

# Frontend
VITE_API_URL=https://api-gateway-production.up.railway.app
VITE_WS_URL=wss://api-gateway-production.up.railway.app
```

## Monitoring Cross-Service Configuration

### Health Check Endpoints

Each service should expose health status including configuration:

```typescript
// Example health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasRedis: !!process.env.REDIS_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      corsOrigins: process.env.ALLOWED_ORIGINS?.split(',').length || 0,
      // Don't expose actual values!
    },
  });
});
```

### Configuration Dashboard

Create an admin endpoint (protected) to view configuration status:

```typescript
app.get('/admin/config-status', authenticateAdmin, (req, res) => {
  res.json({
    services: {
      database: {
        connected: true,
        url: process.env.DATABASE_URL?.split('@')[1],
      },
      redis: { connected: true, url: process.env.REDIS_URL?.split('@')[1] },
    },
    secrets: {
      jwt: {
        configured: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length,
      },
      // Show presence, not values
    },
    cors: {
      origins: process.env.ALLOWED_ORIGINS?.split(','),
    },
  });
});
```

## Summary

**Key Takeaways:**

1. **JWT_SECRET must be identical** across API and Backend services
2. **Service URLs must be accurate** - check Railway dashboard after each
   deployment
3. **CORS origins must match exactly** - include protocol, no trailing slashes
4. **Deploy in order** - databases → backends → gateway → frontend
5. **Validate after every deployment** - use health checks and test flows
6. **Use Railway variable references** for database services:
   `${{Postgres.DATABASE_URL}}`
7. **Restart services** after changing environment variables

For detailed variable documentation, see
[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md). For Railway deployment
steps, see [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md).
