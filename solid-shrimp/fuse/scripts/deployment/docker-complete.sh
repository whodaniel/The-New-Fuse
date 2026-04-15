#!/bin/bash
set -e

echo "🚀 Starting The New Fuse complete development environment using Docker..."

# Build and start the Docker containers
docker-compose -f docker-compose.complete.yml up --build

echo "✅ Development environment is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "📨 Message Broker: http://localhost:3002"
