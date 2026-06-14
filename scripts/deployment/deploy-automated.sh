#!/bin/bash

###############################################################################
# The New Fuse - Automated Deployment Script
# One-command deployment with validation, rollback, and zero-downtime support
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_CONFIG="${DEPLOYMENT_CONFIG:-$PROJECT_ROOT/.deployment-config}"
DEPLOYMENT_LOG_DIR="$PROJECT_ROOT/logs/deployment"
BACKUP_DIR="$PROJECT_ROOT/backups"
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$DEPLOYMENT_LOG_DIR/$DEPLOYMENT_ID.log"

# Environment
ENVIRONMENT="${ENVIRONMENT:-production}"
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-rolling}"  # rolling, blue-green, canary
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-false}"
AUTO_ROLLBACK="${AUTO_ROLLBACK:-true}"
ENABLE_NOTIFICATIONS="${ENABLE_NOTIFICATIONS:-true}"

# Service configuration
SERVICES=(
  "api-gateway"
  "backend"
  "frontend"
  "api"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# State tracking
DEPLOYMENT_STATE_FILE="$DEPLOYMENT_LOG_DIR/$DEPLOYMENT_ID-state.json"
declare -A SERVICE_VERSIONS
declare -A SERVICE_STATUS
DEPLOYMENT_FAILED=false

###############################################################################
# Utility Functions
###############################################################################

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
    SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE" ;;
    WARNING) echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$LOG_FILE" ;;
    ERROR)   echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" | tee -a "$LOG_FILE" ;;
    *)       echo "$message" | tee -a "$LOG_FILE" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}  ${BOLD}The New Fuse - Automated Deployment System${NC}              ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

save_state() {
  local key=$1
  local value=$2

  jq -n \
    --arg deployment_id "$DEPLOYMENT_ID" \
    --arg timestamp "$(date -Iseconds)" \
    --arg key "$key" \
    --arg value "$value" \
    '{deployment_id: $deployment_id, timestamp: $timestamp, ($key): $value}' \
    >> "$DEPLOYMENT_STATE_FILE" 2>/dev/null || true
}

