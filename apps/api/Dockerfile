# Multi-stage Dockerfile for The New Fuse API Service
# Optimized for NestJS application

# Stage 1: Build dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
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
COPY package.json ./apps/api/
COPY ../api-gateway/package.json ./apps/api-gateway/
COPY ../backend/package.json ./apps/backend/
COPY ../browser-hub/package.json ./apps/browser-hub/
COPY ../electron-desktop/package.json ./apps/electron-desktop/
COPY ../frontend/package.json ./apps/frontend/
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
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code and config (relative to repo root)
COPY ../../turbo.json ./
COPY ../../tsconfig.base.json ./
COPY . ./apps/api
COPY ../../packages ./packages
COPY ../../prisma ./prisma

# Build packages first, then the API
ENV NODE_ENV=production
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter @the-new-fuse/core build || true
RUN pnpm --filter @the-new-fuse/database build || true
RUN pnpm --filter @the-new-fuse/api-server build

# Generate Prisma Client
RUN pnpm prisma generate --schema=./prisma/schema.prisma || echo "Prisma schema not found, skipping"

# Stage 3: Production runtime
FROM node:18-alpine AS runner
RUN apk add --no-cache dumb-init curl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy built application and dependencies
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser
RUN chown -R apiuser:nodejs /app
USER apiuser

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/src/index.js"]
