# Build and Deployment Pipeline for The New Fuse

This document outlines the enhanced build and deployment processes for The New Fuse project, focusing on port management, Docker integration, and production deployment.

## Port Configuration

### Development Environment
| Service | Port | Environment Variable |
|---------|------|---------------------|
| Frontend | 3000 | `PORT=3000` |
| API Server | 3003 | `PORT=3003` |
| Backend App | 3004 | `PORT=3004` |

### Docker/Production Environment
| Service | Port | Environment Variable |
|---------|------|---------------------|
| Frontend | 3000 | `PORT=3000` |
| API Server | 3003 | `PORT=3003` |
| Backend App | 3004 | `PORT=3004` |
| Redis | 6379 | N/A |
| PostgreSQL | 5432 | N/A |

## Build Commands

### Development Builds

```bash
# Run development environment with automatic port clearing
yarn dev

# Build local development version (includes automatic port clearing via prebuild)
yarn build
```

### Production Builds

```bash
# Build for production (optimized)
yarn build:production

# Full production build pipeline
bash ./scripts/production-build.sh
```

### Docker Builds

```bash
# Check Docker port availability
yarn check:docker-ports

# Build Docker images
yarn build:docker
```

### Testing Build Workflow

```bash
# Test the port management and build workflow
bash ./scripts/test-build-workflow.sh
```

## Port Management

### Scripts

1. **`kill-port-processes.js`** - Clears ports for development
   - Automatically runs before `yarn dev`
   - Automatically runs before `yarn build` via the `prebuild` script
   - Checks ports 3001-3004
   
2. **`check-docker-ports.js`** - Checks for Docker port conflicts
   - Runs before Docker builds
   - Checks for conflicts on ports 3000-3004, 5432, 6379
   - Interactive mode for port conflict resolution

### Usage in Build Process

1. **Development**: 
   - Ports are automatically cleared before starting services
   - Each service uses a defined port from environment variables

2. **Production**:
   - Build process checks for port conflicts
   - Docker containers use aligned port numbers in both environments
   - Health checks verify services are operational

## Docker Integration

### Docker Compose Files

1. **`compose.yaml`** - Development Docker Compose file
   - Updated to use consistent port mappings with local development

2. **`docker-compose.production.yml`** - Production Docker Compose file
   - Production-ready settings with healthchecks
   - Volume mounts for data persistence
   - NGINX proxy for frontend requests

### Docker Build Process

The Docker build process has been enhanced to:

1. Check Docker daemon is running
2. Verify required ports are available
3. Build optimized production images
4. Perform health checks on services
5. Support deployment tagging

## CI/CD Pipeline

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) has been updated to:

1. Run tests and linting
2. Build optimized production assets
3. Build and publish Docker images
4. Deploy to staging/production environments based on workflow triggers

## Production Deployment

A complete production deployment package includes:

1. **`scripts/production-build.sh`** - Full build script with:
   - Port clearing
   - Testing
   - Linting
   - Optimized builds
   - Docker image creation

2. **`docker-compose.production.yml`** - Production-ready Docker Compose with:
   - Volume persistence
   - Health checks
   - NGINX reverse proxy
   - Environment variable configuration

## Next Steps for Production Readiness

1. **Environment Configuration**
   - Implement secure environment variable management
   - Add support for .env.production files

2. **Database Migration**
   - Add automated database migration scripts
   - Include data backup and restore procedures

3. **Monitoring and Logging**
   - Integrate logging aggregation
   - Add performance monitoring
   - Set up alerting for service disruptions

4. **CD/CD Expansion**
   - Add automated deployment to cloud providers
   - Include infrastructure-as-code templates
   - Implement blue/green deployment strategies
