# Multi-stage Dockerfile for The New Fuse Frontend
# This Dockerfile works when build context is apps/frontend OR monorepo root
# Railway configuration should NOT set a root directory for this service

# Stage 1: Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

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
ENV VITE_API_URL=https://api.thenewfuse.com
ENV VITE_BACKEND_URL=https://backend.thenewfuse.com
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build foundational packages first to ensure they're available
# This avoids Turbo cache issues in fresh Docker builds
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter @the-new-fuse/core-vector-db build || true  
RUN pnpm --filter @the-new-fuse/core build || true

# Clear Turbo cache and run the full build
# TURBO_FORCE=true tells Turbo to ignore cache
RUN rm -rf .turbo node_modules/.cache/turbo
ENV TURBO_FORCE=true
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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Start command - substitute PORT env var and start nginx
# This replaces ${PORT:-3000} in nginx config with actual PORT value
CMD ["sh", "-c", "envsubst '$$PORT' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
