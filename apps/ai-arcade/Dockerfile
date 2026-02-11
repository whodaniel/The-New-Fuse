# Dockerfile for AI Arcade service (built from monorepo root context)
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app/apps/ai-arcade

# Install only ai-arcade deps (avoid monorepo root native deps)
COPY apps/ai-arcade/package.json ./
RUN npm install --legacy-peer-deps

# Build app
COPY apps/ai-arcade/ ./
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/apps/ai-arcade/dist ./dist

EXPOSE ${PORT:-3005}
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3005}/ || exit 1
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3005} -s -n"]
