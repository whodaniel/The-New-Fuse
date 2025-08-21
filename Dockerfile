# Multi-stage Dockerfile for The New Fuse Backend Services
# Optimized for monorepo with Bun runtime

FROM oven/bun:1.2.16-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy root package files first for better layer caching
COPY package.json bun.lockb ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy package.json files for all dependencies
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/utils/package.json ./packages/utils/
COPY packages/core-monitoring/package.json ./packages/core-monitoring/
COPY packages/core-error-handling/package.json ./packages/core-error-handling/
COPY packages/mcp-core/package.json ./packages/mcp-core/
COPY packages/sync-core/package.json ./packages/sync-core/

# Dependencies stage
FROM base AS deps
RUN bun install --frozen-lockfile --production

# Build stage
FROM base AS build
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

# API Server Production Image
FROM base AS api-server
ARG SERVICE=api

# Copy dependencies and built code
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/*/dist ./packages/
COPY --from=build /app/prisma ./prisma

# Copy service-specific files
COPY apps/api/package.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S api-user -u 1001
RUN chown -R api-user:nodejs /app
USER api-user

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "apps/api/src/index.ts"]

# A2A Service Production Image
FROM base AS a2a-service
ARG SERVICE=a2a

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/a2a-core/dist ./packages/a2a-core/dist
COPY --from=build /app/packages/*/dist ./packages/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S a2a-user -u 1001
RUN chown -R a2a-user:nodejs /app
USER a2a-user

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "packages/a2a-core/src/server.ts"]

# Sync Core Service Production Image
FROM base AS sync-core
ARG SERVICE=sync

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/sync-core/dist ./packages/sync-core/dist
COPY --from=build /app/packages/*/dist ./packages/
COPY --from=build /app/prisma ./prisma

RUN addgroup -g 1001 -S nodejs && \
    adduser -S sync-user -u 1001
RUN chown -R sync-user:nodejs /app
USER sync-user

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "packages/sync-core/src/server.ts"]

# MCP Core Service Production Image
FROM base AS mcp-core
ARG SERVICE=mcp

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/mcp-core/dist ./packages/mcp-core/dist
COPY --from=build /app/packages/*/dist ./packages/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp-user -u 1001
RUN chown -R mcp-user:nodejs /app
USER mcp-user

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "packages/mcp-core/src/server.ts"]