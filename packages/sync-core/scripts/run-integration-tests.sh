#!/bin/bash

# Multi-Tenant Chokidar Sync Integration Test Runner
# This script sets up the environment and runs comprehensive integration tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="sync_integration_test"
TEST_REDIS_DB="15"
ARTIFACTS_DIR="test-artifacts/integration"
LOG_FILE="$ARTIFACTS_DIR/test-run.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create artifacts directory
mkdir -p "$ARTIFACTS_DIR"
echo "Integration Test Run - $(date)" > "$LOG_FILE"

log "🚀 Starting Multi-Tenant Chokidar Sync Integration Tests"

# Check prerequisites
log "📋 Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    error "PostgreSQL is not installed"
    exit 1
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    error "Redis is not installed"
    exit 1
fi

# Test PostgreSQL connection
if ! pg_isready -q; then
    error "PostgreSQL is not running"
    exit 1
fi

# Test Redis connection
if ! redis-cli ping > /dev/null 2>&1; then
    error "Redis is not running"
    exit 1
fi

success "All prerequisites met"

# Set environment variables
export NODE_ENV=test
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/$TEST_DB_NAME"
export TEST_REDIS_URL="redis://localhost:6379/$TEST_REDIS_DB"
export TEST_ARTIFACTS_DIR="$PWD/$ARTIFACTS_DIR"

log "🔧 Environment configuration:"
log "  NODE_ENV: $NODE_ENV"
log "  TEST_DATABASE_URL: $TEST_DATABASE_URL"
log "  TEST_REDIS_URL: $TEST_REDIS_URL"
log "  TEST_ARTIFACTS_DIR: $TEST_ARTIFACTS_DIR"

# Setup test database
log "📊 Setting up test database..."

# Drop and recreate test database
dropdb --if-exists "$TEST_DB_NAME" 2>/dev/null || true
createdb "$TEST_DB_NAME"

# Run database migrations
log "Running database migrations..."
pnpm db:push 2>&1 | tee -a "$LOG_FILE"

success "Test database ready"

# Clear Redis test database
log "🗄️  Clearing Redis test database..."
redis-cli -n "$TEST_REDIS_DB" FLUSHDB > /dev/null
success "Redis test database cleared"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log "📦 Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
fi

# Run tests based on arguments
TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
    "unit")
        log "🧪 Running unit tests..."
        npm run test:unit 2>&1 | tee -a "$LOG_FILE"
        ;;
    "integration")
        log "🔗 Running integration tests..."
        npm run test:integration 2>&1 | tee -a "$LOG_FILE"
        ;;
    "performance")
        log "⚡ Running performance tests..."
        npm run test:performance 2>&1 | tee -a "$LOG_FILE"
        ;;
    "security")
        log "🔒 Running security tests..."
        npm run test:security 2>&1 | tee -a "$LOG_FILE"
        ;;
    "all")
        log "🎯 Running all tests..."
        
        log "Step 1/3: Unit tests"
        npm run test:unit 2>&1 | tee -a "$LOG_FILE"
        
        log "Step 2/3: Integration tests"
        npm run test:integration 2>&1 | tee -a "$LOG_FILE"
        
        log "Step 3/3: Generating coverage report"
        npx vitest --coverage --reporter=json --reporter=html 2>&1 | tee -a "$LOG_FILE"
        ;;
    *)
        error "Unknown test type: $TEST_TYPE"
        echo "Usage: $0 [unit|integration|performance|security|all]"
        exit 1
        ;;
esac

TEST_EXIT_CODE=$?

# Generate test report
log "📊 Generating test report..."

REPORT_FILE="$ARTIFACTS_DIR/test-report.json"
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "testType": "$TEST_TYPE",
  "exitCode": $TEST_EXIT_CODE,
  "environment": {
    "nodeVersion": "$NODE_VERSION",
    "databaseUrl": "$TEST_DATABASE_URL",
    "redisUrl": "$TEST_REDIS_URL"
  },
  "artifacts": {
    "logFile": "$LOG_FILE",
    "reportFile": "$REPORT_FILE",
    "coverageDir": "coverage/"
  }
}
EOF

# Cleanup
log "🧹 Cleaning up..."

# Drop test database
dropdb --if-exists "$TEST_DB_NAME" 2>/dev/null || true

# Clear Redis test database
redis-cli -n "$TEST_REDIS_DB" FLUSHDB > /dev/null

# Check test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    success "All tests passed! 🎉"
    log "Test artifacts saved to: $ARTIFACTS_DIR"
    
    # Display coverage summary if available
    if [ -f "coverage/coverage-summary.json" ]; then
        log "📈 Coverage Summary:"
        cat coverage/coverage-summary.json | jq '.total' 2>/dev/null || true
    fi
else
    error "Tests failed with exit code: $TEST_EXIT_CODE"
    log "Check the log file for details: $LOG_FILE"
    exit $TEST_EXIT_CODE
fi

log "✅ Integration test run completed successfully"
