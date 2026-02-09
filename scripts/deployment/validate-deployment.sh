#!/bin/bash

###############################################################################
# The New Fuse - Pre-Deployment Validation Script
# Validates environment, dependencies, and configuration before deployment
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

VALIDATION_FAILED=false
WARNINGS=0
ERRORS=0

log_info() {
  echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $*"
}

log_warning() {
  echo -e "${YELLOW}[⚠]${NC} $*"
  ((WARNINGS++))
}

log_error() {
  echo -e "${RED}[✗]${NC} $*"
  ((ERRORS++))
  VALIDATION_FAILED=true
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# Validation Functions
###############################################################################

validate_node_version() {
  print_section "Node.js Version Validation"

  local node_version=$(node --version | sed 's/v//')
  local required_major=18

  log_info "Current Node.js version: $node_version"

  local current_major=$(echo "$node_version" | cut -d. -f1)

  if [ "$current_major" -lt "$required_major" ]; then
    log_error "Node.js version must be >= $required_major.x.x (current: $node_version)"
  else
    log_success "Node.js version is compatible"
  fi
}

validate_pnpm() {
  print_section "pnpm Validation"

  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed"
    log_info "Install with: npm install -g pnpm"
    return 1
  fi

  local pnpm_version=$(pnpm --version)
  log_success "pnpm is installed (version: $pnpm_version)"

  # Check if pnpm store is accessible
  if pnpm store status &>/dev/null; then
    log_success "pnpm store is accessible"
  else
    log_warning "pnpm store may have issues"
  fi
}

validate_git_status() {
  print_section "Git Status Validation"

  cd "$PROJECT_ROOT"

  # Check if git is initialized
  if ! git rev-parse --git-dir &>/dev/null; then
    log_error "Not a git repository"
    return 1
  fi

  log_success "Git repository detected"

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    log_warning "Uncommitted changes detected"
    log_info "Consider committing changes before deployment"
  else
    log_success "Working directory is clean"
  fi

  # Check current branch
  local branch=$(git branch --show-current)
  log_info "Current branch: $branch"

  # Get current commit
  local commit=$(git rev-parse --short HEAD)
  log_info "Current commit: $commit"
}

validate_dependencies() {
  print_section "Dependency Validation"

  cd "$PROJECT_ROOT"

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    log_error "node_modules not found - run 'pnpm install' first"
    return 1
  fi

  log_success "node_modules directory exists"

  # Check for lockfile
  if [ ! -f "pnpm-lock.yaml" ]; then
    log_error "pnpm-lock.yaml not found"
    return 1
  fi

  log_success "pnpm-lock.yaml found"

  # Verify lockfile is up to date
  log_info "Verifying dependencies..."

  if pnpm install --frozen-lockfile --dry-run &>/dev/null; then
    log_success "Dependencies are up to date"
  else
    log_error "Dependencies are out of sync - run 'pnpm install'"
  fi
}

validate_turbo_config() {
  print_section "Turbo Configuration Validation"

  if [ ! -f "$PROJECT_ROOT/turbo.json" ]; then
    log_error "turbo.json not found"
    return 1
  fi

  log_success "turbo.json found"

  # Validate JSON syntax
  if jq empty "$PROJECT_ROOT/turbo.json" 2>/dev/null; then
    log_success "turbo.json is valid JSON"
  else
    log_error "turbo.json has invalid JSON syntax"
  fi
}

validate_environment_files() {
  print_section "Environment Files Validation"

  local env_files=(
    ".env.development"
    ".env.production"
    ".env.staging"
  )

  for env_file in "${env_files[@]}"; do
    if [ -f "$PROJECT_ROOT/$env_file" ]; then
      log_success "$env_file exists"
    else
      log_warning "$env_file not found (may not be needed)"
    fi
  done

  # Check for .env.example
  if [ -f "$PROJECT_ROOT/.env.example" ]; then
    log_success ".env.example found"
  else
    log_warning ".env.example not found"
  fi
}

validate_environment_variables() {
  print_section "Environment Variables Validation"

  # Critical variables that must be set
  local critical_vars=(
    "NODE_ENV"
    "DATABASE_URL"
  )

  # Optional but recommended variables
  local optional_vars=(
    "JWT_SECRET"
    "REDIS_URL"
    "API_PORT"
    "FRONTEND_PORT"
  )

  log_info "Checking critical environment variables..."

  for var in "${critical_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      log_error "Critical environment variable not set: $var"
    else
      log_success "$var is set"
    fi
  done

  log_info "Checking optional environment variables..."

  for var in "${optional_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      log_warning "Optional environment variable not set: $var"
    else
      log_success "$var is set"
    fi
  done
}

validate_database_connection() {
  print_section "Database Connection Validation"

  if [ -z "${DATABASE_URL:-}" ]; then
    log_warning "DATABASE_URL not set, skipping database validation"
    return 0
  fi

  log_info "Checking database connectivity..."

  # Try to connect using Prisma
  if command -v prisma &>/dev/null; then
    if pnpm prisma db execute --stdin <<< "SELECT 1;" &>/dev/null; then
      log_success "Database is accessible"
    else
      log_error "Cannot connect to database"
      log_info "Check DATABASE_URL: ${DATABASE_URL}"
    fi
  else
    log_warning "Prisma CLI not found, skipping database connectivity check"
  fi
}

validate_redis_connection() {
  print_section "Redis Connection Validation"

  if [ -z "${REDIS_URL:-}" ]; then
    log_warning "REDIS_URL not set, skipping Redis validation"
    return 0
  fi

  log_info "Checking Redis connectivity..."

  # Extract host and port from REDIS_URL
  if command -v redis-cli &>/dev/null; then
    if redis-cli -u "$REDIS_URL" PING &>/dev/null; then
      log_success "Redis is accessible"
    else
      log_warning "Cannot connect to Redis (may be OK if not critical)"
    fi
  else
    log_warning "redis-cli not found, skipping Redis connectivity check"
  fi
}

validate_ports_available() {
  print_section "Port Availability Validation"

  local ports=(
    "${API_PORT:-3001}"
    "${FRONTEND_PORT:-3000}"
    "${BACKEND_PORT:-3003}"
  )

  for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      log_warning "Port $port is already in use"
      log_info "Process using port $port: $(lsof -Pi :$port -sTCP:LISTEN | tail -n +2 || echo 'Unknown')"
    else
      log_success "Port $port is available"
    fi
  done
}

validate_disk_space() {
  print_section "Disk Space Validation"

  local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
  local required_space=5

  log_info "Available disk space: ${available_space}GB"

  if [ "$available_space" -lt "$required_space" ]; then
    log_error "Insufficient disk space (required: ${required_space}GB, available: ${available_space}GB)"
  else
    log_success "Sufficient disk space available"
  fi
}

validate_memory() {
  print_section "Memory Validation"

  if command -v free &>/dev/null; then
    local total_mem=$(free -g | awk '/^Mem:/{print $2}')
    local available_mem=$(free -g | awk '/^Mem:/{print $7}')
    local required_mem=2

    log_info "Total memory: ${total_mem}GB"
    log_info "Available memory: ${available_mem}GB"

    if [ "$available_mem" -lt "$required_mem" ]; then
      log_warning "Low available memory (recommended: ${required_mem}GB+)"
    else
      log_success "Sufficient memory available"
    fi
  else
    log_info "Memory check not available on this system"
  fi
}

validate_build_artifacts() {
  print_section "Build Artifacts Validation"

  local services=(
    "api-gateway"
    "backend"
    "frontend"
  )

  log_info "Checking if services are built..."

  local unbuilt_services=()

  for service in "${services[@]}"; do
    local dist_dir="$PROJECT_ROOT/apps/$service/dist"
    local build_dir="$PROJECT_ROOT/apps/$service/build"

    if [ -d "$dist_dir" ] || [ -d "$build_dir" ]; then
      log_success "$service is built"
    else
      log_warning "$service is not built"
      unbuilt_services+=("$service")
    fi
  done

  if [ ${#unbuilt_services[@]} -gt 0 ]; then
    log_warning "The following services need to be built: ${unbuilt_services[*]}"
    log_info "Run 'pnpm run build' to build all services"
  fi
}

validate_docker_available() {
  print_section "Docker Availability Check"

  if command -v docker &>/dev/null; then
    log_success "Docker is installed"

    if docker info &>/dev/null; then
      log_success "Docker daemon is running"

      local docker_version=$(docker --version)
      log_info "$docker_version"
    else
      log_warning "Docker daemon is not running"
    fi
  else
    log_info "Docker is not installed (not required for Railway deployment)"
  fi
}

validate_railway_cli() {
  print_section "Railway CLI Validation"

  if command -v railway &>/dev/null; then
    log_success "Railway CLI is installed"

    local railway_version=$(railway --version 2>&1 || echo "unknown")
    log_info "Railway CLI version: $railway_version"

    # Check if authenticated
    if railway whoami &>/dev/null; then
      log_success "Railway CLI is authenticated"

      local user=$(railway whoami 2>&1)
      log_info "Logged in as: $user"
    else
      log_error "Railway CLI is not authenticated"
      log_info "Run 'railway login' to authenticate"
    fi

    # Check if linked to a project
    if railway status &>/dev/null; then
      log_success "Railway project is linked"

      log_info "Project info:"
      railway status 2>&1 | head -5
    else
      log_warning "Not linked to a Railway project"
      log_info "Run 'railway link' to link to a project"
    fi
  else
    log_error "Railway CLI is not installed"
    log_info "Install with: npm install -g @railway/cli"
  fi
}

validate_prisma_schema() {
  print_section "Prisma Schema Validation"

  local schema_files=(
    "$PROJECT_ROOT/prisma/schema.prisma"
    "$PROJECT_ROOT/packages/database/prisma/schema.prisma"
  )

  local schema_found=false

  for schema_file in "${schema_files[@]}"; do
    if [ -f "$schema_file" ]; then
      schema_found=true
      log_success "Found Prisma schema: $schema_file"

      # Validate schema
      if pnpm prisma validate --schema="$schema_file" &>/dev/null; then
        log_success "Prisma schema is valid"
      else
        log_error "Prisma schema has errors"
      fi

      break
    fi
  done

  if [ "$schema_found" = false ]; then
    log_warning "No Prisma schema found"
  fi
}

validate_typescript_config() {
  print_section "TypeScript Configuration Validation"

  if [ ! -f "$PROJECT_ROOT/tsconfig.json" ]; then
    log_warning "Root tsconfig.json not found"
  else
    log_success "Root tsconfig.json found"

    # Validate JSON syntax
    if jq empty "$PROJECT_ROOT/tsconfig.json" 2>/dev/null; then
      log_success "tsconfig.json is valid JSON"
    else
      log_error "tsconfig.json has invalid JSON syntax"
    fi
  fi
}

check_security_vulnerabilities() {
  print_section "Security Vulnerabilities Check"

  log_info "Checking for known vulnerabilities..."

  if pnpm audit --audit-level=high &>/dev/null; then
    log_success "No high-severity vulnerabilities found"
  else
    log_warning "Security vulnerabilities detected"
    log_info "Run 'pnpm audit' for details"
    log_info "Run 'pnpm audit --fix' to attempt automatic fixes"
  fi
}

check_outdated_dependencies() {
  print_section "Outdated Dependencies Check"

  log_info "Checking for outdated dependencies..."

  local outdated=$(pnpm outdated --format json 2>/dev/null || echo "[]")
  local outdated_count=$(echo "$outdated" | jq 'length' 2>/dev/null || echo "0")

  if [ "$outdated_count" -eq 0 ]; then
    log_success "All dependencies are up to date"
  else
    log_warning "$outdated_count outdated dependencies found"
    log_info "Run 'pnpm outdated' for details"
  fi
}

###############################################################################
# Main Validation Flow
###############################################################################

print_banner() {
  echo ""
  echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║${NC}  ${BOLD}Pre-Deployment Validation${NC}                                  ${BOLD}${BLUE}║${NC}"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

main() {
  print_banner

  # System validations
  validate_node_version
  validate_pnpm
  validate_git_status

  # Dependency validations
  validate_dependencies
  validate_turbo_config
  validate_typescript_config

  # Environment validations
  validate_environment_files
  validate_environment_variables

  # Service validations
  validate_database_connection
  validate_redis_connection
  validate_ports_available

  # Resource validations
  validate_disk_space
  validate_memory

  # Build validations
  validate_build_artifacts
  validate_prisma_schema

  # Deployment tool validations
  validate_docker_available
  validate_railway_cli

  # Security validations
  check_security_vulnerabilities
  check_outdated_dependencies

  # Summary
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}Validation Summary${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  if [ "$VALIDATION_FAILED" = true ]; then
    echo -e "${RED}${BOLD}✗ Validation FAILED${NC}"
    echo -e "  ${RED}Errors: $ERRORS${NC}"
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    echo ""
    echo "Please fix the errors before proceeding with deployment."
    exit 1
  else
    echo -e "${GREEN}${BOLD}✓ Validation PASSED${NC}"
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    echo ""
    if [ $WARNINGS -gt 0 ]; then
      echo "Validation passed, but there are warnings to review."
    else
      echo "All validation checks passed successfully!"
    fi
    exit 0
  fi
}

main

exit 0
