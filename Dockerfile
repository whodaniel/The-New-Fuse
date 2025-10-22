# Multi-stage Dockerfile for The New Fuse - Optimized Build
FROM node:20-alpine AS base

# Install system dependencies in one layer
RUN apk add --no-cache curl git python3 make g++ dumb-init && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Dependencies stage - install all dependencies once
FROM base AS dependencies
COPY package.json pnpm-lock.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies at workspace level
RUN pnpm install --frozen-lockfile

# Build stage - build both frontend and backend
FROM dependencies AS build
COPY . .

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm run build

# Build backend
WORKDIR /app/apps/backend  
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache curl dumb-init && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built frontend
COPY --from=build /app/apps/frontend/dist ./apps/frontend/dist

# Copy backend build and dependencies
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app-user -u 1001 && \
    chown -R app-user:nodejs /app

USER app-user

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/backend/dist/main.js"]