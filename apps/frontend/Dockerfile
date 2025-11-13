# Multi-stage Dockerfile for The New Fuse Frontend
# Optimized for Vite React application

# Stage 1: Build dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy root package files (relative to repo root)
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../.npmrc ../../.pnpmrc ./

# Copy scripts directory (needed for postinstall)
COPY ../../scripts ./scripts

# Copy all package.json files for workspace resolution (required by pnpm)
# Apps
COPY package.json ./apps/frontend/
COPY ../api-gateway/package.json ./apps/api-gateway/
COPY ../api/package.json ./apps/api/
COPY ../backend/package.json ./apps/backend/
COPY ../browser-hub/package.json ./apps/browser-hub/
COPY ../electron-desktop/package.json ./apps/electron-desktop/
COPY ../theia-ide/package.json ./apps/theia-ide/
# Packages
COPY ../../packages/a2a-core/package.json ./packages/a2a-core/
COPY ../../packages/a2a-react/package.json ./packages/a2a-react/
COPY ../../packages/agent/package.json ./packages/agent/
COPY ../../packages/ap2-protocol/package.json ./packages/ap2-protocol/
COPY ../../packages/api-client/package.json ./packages/api-client/
COPY ../../packages/api-types/package.json ./packages/api-types/
COPY ../../packages/api/package.json ./packages/api/
COPY ../../packages/backend/package.json ./packages/backend/
COPY ../../packages/build-optimization/package.json ./packages/build-optimization/
COPY ../../packages/client/package.json ./packages/client/
COPY ../../packages/common/package.json ./packages/common/
COPY ../../packages/contracts/package.json ./packages/contracts/
COPY ../../packages/core-error-handling/package.json ./packages/core-error-handling/
COPY ../../packages/core-monitoring/package.json ./packages/core-monitoring/
COPY ../../packages/core-vector-db/package.json ./packages/core-vector-db/
COPY ../../packages/core/package.json ./packages/core/
COPY ../../packages/database/package.json ./packages/database/
COPY ../../packages/deployment-core/package.json ./packages/deployment-core/
COPY ../../packages/eslint-config-custom/package.json ./packages/eslint-config-custom/
COPY ../../packages/extension-system/package.json ./packages/extension-system/
COPY ../../packages/fairtable-adapters/package.json ./packages/fairtable-adapters/
COPY ../../packages/fairtable-components/package.json ./packages/fairtable-components/
COPY ../../packages/fairtable-core/package.json ./packages/fairtable-core/
COPY ../../packages/fairtable-utils/package.json ./packages/fairtable-utils/
COPY ../../packages/feature-suggestions/package.json ./packages/feature-suggestions/
COPY ../../packages/feature-tracker/package.json ./packages/feature-tracker/
COPY ../../packages/features/package.json ./packages/features/
COPY ../../packages/hooks/package.json ./packages/hooks/
COPY ../../packages/infrastructure/package.json ./packages/infrastructure/
COPY ../../packages/integration-tests/package.json ./packages/integration-tests/
COPY ../../packages/integrations/package.json ./packages/integrations/
COPY ../../packages/layout/package.json ./packages/layout/
COPY ../../packages/mcp-core/package.json ./packages/mcp-core/
COPY ../../packages/monitoring/package.json ./packages/monitoring/
COPY ../../packages/port-management/package.json ./packages/port-management/
COPY ../../packages/prompt-templating/package.json ./packages/prompt-templating/
COPY ../../packages/proto-definitions/package.json ./packages/proto-definitions/
COPY ../../packages/relay-core/package.json ./packages/relay-core/
COPY ../../packages/security/package.json ./packages/security/
COPY ../../packages/shared/package.json ./packages/shared/
COPY ../../packages/sync-core/package.json ./packages/sync-core/
COPY ../../packages/test-utils/package.json ./packages/test-utils/
COPY ../../packages/testing/package.json ./packages/testing/
COPY ../../packages/types/package.json ./packages/types/
COPY ../../packages/ui-consolidated/package.json ./packages/ui-consolidated/
COPY ../../packages/utils/package.json ./packages/utils/
COPY ../../packages/web-scraping/package.json ./packages/web-scraping/
COPY ../../packages/workflow-engine/package.json ./packages/workflow-engine/

# Install dependencies (skip postinstall scripts in Docker - they're for native modules not needed in production)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build application
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code (relative to repo root)
COPY ../../turbo.json ./
COPY ../../tsconfig.base.json ./
COPY . ./apps/frontend
COPY ../../packages ./packages

# Build the frontend
ENV NODE_ENV=production
RUN pnpm --filter @the-new-fuse/frontend-app build

# Stage 3: Production server
FROM node:18-alpine AS runner
WORKDIR /app

# Install serve to run the static files
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/apps/frontend/dist ./dist

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 frontend
RUN chown -R frontend:nodejs /app
USER frontend

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]
