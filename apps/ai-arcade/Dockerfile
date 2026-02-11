# Dockerfile for AI Arcade - standalone frontend app
# Build context: repository root (so we have pnpm-lock.yaml)

ARG NODE_VERSION=22

#------------------------------------------------------------------------------
# Builder stage
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace-level files for dependency resolution
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy scripts directory (needed by root postinstall)
COPY scripts/ ./scripts/

# Copy the ai-arcade app
COPY apps/ai-arcade ./apps/ai-arcade

# Install dependencies - use --ignore-scripts to skip postinstall, then install again
RUN pnpm install --no-frozen-lockfile --filter ai-arcade... --ignore-scripts && \
    cd apps/ai-arcade && pnpm install --no-frozen-lockfile --ignore-scripts

# Build the AI Arcade application
WORKDIR /app/apps/ai-arcade
ENV NODE_ENV=production
RUN npx vite build

#------------------------------------------------------------------------------
# Runner stage - Production image
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner

# Install serve globally for serving static files
RUN npm install -g serve

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/apps/ai-arcade/dist ./dist

# Expose port (Railway will inject PORT env var)
EXPOSE ${PORT:-3005}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3005}/ || exit 1

# Start command - serve the built static files
# -s enables SPA mode (serves index.html for all routes)
# -n disables clipboard notifications
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3005} -s -n"]
