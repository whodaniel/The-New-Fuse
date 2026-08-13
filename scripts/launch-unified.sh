#!/bin/bash
set -e

echo "🚀 Launching The New Fuse in development mode..."

# Check Docker status
echo "🐳 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running!"

# Prepare fresh environment
echo "🧹 Preparing fresh environment..."
./scripts/fresh-env.sh

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build core packages in correct order
echo "🔨 Building core packages..."
yarn workspace @the-new-fuse/types build
yarn workspace @the-new-fuse/utils build
yarn workspace @the-new-fuse/core build
yarn workspace @the-new-fuse/database build
yarn workspace @the-new-fuse/feature-tracker build
yarn workspace @the-new-fuse/feature-suggestions build

# Setup database
echo "🗄️ Setting up database..."
yarn workspace @the-new-fuse/database generate
yarn workspace @the-new-fuse/database migrate

# Start infrastructure services
echo "🛠️ Starting infrastructure services..."
docker-compose -f docker/development.yml up -d

# Start services
echo "🔧 Starting services..."
yarn workspace @the-new-fuse/api start &
yarn workspace @the-new-fuse/backend start &
yarn workspace @the-new-fuse/frontend start &

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

echo "✨ The New Fuse is now running!"
echo "
📝 Service URLs:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Backend: http://localhost:3002
- Health Dashboard: http://localhost:3003/health-dashboard
"
