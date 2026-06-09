#!/bin/bash
# TNF System Health Verification
# Cloud-first health check - gracefully skips unavailable local services

echo "🔍 Performing comprehensive system health check..."

# Track failures but don't exit on local service failures
LOCAL_SERVICES_FAILED=0
API_HEALTH_URL="${TNF_API_HEALTH_URL:-https://api.thenewfuse.com/api/health}"
FRONTEND_HEALTH_URL="${TNF_FRONTEND_HEALTH_URL:-https://thenewfuse.com/health}"

# 1. Check Docker containers (optional)
printf '\n📦 Checking Docker services...\n'
if command -v docker &> /dev/null && docker info &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "⚠️ Docker not running"
else
    echo "⚠️ Docker not available (skipping)"
fi

# 2. Database health check (cloud-first)
printf '\n🗄️ Checking PostgreSQL...\n'
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 &> /dev/null || pg_isready -h localhost -p 5433 &> /dev/null; then
        echo "✅ Local PostgreSQL is ready"
    else
        echo "⚠️ Local PostgreSQL not running (using cloud DB)"
    fi
else
    echo "⚠️ PostgreSQL client not installed (using cloud DB)"
fi

# 3. Redis health check (cloud-first)
printf '\n💾 Checking Redis...\n'
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Local Redis is ready"
    else
        echo "⚠️ Local Redis not running (using cloud Redis)"
    fi
else
    echo "⚠️ Redis client not installed (using cloud Redis)"
fi

# 4. API health checks (critical)
printf '\n🌐 Checking API endpoints...\n'
echo "API health URL: $API_HEALTH_URL"
if curl --silent --fail "$API_HEALTH_URL" &> /dev/null; then
    echo "✅ Cloud API is healthy"
else
    echo "❌ Cloud API health check failed"
    LOCAL_SERVICES_FAILED=1
fi

# 5. Frontend health check (optional - may be local)
printf '\n🖥️ Checking Frontend...\n'
if curl --silent --fail "$FRONTEND_HEALTH_URL" &> /dev/null || curl --silent --fail http://localhost:3000/health &> /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️ Frontend not accessible (may need local start)"
fi

# Summary
echo ""
if [ $LOCAL_SERVICES_FAILED -eq 0 ]; then
    echo "✅ TNF System Health: PASS (cloud services operational)"
    exit 0
else
    echo "❌ TNF System Health: FAIL"
    exit 1
fi
