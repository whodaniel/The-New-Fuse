# Multi-stage Dockerfile for The New Fuse Frontend
# Optimized for Vite React application

# Stage 1: Build dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc .pnpmrc ./

# Copy scripts directory (needed for postinstall)
COPY scripts ./scripts

# Copy all package.json files for workspace resolution
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY packages/ui-consolidated/package.json ./packages/ui-consolidated/
COPY packages/a2a-core/package.json ./packages/a2a-core/
COPY packages/a2a-react/package.json ./packages/a2a-react/
COPY packages/feature-suggestions/package.json ./packages/feature-suggestions/
COPY packages/port-management/package.json ./packages/port-management/
COPY packages/prompt-templating/package.json ./packages/prompt-templating/

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

# Copy source code
COPY turbo.json ./
COPY tsconfig.base.json ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

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
