# The New Fuse Monorepo Architecture

## Overview

The New Fuse is organized as a **pnpm workspace monorepo** with 54+ packages.
This document explains how the packages are structured and accessed.

## Architecture

The monorepo follows a **multi-tier architecture**:

```
┌─────────────────────────────────────────┐
│   USER-FACING APPLICATIONS (4)          │
│   ├─ apps/frontend (React SPA)          │
│   ├─ apps/backend (NestJS API)          │
│   ├─ apps/api (Secondary API)           │
│   └─ apps/api-gateway (Gateway)         │
└─────────────────────────────────────────┘
                  ↓ depends on
┌─────────────────────────────────────────┐
│   SHARED PACKAGES (50+)                  │
│   Internal workspace dependencies        │
└─────────────────────────────────────────┘
```

## How Users Access the System

### End Users

**End users DO NOT directly access the 54 packages.** They interact with the
deployed applications:

1. **Web Application** → `apps/frontend`
   - URL: `https://thenewfuse.com`
   - Tech: React 19 + Vite + Tailwind

2. **Backend API** → `apps/backend`
   - URL: `https://api.thenewfuse.com`
   - Tech: NestJS + PostgreSQL + Redis

3. **API Gateway** → `apps/api-gateway`
   - URL: `https://gateway.thenewfuse.com`
   - Tech: NestJS + WebSocket

4. **Secondary API** → `apps/api`
   - URL: `https://api2.thenewfuse.com` (or similar)
   - Tech: NestJS + TypeORM

### Developers

**Developers** use the packages as internal dependencies:

```typescript
// In apps/backend/src/some-file.ts
import { SomeUtility } from '@the-new-fuse/utils';
import { Agent } from '@the-new-fuse/types';
import { DatabaseService } from '@the-new-fuse/database';
```

## Package Categories

### Core Infrastructure (8 packages)

```
@the-new-fuse/core              - Core utilities and base classes
@the-new-fuse/types             - TypeScript type definitions
@the-new-fuse/utils             - Shared utilities
@the-new-fuse/database          - Drizzle client and schema
@the-new-fuse/shared            - Shared constants and configs
@the-new-fuse/security          - Security utilities
@the-new-fuse/api-types         - API DTOs and interfaces
@the-new-fuse/port-management   - Port allocation utilities
```

### Agent & Protocol (8 packages)

```
@the-new-fuse/agent             - Agent base classes
@the-new-fuse/a2a-core          - Agent-to-Agent communication
@the-new-fuse/mcp-core          - Model Context Protocol
@the-new-fuse/relay-core        - Message relay system
@the-new-fuse/api-client        - API client library
@the-new-fuse/contracts         - Smart contracts (if applicable)
@the-new-fuse/integrations      - External integrations
@the-new-fuse/extension-system  - Plugin architecture
```

### UI & Components (6 packages)

```
@the-new-fuse/ui-consolidated   - Shared React components
@the-new-fuse/layout            - Layout components
@the-new-fuse/a2a-react         - React hooks for A2A
@the-new-fuse/fairtable-core    - Table library core
@the-new-fuse/fairtable-components - Table components
@the-new-fuse/fairtable-adapters - Table adapters
```

### Workflow & Features (8 packages)

```
@the-new-fuse/workflow-engine   - Workflow orchestration
@the-new-fuse/features          - Feature flags
@the-new-fuse/feature-tracker   - Feature analytics
@the-new-fuse/feature-suggestions - AI suggestions
@the-new-fuse/prompt-templating - Prompt templates
@the-new-fuse/hooks             - React hooks library
@the-new-fuse/web-scraping      - Web scraping utilities
@the-new-fuse/sync-core         - Data synchronization
```

### Infrastructure & DevOps (10 packages)

```
@the-new-fuse/infrastructure    - Infrastructure as code
@the-new-fuse/deployment-core   - Deployment utilities
@the-new-fuse/monitoring        - Monitoring and metrics
@the-new-fuse/build-optimization - Build tools
@the-new-fuse/testing           - Testing utilities
@the-new-fuse/test-utils        - Test helpers
@the-new-fuse/integration-tests - Integration test suite
@the-new-fuse/eslint-config-custom - ESLint config
@the-new-fuse/proto-definitions - Protocol buffers
@the-new-fuse/ap2-protocol      - AP2 protocol
```

### New Packages (Added This Session) (5 packages)

```
@the-new-fuse/websocket-infrastructure - WebSocket server/client
@the-new-fuse/core-error-handling     - Error handling system
@the-new-fuse/core-monitoring         - Performance monitoring
@the-new-fuse/core-vector-db          - Vector database client
@the-new-fuse/api-optimization        - API caching & rate limiting
```

### Backend Services (5 packages)

```
packages/backend/               - Backend utilities
packages/api/                   - API utilities
packages/fairtable-utils/       - Table utilities
packages/client/                - Client SDK
packages/common/                - Common utilities
```

### Tools (3 packages)

