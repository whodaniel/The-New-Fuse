# Multi-stage Dockerfile for The New Fuse - Backend + Frontend
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Frontend build stage
FROM base AS frontend-build
WORKDIR /app

# Copy frontend source
COPY apps/frontend ./apps/frontend
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Install frontend dependencies and build
WORKDIR /app/apps/frontend
RUN pnpm install
RUN pnpm run build

# Backend build stage  
FROM base AS backend-build
WORKDIR /app

# Copy backend source
COPY apps/backend ./apps/backend
COPY src ./src
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Install backend dependencies and build
WORKDIR /app/apps/backend
RUN pnpm install
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built frontend
COPY --from=frontend-build /app/apps/frontend/dist ./apps/frontend/dist

# Copy backend source and dependencies
COPY --from=backend-build /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-build /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=backend-build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=backend-build /app/src ./src
COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app-user -u 1001
RUN chown -R app-user:nodejs /app
USER app-user

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/backend/dist/main.js"]