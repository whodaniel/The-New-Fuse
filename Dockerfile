# Dockerfile - Production build for Railway deployments
# This file serves as the root Dockerfile for all services (via build args)
# or specifically for the frontend if used as a default.

ARG NODE_VERSION=22

#------------------------------------------------------------------------------
# Builder stage
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files first for better caching
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all necessary workspace packages
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install all dependencies (including workspace dependencies)
# We use --frozen-lockfile to ensure reproducible builds
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Set Node.js memory limit for TypeScript builds
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build required workspace packages that frontend depends on
# We explicitly build these to ensure they are ready before the app build
RUN pnpm --filter @the-new-fuse/types build
RUN pnpm --filter @the-new-fuse/a2a-core build
RUN pnpm --filter @the-new-fuse/a2a-react build
RUN pnpm --filter @the-new-fuse/feature-suggestions build
RUN pnpm --filter @the-new-fuse/port-management build
RUN pnpm --filter @the-new-fuse/prompt-templating build
RUN pnpm --filter @the-new-fuse/ui-consolidated build

# Build the frontend application
WORKDIR /app/apps/frontend
ARG VITE_API_URL=https://api.thenewfuse.com
ARG VITE_BACKEND_URL=https://backend.thenewfuse.com
ENV NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN echo "Building with NODE_ENV=$NODE_ENV" && pnpm run build -- --mode production

#------------------------------------------------------------------------------
# Runner stage - Production image with nginx
#------------------------------------------------------------------------------
FROM nginx:alpine AS runner

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/apps/frontend/dist ./dist

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/nginx.template.conf

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
# This replaces ${PORT} in nginx config with actual PORT value from Railway
CMD ["sh", "-c", "envsubst '$$PORT' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
