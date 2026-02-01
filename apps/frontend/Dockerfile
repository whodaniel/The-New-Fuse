# Multi-stage Dockerfile for The New Fuse Frontend
# This Dockerfile works when build context is apps/frontend OR monorepo root
# Railway configuration should NOT set a root directory for this service
# Cache bust: 2026-02-01-v1 - Force rebuild to use updated dist path logic

# Stage 1: Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Accept Firebase environment variables as build args
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Check if we're in the frontend directory or monorepo root
# by looking for the presence of app-specific files

# Copy package files first for better caching
# Handle both monorepo root and apps/frontend contexts
COPY package.json ./

# If we're in the frontend directory (has vite.config.ts), do a simplified build
# Otherwise, we're at monorepo root and need workspace dependencies

# Try to copy from monorepo structure first, then fallback
# This uses a multi-context approach

# For builds from apps/frontend context:
# Copy all source files
COPY . ./frontend-source/

# Install dependencies
WORKDIR /app/frontend-source
RUN npm install --legacy-peer-deps || pnpm install --no-frozen-lockfile --ignore-scripts

# Build the application
ENV NODE_ENV=production
# Use relative paths so nginx can proxy to the backend
# Previously these were hardcoded to api.thenewfuse.com which doesn't exist in DNS
ENV VITE_API_URL=/api
ENV VITE_BACKEND_URL=/api
ENV NODE_OPTIONS=--max-old-space-size=4096

# Firebase configuration is loaded from .env.production which is committed to the repo
# Do NOT set empty ENV vars here as they override .env.production values

# Build foundational packages first to ensure they're available
# This avoids Turbo cache issues in fresh Docker builds
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter @the-new-fuse/database build || true
RUN pnpm --filter @the-new-fuse/core-vector-db build || true
RUN pnpm --filter @the-new-fuse/core build || true

# Clear Turbo cache and run the full build
# TURBO_FORCE=true tells Turbo to ignore cache
RUN rm -rf .turbo node_modules/.cache/turbo
ENV TURBO_FORCE=true

# Build frontend with exclusions for packages that aren't needed and have issues
RUN npm run build || pnpm run build

# Normalize dist directory location
# If running from monorepo root, build output is in apps/frontend/dist
# If running from app root, build output is in dist - this logic handles both cases
RUN if [ -d "apps/frontend/dist" ]; then rm -rf dist && mv apps/frontend/dist ./dist; fi

# Normalize nginx.conf location
# If running from monorepo root, nginx.conf is in apps/frontend/nginx.conf
# If running from app root, nginx.conf is in ./nginx.conf
RUN if [ -f "apps/frontend/nginx.conf" ]; then cp apps/frontend/nginx.conf ./nginx.conf; fi

# Stage 2: Production stage with nginx
FROM nginx:alpine AS runner

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/frontend-source/dist ./dist

# Copy nginx configuration
COPY --from=builder /app/frontend-source/nginx.conf /etc/nginx/nginx.template.conf

# Create temp directories for nginx (non-root mode)
RUN mkdir -p /tmp/client_body /tmp/proxy /tmp/fastcgi /tmp/uwsgi /tmp/scgi && \
    chmod -R 777 /tmp/client_body /tmp/proxy /tmp/fastcgi /tmp/uwsgi /tmp/scgi && \
    chmod -R 755 /app/dist

# Expose port (Railway will inject PORT env var)
EXPOSE ${PORT:-3000}

# Health check - Railway injects PORT, but healthcheck runs before CMD exports it
# Use a script that reads PORT from env or defaults to 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start command - substitute environment variables and start nginx
# Set defaults for PORT and BACKEND_URL if not provided
# Then use envsubst to replace variables in nginx config
CMD ["sh", "-c", "echo 'Starting nginx with PORT=${PORT:-3000}' && export PORT=${PORT:-3000} && export BACKEND_URL=${BACKEND_URL:-https://api.thenewfuse.com} && envsubst '$PORT $BACKEND_URL' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf && echo 'Nginx config generated:' && head -50 /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
