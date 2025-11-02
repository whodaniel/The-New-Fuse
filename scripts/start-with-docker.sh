#!/bin/bash

# Start The New Fuse with Docker infrastructure
# This script starts PostgreSQL and Redis in Docker, then runs the applications

echo "🐳 Starting The New Fuse with Docker Infrastructure"
echo "=================================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start Docker services
echo "🚀 Starting PostgreSQL and Redis with Docker..."
docker-compose -f docker-compose.dev-simple.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.dev-simple.yml ps

# Load Docker environment variables
echo "📝 Loading Docker environment variables..."
export $(cat .env.docker | xargs)

# Display service information
echo ""
echo "✅ Docker Services Ready:"
echo "   📊 PostgreSQL: localhost:5433"
echo "   🗄️  Redis: localhost:6380"
echo ""
echo "🎯 Ready to start applications with:"
echo "   • Frontend: pnpm run dev:frontend"
echo "   • Backend: DATABASE_URL=$DATABASE_URL REDIS_URL=$REDIS_URL pnpm run dev:backend"
echo "   • Electron: pnpm run dev:hub"
echo ""
echo "💡 To stop Docker services: docker-compose -f docker-compose.dev-simple.yml down"