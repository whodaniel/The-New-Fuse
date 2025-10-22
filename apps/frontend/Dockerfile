# Multi-stage build for React frontend
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy root-level TypeScript configuration files first
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Set working directory for frontend
WORKDIR /app/apps/frontend

# Copy frontend package.json and package-lock.json
COPY apps/frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY apps/frontend/ ./

# Build stage
FROM base AS builder

WORKDIR /app/apps/frontend

# Build the frontend application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration if it exists, otherwise use default
RUN if [ -f /app/apps/frontend/nginx.conf ]; then \
    cp /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
    echo "No nginx.conf found, using default"; \
    fi

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Force rebuild Wed Oct 22 00:07:30 EDT 2025
