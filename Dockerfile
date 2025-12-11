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
# Runner stage - Production image
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner

# Install serve globally for serving static files
RUN npm install -g serve

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/apps/frontend/dist ./dist

# Expose port (Railway will inject PORT env var)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start command - serve the built static files
# -s enables SPA mode (serves index.html for all routes)
# -n disables clipboard notifications
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3000} -s -n"]
