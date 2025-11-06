# Multi-stage Dockerfile for Sync-Core
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/sync-core/package.json ./packages/sync-core/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/sync-core ./packages/sync-core
COPY packages/database ./packages/database
COPY tsconfig.json ./

# Build the application
WORKDIR /app/packages/sync-core
RUN pnpm build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/sync-core/package.json ./packages/sync-core/

RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/packages/sync-core/dist ./packages/sync-core/dist
COPY --from=builder /app/packages/database ./packages/database

# Create non-root user
RUN addgroup -g 1001 -S synccore && \
    adduser -S synccore -u 1001

# Set ownership
RUN chown -R synccore:synccore /app

USER synccore

# Expose ports
EXPOSE 3001 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "packages/sync-core/dist/main.js"]
