# Production Dockerfile for API service
FROM node:18.20.2-alpine AS base

WORKDIR /app

# Install security updates and pnpm
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl
RUN npm install -g pnpm@latest

# Install build dependencies
FROM base AS builder

RUN apk add --no-cache python3 make g++

# Copy workspace configuration files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all package.json files first for better caching
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies using pnpm (without frozen lockfile for Docker build)
RUN pnpm install --no-frozen-lockfile

# Copy source code for API
COPY apps/api ./apps/api

# Build packages first
RUN pnpm run build:packages

# Build the API application
RUN cd apps/api && pnpm run build

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy workspace configuration files for production install
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy built application and package.json
COPY --from=builder --chown=appuser:appgroup /app/apps/api/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=appuser:appgroup /app/packages ./packages

# Install only production dependencies
RUN pnpm install --prod --no-frozen-lockfile && \
    pnpm store prune && \
    rm -rf ~/.pnpm-store

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["dumb-init", "node", "dist/main.js"]
