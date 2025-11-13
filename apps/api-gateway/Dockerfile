# Multi-stage Dockerfile for The New Fuse API Gateway
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

# Copy all package.json files for workspace resolution
COPY package.json ./apps/api-gateway/
COPY ../../packages/types/package.json ./packages/types/
COPY ../../packages/core/package.json ./packages/core/

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
COPY . ./apps/api-gateway
COPY ../../packages ./packages

# Build packages first, then the gateway
ENV NODE_ENV=production
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter @the-new-fuse/core build || true
RUN pnpm --filter @the-new-fuse/api-gateway build

# Stage 3: Production runtime
FROM node:18-alpine AS runner
RUN apk add --no-cache dumb-init curl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy built application and dependencies
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder /app/apps/api-gateway/package.json ./apps/api-gateway/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gateway
RUN chown -R gateway:nodejs /app
USER gateway

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api-gateway/dist/main.js"]
