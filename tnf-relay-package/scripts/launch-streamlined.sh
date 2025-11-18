#!/bin/bash
set -e

echo "🚀 Launching The New Fuse..."

# Define environment variables
PROJECT_BASE_DIR="${PROJECT_BASE_DIR:-.}"
LOGS_BASE_DIR="${LOGS_BASE_DIR:-$PROJECT_BASE_DIR/logs}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGS_DIR="$LOGS_BASE_DIR/launch_${TIMESTAMP}"
mkdir -p "$LOGS_DIR"

# Function to check service health
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

# Step 1: Start Redis
echo "📦 Step 1: Starting Redis..."
brew services start redis > "$LOGS_DIR/redis.log" 2>&1
sleep 3

# Verify Redis is running
if ! redis-cli ping | grep -q "PONG"; then
    echo "❌ Redis failed to start"
    exit 1
fi

# Step 2: Build essential packages
echo "📦 Step 2: Building packages..."
bun --filter @the-new-fuse/types run build > "$LOGS_DIR/build.log" 2>&1
bun --filter @the-new-fuse/utils run build >> "$LOGS_DIR/build.log" 2>&1
bun --filter @the-new-fuse/ui run build >> "$LOGS_DIR/build.log" 2>&1
bun --filter @the-new-fuse/core run build >> "$LOGS_DIR/build.log" 2>&1
bun --filter @the-new-fuse/database run build >> "$LOGS_DIR/build.log" 2>&1

# Step 3: Database setup
echo "📊 Step 3: Setting up database..."
bun prisma:generate > "$LOGS_DIR/database.log" 2>&1
bun prisma:migrate >> "$LOGS_DIR/database.log" 2>&1

# Step 4: Start services
echo "🚀 Step 4: Starting services..."
docker-compose -f docker/production.yml up -d > "$LOGS_DIR/services.log" 2>&1

# Step 5: Health checks
echo "🔍 Step 5: Performing health checks..."
check_health "API" "http://localhost:3000/health" || true
check_health "Frontend" "http://localhost:5173" || true
check_health "Trae Agent" "http://localhost:3001/health" || true

echo "✨ The New Fuse has been successfully launched! ✨"
echo "📝 Launch logs are available at $LOGS_DIR"