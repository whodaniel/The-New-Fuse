# The New Fuse - Monorepo Dockerfile

# 1. Base image for all stages
FROM node:20-alpine AS base
RUN apk add --no-cache curl && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*
WORKDIR /app

# 2. Install all dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc .npmrc
RUN pnpm install

# 3. Build all packages
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm run build

# --- Production Stages ---

# 4. Production base image
FROM base AS prod_base
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001
USER appuser
WORKDIR /app

# 5. Production image for api-gateway
FROM prod_base AS api-gateway
COPY --chown=appuser:nodejs --from=builder /app .
RUN pnpm deploy --filter @the-new-fuse/api-gateway /app/deploy
WORKDIR /app/deploy
RUN pnpm install --prod
CMD ["node", "dist/main.js"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3002}/health || exit 1

# 6. Production image for backend
FROM prod_base AS backend
COPY --chown=appuser:nodejs --from=builder /app .
RUN pnpm deploy --filter @the-new-fuse/backend-app /app/deploy
WORKDIR /app/deploy
RUN pnpm install --prod
CMD ["node", "dist/main.js"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3003}/health || exit 1

# 7. Production image for frontend
FROM prod_base AS frontend
WORKDIR /app
COPY --chown=appuser:nodejs --from=builder /app/apps/frontend/dist ./dist
COPY --chown=appuser:nodejs --from=builder /app/server.js ./
COPY --chown=appuser:nodejs --from=builder /app/package.json ./
COPY --chown=appuser:nodejs --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --prod
CMD ["node", "server.js"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1
