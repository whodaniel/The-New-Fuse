# Port Management System Documentation

## Overview

The New Fuse includes a comprehensive port management system designed to eliminate port conflicts, provide visibility into service allocation, and automate configuration management.

## Quick Start

```bash
# Check current port status
tnf-ports status

# Check for conflicts
tnf-ports conflicts

# Check service health
tnf-ports health

# Start development with optimized setup
./dev-with-port-management.sh
```

## System Architecture

### Core Components

1. **Port Registry Service** (`packages/port-management/`)
   - Tracks all service ports across environments
   - Manages port allocation and conflict detection
   - Provides real-time monitoring capabilities

2. **Frontend Dashboard** (`apps/frontend/src/components/PortManagement/`)
   - Visual port allocation map
   - Conflict resolution interface
   - Service health monitoring
   - Real-time updates via WebSocket

3. **CLI Tools** (`tools/port-manager/`)
   - `tnf-ports status` - Show port allocation
   - `tnf-ports conflicts` - Detect and resolve conflicts
   - `tnf-ports health` - Monitor service health
   - `tnf-ports dev` - Optimize development environment

4. **Configuration Auto-Update**
   - Automatically updates Vite configurations
   - Modifies package.json scripts
   - Updates Docker Compose port mappings
   - Synchronizes environment files

## Default Port Allocation

| Service | Development | Production | Purpose |
|---------|------------|------------|----------|
| Frontend | 3000 | 3000 | React/Vite application |
| API Server | 3001 | 3001 | NestJS API endpoints |
| Backend | 3004 | - | Additional backend services |
| Message Broker | - | 3002 | WebSocket/messaging |
| Database | 5432 | 5432 | PostgreSQL |
| Redis | 6379 | 6379 | Caching/sessions |

## Features

### Automatic Conflict Resolution
- **Smart Detection**: Identifies port conflicts across all services
- **Intelligent Suggestions**: Provides optimal resolution strategies
- **One-Click Resolution**: Apply suggested fixes instantly
- **Priority-Based**: Frontend > API > Backend service prioritization

### Real-Time Monitoring
- **Health Checks**: Continuous monitoring of service endpoints
- **Status Updates**: Live updates via WebSocket connections
- **Visual Dashboard**: Interactive port allocation map
- **Alerting**: Immediate notification of issues

### Configuration Management
- **Dynamic Updates**: Configuration files update automatically
- **Backup & Restore**: Automatic backup before changes
- **Validation**: Ensures configuration integrity
- **Rollback**: Easy restoration if issues occur

### Development Workflow Integration
- **VS Code Integration**: Updated launch configurations
- **Docker Support**: Automatic Docker Compose updates
- **Environment Sync**: Consistent port allocation across environments
- **CLI Automation**: Scriptable port management operations

## CLI Reference

### Status Commands
```bash
# Show all ports
tnf-ports status

# Filter by environment
tnf-ports status -e development

# Filter by service
tnf-ports status -s frontend
```

### Conflict Management
```bash
# Check for conflicts
tnf-ports conflicts

# Auto-resolve all conflicts
tnf-ports conflicts --auto-resolve
```

### Health Monitoring
```bash
# Check all services
tnf-ports health

# Check specific port
tnf-ports health -p 3000

# Check specific service
tnf-ports health -s api
```

### Development Environment
```bash
# Prepare optimized development environment
tnf-ports dev --optimize

# Start with conflict resolution
./dev-with-port-management.sh
```

## Integration Guide

### Frontend Integration

```typescript
// Import the port management hook
import { usePortRegistry } from '@/hooks/usePortRegistry';

function PortDashboard() {
  const { ports, conflicts, reassignPort } = usePortRegistry();
  
  return (
    <div>
      {/* Port management UI */}
    </div>
  );
}
```

### Backend Integration

```typescript
// Import the port registry service
import { PortRegistryService } from '@the-new-fuse/port-management';

const portRegistry = new PortRegistryService();

// Register a service port
await portRegistry.registerPort({
  serviceName: 'my-service',
  serviceType: 'api',
  environment: 'development',
  port: 3005
});
```

### Configuration Files

The system automatically updates:

- `apps/frontend/vite.config.ts` - Vite development server port
- `apps/frontend/package.json` - Dev and preview script ports
- `docker-compose.yml` - Container port mappings
- `.env.development` - Environment-specific port variables
- `.vscode/launch.json` - VS Code debug configurations

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Use port management to find alternative
   tnf-ports conflicts --auto-resolve
   ```

2. **Service Not Responding**
   ```bash
   # Check service health
   tnf-ports health -s frontend
   
   # Verify port allocation
   tnf-ports status
   ```

3. **Configuration Out of Sync**
   ```bash
   # Re-register service with correct port
   tnf-ports register -s frontend -e development -p 3000
   ```

### Reset Port Configuration

```bash
# Stop all services
pkill -f "node.*3000\|node.*3001\|vite"

# Clear port registry (if needed)
rm -rf node_modules/.port-registry

# Re-register services
tnf-ports register -s frontend -e development -p 3000 -t frontend
tnf-ports register -s api -e development -p 3001 -t api
```

## Advanced Features

### Custom Port Ranges
Configure preferred port ranges for different service types:

```javascript
// Port configuration
const serviceConfig = {
  frontend: { range: [3000, 3099], preferred: 3000 },
  api: { range: [3100, 3199], preferred: 3101 },
  backend: { range: [3200, 3299], preferred: 3201 }
};
```

### Health Check Configuration
Set up custom health check endpoints:

```javascript
// Health check configuration
const healthConfig = {
  path: '/health',
  interval: 30000,
  timeout: 5000,
  expectedStatus: 200
};
```

### Environment-Specific Settings
Different port allocation per environment:

```javascript
// Environment-specific ports
const envPorts = {
  development: { frontend: 3000, api: 3001 },
  staging: { frontend: 4000, api: 4001 },
  production: { frontend: 80, api: 443 }
};
```

## Performance Considerations

- **Monitoring Frequency**: Default 30-second health checks
- **Conflict Detection**: Real-time during service startup
- **Configuration Updates**: Atomic file operations with backup
- **Memory Usage**: Minimal overhead with efficient registry storage

## Security Notes

- **Local Development**: Port management operates in development context
- **Production Deployment**: Extended for container orchestration
- **Access Control**: Future integration with service authentication
- **Audit Trail**: All port changes logged for review

## Future Enhancements

1. **AI-Powered Optimization**: Machine learning for optimal port allocation
2. **Kubernetes Integration**: Automatic service discovery and port management
3. **Load Balancer Integration**: Dynamic port configuration for scaling
4. **Performance Analytics**: Port usage patterns and optimization suggestions
5. **Team Collaboration**: Shared port allocation across development teams

## Support

For issues or questions about the port management system:

1. Check the troubleshooting section above
2. Run `tnf-ports --help` for CLI assistance
3. Review logs in `.port-management-backups/`
4. Consult the development team documentation

---

*This documentation is part of The New Fuse platform and is automatically updated as features evolve.*
