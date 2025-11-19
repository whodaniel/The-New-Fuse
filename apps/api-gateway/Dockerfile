# syntax=docker/dockerfile:1.4

FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.200.0

# Copy necessary package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy scripts needed for installation
COPY scripts ./scripts

# Copy specific app's package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Copy all workspace packages
COPY packages ./packages

# Install dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Build the API Gateway service
RUN pnpm --filter @the-new-fuse/api-gateway run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api-gateway/package.json ./apps/api-gateway/

# Set production environment
ENV NODE_ENV=production
ENV PORT=3002 # Assuming API Gateway uses port 3002

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start the application
CMD ["node", "apps/api-gateway/dist/main.js"]
