#!/bin/bash

###############################################################################
# The New Fuse - Comprehensive Health Check System
# Advanced health verification for all services and dependencies
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HEALTH_CHECK_LOG_DIR="$PROJECT_ROOT/logs/health-checks"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
TIMEOUT="${TIMEOUT:-30}"
RETRY_COUNT="${RETRY_COUNT:-3}"
RETRY_DELAY="${RETRY_DELAY:-5}"
HEALTH_CHECK_MODE="${HEALTH_CHECK_MODE:-standard}" # standard, deep, minimal

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
CHECKS_TOTAL=0

# Create log directory
mkdir -p "$HEALTH_CHECK_LOG_DIR"
HEALTH_LOG="$HEALTH_CHECK_LOG_DIR/health-check-$(date +%Y%m%d-%H%M%S).log"

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$HEALTH_LOG" ;;
    SUCCESS) echo -e "${GREEN}[✓]${NC} $message" | tee -a "$HEALTH_LOG" ;;
    WARNING) echo -e "${YELLOW}[⚠]${NC} $message" | tee -a "$HEALTH_LOG" ;;
    ERROR)   echo -e "${RED}[✗]${NC} $message" | tee -a "$HEALTH_LOG" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" | tee -a "$HEALTH_LOG" ;;
    *)       echo "$message" | tee -a "$HEALTH_LOG" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$HEALTH_LOG"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}  ${BOLD}Comprehensive Health Check System${NC}                         ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# Health Check Functions
###############################################################################

check_result() {
  local status=$1
  local message=$2

  ((CHECKS_TOTAL++))

  case $status in
    success)
      log SUCCESS "$message"
      ((CHECKS_PASSED++))
      return 0
      ;;
    warning)
      log WARNING "$message"
      ((CHECKS_WARNING++))
      return 0
      ;;
    error|fail)
      log ERROR "$message"
      ((CHECKS_FAILED++))
      return 1
      ;;
  esac
}

make_http_request() {
  local url=$1
  local expected_status=${2:-200}
  local timeout=${3:-$TIMEOUT}
  local method=${4:-GET}

  local response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    -X "$method" \
    --max-time "$timeout" \
    "$url" 2>/dev/null || echo -e "\n000\n0")

  local status=$(echo "$response" | tail -2 | head -1)
  local time=$(echo "$response" | tail -1)
  local body=$(echo "$response" | head -n -2)

  echo "$status|$time|$body"
}

###############################################################################
# Service Health Checks
###############################################################################

check_service_health() {
  local service_name=$1
  local url=$2
  local expected_status=${3:-200}
  local check_content=${4:-}

  log STEP "Checking $service_name health..."

  local attempts=0
  local success=false

  while [[ $attempts -lt $RETRY_COUNT ]]; do
    local result=$(make_http_request "$url" "$expected_status")
    local status=$(echo "$result" | cut -d'|' -f1)
    local time=$(echo "$result" | cut -d'|' -f2)
    local body=$(echo "$result" | cut -d'|' -f3)

    if [[ "$status" == "$expected_status" ]]; then
      # Check response time
      local time_ms=$(echo "$time * 1000" | bc | cut -d'.' -f1)

      # Check content if specified
      if [[ -n "$check_content" ]]; then
        if echo "$body" | grep -q "$check_content"; then
          check_result success "$service_name is healthy (${time_ms}ms, content verified)"
          success=true
          break
        else
          log WARNING "Response missing expected content: $check_content"
        fi
      else
        check_result success "$service_name is healthy (${time_ms}ms)"
        success=true
        break
      fi
    fi

    ((attempts++))
    if [[ $attempts -lt $RETRY_COUNT ]]; then
      log INFO "Attempt $attempts failed (HTTP $status), retrying in ${RETRY_DELAY}s..."
      sleep "$RETRY_DELAY"
    fi
  done

  if [[ "$success" == "false" ]]; then
    check_result error "$service_name health check failed (HTTP $status)"
    return 1
  fi

  return 0
}

check_api_gateway_health() {
  print_section "API Gateway Health Check"

  local api_url="${API_GATEWAY_URL:-http://localhost:3002}"

  check_service_health "API Gateway" "$api_url/health" 200

  # Deep checks for API Gateway
  if [[ "$HEALTH_CHECK_MODE" == "deep" ]]; then
    log INFO "Performing deep health check..."

    # Check metrics endpoint
    if make_http_request "$api_url/metrics" 200 >/dev/null 2>&1; then
      check_result success "Metrics endpoint is accessible"
    else
      check_result warning "Metrics endpoint not accessible"
    fi

    # Check readiness
    if make_http_request "$api_url/ready" 200 >/dev/null 2>&1; then
      check_result success "Service is ready"
    else
      check_result warning "Readiness check failed"
    fi
  fi
}

