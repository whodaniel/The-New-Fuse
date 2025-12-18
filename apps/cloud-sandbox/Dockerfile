# The New Fuse - Cloud Sandbox
# Standalone MCP server for Railway deployment

FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy only cloud-sandbox files
# Copy only cloud-sandbox files
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies
RUN npm install

# Build TypeScript
RUN npx tsc

# Expose MCP server port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start MCP server
CMD ["node", "dist/server.js"]
