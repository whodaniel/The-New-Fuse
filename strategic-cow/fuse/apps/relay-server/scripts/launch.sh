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
bun --filter @the-new-fuse/types run build
bun --filter @the-new-fuse/utils run build
bun --filter @the-new-fuse/ui run build
bun --filter @the-new-fuse/core run build
bun --filter @the-new-fuse/database run build
bun --filter @the-new-fuse/feature-tracker run build
bun --filter @the-new-fuse/feature-suggestions run build

# Start infrastructure services
echo "🛠 Starting infrastructure services..."
docker-compose -f docker/infrastructure.yml up -d

# Wait for infrastructure services
sleep 10

# Start backend services
echo "🔧 Starting backend services..."
bun --filter @the-new-fuse/api run start:prod &
bun --filter @the-new-fuse/backend run start:prod &

# Wait for backend services to be healthy
check_health "API" "http://localhost:3001/health"
check_health "Backend" "http://localhost:3002/health"

# Start frontend application
echo "🌐 Starting frontend application..."
bun --filter @the-new-fuse/frontend run start:prod &

# Start monitoring services
echo "📊 Starting monitoring services..."
bun --filter monitoring run start &

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
