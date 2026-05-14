# CloudRuntime Deployment Guide for The New Fuse SAAS

This guide provides step-by-step instructions for deploying all SAAS-related packages to CloudRuntime.

## Prerequisites

1. **CloudRuntime CLI**: Install the CloudRuntime CLI
   ```bash
   npm install -g @cloud_runtime/cli
   ```

2. **CloudRuntime Account**: Create an account at [cloud_runtime.app](https://cloud_runtime.app)

3. **Login**: Authenticate with CloudRuntime
   ```bash
   cloud_runtime login
   ```

## Services Overview

The following SAAS services will be deployed to CloudRuntime:

### Core API Services
- **API Server** (`apps/api`) - Main API service (Port: 3000)
- **Backend** (`apps/backend`) - Backend services (Port: 3001)
- **API Gateway** (`apps/api-gateway`) - API Gateway (Port: 3002)

### Frontend Applications
- **Frontend** (`apps/frontend`) - Main frontend application (Port: 3003)

### Communication Services
- **Relay Server** (`apps/relay-server`) - Relay communication service (Port: 3004)
- **Browser Hub** (`apps/browser-hub`) - Browser management service (Port: 3005)
- **MCP Servers** (`apps/mcp-servers`) - Model Context Protocol servers (Port: 3006)

## Deployment Methods

### Method 1: Automated Deployment Script

Use the provided deployment script for quick deployment:

```bash
./cloud_runtime-deploy.sh
```

### Method 2: Manual Deployment

Deploy each service individually:

```bash
# Deploy API Server
cd apps/api
cloud_runtime up --detach

# Deploy Backend
cd ../backend
cloud_runtime up --detach

# Deploy API Gateway
cd ../api-gateway
cloud_runtime up --detach

# Deploy Frontend
cd ../frontend
cloud_runtime up --detach

# Deploy Relay Server
cd ../relay-server
cloud_runtime up --detach

# Deploy Browser Hub
cd ../browser-hub
cloud_runtime up --detach

# Deploy MCP Servers
cd ../mcp-servers
cloud_runtime up --detach
```

## Configuration Files

Each service includes:
- `cloud_runtime.toml` - CloudRuntime deployment configuration
- `nixpacks.toml` - Build configuration using Nixpacks

### CloudRuntime Configuration Structure

```toml
[build]
builder = "nixpacks"
nixpacksConfigPath = "nixpacks.toml"
buildCommand = "cd apps/[service] && pnpm install --frozen-lockfile && pnpm run build"

[deploy]
startCommand = "cd apps/[service] && pnpm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[variables]
NODE_ENV = "production"
PORT = "[service-port]"
```

## Environment Variables

### Required Environment Variables

Copy `.env.example` to `.env` and configure the following:

#### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MONGODB_URI` - MongoDB connection string (if used)

#### Service URLs
- `API_BASE_URL` - API service URL
- `BACKEND_URL` - Backend service URL
- `FRONTEND_URL` - Frontend service URL
- `RELAY_SERVER_URL` - Relay server URL
- `BROWSER_HUB_URL` - Browser hub URL
- `MCP_SERVERS_URL` - MCP servers URL

#### Authentication & Security
- `JWT_SECRET` - JWT signing secret
- `API_KEY` - API authentication key
- `INTERNAL_API_KEY` - Internal service API key

#### External Services
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `DRIZZLE_ACCELERATE_API_KEY` - Drizzle Accelerate API key

### Setting Environment Variables in CloudRuntime

1. **Via CloudRuntime Dashboard**:
   - Go to your project dashboard
   - Select the service
   - Navigate to "Variables" tab
   - Add environment variables

2. **Via CloudRuntime CLI**:
   ```bash
   cloud_runtime variables set DATABASE_URL="your-database-url"
   cloud_runtime variables set JWT_SECRET="your-jwt-secret"
   ```

## Database Setup

### PostgreSQL Database

1. **Add PostgreSQL Plugin**:
   ```bash
   cloud_runtime add postgresql
   ```

2. **Get Database URL**:
   ```bash
   cloud_runtime variables get DATABASE_URL
   ```

### Redis Cache

1. **Add Redis Plugin**:
   ```bash
   cloud_runtime add redis
   ```

2. **Get Redis URL**:
   ```bash
   cloud_runtime variables get REDIS_URL
   ```

## Health Checks

Each service includes health check endpoints:
- API services: `/health`
- Frontend: `/` (root path)

Health checks are configured with:
- Timeout: 300 seconds
- Restart policy: On failure
- Max retries: 10

## Monitoring & Logging

### View Logs
```bash
# View logs for a specific service
cloud_runtime logs

# Follow logs in real-time
cloud_runtime logs --follow
```

### Service Status
```bash
# Check service status
cloud_runtime status
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check `pnpm install` dependencies
   - Verify Node.js version (20.x required)
   - Check build scripts in `package.json`

2. **Environment Variable Issues**:
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify database connections

3. **Port Conflicts**:
   - CloudRuntime automatically assigns ports
   - Use `PORT` environment variable in your app
   - Don't hardcode port numbers

### Debug Commands

```bash
# Check environment variables
cloud_runtime variables

# View service information
cloud_runtime service

# Check build logs
cloud_runtime logs --build

# Restart service
cloud_runtime restart
```

## Post-Deployment

### Verify Deployments

1. Check all services are running:
   ```bash
   cloud_runtime status
   ```

2. Test health endpoints:
   - API: `https://your-api-service.thenewfuse.com/health`
   - Backend: `https://your-backend-service.thenewfuse.com/health`
   - Frontend: `https://your-frontend-service.thenewfuse.com/`

3. Monitor logs for errors:
   ```bash
   cloud_runtime logs --follow
   ```

### Domain Configuration

1. **Custom Domains**:
   - Go to CloudRuntime dashboard
   - Select service
   - Navigate to "Settings" > "Domains"
   - Add custom domain

2. **SSL Certificates**:
   - CloudRuntime automatically provides SSL certificates
   - No additional configuration required

## Scaling & Performance

### Horizontal Scaling
- CloudRuntime supports automatic scaling
- Configure in service settings
- Monitor resource usage

### Resource Limits
- Set appropriate CPU/memory limits
- Monitor performance metrics
- Adjust based on usage patterns

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to repository
   - Use CloudRuntime's secure variable storage
   - Rotate secrets regularly

2. **Network Security**:
   - Configure CORS properly
   - Use HTTPS for all communications
   - Implement rate limiting

3. **Database Security**:
   - Use connection pooling
   - Enable SSL for database connections
   - Regular security updates

## Support & Resources

- [CloudRuntime Documentation](https://docs.thenewfuse.com/)
- [CloudRuntime Discord Community](https://discord.gg/cloud_runtime)
- [CloudRuntime Status Page](https://status.thenewfuse.com/)

## Deployment Checklist

- [ ] CloudRuntime CLI installed and authenticated
- [ ] All environment variables configured
- [ ] Database services added (PostgreSQL, Redis)
- [ ] All services deployed successfully
- [ ] Health checks passing
- [ ] Logs reviewed for errors
- [ ] Custom domains configured (if needed)
- [ ] SSL certificates verified
- [ ] Performance monitoring set up