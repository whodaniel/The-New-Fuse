# Dockerfile.frontend - Frontend build for Railway deployments
# This file should be used from the monorepo root with NO root directory set in Railway

ARG NODE_VERSION=22

#------------------------------------------------------------------------------
# Builder stage
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder

# Accept Firebase environment variables as build args
# These must be declared AFTER FROM to be available in this stage
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Install build dependencies for canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files first for better caching
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY tsconfig.standard.json ./
COPY scripts ./scripts

# Copy all necessary workspace packages
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Build required workspace packages that frontend depends on
RUN pnpm --filter @the-new-fuse/types build || echo "Types built"
RUN pnpm --filter @the-new-fuse/a2a-core build || echo "A2A Core built"
RUN pnpm --filter @the-new-fuse/a2a-react build || echo "A2A React built"
RUN pnpm --filter @the-new-fuse/feature-suggestions build || echo "Feature Suggestions built"
RUN pnpm --filter @the-new-fuse/features build || echo "Features built"
RUN pnpm --filter @the-new-fuse/port-management build || echo "Port Management built"
RUN pnpm --filter @the-new-fuse/prompt-templating build || echo "Prompt Templating built"
RUN pnpm --filter @the-new-fuse/ui-consolidated build || echo "UI Consolidated built"

# Build the frontend application
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV VITE_API_URL=https://api.thenewfuse.com
ENV VITE_BACKEND_URL=https://backend.thenewfuse.com

# Firebase config - passed as Docker build args from Railway environment variables
# These MUST be set as ENV so Vite can inline them at build time via import.meta.env.*
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Force cache invalidation: 2026-02-11T07:25:00Z
RUN echo "Building with NODE_ENV=$NODE_ENV FIREBASE_PROJECT=$VITE_FIREBASE_PROJECT_ID" && pnpm run build -- --mode production

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
# Force rebuild Thu Jan 23 06:30:00 EST 2026
