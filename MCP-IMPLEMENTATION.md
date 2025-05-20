# MCP Implementation Guide

## Overview
Combines protocol implementation details with usage documentation for the Model Context Protocol integration in The New Fuse extension.

## Prerequisites
```bash
./setup-extension.sh
./launch-vscode.sh
```

## Command Reference
### Core Commands
- `thefuse.mcp.initialize`: Initialize MCP system
- `thefuse.mcp.showTools`: Display available tools
- `thefuse.mcp.testTool`: Test individual tool
- `thefuse.mcp.askAgent`: Agent-assisted tool usage

## Usage Examples
1. **Basic Initialization**:
   - Command Palette → "Initialize MCP"
   - Monitor output channel for initialization status

2. **Tool Testing Workflow**:
   ```bash
   echo "Test content" > ./data/example.txt
   ```
   - Run `thefuse.mcp.testTool` → Select `read_file`
   - Input: `{"path": "./data/example.txt"}`

3. **Agent Interaction**:
   - Ask: "What's in example.txt?"
   - Agent will automatically use `read_file` tool

## Protocol Implementation Details
- JSON-RPC 2.0 over stdio
- Tool discovery via `get_tools` method
- Automatic process management (spawn/cleanup)
- Error handling with VS Code diagnostics

## Docker Configuration

### Multi-Stage Build Setup
```dockerfile
# Base Dockerfile template with environment variables
ARG NODE_VERSION=20-bullseye
ARG NGINX_VERSION=alpine

### Shared Build Stage ###
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN corepack enable && corepack prepare yarn@3.6.0 --activate

### Development Image ###
FROM builder AS dev
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    postgresql-client \
    net-tools \
    htop
COPY . .
CMD ["yarn", "dev"]

### Production API Service ###
FROM node:${NODE_VERSION}-slim AS api
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]

### Client Build ###
FROM nginx:${NGINX_VERSION} AS client
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R nginx:nginx /usr/share/nginx/html
```

### docker-compose.yml
```yaml
services:
  api:
    build:
      context: .
      target: api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/the_new_fuse
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: .
      target: client
    ports:
      - "3000:80"

  postgres:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## MCP Server Configuration
```json
// mcp_config.json
{
  "mcpServers": {
    "coreTools": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {"LOG_LEVEL": "debug"}
    }
  }
}
```

## Deprecated Documents
- MCP-COMMANDS-GUIDE.md
- MCP-USAGE.md
- MCP-NEXT-STEPS.md

> **Important**: This consolidated document replaces all previous MCP-related guides.