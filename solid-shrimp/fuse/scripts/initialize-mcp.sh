#!/bin/bash

# Initialize MCP Integration for The New Fuse
echo "Starting MCP Integration setup..."

# Create necessary directories
mkdir -p ./mcp/logs
mkdir -p ./mcp/cache
mkdir -p ./mcp/data

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running or not installed. Please start Docker and try again."
  exit 1
fi

# Update MCP configuration
echo "Updating MCP configuration..."
if [ -f ./src/vscode-extension/mcp_config.json ]; then
  cp ./src/vscode-extension/mcp_config.json ./mcp_config.json
  echo "MCP configuration updated."
else
  echo "Warning: MCP configuration file not found."
fi

# Pull required Docker images
echo "Pulling required Docker images..."
docker pull postgres:13-alpine
docker pull redis:6-alpine
docker pull node:16-alpine

# Start required containers if not already running
if ! docker ps | grep -q "fuse-postgres"; then
  echo "Starting PostgreSQL container..."
  docker run --name fuse-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=fuse -p 5432:5432 -d postgres:13-alpine
fi

if ! docker ps | grep -q "fuse-redis"; then
  echo "Starting Redis container..."
  docker run --name fuse-redis -p 6379:6379 -d redis:6-alpine
fi

# Fix permissions for script files
echo "Setting execution permissions for scripts..."
find ./scripts -name "*.sh" -exec chmod +x {} \;

# Initialize database
echo "Initializing database schema..."
if [ -f ./scripts/reset-db-simple.sh ]; then
  ./scripts/reset-db-simple.sh
else
  echo "Warning: Database initialization script not found."
fi

echo "MCP Integration setup complete!"
echo "You can now use MCP tools to communicate between AI agents."