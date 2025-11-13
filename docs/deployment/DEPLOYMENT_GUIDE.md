# The New Fuse - Production Deployment Guide

## Overview

This guide covers the complete deployment process for The New Fuse to production using Docker Hub for container builds and Railway for hosting.

## Prerequisites

### Required Accounts
- [Docker Hub](https://hub.docker.com/) account
- [Railway](https://railway.app/) account
- GitHub repository access

### Required Secrets
Configure these secrets in your GitHub repository settings:

#### Docker Hub Secrets
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub access token

#### Railway Secrets
- `RAILWAY_TOKEN`: Your Railway API token
- `RAILWAY_PROJECT_ID`: Your Railway project ID
- `RAILWAY_API_URL`: Your Railway API service URL
- `RAILWAY_FRONTEND_URL`: Your Railway frontend service URL

#### Optional Secrets
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications

## Deployment Architecture

```
GitHub Repository
    ↓ (Push to main/project-reconstruction)
GitHub Actions
    ↓ (Build & Push)
Docker Hub
    ↓ (Pull & Deploy)
Railway Platform
    ↓ (Serve)
Production Environment
```

## Services Overview

### 1. API Service
- **Image**: `whodaniel/fuse-api`
- **Port**: 3001
- **Health Check**: `/health`
- **Dependencies**: PostgreSQL, Redis

### 2. Frontend Service
- **Image**: `whodaniel/fuse-frontend`
- **Port**: 80
- **Health Check**: `/health`
- **Dependencies**: API Service

### 3. Database Services
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage

## Step-by-Step Deployment

### Phase 1: Docker Hub Setup

1. **Create Docker Hub Repositories**
   ```bash
   # Create repositories on Docker Hub:
   # - whodaniel/fuse-api
   # - whodaniel/fuse-frontend
   ```

2. **Configure GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add Docker Hub credentials

3. **Trigger Initial Build**
   ```bash
   git push origin project-reconstruction
   ```

### Phase 2: Railway Setup

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   curl -fsSL https://railway.app/install.sh | sh
   
   # Login and create project
   railway login
   railway init
   ```

2. **Configure Services**
   ```bash
   # Add PostgreSQL
   railway add postgresql
   
   # Add Redis
   railway add redis
   
   # Deploy API service
   railway service create api
   railway service create frontend
   ```

3. **Set Environment Variables**
   ```bash
   # API Service Variables
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
   railway variables set REDIS_URL=${{Redis.REDIS_URL}}
   
   # Frontend Service Variables
   railway variables set VITE_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
   railway variables set VITE_WS_URL=wss://${{api.RAILWAY_PUBLIC_DOMAIN}}
   ```

### Phase 3: Automated Deployment

1. **GitHub Actions Workflow**
   - Workflows are automatically triggered on push to main branches
   - Docker images are built and pushed to Docker Hub
   - Railway deployment is triggered automatically

2. **Manual Deployment**
   ```bash
   # Trigger manual deployment
   gh workflow run "Deploy to Railway"
   ```

## Environment Variables

### Required Environment Variables

#### API Service
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://user:password@host:port
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-byte-encryption-key
```

#### Frontend Service
```env
VITE_API_URL=https://your-api-domain.railway.app
VITE_WS_URL=wss://your-api-domain.railway.app
```

#### Database Services
```env
# PostgreSQL
POSTGRES_DB=fuse
POSTGRES_USER=fuse
POSTGRES_PASSWORD=secure-password

# Redis
REDIS_PASSWORD=secure-redis-password
```

## Monitoring and Health Checks

### Health Check Endpoints
- **API**: `GET /health`
- **Frontend**: `GET /health`

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Jaeger**: Distributed tracing

### Alerts
- Service health checks every 30 seconds
- Automatic restart on failure
- Slack notifications for deployment status

## Security Considerations

### Container Security
- Multi-stage Docker builds for minimal attack surface
- Non-root user execution
- Security scanning with Trivy

### Network Security
- Private networking between services
- HTTPS/TLS termination at load balancer
- Environment variable encryption

### Data Security
- Encrypted database connections
- API key encryption (AES-256-GCM)
- Secure session management

## Scaling Configuration

### Horizontal Scaling
```yaml
# Railway scaling configuration
replicas: 3
resources:
  limits:
    memory: 1Gi
    cpu: 500m
  requests:
    memory: 512Mi
    cpu: 250m
```

### Database Scaling
- PostgreSQL connection pooling
- Redis clustering for high availability
- Read replicas for improved performance

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check GitHub Actions logs
   gh run list --workflow="Docker Hub Build and Push"
   gh run view [run-id]
   ```

2. **Deployment Failures**
   ```bash
   # Check Railway logs
   railway logs --service api
   railway logs --service frontend
   ```

3. **Health Check Failures**
   ```bash
   # Test health endpoints
   curl -f https://your-api-domain.railway.app/health
   curl -f https://your-frontend-domain.railway.app/health
   ```

### Debug Commands
```bash
# Railway CLI debugging
railway status
railway ps
railway variables

# Docker debugging
docker logs container-name
docker exec -it container-name /bin/sh
```

## Rollback Procedures

### Automatic Rollback
- Failed health checks trigger automatic rollback
- Previous stable version is restored

### Manual Rollback
```bash
# Railway rollback
railway rollback --service api
railway rollback --service frontend

# Docker Hub rollback
docker pull whodaniel/fuse-api:previous-tag
railway redeploy --service api
```

## Performance Optimization

### Docker Optimization
- Multi-stage builds reduce image size
- Layer caching improves build times
- Health checks ensure service availability

### Railway Optimization
- Auto-scaling based on CPU/memory usage
- CDN integration for static assets
- Database connection pooling

## Maintenance

### Regular Tasks
- Monitor resource usage
- Update dependencies
- Review security scans
- Backup database

### Scheduled Maintenance
- Weekly security updates
- Monthly performance reviews
- Quarterly disaster recovery tests

## Support

### Documentation
- [Railway Documentation](https://docs.railway.app/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Monitoring Dashboards
- Railway Dashboard: Monitor service health and metrics
- Grafana: Custom performance dashboards
- GitHub Actions: Build and deployment status

---

## Quick Start Checklist

- [ ] Docker Hub repositories created
- [ ] GitHub secrets configured
- [ ] Railway project initialized
- [ ] Environment variables set
- [ ] Initial deployment successful
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup procedures tested

**Deployment Status**: Ready for production release! 🚀