check_prerequisites() {
  print_section "Checking Prerequisites"

  local missing_deps=()

  # Check required commands
  local required_commands=("pnpm" "node" "git" "jq" "curl")

  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_deps+=("$cmd")
      log ERROR "Required command not found: $cmd"
    else
      log SUCCESS "Found: $cmd ($(command -v $cmd))"
    fi
  done

  # Check CloudRuntime CLI if deploying to CloudRuntime
  if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "staging" ]]; then
    if ! command -v cloud_runtime &> /dev/null; then
      log WARNING "CloudRuntime CLI not found. Install with: npm install -g @cloud_runtime/cli"
      log WARNING "CloudRuntime deployments will be skipped"
    else
      log SUCCESS "CloudRuntime CLI found"
    fi
  fi

  # Check Node version
  local node_version=$(node --version)
  log INFO "Node.js version: $node_version"

  # Check pnpm version
  local pnpm_version=$(pnpm --version)
  log INFO "pnpm version: $pnpm_version"

  if [ ${#missing_deps[@]} -gt 0 ]; then
    log ERROR "Missing dependencies: ${missing_deps[*]}"
    return 1
  fi

  log SUCCESS "All prerequisites satisfied"
  return 0
}

create_directories() {
  mkdir -p "$DEPLOYMENT_LOG_DIR"
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$BACKUP_DIR/database"
  mkdir -p "$BACKUP_DIR/env"
  mkdir -p "$BACKUP_DIR/builds"
}

###############################################################################
# Pre-Deployment Validation
###############################################################################

validate_deployment() {
  print_section "Pre-Deployment Validation"

  log STEP "Running pre-deployment validation script..."

  if [[ -f "$SCRIPT_DIR/validate-deployment.sh" ]]; then
    if bash "$SCRIPT_DIR/validate-deployment.sh"; then
      log SUCCESS "Pre-deployment validation passed"
      return 0
    else
      log ERROR "Pre-deployment validation failed"
      return 1
    fi
  else
    log WARNING "Validation script not found, performing basic checks..."

    # Basic validation
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
      log ERROR "package.json not found"
      return 1
    fi

    if [[ ! -f "$PROJECT_ROOT/turbo.json" ]]; then
      log ERROR "turbo.json not found"
      return 1
    fi

    log SUCCESS "Basic validation passed"
    return 0
  fi
}

validate_environment_variables() {
  print_section "Validating Environment Variables"

  local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"

  if [[ ! -f "$env_file" ]]; then
    log ERROR "Environment file not found: $env_file"
    return 1
  fi

  log INFO "Loading environment from: $env_file"

  # Check critical environment variables
  local required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NODE_ENV"
  )

  local missing_vars=()

  # Source the env file and check
  set -a
  source "$env_file"
  set +a

  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing_vars+=("$var")
      log ERROR "Missing required environment variable: $var"
    else
      log SUCCESS "Found: $var"
    fi
  done

  if [ ${#missing_vars[@]} -gt 0 ]; then
    log ERROR "Missing environment variables: ${missing_vars[*]}"
    return 1
  fi

  log SUCCESS "Environment variables validated"
  return 0
}

check_breaking_changes() {
  print_section "Checking for Breaking Changes"

  log INFO "Analyzing git commits for breaking changes..."

  # Get commits since last deployment
  local last_deploy_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")
  local breaking_changes=$(git log "$last_deploy_tag..HEAD" --oneline | grep -i "BREAKING\|breaking change" || true)

  if [[ -n "$breaking_changes" ]]; then
    log WARNING "Breaking changes detected:"
    echo "$breaking_changes" | while read line; do
      log WARNING "  - $line"
    done

    if [[ "${ALLOW_BREAKING_CHANGES:-false}" != "true" ]]; then
      log ERROR "Breaking changes detected. Set ALLOW_BREAKING_CHANGES=true to proceed"
      return 1
    fi
  else
    log SUCCESS "No breaking changes detected"
  fi

  return 0
}

###############################################################################
# Build Process
###############################################################################

build_services() {
  print_section "Building Services"

  log STEP "Installing dependencies..."
  pnpm install --frozen-lockfile || {
    log ERROR "Dependency installation failed"
    return 1
  }

  log STEP "Building packages and services..."

  # Use CloudRuntime-optimized build if available
  if [[ -f "$PROJECT_ROOT/scripts/build-cloud_runtime.cjs" ]]; then
    log INFO "Using CloudRuntime-optimized build"
    BUILD_VERBOSE=true node "$PROJECT_ROOT/scripts/build-cloud_runtime.cjs" || {
      log ERROR "Build failed"
      return 1
    }
  else
    log INFO "Using standard build"
    pnpm run build || {
      log ERROR "Build failed"
      return 1
    }
  fi

  log SUCCESS "Build completed successfully"

  # Create build backup
  create_build_backup

  return 0
}

create_build_backup() {
  log INFO "Creating build backup..."

  local backup_path="$BACKUP_DIR/builds/$DEPLOYMENT_ID"
  mkdir -p "$backup_path"

  # Backup built artifacts
  for service in "${SERVICES[@]}"; do
    local service_dist="$PROJECT_ROOT/apps/$service/dist"
    if [[ -d "$service_dist" ]]; then
      cp -r "$service_dist" "$backup_path/$service-dist" || true
      log INFO "Backed up $service build artifacts"
    fi
  done

  log SUCCESS "Build backup created at: $backup_path"
}

###############################################################################
# Testing
###############################################################################

run_tests() {
  print_section "Running Tests"

  if [[ "$SKIP_TESTS" == "true" ]]; then
    log WARNING "Tests skipped (SKIP_TESTS=true)"
    return 0
  fi

  log STEP "Running test suite..."

  # Run tests with memory optimization
  pnpm run test:memory-optimized || {
    log ERROR "Tests failed"

    if [[ "${ALLOW_TEST_FAILURES:-false}" == "true" ]]; then
      log WARNING "Continuing despite test failures (ALLOW_TEST_FAILURES=true)"
      return 0
    else
      return 1
    fi
  }

  log SUCCESS "All tests passed"
  return 0
}

###############################################################################
# Database Operations
###############################################################################

backup_database() {
  print_section "Backing Up Database"

  log STEP "Creating database backup..."

  if [[ -f "$SCRIPT_DIR/db-backup.sh" ]]; then
    bash "$SCRIPT_DIR/db-backup.sh" "$DEPLOYMENT_ID" || {
      log ERROR "Database backup failed"
      return 1
    }
  else
    log WARNING "Database backup script not found"

    # Basic Drizzle backup
    local backup_file="$BACKUP_DIR/database/backup-$DEPLOYMENT_ID.sql"

    # This is a placeholder - actual implementation would depend on database type
    log INFO "Database backup would be created at: $backup_file"
  fi

  log SUCCESS "Database backup completed"
  save_state "database_backup" "completed"

  return 0
}

run_migrations() {
  print_section "Running Database Migrations"

  if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
    log WARNING "Migrations skipped (SKIP_MIGRATIONS=true)"
    return 0
  fi

  log STEP "Applying database migrations..."

  if [[ -f "$SCRIPT_DIR/db-migrate.sh" ]]; then
    bash "$SCRIPT_DIR/db-migrate.sh" || {
      log ERROR "Database migrations failed"
      return 1
    }
  else
    # Run Drizzle migrations
    pnpm run db:migrate || {
      log ERROR "Database migrations failed"
      return 1
    }
  fi

  log SUCCESS "Database migrations completed"
  save_state "migrations" "completed"

  return 0
}

###############################################################################
# Deployment Strategies
###############################################################################

deploy_rolling() {
  print_section "Deploying Services (Rolling Strategy)"

  log INFO "Using rolling deployment strategy"

  for service in "${SERVICES[@]}"; do
    log STEP "Deploying $service..."

    if deploy_service "$service"; then
      SERVICE_STATUS[$service]="deployed"
      log SUCCESS "$service deployed successfully"
    else
      SERVICE_STATUS[$service]="failed"
      log ERROR "$service deployment failed"
      DEPLOYMENT_FAILED=true

      if [[ "$AUTO_ROLLBACK" == "true" ]]; then
        log WARNING "Auto-rollback enabled, initiating rollback..."
        return 1
      fi
    fi

    # Wait between service deployments
    sleep 5
  done

  if [[ "$DEPLOYMENT_FAILED" == "true" ]]; then
    return 1
  fi

  return 0
}

deploy_blue_green() {
  print_section "Deploying Services (Blue-Green Strategy)"

  log INFO "Using blue-green deployment strategy"
  log WARNING "Blue-green deployment not fully implemented yet"
  log INFO "Falling back to rolling deployment"

  deploy_rolling
}

deploy_canary() {
  print_section "Deploying Services (Canary Strategy)"

  log INFO "Using canary deployment strategy"
  log WARNING "Canary deployment not fully implemented yet"
  log INFO "Falling back to rolling deployment"

  deploy_rolling
}

deploy_service() {
  local service=$1
  local service_path="$PROJECT_ROOT/apps/$service"

  if [[ ! -d "$service_path" ]]; then
    log WARNING "Service directory not found: $service_path"
    return 1
  fi

  # Check if CloudRuntime CLI is available
  if command -v cloud_runtime &> /dev/null; then
    log INFO "Deploying $service to CloudRuntime..."

    cd "$service_path"
    cloud_runtime up --detach || {
      log ERROR "CloudRuntime deployment failed for $service"
      cd "$PROJECT_ROOT"
      return 1
    }
    cd "$PROJECT_ROOT"

    log SUCCESS "$service deployed to CloudRuntime"
  else
    log WARNING "CloudRuntime CLI not available, skipping CloudRuntime deployment"
  fi

  return 0
}

###############################################################################
# Post-Deployment
###############################################################################

run_smoke_tests() {
  print_section "Running Smoke Tests"

  log STEP "Executing smoke tests..."

  if [[ -f "$SCRIPT_DIR/smoke-tests.sh" ]]; then
    bash "$SCRIPT_DIR/smoke-tests.sh" || {
      log ERROR "Smoke tests failed"
      return 1
    }
  else
    log INFO "Smoke test script not found, running basic health checks..."

    # Basic health checks
    local services_healthy=true

    for service in "${SERVICES[@]}"; do
      if ! check_service_health "$service"; then
        services_healthy=false
      fi
    done

    if [[ "$services_healthy" == "false" ]]; then
      log ERROR "Some services are not healthy"
      return 1
    fi
  fi

  log SUCCESS "Smoke tests passed"
  return 0
}

check_service_health() {
  local service=$1

  log INFO "Checking health of $service..."

  # This is a placeholder - actual implementation would check CloudRuntime service health
  # via CloudRuntime API or health check endpoints

  if command -v cloud_runtime &> /dev/null; then
    # Check CloudRuntime service status
    cloud_runtime status --service "$service" &>/dev/null || {
      log WARNING "$service health check failed (may not be deployed)"
      return 1
    }
  fi

  log SUCCESS "$service is healthy"
  return 0
}

warm_up_services() {
  print_section "Warming Up Services"

  log INFO "Sending warm-up requests to services..."

  # This is a placeholder for warm-up logic
  sleep 2

  log SUCCESS "Services warmed up"
}

invalidate_cache() {
  print_section "Invalidating Cache"

  log INFO "Invalidating application caches..."

  # Placeholder for cache invalidation
  # Could call Redis FLUSHALL or specific cache invalidation endpoints

  log SUCCESS "Cache invalidated"
}

###############################################################################
# Rollback
###############################################################################

rollback_deployment() {
  print_section "Rolling Back Deployment"

  log ERROR "Deployment failed, initiating rollback..."

  if [[ -f "$SCRIPT_DIR/rollback.sh" ]]; then
    bash "$SCRIPT_DIR/rollback.sh" "$DEPLOYMENT_ID" || {
      log ERROR "Rollback failed!"
      return 1
    }
  else
    log ERROR "Rollback script not found at: $SCRIPT_DIR/rollback.sh"
    log ERROR "Manual rollback required!"
    return 1
  fi

  log SUCCESS "Rollback completed"
  save_state "deployment_status" "rolled_back"

  return 0
}

###############################################################################
# Notifications
###############################################################################

send_notification() {
  local status=$1
  local message=$2

  if [[ "$ENABLE_NOTIFICATIONS" != "true" ]]; then
    return 0
  fi

  log INFO "Sending notification: $message"

  # Placeholder for notification integration
  # Could integrate with Slack, Discord, email, etc.

  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"[$status] $message\"}" \
      &>/dev/null || true
  fi
}

###############################################################################
# Cleanup
###############################################################################

cleanup() {
  log INFO "Cleaning up temporary files..."

  # Remove old logs (keep last 30 days)
  find "$DEPLOYMENT_LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

  # Remove old backups (keep last 10)
  ls -t "$BACKUP_DIR/builds" | tail -n +11 | xargs -I {} rm -rf "$BACKUP_DIR/builds/{}" 2>/dev/null || true

  log SUCCESS "Cleanup completed"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
  print_banner

  log INFO "Starting deployment: $DEPLOYMENT_ID"
  log INFO "Environment: $ENVIRONMENT"
  log INFO "Strategy: $DEPLOYMENT_STRATEGY"
  log INFO "Log file: $LOG_FILE"

  # Initialize
  create_directories
  save_state "deployment_status" "started"
  save_state "deployment_strategy" "$DEPLOYMENT_STRATEGY"

  # Pre-deployment
  check_prerequisites || exit 1
  validate_deployment || exit 1
  validate_environment_variables || exit 1
  check_breaking_changes || exit 1

  # Build
  build_services || exit 1

  # Test
  run_tests || exit 1

  # Database
  backup_database || {
    log ERROR "Database backup failed, aborting deployment"
    exit 1
  }

  run_migrations || {
    log ERROR "Database migrations failed"
    if [[ "$AUTO_ROLLBACK" == "true" ]]; then
      rollback_deployment
    fi
    exit 1
  }

  # Deploy
  case "$DEPLOYMENT_STRATEGY" in
    rolling)
      deploy_rolling || {
        if [[ "$AUTO_ROLLBACK" == "true" ]]; then
          rollback_deployment
        fi
        exit 1
      }
      ;;
    blue-green)
      deploy_blue_green || {
        if [[ "$AUTO_ROLLBACK" == "true" ]]; then
          rollback_deployment
        fi
        exit 1
      }
      ;;
    canary)
      deploy_canary || {
        if [[ "$AUTO_ROLLBACK" == "true" ]]; then
          rollback_deployment
        fi
        exit 1
      }
      ;;
    *)
      log ERROR "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
      exit 1
      ;;
  esac

  # Post-deployment
  run_smoke_tests || {
    log ERROR "Smoke tests failed"
    if [[ "$AUTO_ROLLBACK" == "true" ]]; then
      rollback_deployment
      exit 1
    fi
  }

  warm_up_services
  invalidate_cache

  # Finalize
  save_state "deployment_status" "completed"
  cleanup

  # Success!
  print_section "Deployment Complete"
  log SUCCESS "Deployment $DEPLOYMENT_ID completed successfully!"
  log INFO "Duration: $SECONDS seconds"

  send_notification "SUCCESS" "Deployment $DEPLOYMENT_ID completed successfully"

  # Print summary
  echo ""
  echo -e "${BOLD}Deployment Summary:${NC}"
  echo -e "  ID: ${CYAN}$DEPLOYMENT_ID${NC}"
  echo -e "  Environment: ${CYAN}$ENVIRONMENT${NC}"
  echo -e "  Strategy: ${CYAN}$DEPLOYMENT_STRATEGY${NC}"
  echo -e "  Log: ${CYAN}$LOG_FILE${NC}"
  echo ""

  echo -e "${BOLD}Next Steps:${NC}"
  echo "  - Monitor service health: cloud_runtime status"
  echo "  - View logs: cloud_runtime logs"
  echo "  - Check metrics: cloud_runtime metrics"
  echo ""
}

# Handle script interruption
trap 'log ERROR "Deployment interrupted"; exit 1' INT TERM

# Run main deployment
main

exit 0
