#!/bin/bash

# Performance Optimization Verification Script
# This script verifies that all performance optimizations are properly configured

set -e

echo "========================================="
echo "Performance Optimization Verification"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

echo "1. Checking File Structure..."
echo "-----------------------------------"

# Check interceptors
if [ -f "src/interceptors/etag.interceptor.ts" ]; then
    success "ETag interceptor exists"
else
    error "ETag interceptor missing"
fi

if [ -f "src/interceptors/cache.interceptor.ts" ]; then
    success "Cache interceptor exists"
else
    error "Cache interceptor missing"
fi

if [ -f "src/interceptors/compression.interceptor.ts" ]; then
    success "Compression interceptor exists"
else
    error "Compression interceptor missing"
fi

if [ -f "src/interceptors/performance.interceptor.ts" ]; then
    success "Performance interceptor exists"
else
    error "Performance interceptor missing"
fi

# Check monitoring
if [ -f "src/monitoring/performance-metrics.service.ts" ]; then
    success "Performance metrics service exists"
else
    error "Performance metrics service missing"
fi

if [ -f "src/monitoring/performance-metrics.controller.ts" ]; then
    success "Performance metrics controller exists"
else
    error "Performance metrics controller missing"
fi

# Check load tests
if [ -f "tests/load/k6-load-test.js" ]; then
    success "k6 load test exists"
else
    error "k6 load test missing"
fi

if [ -f "tests/load/artillery-config.yml" ]; then
    success "Artillery config exists"
else
    error "Artillery config missing"
fi

echo ""
echo "2. Checking Database Migrations..."
echo "-----------------------------------"

if [ -f "../../packages/database/prisma/migrations/add_performance_indexes.sql" ]; then
    success "Database index migration exists"
else
    error "Database index migration missing"
fi

echo ""
echo "3. Checking Environment Configuration..."
echo "-----------------------------------"

if [ -f ".env.performance" ]; then
    success "Performance env template exists"
else
    warning "Performance env template missing"
fi

if [ -f ".env.local" ]; then
    success ".env.local exists"

    # Check critical environment variables
    if grep -q "DATABASE_URL" .env.local 2>/dev/null; then
        success "DATABASE_URL configured"
    else
        warning "DATABASE_URL not configured"
    fi

    if grep -q "REDIS_HOST" .env.local 2>/dev/null; then
        success "REDIS_HOST configured"
    else
        warning "REDIS_HOST not configured"
    fi
else
    warning ".env.local not found - using .env"
fi

echo ""
echo "4. Checking Dependencies..."
echo "-----------------------------------"

if [ -f "package.json" ]; then
    if grep -q "prom-client" package.json; then
        success "prom-client dependency found"
    else
        warning "prom-client not in package.json (needed for metrics)"
    fi

    if grep -q "compression" package.json; then
        success "compression dependency found"
    else
        warning "compression not in package.json"
    fi

    if grep -q "ioredis" package.json; then
        success "ioredis dependency found"
    else
        error "ioredis not in package.json (required for caching)"
    fi
else
    error "package.json not found"
fi

echo ""
echo "5. Checking Service Implementations..."
echo "-----------------------------------"

# Check if services use pagination
if grep -q "page.*limit" src/users/users.service.ts 2>/dev/null; then
    success "Users service implements pagination"
else
    warning "Users service may not implement pagination"
fi

if grep -q "select:" src/users/users.service.ts 2>/dev/null; then
    success "Users service uses select() optimization"
else
    warning "Users service may not use select() optimization"
fi

# Check Prisma service
if grep -q "connection" src/prisma/prisma.service.ts 2>/dev/null; then
    success "Prisma service has connection configuration"
else
    warning "Prisma service may need connection optimization"
fi

# Check Redis service
if grep -q "enableAutoPipelining" src/services/redis.service.ts 2>/dev/null; then
    success "Redis service has auto-pipelining enabled"
else
    warning "Redis service may not have auto-pipelining"
fi

echo ""
echo "6. Testing Load Test Scripts..."
echo "-----------------------------------"

# Check if k6 is installed
if command -v k6 &> /dev/null; then
    success "k6 is installed"

    # Validate k6 scripts
    if k6 inspect tests/load/k6-load-test.js &> /dev/null; then
        success "k6 load test script is valid"
    else
        warning "k6 load test script may have issues"
    fi
else
    warning "k6 is not installed (needed for load testing)"
    echo "    Install with: brew install k6 (macOS) or see https://k6.io/docs/getting-started/installation/"
fi

# Check if artillery is installed
if command -v artillery &> /dev/null; then
    success "Artillery is installed"
else
    warning "Artillery is not installed (optional)"
    echo "    Install with: npm install -g artillery"
fi

echo ""
echo "7. Checking Documentation..."
echo "-----------------------------------"

if [ -f "PERFORMANCE_OPTIMIZATION.md" ]; then
    success "Performance optimization guide exists"
else
    warning "Performance optimization guide missing"
fi

if [ -f "PERFORMANCE_SETUP.md" ]; then
    success "Performance setup guide exists"
else
    warning "Performance setup guide missing"
fi

if [ -f "tests/load/README.md" ]; then
    success "Load testing README exists"
else
    warning "Load testing README missing"
fi

echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}Some critical checks failed. Please review the errors above.${NC}"
    exit 1
elif [ $CHECKS_WARNING -gt 0 ]; then
    echo -e "${YELLOW}All critical checks passed, but there are some warnings.${NC}"
    echo "Review the warnings above and fix if necessary."
    exit 0
else
    echo -e "${GREEN}All checks passed! Performance optimizations are properly configured.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Apply database indexes: psql \$DATABASE_URL -f ../../packages/database/prisma/migrations/add_performance_indexes.sql"
    echo "2. Configure environment: cp .env.performance .env.local && edit .env.local"
    echo "3. Start the backend: npm run start:dev"
    echo "4. Run load tests: k6 run tests/load/k6-load-test.js"
    echo "5. Check metrics: curl http://localhost:3001/metrics"
    exit 0
fi
