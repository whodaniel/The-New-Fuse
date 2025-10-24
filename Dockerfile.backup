# Minimal production Dockerfile for The New Fuse server (Prompt Templating Service)
# Simplified to avoid building missing workspace packages; serves health/API endpoints

FROM node:20-alpine

# Install system deps and pnpm
RUN apk add --no-cache curl && \
    npm install -g pnpm && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy only root dependencies needed for server
COPY package.json pnpm-lock.yaml ./

# Install production deps (express)
RUN pnpm install --prod --no-frozen-lockfile

# Copy server entry
COPY server.js ./

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:nodejs /app

USER appuser

# Railway sets PORT; default to 8080 if not provided
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the application
CMD ["node", "server.js"]