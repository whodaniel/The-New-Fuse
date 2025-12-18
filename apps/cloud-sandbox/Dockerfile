# The New Fuse - Cloud Sandbox with Playwright
# MCP server with headless browser automation for Railway deployment

FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install Node.js 22
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy only cloud-sandbox files
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies (including Playwright)
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
