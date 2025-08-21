# Multi-stage build for sync-core service
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/sync-core/package.json ./packages/sync-core/
COPY packages/core-monitoring/package.json ./packages/core-monitoring/
COPY packages/core-error-handling/package.json ./packages/core-error-handling/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY . .
RUN npm ci
RUN npm run build --workspace=packages/sync-core

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sync-user -u 1001

WORKDIR /app

# Copy built application
COPY --from=deps --chown=sync-user:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=sync-user:nodejs /app/packages/sync-core/dist ./packages/sync-core/dist
COPY --from=build --chown=sync-user:nodejs /app/packages/sync-core/package.json ./packages/sync-core/
COPY --from=build --chown=sync-user:nodejs /app/prisma ./prisma

# Create data directory
RUN mkdir -p /app/data && chown sync-user:nodejs /app/data

USER sync-user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3003/health/sync || exit 1

EXPOSE 3003

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/sync-core/dist/server.js"]