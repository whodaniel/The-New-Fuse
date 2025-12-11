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
RUN npm install --legacy-peer-deps || pnpm install --no-frozen-lockfile

# Build the application
ENV NODE_ENV=production
ENV VITE_API_URL=https://api.thenewfuse.com
ENV VITE_BACKEND_URL=https://backend.thenewfuse.com
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build || pnpm run build

# Normalize dist directory location
# If running from monorepo root, build output is in apps/frontend/dist
# If running from app root, build output is in dist - this logic handles both cases
RUN if [ -d "apps/frontend/dist" ]; then rm -rf dist && mv apps/frontend/dist ./dist; fi

# Stage 2: Production stage
FROM node:22-alpine AS runner

# Install serve globally for serving static files
RUN npm install -g serve

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/frontend-source/dist ./dist

# Expose port (Railway will inject PORT env var)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start command - serve the built static files
# -s enables SPA mode (serves index.html for all routes)
# -n disables clipboard notifications
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3000} -s -n"]
