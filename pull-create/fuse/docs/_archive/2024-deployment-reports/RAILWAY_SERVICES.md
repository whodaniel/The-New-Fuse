# Railway Deployment Services

## Services to Deploy

### Apps (Frontend & API Services)
1. **apps/api** - API Server (Port: 3000)
2. **apps/backend** - Backend Services (Port: 3001)
3. **apps/api-gateway** - API Gateway (Port: 3002)
4. **apps/frontend** - Frontend Application (Port: 3003)

### Packages (Core Services)
5. **packages/api** - API Package Service
6. **packages/backend** - Backend Package Service
7. **packages/relay-core** - Relay Core Service
8. **packages/core-vector-db** - Vector Database Service

## Services to EXCLUDE (Desktop/Browser Only)
- apps/electron-desktop (SkIDEancer IDE)
- apps/browser-hub (Electron app)
- apps/vscode-extension
- apps/extension (Chrome extension)
- apps/client (Chrome extension)
- apps/relay-server (no package.json - standalone)
- apps/mcp-servers (no package.json - standalone)

## Deployment Priority
Priority 1 (Core Infrastructure):
- packages/core-vector-db
- packages/relay-core

Priority 2 (API Layer):
- apps/api
- apps/backend
- apps/api-gateway
- packages/api
- packages/backend

Priority 3 (Frontend):
- apps/frontend
