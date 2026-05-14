# CloudRuntime Deployment Guide - Secure Cloud Sandbox

Complete guide for deploying the secure cloud sandbox to CloudRuntime with RBAC and
multi-tenant isolation.

## Prerequisites

- [x] CloudRuntime account created
- [x] CloudRuntime CLI installed and logged in
- [x] PostgreSQL database provisioned on CloudRuntime
- [x] JWT secret generated
- [x] Domain configured (optional)

## Quick Start

```bash
# 1. Login to CloudRuntime
cloud_runtime login

# 2. Link to your project
cloud_runtime link

# 3. Deploy cloud sandbox
cloud_runtime up --service tnf-cloud-sandbox-v2
```

## Detailed Setup

### 1. Create CloudRuntime Project

```bash
# Initialize new project (if not exists)
cloud_runtime init

# Or link to existing project
cloud_runtime link [project-id]
```

### 2. Provision PostgreSQL Database

```bash
# Add PostgreSQL service
cloud_runtime add --service postgresql

# Get database URL
cloud_runtime variables --service postgresql
```

The `DATABASE_URL` will be automatically injected into your service.

### 3. Configure Environment Variables

Set these variables in CloudRuntime dashboard or via CLI:

#### Required Variables

```bash
# JWT Secret (generate with: openssl rand -base64 32)
cloud_runtime variables set JWT_SECRET="your-generated-secret-here"

# Database URL (automatically set when linking PostgreSQL)
# DATABASE_URL is injected automatically

# Node Environment
cloud_runtime variables set NODE_ENV="production"

# Port (CloudRuntime will set PORT automatically, but we can override)
cloud_runtime variables set PORT="8080"
```

#### Optional Security Variables

```bash
# JWT Expiration
cloud_runtime variables set JWT_EXPIRES_IN="1h"

# CORS Origins
cloud_runtime variables set CORS_ORIGINS="https://app.thenewfuse.com,https://thenewfuse.com"

# Rate Limiting
cloud_runtime variables set RATE_LIMIT_WINDOW_MS="900000"
cloud_runtime variables set RATE_LIMIT_MAX_REQUESTS="100"

# Enable Features
cloud_runtime variables set ENABLE_TENANT_ISOLATION="true"
cloud_runtime variables set ENABLE_RESOURCE_QUOTAS="true"
cloud_runtime variables set ENABLE_AUDIT_LOG="true"
```

### 4. Configure cloud_runtime.toml

The `cloud_runtime.toml` file is already configured for the secure cloud sandbox:

```toml
[services.tnf-cloud-sandbox-v2]
builder = "DOCKERFILE"
build = {
  dockerfilePath = "apps/cloud-sandbox/Dockerfile.cloud_runtime",
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
cloud_runtime up --service tnf-cloud-sandbox-v2

# Watch logs
cloud_runtime logs --service tnf-cloud-sandbox-v2
```

#### Deploy from GitHub (Recommended)

1. Connect your GitHub repository to CloudRuntime
2. Set up automatic deployments on push
3. Configure deployment triggers:
   ```
   Trigger: Push to main branch
   Watch paths: apps/cloud-sandbox/**, packages/**
   ```

### 6. Verify Deployment

```bash
# Check service status
cloud_runtime status --service tnf-cloud-sandbox-v2

# Get service URL
cloud_runtime domain --service tnf-cloud-sandbox-v2

# Test health endpoint
curl https://your-service.thenewfuse.com/health

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
| Dockerfile Path | apps/cloud-sandbox/Dockerfile.cloud_runtime | Custom secure Dockerfile |
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

Configure in CloudRuntime dashboard:

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
- [ ] Set DATABASE_URL from CloudRuntime PostgreSQL
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

CloudRuntime automatically monitors the `/health` endpoint:

```bash
# Manual health check
curl https://your-service.thenewfuse.com/health

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
cloud_runtime logs --service tnf-cloud-sandbox-v2

# Follow logs (real-time)
cloud_runtime logs --service tnf-cloud-sandbox-v2 --follow

