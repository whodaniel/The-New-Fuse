# Multi-stage build for React frontend
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.6

# Set working directory
WORKDIR /app

# Copy root package.json and pnpm files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Copy TypeScript configuration files
COPY tsconfig.json tsconfig.base.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/

# Install dependencies with force flag to handle lockfile issues
RUN pnpm install --force

# Build stage
FROM base AS builder

WORKDIR /app

# Build the frontend application
RUN pnpm --filter=@the-new-fuse/frontend-app build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]