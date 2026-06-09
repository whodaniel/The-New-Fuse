# Installation Guide

## Prerequisites

Ensure your system meets these requirements:

- Node.js matching `.nvmrc`
- pnpm 10+
- Docker 24.0+
- Docker Compose 2.20+
- PostgreSQL 17.0+
- Redis 7+
- Git

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/whodaniel/fuse.git
cd fuse
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env
touch .tnf.local.env

# Configure environment variables
# Edit .env files with shared settings.
# Edit .tnf.local.env with machine-specific paths, relay URLs, and port allowances.
```

TNF CLI helpers load `.env`, `.env.local`, and `.tnf.local.env` from the repo
root. Exported shell variables win over file values. See
`docs/reference/local-runtime-profile.md`.

### 3. Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### 4. Database Setup

```bash
# Start PostgreSQL
docker compose -f packages/sync-core/docker-compose.yml up -d postgres redis

# Run the API/database commands required by your selected workspace.
# Check the target package README before running migrations against shared data.
```

### 5. Start Services

```bash
# Development mode
./tnf ports preflight
pnpm run dev

# Production mode
pnpm run build
pnpm run start
```

## Docker Installation

### Using Docker Compose

```bash
# Start the sync-core local support services
docker compose -f packages/sync-core/docker-compose.yml up -d

# View logs
docker compose -f packages/sync-core/docker-compose.yml logs -f

# Stop services
docker compose -f packages/sync-core/docker-compose.yml down
```

### Individual Container Setup

```bash
# Build API image
docker build -t fuse-api -f Dockerfile.api .

# Run API image
docker run --rm -p 3000:3000 --env-file .env fuse-api
```

## Verification

### Health Checks

```bash
# API health check
curl http://localhost:3000/health

# Frontend development server
pnpm --filter @the-new-fuse/frontend-app run dev

# TNF port surface
./tnf ports status
./tnf ports preflight
```

### Test Installation

```bash
# Run all tests
pnpm test

# Run release readiness gates
pnpm run release:gate
pnpm run release:gate:strict
```

## Troubleshooting

### Common Issues

1. Database Connection
```bash
# Check database logs
docker compose -f packages/sync-core/docker-compose.yml logs postgres

# Verify connection
psql -h localhost -U postgres -d fuse
```

2. Redis Connection
```bash
# Check Redis logs
docker compose -f packages/sync-core/docker-compose.yml logs redis

# Verify connection
redis-cli ping
```

3. Build Issues
```bash
# Clean and rebuild
pnpm run build:cleanup
pnpm install
pnpm run build
```

4. Port Conflicts
```bash
# Inspect active listeners
./tnf ports status

# Non-destructive preflight
./tnf ports preflight

# Strict preflight for CI/release gates
./tnf ports preflight --strict

# Mark intentional local listeners as allowed
echo "TNF_PORTS_ALLOW_OCCUPIED=3005,6379" >> .tnf.local.env
```