# Filter logs by level
cloud_runtime logs --service tnf-cloud-sandbox-v2 | grep ERROR
```

### Metrics

Access metrics endpoint:

```bash
# Prometheus metrics (if enabled)
curl https://your-service.thenewfuse.com/metrics

# Application metrics
curl https://your-service.thenewfuse.com/api/admin/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

## Troubleshooting

### Build Failures

```bash
# Check build logs
cloud_runtime logs --service tnf-cloud-sandbox-v2 --build

# Common issues:
# 1. Missing dependencies - check package.json
# 2. TypeScript errors - run `pnpm build` locally
# 3. Workspace resolution - ensure pnpm-workspace.yaml is correct
```

### Runtime Errors

```bash
# Check runtime logs
cloud_runtime logs --service tnf-cloud-sandbox-v2

# Common issues:
# 1. Missing JWT_SECRET - set in CloudRuntime variables
# 2. Database connection - check DATABASE_URL
# 3. Permission errors - check file permissions in Dockerfile
```

### Authentication Issues

```bash
# Test JWT authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-service.thenewfuse.com/api/tools/list

# Test API key authentication
curl -H "X-Agent-API-Key: YOUR_API_KEY" \
  https://your-service.thenewfuse.com/api/tools/list

# Check authentication logs
cloud_runtime logs --service tnf-cloud-sandbox-v2 | grep "authentication"
```

### Performance Issues

```bash
# Check resource usage
cloud_runtime metrics --service tnf-cloud-sandbox-v2

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
cloud_runtime scale --service tnf-cloud-sandbox-v2 --replicas 3

# Note: Requires Redis for distributed state
cloud_runtime variables set REDIS_URL="redis://your-redis-url"
```

### Vertical Scaling

Increase resources in CloudRuntime dashboard:

1. Go to service settings
2. Adjust memory and CPU limits
3. Deploy changes

## Rollback

```bash
# List deployments
cloud_runtime deployments --service tnf-cloud-sandbox-v2

# Rollback to previous deployment
cloud_runtime rollback --service tnf-cloud-sandbox-v2 [deployment-id]
```

## Backup and Recovery

### Database Backups

CloudRuntime PostgreSQL includes automatic backups:

```bash
# Create manual backup
cloud_runtime backup create --service postgresql

# List backups
cloud_runtime backup list --service postgresql

# Restore from backup
cloud_runtime backup restore --service postgresql [backup-id]
```

### Audit Log Export

```bash
# Export audit logs via API
curl https://your-service.thenewfuse.com/api/admin/audit-logs \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -o audit-logs.json

# Download logs for specific tenant
curl "https://your-service.thenewfuse.com/api/admin/tenants/[tenant-id]/audit-logs?limit=10000" \
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

Based on CloudRuntime pricing (as of 2025):

| Configuration     | Memory | vCPU | Estimated Monthly Cost |
| ----------------- | ------ | ---- | ---------------------- |
| Development       | 1GB    | 1    | ~$5                    |
| Small Production  | 2GB    | 2    | ~$15                   |
| Medium Production | 4GB    | 4    | ~$35                   |
| Large Production  | 8GB    | 8    | ~$75                   |

Add $5-10/month for PostgreSQL database.

## Support

### Resources

- [CloudRuntime Documentation](https://docs.thenewfuse.com)
- [The New Fuse Docs](../../../docs/)
- [Security Guide](./SECURITY_AND_TOOLS_README.md)
- [Integration Guide](./src/auth/INTEGRATION_GUIDE.md)

### Getting Help

1. Check logs: `cloud_runtime logs --service tnf-cloud-sandbox-v2`
2. Review environment variables: `cloud_runtime variables`
3. Check service status: `cloud_runtime status`
4. Open issue on GitHub
5. Contact CloudRuntime support (for platform issues)

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

# 5. CloudRuntime auto-deploys (if GitHub integration enabled)
# Or deploy manually:
cloud_runtime up --service tnf-cloud-sandbox-v2

# 6. Monitor deployment
cloud_runtime logs --service tnf-cloud-sandbox-v2 --follow
```
