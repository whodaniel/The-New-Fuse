#!/bin/bash
set -e

echo "🔍 Running post-deployment verification..."

# Check service health
check_endpoint() {
    local service=$1
    local endpoint=$2
    local max_retries=5
    local retry=0

    while [ $retry -lt $max_retries ]; do
        if curl -s -f "$endpoint/health" > /dev/null; then
            echo "✅ $service is healthy"
            return 0
        fi
        retry=$((retry+1))
        sleep 5
    done
    echo "❌ $service health check failed"
    return 1
}

# Verify all services
check_endpoint "API" "https://api.fuse.production"
check_endpoint "Frontend" "https://app.fuse.production"
check_endpoint "GDesigner" "https://gdesigner.fuse.production"

# Verify database connections
echo "🔍 Verifying database connections..."
bun --filter @the-new-fuse/database run check-connection

# Verify cache system
echo "🔍 Verifying cache system..."
redis-cli -h redis-primary ping

# Check monitoring
echo "🔍 Verifying monitoring systems..."
curl -s -f "https://monitor.fuse.production/health"
