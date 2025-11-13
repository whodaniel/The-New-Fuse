# Multi-stage Dockerfile for The New Fuse API Package
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
COPY package.json ./packages/api/
COPY ../types/package.json ./packages/types/
COPY ../core/package.json ./packages/core/
COPY ../database/package.json ./packages/database/
COPY ../utils/package.json ./packages/utils/
COPY ../infrastructure/package.json ./packages/infrastructure/

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
COPY . ./packages/api
COPY ../types ./packages/types
COPY ../core ./packages/core
COPY ../database ./packages/database
COPY ../utils ./packages/utils
COPY ../infrastructure ./packages/infrastructure
COPY ../../prisma ./prisma

# Build packages first, then the API
ENV NODE_ENV=production
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter @the-new-fuse/core build || true
RUN pnpm --filter @the-new-fuse/database build || true
RUN pnpm --filter @the-new-fuse/utils build || true
RUN pnpm --filter @the-new-fuse/infrastructure build || true
RUN pnpm --filter @the-new-fuse/api build

# Generate Prisma Client
RUN pnpm prisma generate --schema=./prisma/schema.prisma || echo "Prisma schema not found, skipping"

# Stage 3: Production runtime
FROM node:18-alpine AS runner
RUN apk add --no-cache dumb-init curl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy built application and dependencies
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser
RUN chown -R apiuser:nodejs /app
USER apiuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/api/dist/main.js"]
