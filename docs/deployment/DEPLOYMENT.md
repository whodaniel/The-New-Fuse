# The New Fuse Deployment Guide

This document provides comprehensive guidance for deploying The New Fuse in various environments, from local development to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
   - [Docker Deployment](#docker-deployment)
   - [Kubernetes Deployment](#kubernetes-deployment)
   - [Manual Deployment](#manual-deployment)
4. [Database Setup](#database-setup)
5. [Monitoring Setup](#monitoring-setup)
6. [Security Configuration](#security-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)
9. [Health Checks](#health-checks)
10. [Maintenance Procedures](#maintenance-procedures)

## Prerequisites

### Required Software
- Node.js 18.x or later
- PostgreSQL 14.x or later
- Redis 6.x or later
- Docker & Docker Compose (for containerized deployment)
- Kubernetes & Helm (for Kubernetes deployment)
- Firebase CLI (for Firebase deployment)

### Required Access
- Google Cloud Platform account (if using GCP)
- Firebase project (if using Firebase)
- Domain name (for production)
- SSL certificates

### Additional Prerequisites
- Kubernetes cluster
- Docker Hub account
- GitHub account with required secrets configured
- Base64 encoded kubeconfig

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/the-new-fuse.git
cd the-new-fuse
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/fuse
REDIS_URL=redis://user:password@host:6379

# Authentication
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/fuse/app.log
LOG_MAX_FILES=5
LOG_MAX_SIZE=10m

# External Services
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL=3600
MEMORY_CACHE_TTL=3600
```

### Staging Environment
- 2 replicas
- Resource limits:
  - Memory: 1Gi
  - CPU: 500m
- Load balanced service
- Health checks on /health and /ready endpoints

### Production Environment
- 3 replicas
- Resource limits:
  - Memory: 2Gi
  - CPU: 1000m
- Load balanced service
- Enhanced monitoring
- Automatic rollback on failures

## Database Setup

### 1. PostgreSQL Setup
```bash
# Create database
psql -U postgres
CREATE DATABASE fuse;
CREATE USER fuse_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE fuse TO fuse_user;

# Run migrations
yarn prisma migrate deploy
```

### 2. Redis Setup
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password
requirepass your-secure-password

# Restart Redis
sudo systemctl restart redis
```

## Application Deployment

### Using Docker (Recommended)

1. Build the Docker image:
```bash
docker build -t the-new-fuse .
```

2. Run using Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. Build the application:
```bash
yarn build-all
```

2. Start the application:
```bash
yarn start:prod
```

### Firebase Deployment

1. Initialize Firebase:
```bash
firebase init
```

2. Deploy to Firebase:
```bash
yarn deploy
```

## Secret Management
Required secrets in Kubernetes:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: thefuse-secrets
type: Opaque
data:
  database-url: <base64-encoded-url>
```

## Deployment Process
1. Changes pushed to main/develop trigger CI/CD pipeline
2. Tests run (unit, integration, E2E)
3. Security scan with Snyk
4. Docker image built with layer caching
5. Deployment to staging/production with version tagging
6. Health check verification
7. Automatic rollback if deployment fails

## Monitoring Setup

### 1. Health Checks
The application exposes health check endpoints:
- Basic health: `GET /health`
- Detailed health: `GET /health/detailed`

### 2. Logging
Logs are written to:
- Console (JSON format)
- File (`/var/log/fuse/app.log`)
- Cloud Logging (when deployed to GCP)

### 3. Metrics
Monitor the following metrics:
- Request latency
- Error rates
- Cache hit rates
- Database connection pool status
- Redis connection status
- Memory usage
- CPU usage

### 4. Alerts
Configure alerts for:
- Error rate > 1%
- P95 latency > 500ms
- Memory usage > 85%
- CPU usage > 85%
- Failed health checks
- Database connection issues

## Security Configuration

### 1. SSL/TLS
```bash
# Install SSL certificate
certbot certonly --nginx -d your-domain.com
```

### 2. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
```

### 3. Rate Limiting
Rate limiting is configured in the application:
- 100 requests per 15 minutes per IP
- Configurable through environment variables

### 4. API Keys
Generate API keys through the admin interface:
1. Log in as admin
2. Navigate to Settings > API Keys
3. Generate new key with appropriate permissions

## Troubleshooting

### Common Issues

1. Database Connection Issues
```bash
# Check database logs
tail -f /var/log/postgresql/postgresql.log

# Check connection
psql -h localhost -U fuse_user -d fuse
```

2. Redis Connection Issues
```bash
# Check Redis status
redis-cli ping
redis-cli info

# Monitor Redis
redis-cli monitor
```

3. Application Issues
```bash
# Check application logs
tail -f /var/log/fuse/app.log

# Check system resources
htop
```

### Health Check Status Codes
- 200: Healthy
- 429: Rate Limited
- 503: Service Unavailable
- 500: Internal Server Error

### Support
For additional support:
1. Check the logs
2. Review the documentation
3. Contact the development team
4. Open an issue on GitHub

## Rolling Back
Automatic rollback occurs if:
- Health checks fail
- Resource limits exceeded
- Application errors detected

Manual rollback:
```bash
kubectl rollout undo deployment/thefuse -n [environment]
```