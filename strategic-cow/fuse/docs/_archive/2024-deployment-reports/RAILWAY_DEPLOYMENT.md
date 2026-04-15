# Railway Deployment Guide for The New Fuse SAAS

This guide provides step-by-step instructions for deploying all SAAS-related packages to Railway.

## Prerequisites

1. **Railway CLI**: Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   ```

2. **Railway Account**: Create an account at [railway.app](https://railway.app)

3. **Login**: Authenticate with Railway
   ```bash
   railway login
   ```

## Services Overview

The following SAAS services will be deployed to Railway:

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
./railway-deploy.sh
```

### Method 2: Manual Deployment

Deploy each service individually:

```bash
# Deploy API Server
cd apps/api
railway up --detach

# Deploy Backend
cd ../backend
railway up --detach

# Deploy API Gateway
cd ../api-gateway
railway up --detach

# Deploy Frontend
cd ../frontend
railway up --detach

# Deploy Relay Server
cd ../relay-server
railway up --detach

# Deploy Browser Hub
cd ../browser-hub
railway up --detach

# Deploy MCP Servers
cd ../mcp-servers
railway up --detach
```

## Configuration Files

Each service includes:
- `railway.toml` - Railway deployment configuration
- `nixpacks.toml` - Build configuration using Nixpacks

### Railway Configuration Structure

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

### Setting Environment Variables in Railway

1. **Via Railway Dashboard**:
   - Go to your project dashboard
   - Select the service
   - Navigate to "Variables" tab
   - Add environment variables

2. **Via Railway CLI**:
   ```bash
   railway variables set DATABASE_URL="your-database-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   ```

## Database Setup

### PostgreSQL Database

1. **Add PostgreSQL Plugin**:
   ```bash
   railway add postgresql
   ```

2. **Get Database URL**:
   ```bash
   railway variables get DATABASE_URL
   ```

### Redis Cache

1. **Add Redis Plugin**:
   ```bash
   railway add redis
   ```

2. **Get Redis URL**:
   ```bash
   railway variables get REDIS_URL
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
railway logs

# Follow logs in real-time
railway logs --follow
```

### Service Status
```bash
# Check service status
railway status
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
   - Railway automatically assigns ports
   - Use `PORT` environment variable in your app
   - Don't hardcode port numbers

### Debug Commands

```bash
# Check environment variables
railway variables

# View service information
railway service

# Check build logs
railway logs --build

# Restart service
railway restart
```

## Post-Deployment

### Verify Deployments

1. Check all services are running:
   ```bash
   railway status
   ```

2. Test health endpoints:
   - API: `https://your-api-service.railway.app/health`
   - Backend: `https://your-backend-service.railway.app/health`
   - Frontend: `https://your-frontend-service.railway.app/`

3. Monitor logs for errors:
   ```bash
   railway logs --follow
   ```

### Domain Configuration

1. **Custom Domains**:
   - Go to Railway dashboard
   - Select service
   - Navigate to "Settings" > "Domains"
   - Add custom domain

2. **SSL Certificates**:
   - Railway automatically provides SSL certificates
   - No additional configuration required

## Scaling & Performance

### Horizontal Scaling
- Railway supports automatic scaling
- Configure in service settings
- Monitor resource usage

### Resource Limits
- Set appropriate CPU/memory limits
- Monitor performance metrics
- Adjust based on usage patterns

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to repository
   - Use Railway's secure variable storage
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

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app/)

## Deployment Checklist

- [ ] Railway CLI installed and authenticated
- [ ] All environment variables configured
- [ ] Database services added (PostgreSQL, Redis)
- [ ] All services deployed successfully
- [ ] Health checks passing
- [ ] Logs reviewed for errors
- [ ] Custom domains configured (if needed)
- [ ] SSL certificates verified
- [ ] Performance monitoring set up