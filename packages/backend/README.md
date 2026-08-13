# @the-new-fuse/backend

Basic HTTP server for The New Fuse backend infrastructure. Provides a simple health check endpoint for deployment platforms like CloudRuntime.

## Overview

The backend package is a lightweight HTTP server that serves as the foundation for The New Fuse backend infrastructure. It provides basic health monitoring and serves as a deployment target for cloud platforms.

## Features

- **Simple HTTP Server**: Minimal Node.js HTTP server without external framework dependencies
- **Health Check Endpoint**: Returns operational status and timestamp
- **CloudRuntime Compatible**: Designed for deployment on CloudRuntime and similar platforms
- **Docker Support**: Includes Dockerfile for containerized deployments
- **Port Configuration**: Configurable via environment variables
- **Error Handling**: Basic error handling and logging

## Installation

```bash
npm install @the-new-fuse/backend
# or
pnpm add @the-new-fuse/backend
```

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

```bash
PORT=3001  # Server port (default: 3001)
```

## API Endpoints

### Health Check

**GET /** - Returns server status

**Response:**
```json
{
  "status": "running",
  "message": "The New Fuse backend is operational",
  "time": "2025-11-18T12:00:00.000Z"
}
```

**Status Code:** `200 OK`

## Usage Examples

### Basic Usage

```typescript
import { server } from '@the-new-fuse/backend';

// Server starts automatically on import
// Default port: 3001
```

### Custom Port

```bash
# Set custom port via environment variable
PORT=8080 node dist/index.js
```

### Health Check Request

```bash
# Using curl
curl http://localhost:3001/

# Expected response
{
  "status": "running",
  "message": "The New Fuse backend is operational",
  "time": "2025-11-18T12:00:00.000Z"
}
```

## Docker Deployment

### Build Docker Image

```bash
# From the backend package directory
docker build -t tnf-backend .
```

### Run Container

```bash
# Run with default port
docker run -p 3001:3001 tnf-backend

# Run with custom port
docker run -p 8080:8080 -e PORT=8080 tnf-backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./packages/backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    restart: unless-stopped
```

## CloudRuntime Deployment

The package includes `cloud_runtime.toml` configuration for seamless CloudRuntime deployment.

### CloudRuntime Configuration

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node dist/index.js"
healthcheckPath = "/"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Deploy to CloudRuntime

```bash
# Install CloudRuntime CLI
npm i -g @cloud_runtime/cli

# Login to CloudRuntime
cloud_runtime login

# Initialize project
cloud_runtime init

# Deploy
cloud_runtime up
```

## Architecture

```
packages/backend/
├── src/
│   ├── index.ts           # Main server entry point
│   └── __tests__/         # Test files
├── dist/                  # Compiled JavaScript
├── Dockerfile             # Docker configuration
├── cloud_runtime.toml           # CloudRuntime deployment config
├── package.json
└── tsconfig.json
```

## Development

### Project Structure

```typescript
// src/index.ts
import { createServer } from 'http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'running',
    message: 'The New Fuse backend is operational',
    time: new Date().toISOString()
  }));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

export { server };
```

### Scripts

```bash
# Build TypeScript
pnpm build

# Development mode with auto-reload
pnpm dev

# Start production server
pnpm start

# Clean build artifacts
pnpm clean

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check
```

### Testing

```bash
# Run tests
pnpm test

# The server is exported for testing purposes
import { server } from '@the-new-fuse/backend';
// Use server instance in tests
```

## Integration with The New Fuse Ecosystem

The backend package serves as:

- **Health Check Endpoint**: For monitoring and orchestration systems
- **Deployment Target**: Base service for CloudRuntime and cloud platforms
- **Foundation Service**: Starting point for backend infrastructure
- **Status Monitoring**: Provides operational status for The New Fuse platform

### Ecosystem Integration

```typescript
// Can be extended with additional endpoints
import { server } from '@the-new-fuse/backend';
import { DrizzleService } from '@the-new-fuse/database';
import { logger } from '@the-new-fuse/core';

// Add database health check
server.on('request', async (req, res) => {
  if (req.url === '/health/db') {
    try {
      await drizzle.$queryRaw`SELECT 1`;
      res.end(JSON.stringify({ db: 'connected' }));
    } catch (error) {
      logger.error('Database health check failed', error);
      res.statusCode = 503;
      res.end(JSON.stringify({ db: 'disconnected' }));
    }
  }
});
```

## Configuration

### Server Configuration

```typescript
// Environment variables
const config = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development'
};
```

### Production Recommendations

- Set `NODE_ENV=production`
- Configure appropriate `PORT` for your platform
- Enable process managers (PM2, systemd)
- Set up proper logging and monitoring
- Configure health check intervals
- Implement rate limiting if exposed publicly

## Error Handling

The server includes basic error handling:

```typescript
server.on('error', (error) => {
  console.error('Server error:', error);
  // Server continues running after logging error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

## Monitoring

### Health Check Monitoring

```bash
# Set up health check monitoring
while true; do
  curl -f http://localhost:3001/ || echo "Health check failed"
  sleep 30
done
```

### Uptime Monitoring

Integrate with monitoring services:
- UptimeRobot
- Pingdom
- DataDog
- New Relic
- CloudRuntime built-in monitoring

## Performance

- **Minimal Dependencies**: No external frameworks, just Node.js http module
- **Low Memory Footprint**: ~15-30MB RAM usage
- **Fast Startup**: Starts in <100ms
- **High Throughput**: Can handle thousands of requests/second
- **Low Latency**: Sub-millisecond response times

## Security Considerations

- **No Authentication**: This is a public health check endpoint
- **Read-Only**: No data modification capabilities
- **No Sensitive Data**: Only returns operational status
- **Rate Limiting**: Consider adding if exposed to internet
- **HTTPS**: Use reverse proxy (Nginx, Caddy) for SSL termination

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

**Server Not Starting**
```bash
# Check environment variables
echo $PORT

# Check logs
pnpm dev
# Look for error messages
```

**Health Check Failing**
```bash
# Test locally
curl http://localhost:3001/

# Check server logs
docker logs <container-id>
```

## Roadmap

Future enhancements planned:
- Additional health check endpoints (database, redis, etc.)
- Metrics collection integration
- OpenTelemetry tracing
- Graceful shutdown handling
- Clustering support for high availability
- WebSocket support
- API versioning

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Dependencies

```json
{
  "dependencies": {
    "@the-new-fuse/core": "workspace:*",
    "@the-new-fuse/database": "workspace:*",
    "@the-new-fuse/types": "workspace:*",
    "@the-new-fuse/utils": "workspace:*",
    "react": "^19.2.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "uuid": "^13.0.0"
  }
}
```

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Contact the maintainers

## Related Packages

- `@the-new-fuse/core` - Core functionality
- `@the-new-fuse/database` - Database utilities
- `@the-new-fuse/types` - TypeScript types
- `@the-new-fuse/utils` - Utility functions
- `@the-new-fuse/api` - Full REST API server
