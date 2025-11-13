# Multi-stage Dockerfile for The New Fuse Backend Package
# Optimized for TypeScript Node.js application

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
COPY package.json ./packages/backend/
COPY ../types/package.json ./packages/types/
COPY ../core/package.json ./packages/core/
COPY ../database/package.json ./packages/database/
COPY ../utils/package.json ./packages/utils/

# Install dependencies (skip postinstall scripts in Docker)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build application
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code and config (relative to repo root)
COPY ../../turbo.json ./
COPY ../../tsconfig.base.json ./
COPY . ./packages/backend
COPY ../types ./packages/types
COPY ../core ./packages/core
COPY ../database ./packages/database
COPY ../utils ./packages/utils

# Build packages first, then the backend
ENV NODE_ENV=production
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter @the-new-fuse/core build || true
RUN pnpm --filter @the-new-fuse/database build || true
RUN pnpm --filter @the-new-fuse/utils build || true
RUN pnpm --filter @the-new-fuse/backend build

# Stage 3: Production runtime
FROM node:18-alpine AS runner
RUN apk add --no-cache dumb-init curl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy built application and dependencies
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend
RUN chown -R backend:nodejs /app
USER backend

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/backend/dist/index.js"]
