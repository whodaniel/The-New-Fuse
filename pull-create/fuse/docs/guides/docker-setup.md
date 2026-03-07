# Docker Infrastructure Setup Guide

## Overview

The New Fuse uses Docker for production-ready database infrastructure including PostgreSQL and Redis. This provides reliable data persistence, caching, and scalability for production deployments.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend API   │    │  Browser Hub    │
│  localhost:3000 │    │  localhost:3004  │    │ localhost:8080  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Docker Services      │
                    ├─────────────┬─────────────┤
                    │ PostgreSQL  │   Redis     │
                    │ Port: 5433  │ Port: 6380  │
                    │ (Database)  │ (Cache)     │
                    └─────────────┴─────────────┘
```

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Bun package manager
- The New Fuse project cloned locally

### 1. Start Docker Services

```bash
# Start PostgreSQL and Redis
pnpm run docker:start

# Check service status
pnpm run docker:status

# Test connectivity
pnpm run docker:test
```

### 2. Start Applications

```bash
# Start frontend
pnpm run dev:frontend

# Start backend (with Docker database)
DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev \
REDIS_URL=redis://localhost:6380 \
pnpm run dev:backend

# Start Electron app
pnpm run dev:hub
```

## Docker Services

### PostgreSQL Database

- **Container**: `tnf-postgres-dev`
- **Image**: `postgres:14-alpine`
- **Port**: `5433` (external) → `5432` (internal)
- **Database**: `the_new_fuse_dev`
- **Username**: `newfuse`
- **Password**: `secretpass123`
- **Volume**: `postgres_dev_data` (persistent storage)

**Connection String:**
```
postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
```

### Redis Cache

- **Container**: `tnf-redis-dev`
- **Image**: `redis:6`
- **Port**: `6380` (external) → `6379` (internal)
- **Persistence**: Append-only file enabled
- **Volume**: `redis_dev_data` (persistent storage)

**Connection String:**
```
redis://localhost:6380
```

## Environment Configuration

### .env.docker

The project includes a `.env.docker` file with Docker-specific configuration:

```bash
# Database Configuration (Docker PostgreSQL)
DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
DB_HOST=localhost
DB_PORT=5433
DB_USER=newfuse
DB_PASSWORD=secretpass123
DB_NAME=the_new_fuse_dev

# Redis Configuration (Docker Redis)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_URL=redis://localhost:6380

# Application Configuration
NODE_ENV=development
PORT=3004
```

### Loading Environment

```bash
# Load Docker environment variables
export $(cat .env.docker | xargs)

# Or use the startup script
./scripts/start-with-docker.sh
```

## Available Commands

### Docker Management

```bash
# Start services
pnpm run docker:start

# Stop services
pnpm run docker:stop

# View service status
pnpm run docker:status

# View service logs
pnpm run docker:logs

# Test connectivity
pnpm run docker:test

# Start everything with Docker
pnpm run dev:with-docker
```

### Manual Docker Commands

```bash
# Start services
docker-compose -f docker-compose.dev-simple.yml up -d

# Stop services
docker-compose -f docker-compose.dev-simple.yml down

# View logs
docker-compose -f docker-compose.dev-simple.yml logs -f

# Connect to PostgreSQL
docker exec -it tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev

# Connect to Redis CLI
docker exec -it tnf-redis-dev redis-cli
```

## Service Monitoring

The backend API provides real-time monitoring of Docker services:

### Service Status API

```bash
curl http://localhost:3004/api/services/status
```

**Response:**
```json
[
  {
    "name": "PostgreSQL Database",
    "status": "running",
    "port": 5433,
    "type": "database",
    "health": "healthy"
  },
  {
    "name": "Redis Cache", 
    "status": "running",
    "port": 6380,
    "type": "cache",
    "health": "healthy"
  }
]
```

### System Metrics API

```bash
curl http://localhost:3004/api/system/metrics
```

## Development Workflows

### Option 1: Docker + Local Development

```bash
# 1. Start Docker infrastructure
pnpm run docker:start

