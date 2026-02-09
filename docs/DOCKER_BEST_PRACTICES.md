# Docker Best Practices for The New Fuse

This guide documents the best practices implemented in our Docker configuration and provides guidelines for maintaining and improving our containerization strategy.

## Table of Contents

- [General Principles](#general-principles)
- [Dockerfile Optimization](#dockerfile-optimization)
- [Build Performance](#build-performance)
- [Image Size Reduction](#image-size-reduction)
- [Security Hardening](#security-hardening)
- [Production Readiness](#production-readiness)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Common Pitfalls](#common-pitfalls)

## General Principles

### 1. Use BuildKit

**Why**: BuildKit provides better caching, parallelization, and modern features like cache mounts.

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Or set in daemon.json
{
  "features": {
    "buildkit": true
  }
}
```

**In Dockerfile**:
```dockerfile
# syntax=docker/dockerfile:1.4
```

### 2. Use Alpine Images

**Why**: Alpine Linux is significantly smaller than Debian/Ubuntu, reducing image size by 50-70%.

```dockerfile
# ✅ Good
FROM node:22-alpine

# ❌ Avoid
FROM node:22
```

**Trade-offs**:
- Alpine uses musl libc instead of glibc (99% compatible)
- Some native modules may need build dependencies
- Smaller attack surface

### 3. Multi-Stage Builds

**Why**: Separates build-time dependencies from runtime, dramatically reducing final image size.

```dockerfile
# Build stage
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++
COPY . .
RUN npm run build

# Runtime stage
FROM node:22-alpine AS runner
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
```

**Benefits**:
- Final image doesn't include build tools
- Cleaner separation of concerns
- Better layer caching

## Dockerfile Optimization

### 1. Layer Ordering

**Principle**: Order layers from least to most frequently changing.

```dockerfile
# ✅ Good - stable layers first
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ❌ Bad - unstable layers first
FROM node:22-alpine
COPY . .
RUN npm install
RUN npm run build
```

### 2. COPY --link

**Why**: Improves cache invalidation and layer reuse.

```dockerfile
# ✅ Good
COPY --link package.json ./

# ❌ Avoid (legacy syntax)
COPY package.json ./
```

**Benefits**:
- Better parallelization
- Improved cache reuse
- Independent layer invalidation

### 3. Cache Mounts

**Why**: Persist caches between builds, dramatically speeding up dependency installation.

```dockerfile
# ✅ Cache pnpm store
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ✅ Cache APK packages
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache python3

# ✅ Cache build outputs
RUN --mount=type=cache,target=/app/.turbo \
    pnpm turbo run build
```

### 4. Combine RUN Commands

**Why**: Reduces layer count and image size.

```dockerfile
# ✅ Good
RUN apk add --no-cache \
    python3 \
    make \
    g++ && \
    rm -rf /var/cache/apk/*

# ❌ Bad
RUN apk add --no-cache python3
RUN apk add --no-cache make
RUN apk add --no-cache g++
RUN rm -rf /var/cache/apk/*
```

**Trade-off**: Balance between cache reuse and layer count.

### 5. Use .dockerignore

**Why**: Reduces build context size, speeding up builds and reducing memory usage.

```bash
# .dockerignore
node_modules
dist
.git
.env
*.log
coverage
```

**Impact**:
- Without: ~2.5GB context
- With: ~50-100MB context
- 25x faster context transfer

## Build Performance

### 1. Parallel Dependency Installation

```dockerfile
# ✅ Use cache mounts for parallel downloads
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

### 2. BuildKit Secret Mounts

**Why**: Safely use secrets during build without persisting them in layers.

```dockerfile
# Mount secret during build
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install private-package
```

```bash
# Provide secret during build
docker build --secret id=npmrc,src=.npmrc .
```

### 3. Build Arguments

**Why**: Make builds configurable without creating multiple Dockerfiles.

```dockerfile
ARG NODE_VERSION=22
ARG PNPM_VERSION=10.20.0

FROM node:${NODE_VERSION}-alpine
RUN npm install -g pnpm@${PNPM_VERSION}
```

```bash
# Build with custom versions
docker build --build-arg NODE_VERSION=20 .
```

### 4. Dependency Caching Strategy

```dockerfile
# ✅ Copy package files first
COPY --link package.json pnpm-lock.yaml ./

# Install dependencies (cached layer)
RUN pnpm install --frozen-lockfile

# Then copy source (changes frequently)
COPY --link . .
```

## Image Size Reduction

### 1. Production Dependencies Only

```dockerfile
# Install all dependencies for build
FROM base AS builder
RUN pnpm install --frozen-lockfile

# Install only production dependencies for runtime
FROM base AS prod-deps
RUN pnpm install --prod --frozen-lockfile

# Use prod deps in final image
FROM base AS runner
COPY --from=prod-deps /app/node_modules ./node_modules
```

**Impact**: 30-50% reduction in final image size.

### 2. Remove Unnecessary Files

```dockerfile
# ✅ Clean up in same layer
RUN apk add --no-cache python3 make g++ && \
    npm run build && \
    apk del python3 make g++ && \
    rm -rf /var/cache/apk/* /tmp/*

# ❌ Cleanup in separate layer (doesn't reduce size)
RUN apk add --no-cache python3 make g++
RUN npm run build
RUN apk del python3 make g++
```

### 3. Minimize Runtime Dependencies

```dockerfile
# Build stage - all dependencies
FROM node:22-alpine AS build
RUN apk add --no-cache python3 make g++ cairo-dev

# Runtime stage - minimal dependencies
FROM node:22-alpine AS runtime
RUN apk add --no-cache cairo
```

### 4. Use Specific Package Versions

```dockerfile
# ✅ Pin versions
RUN apk add --no-cache \
    python3=3.11.6-r0 \
    make=4.4.1-r0

# ❌ Unpinned (less reproducible)
RUN apk add --no-cache python3 make
```

## Security Hardening

### 1. Run as Non-Root User

**Why**: Principle of least privilege - limits damage from container escape.

```dockerfile
# ✅ Create and use non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Change ownership
COPY --chown=appuser:nodejs /app/dist ./dist

# Switch to non-root
USER appuser

# ❌ Running as root (default)
CMD ["node", "server.js"]
```

### 2. Scan for Vulnerabilities

```bash
# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image the-new-fuse/api-gateway:latest

# Scan with Grype
grype the-new-fuse/api-gateway:latest

# Scan with Docker Scout
docker scout cves the-new-fuse/api-gateway:latest
```

**Recommended**: Integrate scanning into CI/CD pipeline.

### 3. Use Specific Base Image Tags

```dockerfile
# ✅ Good - specific version
FROM node:22.11.0-alpine3.19

# ⚠️ Acceptable - major version
FROM node:22-alpine

# ❌ Bad - unpredictable
FROM node:alpine
FROM node:latest
```

### 4. Read-Only Root Filesystem

```dockerfile
# Run with read-only filesystem
docker run --read-only \
  --tmpfs /tmp \
  the-new-fuse/api-gateway:latest
```

**Docker Compose**:
```yaml
services:
  api:
    image: the-new-fuse/api:latest
    read_only: true
    tmpfs:
      - /tmp
```

### 5. Drop Capabilities

```bash
# Drop all capabilities, add only what's needed
docker run --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  the-new-fuse/api-gateway:latest
```

### 6. Secret Management

```dockerfile
# ❌ Never do this
ENV API_KEY=secret123
COPY .env /app/

# ✅ Use secret mounts
RUN --mount=type=secret,id=api_key \
    export API_KEY=$(cat /run/secrets/api_key) && \
    ./configure

# ✅ Or runtime environment variables
# Set in docker run or compose
```

## Production Readiness

### 1. Health Checks

**Why**: Enables orchestrators to detect unhealthy containers.

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

**Components**:
- `interval`: How often to check
- `timeout`: Max time for check
- `start-period`: Grace period on startup
- `retries`: Failures before marking unhealthy

### 2. Graceful Shutdown

**Why**: Ensures clean termination of connections and processes.

```dockerfile
# Use dumb-init to handle signals
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

**In Application Code**:
```javascript
// Handle SIGTERM gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.close();
  await db.disconnect();
  process.exit(0);
});
```

### 3. Logging Configuration

```dockerfile
# Log to stdout/stderr (not files)
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json

# Docker will collect these logs
CMD ["node", "server.js"]
```

**Docker Compose**:
```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. Resource Limits

```bash
# Set memory and CPU limits
docker run -d \
  --memory=512m \
  --memory-swap=1g \
  --cpus=1.0 \
  the-new-fuse/api:latest
```

**Docker Compose**:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 5. Environment-Specific Configuration

```dockerfile
# Use build args for environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Different builds for different envs
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm prune --production; \
    fi
```

### 6. Metadata Labels

```dockerfile
LABEL org.opencontainers.image.title="The New Fuse API"
LABEL org.opencontainers.image.description="API Gateway service"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="The New Fuse"
LABEL org.opencontainers.image.source="https://github.com/whodaniel/fuse"
LABEL org.opencontainers.image.created="2025-11-18"
```

## Monitoring and Debugging

### 1. Container Metrics

```bash
# Real-time stats
docker stats

# Specific container
docker stats tnf-api-gateway

# Export to file
docker stats --no-stream > stats.txt
```

### 2. Log Analysis

```bash
# View logs
docker logs tnf-api-gateway

# Follow logs
docker logs -f tnf-api-gateway

# Last 100 lines
docker logs --tail 100 tnf-api-gateway

# With timestamps
docker logs -t tnf-api-gateway
```

### 3. Interactive Debugging

```bash
# Execute shell in running container
docker exec -it tnf-api-gateway sh

# Run debug commands
docker exec tnf-api-gateway ps aux
docker exec tnf-api-gateway netstat -tlnp
docker exec tnf-api-gateway env
```

### 4. Image Analysis

```bash
# View image layers
docker history the-new-fuse/api-gateway:latest

# Analyze with dive
dive the-new-fuse/api-gateway:latest

# Check image size
docker images | grep the-new-fuse
```

## Common Pitfalls

### 1. Using `:latest` Tag in Production

**Problem**: Unpredictable deployments, hard to rollback.

```dockerfile
# ❌ Bad
FROM node:latest

# ✅ Good
FROM node:22.11.0-alpine3.19
```

### 2. Installing Dependencies as Root

**Problem**: Security risk, permission issues.

```dockerfile
# ❌ Bad
FROM node:22-alpine
COPY package.json ./
RUN npm install
COPY . .

# ✅ Good
FROM node:22-alpine
RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser
COPY --chown=appuser:appuser package.json ./
RUN npm install
COPY --chown=appuser:appuser . .
```

### 3. Hardcoding Configuration

**Problem**: Need different images for different environments.

```dockerfile
# ❌ Bad
ENV DATABASE_URL=postgresql://localhost:5432/prod

# ✅ Good - use runtime configuration
ENV DATABASE_URL=${DATABASE_URL}
```

### 4. Large Build Context

**Problem**: Slow builds, high memory usage.

```bash
# ❌ Bad - sends entire repo
docker build -t app:latest .

# ✅ Good - use .dockerignore
# Create comprehensive .dockerignore file
```

### 5. Not Using .dockerignore

**Problem**: Sending unnecessary files to Docker daemon.

```bash
# Always create .dockerignore
cat > .dockerignore << EOF
node_modules
dist
.git
.env
EOF
```

### 6. Building Inside Container

**Problem**: Loses build cache, slower builds.

```dockerfile
# ❌ Bad
RUN git clone https://github.com/... && \
    cd repo && \
    npm install && \
    npm run build

# ✅ Good - build on host, copy to container
COPY --from=builder /app/dist ./dist
```

### 7. Ignoring Layer Cache

**Problem**: Rebuilding everything on each change.

```dockerfile
# ❌ Bad - invalidates cache on any file change
COPY . .
RUN npm install

# ✅ Good - cache dependencies separately
COPY package*.json ./
RUN npm install
COPY . .
```

## Maintenance Guidelines

### 1. Regular Updates

- Update base images monthly
- Update dependencies weekly
- Scan for vulnerabilities daily (in CI/CD)

### 2. Version Pinning

```dockerfile
# Pin all versions
FROM node:22.11.0-alpine3.19
RUN npm install -g pnpm@10.20.0
RUN apk add --no-cache python3=3.11.6-r0
```

### 3. Documentation

- Document all ENV variables
- Explain each stage in multi-stage builds
- Add comments for non-obvious optimizations

### 4. Testing

```bash
# Test build
docker build -f Dockerfile.railway -t test:local .

# Test run
docker run --rm test:local

# Test health check
docker inspect --format='{{.State.Health.Status}}' test:local

# Test as non-root
docker run --rm test:local whoami
```

## Checklist

Before deploying a new Dockerfile:

- [ ] Uses BuildKit syntax (`# syntax=docker/dockerfile:1.4`)
- [ ] Alpine base image
- [ ] Multi-stage build
- [ ] Cache mounts for dependencies
- [ ] Production dependencies only in final stage
- [ ] Runs as non-root user
- [ ] Health check configured
- [ ] Graceful shutdown handling
- [ ] Comprehensive .dockerignore
- [ ] Labels for metadata
- [ ] Specific version tags
- [ ] Security scan passed
- [ ] Build time < 10 minutes
- [ ] Image size < 500MB
- [ ] Tested locally
- [ ] Documentation updated

## Resources

- [Docker Official Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Alpine Linux](https://alpinelinux.org/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
