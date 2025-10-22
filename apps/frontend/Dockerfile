# Multi-stage build for React frontend
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy root-level configuration files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Install pnpm
RUN npm install -g pnpm

# Copy all packages and apps for workspace resolution
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install all dependencies from root
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

WORKDIR /app

# Build the frontend application using pnpm workspace - CACHE BUST v3
# Force Railway to use Dockerfile instead of Nixpacks
RUN --mount=type=cache,id=pnpm-build-v3,target=/app/node_modules/.cache \
    pnpm --filter=@the-new-fuse/frontend-app build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Force rebuild - Updated for pnpm workspace build - CACHE BUST v2
