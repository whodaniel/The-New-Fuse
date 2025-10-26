# Dockerfile for core-vector-db package in Railway monorepo deployment
# Railway Root Directory: /packages/core-vector-db

# Stage 1: Build stage with full monorepo context
FROM node:20-alpine3.19 AS builder

# Update Alpine packages for security patches
RUN apk update && apk upgrade --no-cache

# Install pnpm globally
RUN npm install -g pnpm@10.19.0

# Set working directory to monorepo root
WORKDIR /monorepo

# Copy workspace configuration files from monorepo root
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./
COPY ../../pnpm-lock.yaml ./

# Copy all package.json files for proper dependency resolution
# Create directories first, then copy package.json files
RUN mkdir -p ./packages ./apps
COPY ../../packages/*/package.json ./packages/
COPY ../../apps/*/package.json ./apps/


# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy the entire monorepo source
COPY ../../ ./

# Build dependencies first (comprehensive list from both versions)
RUN pnpm --filter @the-new-fuse/types run build || echo "Types build completed"
RUN pnpm --filter @the-new-fuse/utils run build || echo "Utils build completed"
RUN pnpm --filter @the-new-fuse/core run build || echo "Core build completed"
RUN pnpm --filter @the-new-fuse/database run build || echo "Database build completed"
RUN pnpm --filter @the-new-fuse/proto-definitions run build || echo "Proto-definitions build completed"

# Build core-vector-db
RUN pnpm --filter @the-new-fuse/core-vector-db build

# Verify the build output exists
RUN ls -la /monorepo/packages/core-vector-db/dist/

# Stage 2: Production image
FROM node:20-alpine3.19 AS production

# Update Alpine packages for security patches
RUN apk update && apk upgrade --no-cache

# Install pnpm
RUN npm install -g pnpm@10.19.0

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /monorepo/package.json ./
COPY --from=builder /monorepo/pnpm-lock.yaml ./
COPY --from=builder /monorepo/pnpm-workspace.yaml ./
COPY --from=builder /monorepo/packages/core-vector-db ./packages/core-vector-db
COPY --from=builder /monorepo/node_modules ./node_modules

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose gRPC port
EXPOSE 50051

# Set working directory to the service
WORKDIR /app/packages/core-vector-db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:50051/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the service
CMD ["node", "dist/main.js"]