```
tools/codebase-analysis/        - Codebase analysis tools
tools/port-manager/             - Port management CLI
tools/vscode-lm-bridge/         - VS Code language model bridge
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                            │
├─────────────────────────────────────────────────────────┤
│  Railway (4 services)                                    │
│  ├─ Frontend   (apps/frontend)     → thenewfuse.com     │
│  ├─ Backend    (apps/backend)      → api.thenewfuse.com │
│  ├─ API        (apps/api)          → api2.thenewfuse.com│
│  └─ Gateway    (apps/api-gateway)  → gateway...com      │
└─────────────────────────────────────────────────────────┘
          ↑ builds include all needed packages
┌─────────────────────────────────────────────────────────┐
│              DOCKER BUILD PROCESS                        │
│  1. Install all workspace dependencies (pnpm install)    │
│  2. Build required packages (turbo build)                │
│  3. Bundle app with dependencies                         │
│  4. Deploy single container per app                      │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Development

```bash
# Developer clones repo
git clone https://github.com/whodaniel/fuse.git

# Install all dependencies (including internal packages)
pnpm install

# Work on a specific app
cd apps/backend
pnpm dev

# Or build entire monorepo
turbo build
```

### 2. Production Build

```dockerfile
# Dockerfile builds app with all dependencies
COPY packages ./packages          # Copy all internal packages
RUN pnpm install                  # Install + link workspaces
RUN turbo build --filter=backend  # Build backend + dependencies
# Result: Single container with compiled app
```

### 3. Runtime

```
User → https://api.thenewfuse.com
       ↓
  [apps/backend container]
       ↓ uses
  [@the-new-fuse/database]
  [@the-new-fuse/types]
  [@the-new-fuse/core]
  [... all needed packages bundled in container]
```

## Package Versioning

All packages use **workspace protocol**:

```json
{
  "dependencies": {
    "@the-new-fuse/types": "workspace:*"
  }
}
```

This means:

- All packages always use the latest local version
- No need to publish to npm for internal use
- Single source of truth in the monorepo

## Benefits of This Architecture

### For Developers

✅ **Code Reuse** - Write once, use everywhere ✅ **Type Safety** - Shared
TypeScript types across apps ✅ **Atomic Changes** - Update one package, all
apps get it ✅ **Fast Development** - Turborepo caching speeds up builds

### For End Users

✅ **Fast Apps** - Optimized bundles (90% size reduction) ✅ **Consistent UX** -
Shared components ensure consistency ✅ **Reliable** - Shared error handling and
monitoring ✅ **Secure** - Centralized security utilities

## Access Summary

| Audience       | Access Method     | Entry Points     |
| -------------- | ----------------- | ---------------- |
| **End Users**  | Web Browser / API | 4 deployed apps  |
| **Developers** | Local Development | All 54 packages  |
| **CI/CD**      | Automated Builds  | Turbo pipeline   |
| **Production** | Docker Containers | 4 bundled images |

## Key Insight

**The 54 packages are NOT standalone products.** They are **building blocks**
that compose into the 4 user-facing applications. Think of them like:

- **Lego Bricks** (packages) → assemble into **Lego Models** (apps)
- **Car Parts** (packages) → assemble into **Cars** (apps)
- **React Components** (packages) → assemble into **Websites** (apps)

Users drive the cars, not the individual parts. Users use the apps, not the
individual packages.

---

## Related Documentation

### Architecture & Standards

- [Architecture Standards](./ARCHITECTURE_STANDARDS.md) - Coding standards and
  templates
- [Architecture Analysis](./ARCHITECTURE_ANALYSIS_SUMMARY.md) - System
  architecture analysis
- [Monorepo Audit](./MONOREPO-AUDIT-INDEX.md) - Comprehensive monorepo audit
- [Architectural Consistency](./ARCHITECTURAL_CONSISTENCY_REPORT.md) -
  Consistency analysis

### Development & Build

- [README.md](../../README.md) - Project overview
- [Build Guide](../development/BUILD_GUIDE.md) - Build system comprehensive
  guide
- [Build System](../development/BUILD_SYSTEM.md) - Build system overview
- [Dependency Map](../development/DEPENDENCY-MAP.md) - Package dependencies

### Code Quality

- [Code Duplication Report](./CODE_DUPLICATION_REPORT.md)
- [Refactoring Opportunities](./REFACTORING_OPPORTUNITIES.md)
- [Code Quality](../CODE_QUALITY.md)

### Application Documentation

- [Backend Application](../../apps/backend/README.md)
- [Frontend Application](../../apps/frontend/README.md)
- [API Server](../../apps/api/README.md)
- [API Gateway](../../apps/api-gateway/README.md) (if exists)

### Deployment

- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE.md)
- [Railway Deployment](../deployment/RAILWAY_DEPLOYMENT_GUIDE.md)
- [Docker Optimization](../deployment/DOCKER_OPTIMIZATION_SUMMARY.md)
