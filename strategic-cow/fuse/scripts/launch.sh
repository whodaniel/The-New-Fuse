#!/bin/bash
set -e

echo "🚀 Launching The New Fuse application suite..."

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Function to check if a service is healthy
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "Checking health of $service..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null; then
            echo "✅ $service is healthy"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $service not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo "❌ $service failed to become healthy"
    return 1
}

# Build all packages in correct order
echo "📦 Building packages..."
yarn workspace @the-new-fuse/types build
yarn workspace @the-new-fuse/utils build
yarn workspace @the-new-fuse/ui build
yarn workspace @the-new-fuse/core build
yarn workspace @the-new-fuse/database build
yarn workspace @the-new-fuse/feature-tracker build
yarn workspace @the-new-fuse/feature-suggestions build

# Start infrastructure services
echo "🛠 Starting infrastructure services..."
docker-compose -f docker/infrastructure.yml up -d

# Wait for infrastructure services
sleep 10

# Start backend services
echo "🔧 Starting backend services..."
yarn workspace @the-new-fuse/api start:prod &
yarn workspace @the-new-fuse/backend start:prod &

# Wait for backend services to be healthy
check_health "API" "http://localhost:3001/health"
check_health "Backend" "http://localhost:3002/health"

# Start frontend application
echo "🌐 Starting frontend application..."
yarn workspace @the-new-fuse/frontend start:prod &

# Start monitoring services
echo "📊 Starting monitoring services..."
yarn workspace monitoring start &

# Final health check
echo "🔍 Performing final health checks..."
check_health "Frontend" "http://localhost:3000"

echo "✨ All services are up and running!"
echo "
📝 Service URLs:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Backend: http://localhost:3002
- Monitoring: http://localhost:3003
"
