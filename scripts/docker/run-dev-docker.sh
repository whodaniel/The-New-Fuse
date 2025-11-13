#!/bin/bash
set -e

echo "🚀 Starting The New Fuse development environment using Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build and start the Docker containers
echo "🐳 Building and starting Docker containers..."
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Development environment is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "📨 Message Broker: http://localhost:3002"
