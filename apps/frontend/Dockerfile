# Multi-stage build for React frontend - Force rebuild with workspace packages
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Dependencies stage
FROM base AS dependencies

# Copy root-level configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Copy frontend app package.json
COPY apps/frontend/package.json ./apps/frontend/

# Copy package.json files from packages directory explicitly
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
COPY packages/prompt-templating/package.json ./packages/prompt-templating/
COPY packages/testing/package.json ./packages/testing/
COPY packages/types/package.json ./packages/types/
COPY packages/ui-consolidated/package.json ./packages/ui-consolidated/
COPY packages/utils/package.json ./packages/utils/

# Copy source code for packages that frontend depends on BEFORE installing dependencies
COPY packages/port-management/ ./packages/port-management/
COPY packages/prompt-templating/ ./packages/prompt-templating/
COPY packages/ui-consolidated/ ./packages/ui-consolidated/

# Install all dependencies from root without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Build stage
FROM dependencies AS builder

# Copy all source files
COPY . .

# Ensure prompt-templating package is properly recognized in workspace
RUN pnpm install --no-frozen-lockfile

# Build workspace packages first (dependencies of frontend)
RUN pnpm --filter=!@the-new-fuse/frontend-app build

# Build the frontend application using pnpm workspace - CACHE BUST v6
RUN pnpm --filter=@the-new-fuse/frontend-app build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Force rebuild - Updated for pnpm workspace build - CACHE BUST v2
