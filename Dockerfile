# Multi-stage build for The New Fuse application - Optimized
# Force Railway to use Dockerfile - CACHE BUST v5
FROM node:20-alpine AS base

# Install system dependencies and pnpm in one layer
RUN apk add --no-cache curl git python3 make g++ && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Dependencies stage - install all dependencies once
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/*/package.json ./packages/*/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS build
COPY . .

# Build frontend
RUN pnpm --filter=@the-new-fuse/frontend-app build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies and pnpm
RUN apk add --no-cache curl && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built frontend and necessary files from build stage
COPY --from=build /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY server.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
ENTRYPOINT ["node"]
CMD ["server.js"]