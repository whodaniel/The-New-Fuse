# syntax=docker/dockerfile:1.4

FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.20.0

# Copy necessary package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./ 

# Copy scripts needed for installation
COPY scripts ./scripts

# Copy specific app's package.json
COPY apps/backend/package.json ./apps/backend/

# Copy all workspace packages
COPY packages ./packages

# Install dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Build the Backend service
RUN pnpm --filter @the-new-fuse/backend-app run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# Set production environment
ENV NODE_ENV=production
ENV PORT=3003 # Assuming Backend uses port 3003

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start the application
CMD ["node", "apps/backend/dist/main.js"]

