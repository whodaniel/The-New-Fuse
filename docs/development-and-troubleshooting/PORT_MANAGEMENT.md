# Port Management System

The New Fuse includes a comprehensive port management system to prevent conflicts and provide visibility into service port allocation.

## Quick Start

```bash
# Check current port status
tnf-ports status

# Start development with optimized ports
./dev-with-port-management.sh

# Check for and resolve conflicts
tnf-ports conflicts --auto-resolve

# Check service health
tnf-ports health
```

## Features

- **Real-time conflict detection** and automatic resolution
- **Dynamic port allocation** with preferred/fallback ports
- **Health monitoring** for all registered services
- **Configuration auto-update** (vite.config.ts, package.json, docker-compose.yml)
- **VS Code integration** with updated launch configurations
- **CLI tools** for development workflow

## Available Commands

- `tnf-ports status` - Show current port allocation
- `tnf-ports conflicts` - Detect and resolve conflicts
- `tnf-ports health` - Check service health status
- `tnf-ports register` - Register a new service port
- `tnf-ports dev --optimize` - Start with port optimization

## Integration

The port management system is integrated into:
- Frontend development server (Vite)
- API development scripts
- Docker Compose configurations
- VS Code launch configurations
- Environment files

## Default Port Allocation

- **Frontend**: 3000 (dev), 3000 (prod)
- **API Server**: 3001 (dev), 3001 (prod)
- **Backend**: 3004 (dev)
- **Message Broker**: 3002 (prod only)

Ports are automatically assigned if conflicts are detected.
