#!/bin/bash
set -e

echo "🔍 Performing comprehensive system health check..."

# 1. Check Docker containers
echo "\n📦 Checking Docker services..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || {
    echo "❌ Docker check failed"
    exit 1
}

# 2. Database health check
echo "\n🗄️ Checking PostgreSQL..."
pg_isready -h localhost -p 5432 || {
    echo "❌ PostgreSQL is not responding"
    exit 1
}

# 3. Redis health check
echo "\n💾 Checking Redis..."
redis-cli ping || {
    echo "❌ Redis is not responding"
    exit 1
}

# 4. API health checks
echo "\n🌐 Checking API endpoints..."
curl --fail https://api.thenewfuse.com/health || {
    echo "❌ API health check failed"
    exit 1
}

# 5. Frontend health check
echo "\n🖥️ Checking Frontend..."
curl --fail https://thenewfuse.com/health || {
    echo "❌ Frontend health check failed"
    exit 1
}

echo "\n✅ All core services are healthy!"