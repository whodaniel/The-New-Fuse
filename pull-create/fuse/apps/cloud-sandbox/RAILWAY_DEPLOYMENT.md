# Railway Deployment Guide - Secure Cloud Sandbox

Complete guide for deploying the secure cloud sandbox to Railway with RBAC and
multi-tenant isolation.

## Prerequisites

- [x] Railway account created
- [x] Railway CLI installed and logged in
- [x] PostgreSQL database provisioned on Railway
- [x] JWT secret generated
- [x] Domain configured (optional)

## Quick Start

```bash
# 1. Login to Railway
railway login

# 2. Link to your project
railway link

# 3. Deploy cloud sandbox
railway up --service tnf-cloud-sandbox-v2
```

## Detailed Setup

### 1. Create Railway Project

```bash
# Initialize new project (if not exists)
railway init

# Or link to existing project
railway link [project-id]
```

### 2. Provision PostgreSQL Database

```bash
# Add PostgreSQL service
railway add --service postgresql

# Get database URL
railway variables --service postgresql
```

The `DATABASE_URL` will be automatically injected into your service.

### 3. Configure Environment Variables

Set these variables in Railway dashboard or via CLI:

#### Required Variables

```bash
# JWT Secret (generate with: openssl rand -base64 32)
railway variables set JWT_SECRET="your-generated-secret-here"

# Database URL (automatically set when linking PostgreSQL)
# DATABASE_URL is injected automatically

# Node Environment
railway variables set NODE_ENV="production"

# Port (Railway will set PORT automatically, but we can override)
railway variables set PORT="8080"
```

#### Optional Security Variables

```bash
# JWT Expiration
railway variables set JWT_EXPIRES_IN="1h"

# CORS Origins
railway variables set CORS_ORIGINS="https://app.thenewfuse.com,https://thenewfuse.com"

# Rate Limiting
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"

# Enable Features
railway variables set ENABLE_TENANT_ISOLATION="true"
railway variables set ENABLE_RESOURCE_QUOTAS="true"
railway variables set ENABLE_AUDIT_LOG="true"
```

### 4. Configure railway.toml

The `railway.toml` file is already configured for the secure cloud sandbox:

```toml
[services.tnf-cloud-sandbox-v2]
builder = "DOCKERFILE"
build = {
  dockerfilePath = "apps/cloud-sandbox/Dockerfile.railway",
  watchPaths = ["apps/cloud-sandbox/**", "packages/**"]
}
deploy = {
  healthcheckPath = "/health",
  restartPolicyType = "ON_FAILURE"
}
```

### 5. Deploy

#### Deploy from Local

```bash
# Deploy specific service
railway up --service tnf-cloud-sandbox-v2

# Watch logs
railway logs --service tnf-cloud-sandbox-v2
```

#### Deploy from GitHub (Recommended)

1. Connect your GitHub repository to Railway
2. Set up automatic deployments on push
3. Configure deployment triggers:
   ```
   Trigger: Push to main branch
   Watch paths: apps/cloud-sandbox/**, packages/**
   ```

### 6. Verify Deployment

```bash
# Check service status
railway status --service tnf-cloud-sandbox-v2

# Get service URL
railway domain --service tnf-cloud-sandbox-v2

# Test health endpoint
curl https://your-service.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "version": "1.0.0",
#   "uptime": 123,
#   "security": "enabled"
# }
```

## Configuration Details

### Service Configuration

