#!/bin/bash
set -e

echo "🚀 Launching The New Fuse development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if docker-compose.dev.yml exists
if [ ! -f "docker-compose.dev.yml" ]; then
  echo "❌ docker-compose.dev.yml not found. Please run this script from the project root."
  exit 1
fi

# Start the development environment
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Show running containers
echo "🔍 Running containers:"
docker-compose -f docker-compose.dev.yml ps

echo "✅ Development environment is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "To stop the development environment, run:"
echo "docker-compose -f docker-compose.dev.yml down"