check_backend_health() {
  print_section "Backend Service Health Check"

  local backend_url="${BACKEND_URL:-http://localhost:3003}"

  check_service_health "Backend" "$backend_url/health" 200
}

check_frontend_health() {
  print_section "Frontend Service Health Check"

  local frontend_url="${FRONTEND_URL:-http://localhost:3000}"

  check_service_health "Frontend" "$frontend_url" 200
}

check_api_health() {
  print_section "API Service Health Check"

  local api_url="${API_URL:-http://localhost:3001}"

  check_service_health "API" "$api_url/health" 200
}

###############################################################################
# Infrastructure Health Checks
###############################################################################

check_database_health() {
  print_section "Database Health Check"

  if [[ -z "${DATABASE_URL:-}" ]]; then
    check_result warning "DATABASE_URL not set, skipping database checks"
    return 0
  fi

  log STEP "Checking database connectivity..."

  # Basic connectivity
  if pnpm prisma db execute --stdin <<< "SELECT 1;" &>/dev/null; then
    check_result success "Database is accessible"
  else
    check_result error "Cannot connect to database"
    return 1
  fi

  if [[ "$HEALTH_CHECK_MODE" == "deep" ]]; then
    log INFO "Performing deep database health check..."

    # Check connection pool
    local connections=$(pnpm prisma db execute --stdin <<< "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "0")
    log INFO "Active database connections: $connections"

    # Check database size
    local db_size=$(pnpm prisma db execute --stdin <<< "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null || echo "unknown")
    log INFO "Database size: $db_size"

    # Check for table locks
    local locks=$(pnpm prisma db execute --stdin <<< "SELECT count(*) FROM pg_locks WHERE granted = false;" 2>/dev/null || echo "0")
    if [[ "$locks" -gt 0 ]]; then
      check_result warning "$locks table lock(s) detected"
    else
      check_result success "No table locks detected"
    fi
  fi
}

check_redis_health() {
  print_section "Redis Health Check"

  if [[ -z "${REDIS_URL:-}" ]]; then
    check_result warning "REDIS_URL not set, skipping Redis checks"
    return 0
  fi

  if ! command -v redis-cli &>/dev/null; then
    check_result warning "redis-cli not available, skipping Redis checks"
    return 0
  fi

  log STEP "Checking Redis connectivity..."

  if redis-cli -u "$REDIS_URL" PING &>/dev/null; then
    check_result success "Redis is accessible"
  else
    check_result error "Cannot connect to Redis"
    return 1
  fi

  if [[ "$HEALTH_CHECK_MODE" == "deep" ]]; then
    log INFO "Performing deep Redis health check..."

    # Check memory usage
    local memory_used=$(redis-cli -u "$REDIS_URL" INFO MEMORY | grep "used_memory_human" | cut -d':' -f2 | tr -d '\r')
    log INFO "Redis memory usage: $memory_used"

    # Check connected clients
    local clients=$(redis-cli -u "$REDIS_URL" INFO CLIENTS | grep "connected_clients" | cut -d':' -f2 | tr -d '\r')
    log INFO "Connected Redis clients: $clients"

    # Test read/write
    if redis-cli -u "$REDIS_URL" SET healthcheck "ok" EX 10 &>/dev/null; then
      if [[ $(redis-cli -u "$REDIS_URL" GET healthcheck) == "ok" ]]; then
        check_result success "Redis read/write operations working"
      else
        check_result error "Redis read operation failed"
      fi
    else
      check_result error "Redis write operation failed"
    fi
  fi
}

check_storage_health() {
  print_section "Storage Health Check"

  log STEP "Checking disk space..."

  local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
  local total_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $2}' | sed 's/G//')
  local used_percent=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')

  log INFO "Disk space: ${available_space}GB available / ${total_space}GB total (${used_percent}% used)"

  if [[ $available_space -lt 1 ]]; then
    check_result error "Critical: Less than 1GB disk space available"
  elif [[ $available_space -lt 5 ]]; then
    check_result warning "Low disk space: ${available_space}GB available"
  else
    check_result success "Sufficient disk space available"
  fi

  # Check inode usage
  if command -v df &>/dev/null; then
    local inode_usage=$(df -i "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    log INFO "Inode usage: ${inode_usage}%"

    if [[ $inode_usage -gt 90 ]]; then
      check_result warning "High inode usage: ${inode_usage}%"
    fi
  fi
}

check_memory_health() {
  print_section "Memory Health Check"

  if ! command -v free &>/dev/null; then
    check_result warning "Memory check not available on this system"
    return 0
  fi

  log STEP "Checking system memory..."

  local total_mem=$(free -g | awk '/^Mem:/{print $2}')
  local available_mem=$(free -g | awk '/^Mem:/{print $7}')
  local used_mem=$(free -g | awk '/^Mem:/{print $3}')
  local mem_percent=$(echo "scale=2; $used_mem * 100 / $total_mem" | bc)

  log INFO "Memory: ${available_mem}GB available / ${total_mem}GB total (${mem_percent}% used)"

  if [[ $available_mem -lt 1 ]]; then
    check_result error "Critical: Less than 1GB memory available"
  elif [[ $available_mem -lt 2 ]]; then
    check_result warning "Low memory: ${available_mem}GB available"
  else
    check_result success "Sufficient memory available"
  fi

  # Check swap usage
  local swap_used=$(free -g | awk '/^Swap:/{print $3}')
  local swap_total=$(free -g | awk '/^Swap:/{print $2}')

  if [[ $swap_total -gt 0 ]]; then
    local swap_percent=$(echo "scale=2; $swap_used * 100 / $swap_total" | bc)
    log INFO "Swap usage: ${swap_used}GB / ${swap_total}GB (${swap_percent}%)"

    if [[ $(echo "$swap_percent > 50" | bc) -eq 1 ]]; then
      check_result warning "High swap usage: ${swap_percent}%"
    fi
  fi
}

check_cpu_health() {
  print_section "CPU Health Check"

  if ! command -v uptime &>/dev/null; then
    check_result warning "CPU load check not available"
    return 0
  fi

  log STEP "Checking CPU load..."

  local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
  local cpu_count=$(nproc 2>/dev/null || echo "1")

  log INFO "CPU load average (1min): $load_avg (CPUs: $cpu_count)"

  local load_per_cpu=$(echo "scale=2; $load_avg / $cpu_count" | bc)

  if [[ $(echo "$load_per_cpu > 2" | bc) -eq 1 ]]; then
    check_result warning "High CPU load: ${load_avg} (${load_per_cpu} per CPU)"
  else
    check_result success "CPU load is normal"
  fi
}

###############################################################################
# Network Health Checks
###############################################################################

check_network_health() {
  print_section "Network Health Check"

  log STEP "Checking network connectivity..."

  # Check DNS resolution
  if host google.com &>/dev/null; then
    check_result success "DNS resolution working"
  else
    check_result error "DNS resolution failed"
  fi

  # Check external connectivity
  if curl -s --max-time 5 https://www.google.com >/dev/null 2>&1; then
    check_result success "External network connectivity working"
  else
    check_result warning "External network connectivity failed"
  fi

  # Check port availability
  local ports=(
    "${API_PORT:-3001}"
    "${FRONTEND_PORT:-3000}"
    "${BACKEND_PORT:-3003}"
    "${API_GATEWAY_PORT:-3002}"
  )

  for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      log INFO "Port $port is in use (service running)"
    else
      log INFO "Port $port is available"
    fi
  done
}

###############################################################################
# Application Health Checks
###############################################################################

check_environment_health() {
  print_section "Environment Configuration Health"

  log STEP "Checking environment configuration..."

  # Critical variables
  local critical_vars=("NODE_ENV" "DATABASE_URL")
  local missing_critical=()

  for var in "${critical_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing_critical+=("$var")
    fi
  done

  if [[ ${#missing_critical[@]} -eq 0 ]]; then
    check_result success "All critical environment variables are set"
  else
    check_result error "Missing critical variables: ${missing_critical[*]}"
  fi

  # Optional but recommended variables
  local optional_vars=("JWT_SECRET" "REDIS_URL" "SENTRY_DSN")
  local missing_optional=()

  for var in "${optional_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing_optional+=("$var")
    fi
  done

  if [[ ${#missing_optional[@]} -gt 0 ]]; then
    check_result warning "Optional variables not set: ${missing_optional[*]}"
  fi

  # Check NODE_ENV value
  if [[ "${NODE_ENV:-}" == "production" ]]; then
    log INFO "Running in production mode"

    # Production-specific checks
    if [[ -z "${JWT_SECRET:-}" ]]; then
      check_result error "JWT_SECRET must be set in production"
    fi
  fi
}

check_dependencies_health() {
  print_section "Dependencies Health Check"

  log STEP "Checking Node.js dependencies..."

  # Check if node_modules exists
  if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    check_result success "node_modules directory exists"
  else
    check_result error "node_modules not found - run 'pnpm install'"
    return 1
  fi

  # Check for security vulnerabilities
  if [[ "$HEALTH_CHECK_MODE" == "deep" ]]; then
    log INFO "Checking for security vulnerabilities..."

    if pnpm audit --audit-level=high --json &>/dev/null; then
      check_result success "No high-severity vulnerabilities detected"
    else
      check_result warning "Security vulnerabilities detected - run 'pnpm audit'"
    fi
  fi
}

check_build_health() {
  print_section "Build Artifacts Health Check"

  log STEP "Checking build artifacts..."

  local services=("api-gateway" "backend" "frontend" "api")
  local unbuilt=()

  for service in "${services[@]}"; do
    local dist_dir="$PROJECT_ROOT/apps/$service/dist"
    local build_dir="$PROJECT_ROOT/apps/$service/build"

    if [[ -d "$dist_dir" ]] || [[ -d "$build_dir" ]]; then
      log INFO "$service: build artifacts found"
    else
      unbuilt+=("$service")
    fi
  done

  if [[ ${#unbuilt[@]} -eq 0 ]]; then
    check_result success "All services have build artifacts"
  else
    check_result warning "Services not built: ${unbuilt[*]}"
  fi
}

###############################################################################
# Railway-Specific Health Checks
###############################################################################

check_railway_health() {
  print_section "Railway Platform Health Check"

  if ! command -v railway &>/dev/null; then
    check_result warning "Railway CLI not installed"
    return 0
  fi

  if ! railway whoami &>/dev/null; then
    check_result warning "Not authenticated with Railway"
    return 0
  fi

  if ! railway status &>/dev/null; then
    check_result warning "Not linked to a Railway project"
    return 0
  fi

  log STEP "Checking Railway services..."

  local services=("api-gateway" "backend" "frontend" "api")
  local failed_services=()

  for service in "${services[@]}"; do
    if railway status --service "$service" &>/dev/null; then
      check_result success "Railway service '$service' is running"
    else
      failed_services+=("$service")
    fi
  done

  if [[ ${#failed_services[@]} -gt 0 ]]; then
    check_result warning "Railway services not running: ${failed_services[*]}"
  fi
}

###############################################################################
# Performance Checks
###############################################################################

check_performance_health() {
  print_section "Performance Health Check"

  if [[ "$HEALTH_CHECK_MODE" != "deep" ]]; then
    log INFO "Skipping performance checks (use --deep for full check)"
    return 0
  fi

  log STEP "Running performance checks..."

  # Check API response times
  local api_url="${API_GATEWAY_URL:-http://localhost:3002}/health"

  local total_time=0
  local iterations=5

  for i in $(seq 1 $iterations); do
    local result=$(make_http_request "$api_url")
    local time=$(echo "$result" | cut -d'|' -f2)
    total_time=$(echo "$total_time + $time" | bc)
  done

  local avg_time=$(echo "scale=3; $total_time / $iterations" | bc)
  local avg_time_ms=$(echo "$avg_time * 1000" | bc | cut -d'.' -f1)

  log INFO "Average response time: ${avg_time_ms}ms (over $iterations requests)"

  if [[ $avg_time_ms -lt 100 ]]; then
    check_result success "Excellent response time"
  elif [[ $avg_time_ms -lt 500 ]]; then
    check_result success "Good response time"
  elif [[ $avg_time_ms -lt 2000 ]]; then
    check_result warning "Acceptable response time"
  else
    check_result error "Poor response time (${avg_time_ms}ms)"
  fi
}

###############################################################################
# Security Health Checks
###############################################################################

check_security_health() {
  print_section "Security Health Check"

  log STEP "Checking security configuration..."

  # Check for exposed secrets
  if [[ -f "$PROJECT_ROOT/.env" ]]; then
    check_result warning ".env file present in project root (ensure it's in .gitignore)"

    if git check-ignore "$PROJECT_ROOT/.env" &>/dev/null; then
      log INFO ".env is properly ignored by git"
    else
      check_result error ".env is NOT in .gitignore - SECURITY RISK!"
    fi
  fi

  # Check NODE_ENV
  if [[ "${NODE_ENV:-}" == "production" ]]; then
    # Production security checks
    if [[ -z "${JWT_SECRET:-}" ]]; then
      check_result error "JWT_SECRET not set in production"
    fi

    if [[ "${DATABASE_URL:-}" == *"localhost"* ]]; then
      check_result error "DATABASE_URL points to localhost in production"
    fi
  fi

  # Check file permissions
  if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    local perms=$(stat -c %a "$PROJECT_ROOT/.env.production" 2>/dev/null || echo "???")
    if [[ "$perms" == "600" ]] || [[ "$perms" == "400" ]]; then
      check_result success ".env.production has secure permissions ($perms)"
    else
      check_result warning ".env.production has loose permissions ($perms) - consider chmod 600"
    fi
  fi
}

###############################################################################
# Report Generation
###############################################################################

generate_health_report() {
  local report_file="$HEALTH_CHECK_LOG_DIR/health-report-$(date +%Y%m%d-%H%M%S).json"

  cat > "$report_file" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "mode": "$HEALTH_CHECK_MODE",
  "summary": {
    "total_checks": $CHECKS_TOTAL,
    "passed": $CHECKS_PASSED,
    "failed": $CHECKS_FAILED,
    "warnings": $CHECKS_WARNING,
    "success_rate": $(echo "scale=2; $CHECKS_PASSED * 100 / $CHECKS_TOTAL" | bc)
  },
  "status": "$([ $CHECKS_FAILED -eq 0 ] && echo 'healthy' || echo 'unhealthy')",
  "log_file": "$HEALTH_LOG"
}
EOF

  echo "$report_file"
}

###############################################################################
# Main Health Check Flow
###############################################################################

main() {
  print_banner

  log INFO "Starting comprehensive health check..."
  log INFO "Mode: $HEALTH_CHECK_MODE"
  log INFO "Log file: $HEALTH_LOG"

  # Infrastructure checks
  check_database_health || true
  check_redis_health || true
  check_storage_health || true
  check_memory_health || true
  check_cpu_health || true
  check_network_health || true

  # Application checks
  check_environment_health || true
  check_dependencies_health || true
  check_build_health || true

  # Service checks
  check_api_gateway_health || true
  check_backend_health || true
  check_frontend_health || true
  check_api_health || true

  # Platform checks
  check_railway_health || true

  # Additional checks for deep mode
  if [[ "$HEALTH_CHECK_MODE" == "deep" ]]; then
    check_performance_health || true
    check_security_health || true
  fi

  # Generate report
  local report_file=$(generate_health_report)

  # Summary
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}Health Check Summary${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  local success_rate=$(echo "scale=2; $CHECKS_PASSED * 100 / $CHECKS_TOTAL" | bc)

  echo -e "  Total Checks:   ${CYAN}$CHECKS_TOTAL${NC}"
  echo -e "  ${GREEN}Passed:         $CHECKS_PASSED${NC}"
  echo -e "  ${RED}Failed:         $CHECKS_FAILED${NC}"
  echo -e "  ${YELLOW}Warnings:       $CHECKS_WARNING${NC}"
  echo -e "  Success Rate:   ${CYAN}${success_rate}%${NC}"
  echo ""

  echo -e "  Health Log:     ${CYAN}$HEALTH_LOG${NC}"
  echo -e "  Health Report:  ${CYAN}$report_file${NC}"
  echo ""

  if [[ $CHECKS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ System is healthy!${NC}"

    if [[ $CHECKS_WARNING -gt 0 ]]; then
      echo -e "${YELLOW}Note: $CHECKS_WARNING warning(s) detected${NC}"
    fi

    exit 0
  else
    echo -e "${RED}${BOLD}✗ System has health issues${NC}"
    echo ""
    echo "Please review the failed checks before proceeding."
    exit 1
  fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --deep)
      HEALTH_CHECK_MODE="deep"
      shift
      ;;
    --minimal)
      HEALTH_CHECK_MODE="minimal"
      shift
      ;;
    --timeout=*)
      TIMEOUT="${1#*=}"
      shift
      ;;
    --retry=*)
      RETRY_COUNT="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--deep|--minimal] [--timeout=N] [--retry=N]"
      exit 1
      ;;
  esac
done

main

exit 0
