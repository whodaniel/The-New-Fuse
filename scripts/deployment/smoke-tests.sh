#!/bin/bash

###############################################################################
# The New Fuse - Smoke Tests
# Quick validation tests to verify deployment health
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
TIMEOUT="${TIMEOUT:-30}"
RETRY_COUNT="${RETRY_COUNT:-3}"
RETRY_DELAY="${RETRY_DELAY:-5}"

TESTS_PASSED=0
TESTS_FAILED=0

log() {
  local level=$1
  shift
  local message="$*"

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" ;;
    SUCCESS) echo -e "${GREEN}[✓]${NC} $message" ;;
    WARNING) echo -e "${YELLOW}[⚠]${NC} $message" ;;
    ERROR)   echo -e "${RED}[✗]${NC} $message" ;;
    STEP)    echo -e "${MAGENTA}[STEP]${NC} $message" ;;
    *)       echo "$message" ;;
  esac
}

print_banner() {
  echo ""
  echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║${NC}  ${BOLD}Smoke Tests${NC}                                                 ${BOLD}${BLUE}║${NC}"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

make_request() {
  local url=$1
  local expected_status=${2:-200}
  local timeout=${3:-$TIMEOUT}

  local response=$(curl -s -w "\n%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo -e "\n000")
  local status=$(echo "$response" | tail -1)
  local body=$(echo "$response" | head -n -1)

  echo "$status"
}

make_request_with_body() {
  local url=$1
  local timeout=${2:-$TIMEOUT}

  curl -s --max-time "$timeout" "$url" 2>/dev/null || echo ""
}

test_health_endpoint() {
  local service_name=$1
  local url=$2
  local expected_status=${3:-200}

  log STEP "Testing $service_name health endpoint..."

  local attempts=0
  local success=false

  while [[ $attempts -lt $RETRY_COUNT ]]; do
    local status=$(make_request "$url" "$expected_status")

    if [[ "$status" == "$expected_status" ]]; then
      log SUCCESS "$service_name health check passed (HTTP $status)"
      ((TESTS_PASSED++))
      success=true
      break
    else
      ((attempts++))
      if [[ $attempts -lt $RETRY_COUNT ]]; then
        log WARNING "Attempt $attempts failed (HTTP $status), retrying in ${RETRY_DELAY}s..."
        sleep "$RETRY_DELAY"
      fi
    fi
  done

  if [[ "$success" == "false" ]]; then
    log ERROR "$service_name health check failed (HTTP $status)"
    ((TESTS_FAILED++))
    return 1
  fi

  return 0
}

test_api_response() {
  local endpoint=$1
  local expected_content=$2

  log STEP "Testing API response for: $endpoint"

  local response=$(make_request_with_body "$endpoint")

  if echo "$response" | grep -q "$expected_content"; then
    log SUCCESS "API response contains expected content"
    ((TESTS_PASSED++))
    return 0
  else
    log ERROR "API response missing expected content"
    log INFO "Expected: $expected_content"
    log INFO "Got: ${response:0:100}..."
    ((TESTS_FAILED++))
    return 1
  fi
}

test_railway_service() {
  local service=$1

  log STEP "Testing Railway service: $service"

  if ! command -v railway &>/dev/null; then
    log WARNING "Railway CLI not available, skipping"
    return 0
  fi

  if railway status --service "$service" &>/dev/null; then
    log SUCCESS "$service is running on Railway"
    ((TESTS_PASSED++))
    return 0
  else
    log ERROR "$service is not running on Railway"
    ((TESTS_FAILED++))
    return 1
  fi
}

test_database_connectivity() {
  log STEP "Testing database connectivity..."

  if [[ -z "${DATABASE_URL:-}" ]]; then
    log WARNING "DATABASE_URL not set, skipping database test"
    return 0
  fi

  if pnpm drizzle db execute --stdin <<< "SELECT 1;" &>/dev/null; then
    log SUCCESS "Database is accessible"
    ((TESTS_PASSED++))
    return 0
  else
    log ERROR "Database is not accessible"
    ((TESTS_FAILED++))
    return 1
  fi
}

test_redis_connectivity() {
  log STEP "Testing Redis connectivity..."

  if [[ -z "${REDIS_URL:-}" ]]; then
    log WARNING "REDIS_URL not set, skipping Redis test"
    return 0
  fi

  if command -v redis-cli &>/dev/null; then
    if redis-cli -u "$REDIS_URL" PING &>/dev/null; then
      log SUCCESS "Redis is accessible"
      ((TESTS_PASSED++))
      return 0
    else
      log ERROR "Redis is not accessible"
      ((TESTS_FAILED++))
      return 1
    fi
  else
    log WARNING "redis-cli not available, skipping Redis test"
    return 0
  fi
}

test_environment_variables() {
  log STEP "Testing critical environment variables..."

  local critical_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
  local missing_vars=()

  for var in "${critical_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing_vars+=("$var")
    fi
  done

  if [[ ${#missing_vars[@]} -eq 0 ]]; then
    log SUCCESS "All critical environment variables are set"
    ((TESTS_PASSED++))
    return 0
  else
    log ERROR "Missing environment variables: ${missing_vars[*]}"
    ((TESTS_FAILED++))
    return 1
  fi
}

###############################################################################
# Service-Specific Tests
###############################################################################

test_api_gateway() {
  print_section "API Gateway Smoke Tests"

  # Get API Gateway URL
  local api_url="${API_GATEWAY_URL:-http://localhost:3002}"

  # Test health endpoint
  test_health_endpoint "API Gateway" "$api_url/health" 200

  # Test basic API endpoint
  # Uncomment and adjust based on your actual endpoints
  # test_api_response "$api_url/api/status" "ok"
}

test_backend() {
  print_section "Backend Service Smoke Tests"

  local backend_url="${BACKEND_URL:-http://localhost:3003}"

  test_health_endpoint "Backend" "$backend_url/health" 200
}

test_frontend() {
  print_section "Frontend Service Smoke Tests"

  local frontend_url="${FRONTEND_URL:-http://localhost:3000}"

  test_health_endpoint "Frontend" "$frontend_url" 200
}

test_api() {
  print_section "API Service Smoke Tests"

  local api_url="${API_URL:-http://localhost:3001}"

  test_health_endpoint "API" "$api_url/health" 200
}

###############################################################################
# Railway-Specific Tests
###############################################################################

test_railway_services() {
  print_section "Railway Service Tests"

  if ! command -v railway &>/dev/null; then
    log WARNING "Railway CLI not available, skipping Railway tests"
    return 0
  fi

  local services=("api-gateway" "backend" "frontend" "api")

  for service in "${services[@]}"; do
    test_railway_service "$service" || true
  done
}

###############################################################################
# Performance Tests
###############################################################################

test_response_time() {
  print_section "Response Time Tests"

  local url="${1:-${API_GATEWAY_URL:-http://localhost:3002}/health}"
  local max_response_time=2000  # 2 seconds in milliseconds

  log STEP "Testing response time for: $url"

  local start_time=$(date +%s%3N)
  local status=$(make_request "$url")
  local end_time=$(date +%s%3N)

  local response_time=$((end_time - start_time))

  log INFO "Response time: ${response_time}ms"

  if [[ $response_time -lt $max_response_time ]]; then
    log SUCCESS "Response time within acceptable range"
    ((TESTS_PASSED++))
    return 0
  else
    log WARNING "Response time exceeds ${max_response_time}ms"
    ((TESTS_FAILED++))
    return 1
  fi
}

###############################################################################
# Main Test Flow
###############################################################################

main() {
  print_banner

  log INFO "Starting smoke tests..."
  log INFO "Timeout: ${TIMEOUT}s per request"
  log INFO "Retry count: $RETRY_COUNT"

  # Infrastructure tests
  print_section "Infrastructure Tests"
  test_database_connectivity || true
  test_redis_connectivity || true
  test_environment_variables || true

  # Service tests
  test_api_gateway || true
  test_backend || true
  test_frontend || true
  test_api || true

  # Railway tests
  test_railway_services || true

  # Performance tests
  test_response_time || true

  # Summary
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}Smoke Test Summary${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
  echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
  echo ""

  if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ All smoke tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}${BOLD}✗ Some smoke tests failed${NC}"
    echo ""
    echo "Please investigate the failures before proceeding."
    exit 1
  fi
}

main

exit 0
