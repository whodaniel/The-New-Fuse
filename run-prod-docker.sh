#!/bin/bash
set -e

echo "🚀 Starting The New Fuse production environment using Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build the Docker images
echo "🏗️ Building Docker images..."
docker-compose -f docker-compose.yml build

# Start the Docker containers
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.yml up -d

echo "✅ Production environment is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "📨 Message Broker: http://localhost:3002"
echo ""
echo "To view logs, run:"
echo "docker-compose -f docker-compose.yml logs -f"
echo ""
echo "To stop the environment, run:"
echo "docker-compose -f docker-compose.yml down"
