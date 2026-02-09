# Docker Setup and Configuration

## Overview
This document details the Docker configuration and setup for both development and production environments.

## Development Environment

### Dockerfile.dev
```dockerfile
FROM node:20-bullseye

# Development-specific configuration
- Hot-reloading enabled
- Source code mounted as volume
- Development dependencies included
- No build step required
```

### Development Workflow
1. Start all services:
   ```bash
   docker-compose up --build
   ```
2. Access services:
   - Main app: http://localhost:3000
   - Additional service: http://localhost:8000
   - PostgreSQL: localhost:5433
   - Redis: localhost:6379

## Production Environment

### Dockerfile
Multi-stage build process:

#### Stage 1: Builder
```dockerfile
FROM node:20-bullseye AS builder
- Full build environment
- All build dependencies
- TypeScript compilation
- Package optimization
```

#### Stage 2: Production
```dockerfile
FROM node:20-bullseye-slim
- Minimal runtime environment
- Only production dependencies
- Optimized for size and security
```

## Docker Compose Configuration

### Services
1. Node.js Application
   ```yaml
   app:
     build:
       context: .
       dockerfile: Dockerfile.dev  # or Dockerfile for production
     ports:
       - "3000:3000"
       - "8000:8000"
     volumes:  # Development only
       - .:/app
       - /app/node_modules
   ```

2. PostgreSQL Database
   ```yaml
   postgres:
     image: postgres:14
     ports:
       - "5433:5432"
     volumes:
       - postgres_data:/var/lib/postgresql/data
     healthcheck:
       test: ["CMD-SHELL", "pg_isready -U postgres"]
   ```

3. Redis Cache
   ```yaml
   redis:
     image: redis:7
     ports:
       - "6379:6379"
     volumes:
       - redis_data:/data
     healthcheck:
       test: ["CMD", "redis-cli", "ping"]
   ```

## Volume Management
- `postgres_data`: Persistent PostgreSQL data
- `redis_data`: Persistent Redis data
- Source code mount (development only)
- Node modules volume (development only)

## Health Checks
- PostgreSQL: Checks database availability
- Redis: Verifies cache service
- Ensures proper service startup order

## Common Docker Commands

### Development
```bash
# Start development environment
docker-compose up --build

# View logs
docker-compose logs -f app

# Rebuild specific service
docker-compose up --build app

# Stop all services
docker-compose down
```

### Container Management
```bash
# List containers
docker ps

# Shell access
docker exec -it fuse-app bash

# View logs
docker logs fuse-app -f
```

### Data Management
```bash
# Remove volumes
docker-compose down -v

# Prune unused volumes
docker volume prune

# Backup PostgreSQL data
docker exec fuse-postgres pg_dump -U postgres fuse > backup.sql
```
