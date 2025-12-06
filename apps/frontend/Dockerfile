# Multi-stage Dockerfile for The New Fuse Frontend
# This Dockerfile is designed to work from the monorepo root

# Stage 1: Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files from monorepo root
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all necessary workspace packages
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build the frontend application
WORKDIR /app/apps/frontend
RUN pnpm run build

# Stage 2: Production stage
FROM node:22-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install serve globally for serving static files
RUN pnpm add -g serve

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/apps/frontend/dist ./dist
COPY --from=builder /app/apps/frontend/package.json ./package.json

# Expose port (Railway will inject PORT env var)
EXPOSE ${PORT:-3000}

# Start command - serve the built static files
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3000} -s -n"]