# 2. Start development servers
pnpm run dev:frontend    # Frontend on 3000
pnpm run dev:backend     # Backend on 3004 (using Docker DB)
pnpm run dev:hub         # Electron app
```

### Option 2: All-in-Docker (Future)

```bash
# Full Docker development environment
pnpm run dev:with-docker
```

### Option 3: Local Only

```bash
# Traditional development without Docker
pnpm run dev
```

## Data Persistence

### PostgreSQL Data

- **Volume**: `postgres_dev_data`
- **Location**: Docker managed volume
- **Backup**: Use `pg_dump` via Docker exec

```bash
# Backup database
docker exec tnf-postgres-dev pg_dump -U newfuse -d the_new_fuse_dev > backup.sql

# Restore database
docker exec -i tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev < backup.sql
```

### Redis Data

- **Volume**: `redis_dev_data`
- **Persistence**: Append-only file (AOF)
- **Location**: Docker managed volume

```bash
# Save Redis snapshot
docker exec tnf-redis-dev redis-cli BGSAVE

# View Redis info
docker exec tnf-redis-dev redis-cli INFO
```

## Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Check what's using ports
lsof -i :5433
lsof -i :6380

# Update docker-compose.dev-simple.yml ports if needed
```

**2. Docker Not Running**
```bash
# Check Docker status
docker info

# Start Docker Desktop
open -a Docker
```

**3. Container Health Issues**
```bash
# Check container logs
docker logs tnf-postgres-dev
docker logs tnf-redis-dev

# Restart containers
pnpm run docker:stop
pnpm run docker:start
```

**4. Permission Issues**
```bash
# Fix Docker permissions (macOS)
sudo chown -R $(whoami) ~/.docker
```

### Health Checks

```bash
# Test PostgreSQL connection
docker exec tnf-postgres-dev pg_isready -U newfuse

# Test Redis connection  
docker exec tnf-redis-dev redis-cli ping

# Run comprehensive test
pnpm run docker:test
```

## Production Deployment

### Environment Variables

For production deployment, update environment variables:

```bash
# Production PostgreSQL
DATABASE_URL=postgresql://user:password@prod-host:5432/production_db

# Production Redis
REDIS_URL=redis://prod-redis-host:6379

# Security
JWT_SECRET=your-production-jwt-secret
```

### Docker Compose Production

Use `docker-compose.yml` for production deployment with:
- SSL/TLS encryption
- Resource limits
- Health checks
- Monitoring
- Backup strategies

### Scaling

Docker services can be scaled independently:

```bash
# Scale Redis for high availability
docker-compose up --scale redis=3

# Scale PostgreSQL with read replicas
# (requires additional configuration)
```

## Integration with Applications

### Backend Integration

The backend automatically detects and monitors Docker services:

```typescript
// System Controller detects Docker containers
private async checkDockerContainer(containerName: string): Promise<boolean> {
  // Returns true if container is running
}
```

### Frontend Integration

Frontend receives real-time service status:

```typescript
// Service status updates
const services = await fetch('/api/services/status').then(r => r.json());
```

### Electron Integration

Electron app connects to Docker services seamlessly:

```typescript
// Database connection in Electron
const connection = {
  host: 'localhost',
  port: 5433,
  database: 'the_new_fuse_dev'
};
```

## Next Steps

1. **Database Migrations**: Set up Drizzle migrations for schema management
2. **Redis Configuration**: Configure Redis for specific use cases (caching, sessions, queues)
3. **Monitoring**: Add Grafana/Prometheus for production monitoring
4. **Backup Strategy**: Implement automated backup workflows
5. **CI/CD Integration**: Add Docker builds to GitHub Actions

## Support

For Docker-related issues:
1. Check the troubleshooting section above
2. Review Docker container logs
3. Ensure Docker Desktop is running
4. Verify port availability
5. Test connectivity with `pnpm run docker:test`