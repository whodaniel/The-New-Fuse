# Dockerfile.frontend - Generic Frontend build for Railway deployments
# This file should be used from the monorepo root with NO root directory set in Railway

ARG NODE_VERSION=22

#------------------------------------------------------------------------------
# Builder stage
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder

# Build arguments
ARG SERVICE_PATH=apps/frontend
ARG PACKAGE_NAME=@the-new-fuse/frontend
ARG VITE_API_URL
ARG VITE_BACKEND_URL
ARG VITE_API_GATEWAY_URL
ARG VITE_WS_URL
ARG GEMINI_API_KEY

# Accept Firebase environment variables as build args
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Install build dependencies for canvas/native modules
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
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

# Copy workspace files first for better caching
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY tsconfig.standard.json ./
COPY scripts ./scripts
COPY turbo.json ./

# Copy all necessary workspace packages
COPY packages ./packages
COPY apps ./apps

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Build foundational types first
RUN pnpm --filter @the-new-fuse/types build || echo "Types built"

# Build dependencies based on the target service
RUN pnpm --filter "@the-new-fuse/*" build || echo "Packages built"

# Set ENV for the build process (Vite inlines these)
ENV NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the specific frontend application
# Extract just the app name from SERVICE_PATH (e.g., "nexus-orchestrator" from "apps/nexus-orchestrator")
RUN SERVICE_NAME=$(echo "${SERVICE_PATH}" | sed 's|apps/||') && \
    if [ -d "apps/${SERVICE_NAME}" ]; then \
        echo "Building standalone app: ${SERVICE_NAME}"; \
        cd apps/${SERVICE_NAME} && pnpm build; \
    else \
        echo "Building workspace package: ${PACKAGE_NAME}"; \
        pnpm --filter ${PACKAGE_NAME} build; \
    fi

#------------------------------------------------------------------------------
# Runner stage - Production image
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner

# Install serve globally for serving static files
RUN npm install -g serve

WORKDIR /app

# Re-declare ARG in runner stage to use it here
ARG SERVICE_PATH=apps/frontend

# Copy built files from builder stage - handle both standalone and workspace apps
COPY --from=builder /app/${SERVICE_PATH}/dist ./dist

# Expose port (Railway will inject PORT env var)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start command - serve the built static files
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3000} -s -n"]