| Setting         | Value                                 | Description              |
| --------------- | ------------------------------------- | ------------------------ |
| Builder         | DOCKERFILE                            | Uses Docker for build    |
| Dockerfile Path | apps/cloud-sandbox/Dockerfile.railway | Custom secure Dockerfile |
| Health Check    | /health                               | HTTP health endpoint     |
| Restart Policy  | ON_FAILURE                            | Auto-restart on crashes  |
| Watch Paths     | apps/cloud-sandbox/**, packages/**    | Rebuild on changes       |

### Environment Variables

#### Security Variables

| Variable                | Required | Default | Description             |
| ----------------------- | -------- | ------- | ----------------------- |
| JWT_SECRET              | ✅       | -       | JWT signing secret      |
| JWT_EXPIRES_IN          | ❌       | 1h      | Token expiration time   |
| CORS_ORIGINS            | ❌       | \*      | Allowed CORS origins    |
| ENABLE_TENANT_ISOLATION | ❌       | true    | Enable tenant isolation |
| ENABLE_RESOURCE_QUOTAS  | ❌       | true    | Enable resource quotas  |
| ENABLE_AUDIT_LOG        | ❌       | true    | Enable audit logging    |

#### Database Variables

| Variable     | Required | Default | Description                  |
| ------------ | -------- | ------- | ---------------------------- |
| DATABASE_URL | ✅       | -       | PostgreSQL connection string |

#### Application Variables

| Variable   | Required | Default    | Description            |
| ---------- | -------- | ---------- | ---------------------- |
| NODE_ENV   | ❌       | production | Node environment       |
| PORT       | ❌       | 8080       | HTTP server port       |
| WS_PORT    | ❌       | 8080       | WebSocket port         |
| LOG_LEVEL  | ❌       | info       | Logging level          |
| LOG_FORMAT | ❌       | json       | Log format (json/text) |

#### Feature Flags

| Variable                  | Required | Default | Description                            |
| ------------------------- | -------- | ------- | -------------------------------------- |
| ENABLE_BROWSER_TOOLS      | ❌       | true    | Enable browser automation              |
| ENABLE_FILESYSTEM_TOOLS   | ❌       | true    | Enable file operations                 |
| ENABLE_EXECUTION_TOOLS    | ❌       | true    | Enable code execution                  |
| ENABLE_SKILL_CHAINS       | ❌       | true    | Enable skill chains                    |
| ENABLE_DANGEROUS_COMMANDS | ❌       | true    | Allow dangerous commands (SUPER_ADMIN) |

### Resource Limits

Configure in Railway dashboard:

- **Memory**: 2GB minimum, 4GB recommended
- **CPU**: 2 vCPU minimum, 4 vCPU recommended
- **Disk**: 10GB minimum (for browser cache and temp files)

### Networking

- **Ports**: 8080 (HTTP + WebSocket)
- **Protocol**: HTTP/1.1, WebSocket
- **IPv6**: Supported
- **Custom Domain**: Supported

## Security Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Set DATABASE_URL from Railway PostgreSQL
- [ ] Configure CORS_ORIGINS for your domains
- [ ] Enable ENABLE_TENANT_ISOLATION
- [ ] Enable ENABLE_RESOURCE_QUOTAS
- [ ] Enable ENABLE_AUDIT_LOG
- [ ] Set NODE_ENV=production
- [ ] Review and set resource limits
- [ ] Configure custom domain with SSL
- [ ] Set up monitoring and alerts
- [ ] Test authentication with real tokens
- [ ] Verify permission checks work
- [ ] Test quota enforcement
- [ ] Review audit logs

## Monitoring

### Health Checks

Railway automatically monitors the `/health` endpoint:

```bash
# Manual health check
curl https://your-service.railway.app/health

# Response:
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345,
  "security": {
    "authentication": "enabled",
    "rbac": "enabled",
    "tenantIsolation": "enabled",
    "auditLog": "enabled"
  },
  "resources": {
    "memory": {
      "used": 524288000,
      "total": 2147483648
    },
    "cpu": {
      "usage": 15.5
    }
  }
}
```

### Logs

```bash
# View recent logs
railway logs --service tnf-cloud-sandbox-v2

# Follow logs (real-time)
railway logs --service tnf-cloud-sandbox-v2 --follow

# Filter logs by level
railway logs --service tnf-cloud-sandbox-v2 | grep ERROR
```

### Metrics

Access metrics endpoint:

```bash
# Prometheus metrics (if enabled)
curl https://your-service.railway.app/metrics

# Application metrics
curl https://your-service.railway.app/api/admin/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

## Troubleshooting

### Build Failures

```bash
# Check build logs
railway logs --service tnf-cloud-sandbox-v2 --build

# Common issues:
# 1. Missing dependencies - check package.json
# 2. TypeScript errors - run `pnpm build` locally
# 3. Workspace resolution - ensure pnpm-workspace.yaml is correct
```

### Runtime Errors

```bash
# Check runtime logs
railway logs --service tnf-cloud-sandbox-v2

# Common issues:
# 1. Missing JWT_SECRET - set in Railway variables
# 2. Database connection - check DATABASE_URL
# 3. Permission errors - check file permissions in Dockerfile
```

### Authentication Issues

```bash
# Test JWT authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-service.railway.app/api/tools/list

# Test API key authentication
curl -H "X-Agent-API-Key: YOUR_API_KEY" \
  https://your-service.railway.app/api/tools/list

# Check authentication logs
railway logs --service tnf-cloud-sandbox-v2 | grep "authentication"
```

### Performance Issues

```bash
# Check resource usage
railway metrics --service tnf-cloud-sandbox-v2

# Common fixes:
# 1. Increase memory allocation
# 2. Increase CPU allocation
# 3. Optimize database queries
# 4. Enable Redis caching
# 5. Review quota limits
```

## Scaling

### Horizontal Scaling

```bash
# Scale to multiple instances (Enterprise plan)
railway scale --service tnf-cloud-sandbox-v2 --replicas 3

# Note: Requires Redis for distributed state
railway variables set REDIS_URL="redis://your-redis-url"
```

### Vertical Scaling

Increase resources in Railway dashboard:

1. Go to service settings
2. Adjust memory and CPU limits
3. Deploy changes

## Rollback

```bash
# List deployments
railway deployments --service tnf-cloud-sandbox-v2

# Rollback to previous deployment
railway rollback --service tnf-cloud-sandbox-v2 [deployment-id]
```

## Backup and Recovery

### Database Backups

Railway PostgreSQL includes automatic backups:

```bash
# Create manual backup
railway backup create --service postgresql

# List backups
railway backup list --service postgresql

# Restore from backup
railway backup restore --service postgresql [backup-id]
```

### Audit Log Export

```bash
# Export audit logs via API
curl https://your-service.railway.app/api/admin/audit-logs \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -o audit-logs.json

# Download logs for specific tenant
curl "https://your-service.railway.app/api/admin/tenants/[tenant-id]/audit-logs?limit=10000" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -o tenant-audit-logs.json
```

## Cost Optimization

### Tips for Reducing Costs

1. **Right-size resources**: Start with minimum and scale as needed
2. **Use resource quotas**: Prevent runaway usage
3. **Enable caching**: Use Redis for frequently accessed data
4. **Optimize builds**: Use Docker layer caching
5. **Monitor usage**: Review metrics regularly

### Estimated Costs

Based on Railway pricing (as of 2025):

| Configuration     | Memory | vCPU | Estimated Monthly Cost |
| ----------------- | ------ | ---- | ---------------------- |
| Development       | 1GB    | 1    | ~$5                    |
| Small Production  | 2GB    | 2    | ~$15                   |
| Medium Production | 4GB    | 4    | ~$35                   |
| Large Production  | 8GB    | 8    | ~$75                   |

Add $5-10/month for PostgreSQL database.

## Support

### Resources

- [Railway Documentation](https://docs.railway.app)
- [The New Fuse Docs](../../../docs/)
- [Security Guide](./SECURITY_AND_TOOLS_README.md)
- [Integration Guide](./src/auth/INTEGRATION_GUIDE.md)

### Getting Help

1. Check logs: `railway logs --service tnf-cloud-sandbox-v2`
2. Review environment variables: `railway variables`
3. Check service status: `railway status`
4. Open issue on GitHub
5. Contact Railway support (for platform issues)

## Next Steps

After successful deployment:

1. ✅ Test authentication endpoints
2. ✅ Verify RBAC permissions
3. ✅ Test tool execution
4. ✅ Verify quota enforcement
5. ✅ Check audit logging
6. ✅ Set up monitoring alerts
7. ✅ Configure custom domain
8. ✅ Enable SSL/TLS
9. ✅ Document API endpoints
10. ✅ Train team on usage

## Maintenance

### Regular Tasks

- **Weekly**: Review audit logs for security issues
- **Monthly**: Check resource usage and optimize
- **Quarterly**: Update dependencies and security patches
- **Yearly**: Review and update security policies

### Update Procedure

```bash
# 1. Update code locally
git pull origin main

# 2. Test locally
pnpm --filter tnf-cloud-sandbox dev

# 3. Build and test
pnpm --filter tnf-cloud-sandbox build

# 4. Commit and push
git add .
git commit -m "Update cloud sandbox"
git push origin main

# 5. Railway auto-deploys (if GitHub integration enabled)
# Or deploy manually:
railway up --service tnf-cloud-sandbox-v2

# 6. Monitor deployment
railway logs --service tnf-cloud-sandbox-v2 --follow
```
