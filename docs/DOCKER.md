# Docker Guide for The New Fuse

Comprehensive guide for building, running, and optimizing Docker containers for The New Fuse platform.

## Table of Contents

- [Quick Start](#quick-start)
- [Building Images](#building-images)
- [Running Containers](#running-containers)
- [Local Development](#local-development)
- [Optimization Features](#optimization-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Quick Start

### Prerequisites

```bash
# Install Docker (version 20.10+)
docker --version

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1

# Optional: Install Docker Compose v2
docker compose version
```

### Build and Run All Services

```bash
# Build and start all services
docker-compose -f docker-compose.local.yml up --build

# Access services:
# - Frontend: http://localhost:8080
# - API Gateway: http://localhost:3002
# - API: http://localhost:3001
# - Backend: http://localhost:3003
```

## Building Images

### Enable BuildKit (Recommended)

BuildKit provides significant performance improvements and is required for the optimizations in our Dockerfiles.

```bash
# Enable BuildKit for current session
export DOCKER_BUILDKIT=1

# Or enable permanently in Docker daemon config
cat > /etc/docker/daemon.json <<EOF
{
  "features": {
    "buildkit": true
  }
}
EOF
sudo systemctl restart docker
```

### Build Individual Services

#### Frontend

```bash
# Build from repository root
docker build -f apps/frontend/Dockerfile.railway -t the-new-fuse/frontend:latest .

# Build with cache
docker build --cache-from the-new-fuse/frontend:latest \
  -f apps/frontend/Dockerfile.railway \
  -t the-new-fuse/frontend:latest .
```

#### API Gateway

```bash
# Build from repository root
docker build -f apps/api-gateway/Dockerfile.railway -t the-new-fuse/api-gateway:latest .

# Or use the root Dockerfile
docker build -f Dockerfile.railway -t the-new-fuse/api-gateway:latest .
```

#### API Service

```bash
docker build -f apps/api/Dockerfile.railway -t the-new-fuse/api:latest .
```

#### Backend Service

```bash
docker build -f apps/backend/Dockerfile.railway -t the-new-fuse/backend:latest .
```

### Build with Custom Tags

```bash
# Tag with version
docker build -f Dockerfile.railway -t the-new-fuse/api-gateway:v1.0.0 .

# Tag with git commit
docker build -f Dockerfile.railway -t the-new-fuse/api-gateway:$(git rev-parse --short HEAD) .

# Multiple tags
docker build -f Dockerfile.railway \
  -t the-new-fuse/api-gateway:latest \
  -t the-new-fuse/api-gateway:v1.0.0 \
  .
```

## Running Containers

### Run Individual Containers

#### Frontend

```bash
docker run -d \
  --name tnf-frontend \
  -p 8080:8080 \
  the-new-fuse/frontend:latest
```

#### API Gateway

```bash
docker run -d \
  --name tnf-api-gateway \
  -p 3002:3002 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e REDIS_URL="redis://host:6379" \
  the-new-fuse/api-gateway:latest
```

#### API Service

```bash
docker run -d \
  --name tnf-api \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  the-new-fuse/api:latest
```

#### Backend Service

```bash
docker run -d \
  --name tnf-backend \
  -p 3003:3003 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  the-new-fuse/backend:latest
```

### Environment Variables

Common environment variables for all services:

```bash
NODE_ENV=production          # Environment (production, development, test)
PORT=3000                    # Service port
DATABASE_URL=...             # PostgreSQL connection string
REDIS_URL=...                # Redis connection string
LOG_LEVEL=info              # Logging level (error, warn, info, debug)
```

## Local Development

### Using Docker Compose

The `docker-compose.local.yml` file provides a complete local development stack:

```bash
# Start all services
docker-compose -f docker-compose.local.yml up

# Start specific services
docker-compose -f docker-compose.local.yml up frontend api-gateway

# Build and start
docker-compose -f docker-compose.local.yml up --build

# Run in background
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Stop all services
docker-compose -f docker-compose.local.yml down

# Stop and remove volumes
docker-compose -f docker-compose.local.yml down -v
```

### Environment Configuration

Create a `.env.docker` file for local development:

```bash
# Database
POSTGRES_DB=thenewfuse
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/thenewfuse

# Redis
REDIS_URL=redis://redis:6379

# Application
NODE_ENV=production
LOG_LEVEL=debug
```

Then use it with Docker Compose:

```bash
docker-compose -f docker-compose.local.yml --env-file .env.docker up
```

## Optimization Features

Our Dockerfiles implement numerous optimizations for faster builds, smaller images, and better caching.

### BuildKit Cache Mounts

Cache mounts persist between builds, dramatically speeding up dependency installation:

```dockerfile
# Cache pnpm store
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Cache APK packages
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache nodejs

# Cache Turbo builds
RUN --mount=type=cache,target=/app/.turbo \
    pnpm turbo run build
```

### COPY --link

The `--link` flag improves layer reuse and caching:

```dockerfile
# Better caching with --link
COPY --link package.json pnpm-lock.yaml ./
COPY --link apps/api/package.json ./apps/api/
```

### Multi-Stage Builds

Our Dockerfiles use multi-stage builds to minimize final image size:

- **base-build**: Contains build tools (only used during build)
- **base-runtime**: Minimal runtime dependencies
- **deps**: All dependencies (dev + prod)
- **prod-deps**: Production dependencies only
- **builder**: Builds the application
- **runner**: Final production image (smallest)

### Production Dependencies

We create a separate stage for production dependencies:

```dockerfile
# Install ONLY production dependencies
RUN pnpm install --prod
```

This significantly reduces the final image size by excluding dev dependencies.

### Static Asset Compression

For the frontend, we pre-compress static assets:

```dockerfile
# Pre-compress with gzip and brotli
RUN find . -type f \( -name "*.js" -o -name "*.css" \) \
  -exec gzip -9 -k -f {} \; \
  -exec brotli -9 -k -f {} \;
```

Nginx serves these compressed files directly, improving performance.

## Deployment

### Railway Deployment

Our Dockerfiles are optimized for Railway deployment:

1. **Automatic Detection**: Railway detects `Dockerfile.railway` files
2. **BuildKit Support**: Railway uses BuildKit by default
3. **Cache Persistence**: Railway maintains build cache between deployments
4. **Health Checks**: Built-in health checks ensure service availability

### Deployment Checklist

- [ ] Set environment variables in Railway dashboard
- [ ] Configure DATABASE_URL and other secrets
- [ ] Set appropriate resource limits
- [ ] Enable health checks
- [ ] Configure custom domains
- [ ] Set up logging and monitoring

### Manual Deployment

```bash
# Build for production
docker build -f Dockerfile.railway -t registry.example.com/api-gateway:latest .

# Push to registry
docker push registry.example.com/api-gateway:latest

# Deploy to server
docker pull registry.example.com/api-gateway:latest
docker run -d \
  --name api-gateway \
  -p 3002:3002 \
  --restart unless-stopped \
  -e DATABASE_URL="..." \
  registry.example.com/api-gateway:latest
```

## Troubleshooting

### Build Issues

#### Out of Memory

```bash
# Increase Docker memory limit
# Docker Desktop: Preferences → Resources → Memory

# Or build with lower concurrency
docker build --build-arg BUILD_CONCURRENCY=1 -f Dockerfile.railway .
```

#### Cache Issues

```bash
# Clear Docker build cache
docker builder prune -a

# Build without cache
docker build --no-cache -f Dockerfile.railway .
```

#### Layer Caching Not Working

```bash
# Ensure BuildKit is enabled
export DOCKER_BUILDKIT=1

# Check .dockerignore is not too aggressive
cat .dockerignore
```

### Runtime Issues

#### Container Won't Start

```bash
# Check logs
docker logs tnf-api-gateway

# Check health status
docker inspect --format='{{.State.Health.Status}}' tnf-api-gateway

# Run interactively for debugging
docker run -it --rm the-new-fuse/api-gateway:latest sh
```

#### Permission Errors

Our containers run as non-root users. If you encounter permission errors:

```bash
# Check user inside container
docker exec tnf-api-gateway whoami

# Files should be owned by the service user
docker exec tnf-api-gateway ls -la /app
```

#### Health Check Failing

```bash
# Check health check command
docker inspect --format='{{.Config.Healthcheck}}' the-new-fuse/api-gateway:latest

# Test health endpoint manually
docker exec tnf-api-gateway curl -f http://localhost:3002/health
```

### Network Issues

```bash
# Check container network
docker network inspect the-new-fuse-network

# Test connectivity between containers
docker exec tnf-api-gateway ping postgres

# Check port bindings
docker port tnf-api-gateway
```

## Advanced Topics

### Image Size Analysis

```bash
# Check image size
docker images the-new-fuse/*

# Analyze layers
docker history the-new-fuse/api-gateway:latest

# Detailed analysis with dive
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest the-new-fuse/api-gateway:latest
```

### Multi-Platform Builds

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.railway \
  -t the-new-fuse/api-gateway:latest \
  --push \
  .
```

### Security Scanning

```bash
# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image the-new-fuse/api-gateway:latest

# Scan with Docker Scout
docker scout cves the-new-fuse/api-gateway:latest
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Specific container
docker stats tnf-api-gateway

# Export metrics (Prometheus format)
docker run -d \
  -p 9090:9090 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  prom/prometheus
```

### Custom Build Arguments

```dockerfile
# In Dockerfile
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine
```

```bash
# Build with custom argument
docker build --build-arg NODE_VERSION=20 -f Dockerfile.railway .
```

## Best Practices

1. **Always use BuildKit** - Enable it in your environment
2. **Use .dockerignore** - Reduce build context size
3. **Multi-stage builds** - Keep production images small
4. **Cache dependencies** - Use cache mounts for pnpm/npm
5. **Non-root user** - Run containers as non-root
6. **Health checks** - Implement proper health endpoints
7. **Labels** - Add metadata to images
8. **Version tags** - Don't rely only on `:latest`
9. **Security scanning** - Regularly scan images for vulnerabilities
10. **Resource limits** - Set appropriate memory/CPU limits

## Related Documentation

- [Docker Best Practices](./DOCKER_BEST_PRACTICES.md)
- [Build Optimization Report](./DOCKER_OPTIMIZATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Railway Documentation](https://docs.railway.app/)
- [Nginx Optimization](https://nginx.org/en/docs/)
