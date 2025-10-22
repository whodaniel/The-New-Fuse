# Multi-stage build for The New Fuse application - Optimized
# Force Railway to use Dockerfile - CACHE BUST v5
FROM node:20-alpine AS base

# Install system dependencies and pnpm in one layer
RUN apk add --no-cache curl git python3 make g++ && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Copy package.json files from packages directory
# We need to copy each package.json individually since the wildcard pattern doesn't work in Docker
COPY packages/a2a-core/package.json ./packages/a2a-core/
COPY packages/a2a-react/package.json ./packages/a2a-react/
COPY packages/agent/package.json ./packages/agent/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/api-types/package.json ./packages/api-types/
COPY packages/api/package.json ./packages/api/
COPY packages/backend/package.json ./packages/backend/
COPY packages/build-optimization/package.json ./packages/build-optimization/
COPY packages/client/package.json ./packages/client/
COPY packages/common/package.json ./packages/common/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core-error-handling/package.json ./packages/core-error-handling/
COPY packages/core-monitoring/package.json ./packages/core-monitoring/
COPY packages/core-vector-db/package.json ./packages/core-vector-db/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/deployment-core/package.json ./packages/deployment-core/
COPY packages/eslint-config-custom/package.json ./packages/eslint-config-custom/
COPY packages/extension-system/package.json ./packages/extension-system/
COPY packages/fairtable-adapters/package.json ./packages/fairtable-adapters/
COPY packages/fairtable-components/package.json ./packages/fairtable-components/
COPY packages/fairtable-core/package.json ./packages/fairtable-core/
COPY packages/fairtable-utils/package.json ./packages/fairtable-utils/
COPY packages/feature-suggestions/package.json ./packages/feature-suggestions/
COPY packages/feature-tracker/package.json ./packages/feature-tracker/
COPY packages/features/package.json ./packages/features/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/integration-tests/package.json ./packages/integration-tests/
COPY packages/layout/package.json ./packages/layout/
COPY packages/mcp-core/package.json ./packages/mcp-core/
COPY packages/monitoring/package.json ./packages/monitoring/
COPY packages/port-management/package.json ./packages/port-management/
COPY packages/testing/package.json ./packages/testing/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# Install dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Build stage
FROM dependencies AS build
COPY . .

# Build frontend
RUN pnpm --filter=@the-new-fuse/frontend-app build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies and pnpm
RUN apk add --no-cache curl && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built frontend and necessary files from build stage
COPY --from=build /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY server.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
ENTRYPOINT ["node"]
CMD ["server.js"]