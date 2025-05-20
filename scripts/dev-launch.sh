#!/bin/bash

# Exit on error
set -e

echo "🚀 Launching The New Fuse in development mode..."

# Check Docker status
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running!"

# Start infrastructure services first
echo "🛠️ Starting infrastructure services..."
if [ -f "docker/development.yml" ]; then
    docker-compose -f docker/development.yml up -d
else
    docker-compose up -d
fi

# Wait for infrastructure to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Install dependencies without frozen lockfile to resolve peer dependencies
echo "📦 Installing dependencies..."
yarn install

# Start development servers
echo "🔧 Starting development servers..."
yarn dev

echo "✨ The New Fuse is now running in development mode!"
echo "
📝 Service URLs:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Backend: http://localhost:3002
"

# Keep script running
wait
