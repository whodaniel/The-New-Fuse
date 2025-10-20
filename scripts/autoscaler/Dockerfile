FROM node:18-alpine

WORKDIR /app

# Install dependencies for Docker API and monitoring
RUN apk add --no-cache curl docker-cli

# Copy package files
COPY scripts/autoscaler/package.json ./

# Install Node.js dependencies
RUN npm install --only=production

# Copy autoscaler source code
COPY scripts/autoscaler/src/ ./src/

# Create non-root user for security
RUN addgroup -g 1001 -S autoscaler && \
    adduser -S autoscaler -u 1001

# Change ownership of app directory
RUN chown -R autoscaler:autoscaler /app

USER autoscaler

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "src/index.js"]