# Installation Guide

## Prerequisites

Ensure your system meets these requirements:

- Node.js 18+
- Yarn 4.6.0+
- Docker 24.0+
- Docker Compose 2.20+
- PostgreSQL 17.0+
- Redis 7+
- Git

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/organization/the-new-fuse.git
cd the-new-fuse
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env

# Configure environment variables
# Edit .env files with your settings
```

### 3. Install Dependencies

```bash
# Install all dependencies
yarn install

# Generate Prisma client
yarn workspace @the-new-fuse/database generate
```

### 4. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
yarn workspace @the-new-fuse/database migrate:deploy

# Seed database (optional)
yarn workspace @the-new-fuse/database seed
```

### 5. Start Services

```bash
# Development mode
yarn dev

# Production mode
yarn build
yarn start
```

## Docker Installation

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container Setup

```bash
# Build API
docker build -t fuse-api ./apps/api

# Build Frontend
docker build -t fuse-frontend ./apps/frontend

# Run containers
docker run -d --name fuse-api fuse-api
docker run -d --name fuse-frontend fuse-frontend
```

## Verification

### Health Checks

```bash
# API health check
curl http://localhost:3000/health

# Frontend health check
curl http://localhost:8000/health
```

### Test Installation

```bash
# Run all tests
yarn test

# Run specific tests
yarn test:api
yarn test:frontend
```

## Troubleshooting

### Common Issues

1. Database Connection
```bash
# Check database logs
docker-compose logs postgres

# Verify connection
psql -h localhost -U postgres -d fuse
```

2. Redis Connection
```bash
# Check Redis logs
docker-compose logs redis

# Verify connection
redis-cli ping
```

3. Build Issues
```bash
# Clean and rebuild
yarn clean
yarn install
yarn build
```