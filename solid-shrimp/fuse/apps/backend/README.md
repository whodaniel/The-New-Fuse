# Backend Service

This service provides the backend API for the application.

## Setup

Ensure dependencies are installed:

```bash
pnpm install
```

## Building

The backend depends on several shared packages (`@the-new-fuse/types`, `@the-new-fuse/core`, etc.). These must be built before the backend can run in production mode.

```bash
pnpm build
```

## Running

Development:
```bash
pnpm dev
```

Production:
```bash
pnpm start:prod
```

## Related Documentation

### Backend Development
- [API Examples](./API_EXAMPLES.md) - Comprehensive API usage examples
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md) - Backend performance guide
- [Performance Setup](./PERFORMANCE_SETUP.md) - Performance configuration
- [Caching Implementation](./CACHING_IMPLEMENTATION_SUMMARY.md) - Caching strategies
- [Cache Quick Start](./CACHE_QUICK_START.md) - Quick caching guide
- [WebSocket Integration](./WEBSOCKET_INTEGRATION_GUIDE.md) - Real-time communication
- [New Endpoints Summary](./NEW_ENDPOINTS_SUMMARY.md) - Recent API additions

### Modules
- [Agent Registry](./src/modules/agent-registry/README.md) - Agent management system
  - [API Documentation](./src/modules/agent-registry/API_DOCUMENTATION.md)
  - [Implementation Summary](./src/modules/agent-registry/IMPLEMENTATION_SUMMARY.md)
- [Chat Rooms](./src/modules/chat-rooms/README.md) - Chat room system
  - [Demo Scenarios](./src/modules/chat-rooms/DEMO_SCENARIOS.md)
- [MCP Module](./src/modules/mcp/README.md) - Model Context Protocol
  - [Quickstart](./src/modules/mcp/QUICKSTART.md)
  - [Agent Coordination Examples](./src/modules/mcp/AGENT_COORDINATION_EXAMPLES.md)
  - [MCP Testing](./src/modules/mcp/MCP-TESTING-SUMMARY.md)

### Services
- [Cache Service](./src/cache/README.md) - Caching implementation
- [Jobs Service](./src/jobs/README.md) - Background job processing
  - [Usage Examples](./src/jobs/USAGE_EXAMPLES.md)
- [Scripts](./src/scripts/README.md) - Utility scripts

### Architecture & Standards
- [Architecture Standards](../../docs/architecture/ARCHITECTURE_STANDARDS.md)
- [Monorepo Architecture](../../docs/architecture/MONOREPO_ARCHITECTURE.md)
- [API Usage Guide](../../docs/API_USAGE_GUIDE.md)

### Testing
- [Load Testing](./tests/load/README.md) - Performance load tests
- [Testing Setup](../../docs/testing/TESTING_SETUP_COMPLETE.md)
- [E2E Testing](../../docs/testing/E2E_TEST_SUMMARY.md)

### Deployment
- [Deployment Guide](../../docs/deployment/DEPLOYMENT_GUIDE.md)
- [Docker Setup](../../docs/guides/docker-setup.md)
- [Production Readiness](../../PRODUCTION_READINESS.md)

### Security
- [Security Best Practices](../../docs/security/SECURITY_BEST_PRACTICES.md)
- [Developer Security Checklist](../../docs/security/DEVELOPER_SECURITY_CHECKLIST.md)

### Related Services
- [Frontend Application](../frontend/README.md)
- [API Server](../api/README.md)
- [GraphQL API](../api/src/graphql/README.md)

### Getting Started
- [Project README](../../README.md)
- [Quick Start Guide](../../QUICK_START_GUIDE.md)
- [Documentation Map](../../DOCUMENTATION_MAP.md)
