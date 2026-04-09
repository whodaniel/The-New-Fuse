#!/bin/bash

echo "📊 Checking application health metrics..."

# Check for required infrastructure services
REQUIRED_SERVICES=(
    "postgres:5432"
    "redis:6379"
    "api:3001"
    "frontend:3000"
    "backend:3002"
)

for service in "${REQUIRED_SERVICES[@]}"; do
    NAME="${service%%:*}"
    PORT="${service##*:}"
    
    if lsof -i ":$PORT" > /dev/null; then
        echo "✅ $NAME is running on port $PORT"
    else
        echo "❌ $NAME is not running on port $PORT"
    fi
done

# Verify application components
echo "\n🔄 Verifying application components..."
yarn workspace @the-new-fuse/core run-health-checks

echo "\n📝 Health check summary will be available at http://localhost:3003/health-dashboard"