# The New Fuse Living Context

**Purpose** Single, production-safe context summary of the platform, with
pointers to canonical docs. This file avoids local machine paths and keeps a
strict separation between production docs, dev docs, and personal docs.

**Scope** Platform architecture, services, deployment, agent system, testing,
and operational practices as of March 2026.

**Doc Classification** Production docs:

- `PRODUCTION_READINESS.md`
- `docs/guides/deployment-guide.md`
- `docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md`
- `SECURITY.md`
- `SECURITY_MIGRATION_GUIDE.md`

Dev docs:

- `README.md`
- `QUICK_START_GUIDE.md`
- `docs/development/GETTING_STARTED.md`
- `docs/development/BUILD_GUIDE.md`
- `docs/testing/TESTING_SETUP_COMPLETE.md`
- `docs/testing/BEST_PRACTICES.md`

Personal docs:

- Keep personal notes in a dedicated folder such as `docs/personal/` or
  `memory-bank/`.
- Personal docs should not be referenced by production flows or deployment
  scripts.

## Architecture Summary

Core services and ports:

- Frontend: React + Vite on `3000`
- API Server: NestJS on `3001`
- API Gateway: NestJS on `3005`
- Backend: NestJS on `3004`
- Relay Server: WebSocket hub on `3000` (WS)
- PostgreSQL: `5433` (Docker)
- Redis: `6380` (Docker)

Message flow:

- Frontend -> API Gateway -> API Server
- Agents -> Relay Server -> Redis pub/sub -> Agents
- MCP client -> API Server MCP module
- A2A protocol for cross-agent messages

Key packages:

- `@the-new-fuse/types`, `@the-new-fuse/utils`, `@the-new-fuse/infrastructure`
- `@the-new-fuse/relay-core`, `@the-new-fuse/mcp-core`, `@the-new-fuse/a2a-core`
- `@the-new-fuse/workflow-engine`

## Agent System

Core concepts:

- Agents register via the Agent Registry.
- Capabilities are declared and verified during onboarding.
- Communication uses WebSocket, Redis pub/sub, HTTP, and MCP.

Primary references:

- `docs/agents/COMPLETE-AGENT-GUIDE.md`
- `docs/agents-and-protocols/AGENT_COMMUNICATION_GUIDE.md`
- `docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE.md`
- `apps/backend/src/modules/agent-registry/README.md`

## Deployment Overview

Railway:

- Primary production deployment target.
- Services: Frontend, API Gateway, Backend.
- Use `Dockerfile.railway` and environment variables from `.env.railway.example`
  for setup.

Docker (local dev infra):

- Postgres and Redis via `pnpm run docker:start`.
- Reference: `docs/guides/docker-setup.md`.

Primary references:

- `docs/guides/deployment-guide.md`
- `docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md`

## Build and Development

Setup:

- Prefer `./scripts/setup-project.sh` for reliable local setup.
- Node 18 or 20 and Bun are expected.

Build:

- Use `pnpm run build` which runs `turbo run build`.
- Drizzle client generation is required for DB changes.

Primary references:

- `README.md`
- `QUICK_START_GUIDE.md`
- `docs/development/GETTING_STARTED.md`
- `docs/development/BUILD_GUIDE.md`

## Testing and Quality

Testing stack:

- Jest for backend and packages.
- Vitest for frontend.
- Playwright for E2E.

Quality tooling:

- ESLint + Prettier + lint-staged + Husky.

Primary references:

- `docs/testing/TESTING_SETUP_COMPLETE.md`
- `docs/testing/E2E_TEST_SUMMARY.md`
- `docs/testing/BEST_PRACTICES.md`
- `docs/development/CODE_QUALITY_SETUP_COMPLETE.md`

## Monitoring and Ops

Monitoring stack:

- Prometheus + Grafana for metrics.
- ELK for logs.

Primary references:

- `docs/deployment/MONITORING.md`
- `apps/backend/PERFORMANCE_OPTIMIZATION.md`

## UX and Design System

Frontend structure and UX:

- Recommended frontend structure and component standards.
- Production build targets for bundle size and performance.

Primary references:

- `apps/frontend/README.md`
- `apps/frontend/QUICK_START.md`
- `docs/DESIGN_SYSTEM_DOCUMENTATION.md`
- `docs/ui-ux/UX_AUDIT_SUMMARY.md`

## Known Drift to Address

- Some docs still reference local absolute paths or legacy directories.
- Standardize on repo-relative paths before committing deployment docs.
- Consolidate duplicated or conflicting doc sources into canonical entries.

## Canonical Navigation

- `DOCUMENTATION_MAP.md` for full doc graph.
- `DOCUMENTATION_INDEX.md` for category index.
