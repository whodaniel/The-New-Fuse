#!/bin/bash

###############################################################################
# The New Fuse - Deployment Orchestration Master Script
# Coordinates entire deployment process with multiple strategies
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_LOG_DIR="$PROJECT_ROOT/logs/deployment"
DEPLOY_STATE_DIR="$PROJECT_ROOT/.deployment-state"

# Source notification script
source "$SCRIPT_DIR/notifications.sh" 2>/dev/null || true

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
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-blue-green}"  # rolling, blue-green, canary
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
SERVICES="${SERVICES:-api-gateway backend frontend api}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
RUN_TESTS="${RUN_TESTS:-true}"
RUN_HEALTH_CHECKS="${RUN_HEALTH_CHECKS:-true}"
NOTIFY="${NOTIFY:-true}"

mkdir -p "$DEPLOY_LOG_DIR" "$DEPLOY_STATE_DIR"
DEPLOY_LOG="$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"

START_TIME=$(date +%s)

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$DEPLOY_LOG" ;;
    SUCCESS) echo -e "${GREEN}[✓]${NC} $message" | tee -a "$DEPLOY_LOG" ;;
    WARNING) echo -e "${YELLOW}[⚠]${NC} $message" | tee -a "$DEPLOY_LOG" ;;
    ERROR)   echo -e "${RED}[✗]${NC} $message" | tee -a "$DEPLOY_LOG" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" | tee -a "$DEPLOY_LOG" ;;
    *)       echo "$message" | tee -a "$DEPLOY_LOG" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$DEPLOY_LOG"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}  ${BOLD}Deployment Orchestration${NC}                                   ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# Deployment State Management
###############################################################################

save_deployment_state() {
  local status=$1
  local step="${2:-}"
  local error="${3:-}"

  local state_file="$DEPLOY_STATE_DIR/$DEPLOYMENT_ID-state.json"
  local elapsed=$(($(date +%s) - START_TIME))

  cat > "$state_file" <<EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "status": "$status",
  "current_step": "$step",
  "error": "$error",
  "strategy": "$DEPLOYMENT_STRATEGY",
  "services": "$SERVICES",
  "started_at": "$(date -d @$START_TIME -Iseconds 2>/dev/null || date -Iseconds)",
  "updated_at": "$(date -Iseconds)",
  "elapsed_seconds": $elapsed,
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "deployer": "$(whoami)",
  "log_file": "$DEPLOY_LOG"
}
EOF

  log INFO "Deployment state saved: $state_file"
}

###############################################################################
# Pre-Deployment Checks
###############################################################################

run_pre_deployment_validation() {
  print_section "Pre-Deployment Validation"

  log STEP "Running validation script..."

  if [[ -f "$SCRIPT_DIR/validate-deployment.sh" ]]; then
    if bash "$SCRIPT_DIR/validate-deployment.sh"; then
      log SUCCESS "Pre-deployment validation passed"
      return 0
    else
      log ERROR "Pre-deployment validation failed"
      return 1
    fi
  else
    log WARNING "Validation script not found, skipping"
    return 0
  fi
}

run_database_migrations() {
  if [[ "$RUN_MIGRATIONS" != "true" ]]; then
    log INFO "Database migrations skipped (RUN_MIGRATIONS=false)"
    return 0
  fi

  print_section "Database Migrations"

  log STEP "Running database migration script..."

  if [[ -f "$SCRIPT_DIR/db-migrate.sh" ]]; then
    export DEPLOYMENT_ID
    export AUTO_APPROVE="true"

    if bash "$SCRIPT_DIR/db-migrate.sh"; then
      log SUCCESS "Database migrations completed"
      return 0
    else
      log ERROR "Database migration failed"
      return 1
    fi
  else
    log WARNING "Migration script not found, skipping"
    return 0
  fi
}

create_database_backup() {
  print_section "Database Backup"

  log STEP "Creating database backup..."

  if [[ -f "$SCRIPT_DIR/db-backup.sh" ]]; then
    if bash "$SCRIPT_DIR/db-backup.sh"; then
      log SUCCESS "Database backup created"
      return 0
    else
      log WARNING "Database backup failed"
      return 0  # Non-critical
    fi
  else
    log WARNING "Backup script not found, skipping"
    return 0
  fi
}

###############################################################################
# Deployment Strategy Functions
###############################################################################

deploy_rolling_update() {
  print_section "Rolling Update Deployment"

  log INFO "Deploying services one at a time..."

  for service in $SERVICES; do
    log STEP "Deploying service: $service"

    # Build service
    cd "$PROJECT_ROOT"

    if ! pnpm run build --filter="@the-new-fuse/$service"; then
      log ERROR "Build failed for $service"
      return 1
    fi

    log SUCCESS "Build completed for $service"

    # Deploy service
    if command -v railway &>/dev/null; then
      if ! railway up --detach --service "$service"; then
        log ERROR "Deployment failed for $service"
        return 1
      fi

      log SUCCESS "Deployed $service"

      # Wait for service to stabilize
      log INFO "Waiting for $service to stabilize..."
      sleep 10

      # Health check
      if [[ "$RUN_HEALTH_CHECKS" == "true" ]]; then
        log INFO "Running health check for $service..."
        # Add health check logic here
      fi
    else
      log ERROR "Railway CLI not available"
      return 1
    fi
  done

  log SUCCESS "Rolling update completed"
  return 0
}

deploy_blue_green() {
  print_section "Blue-Green Deployment"

  log INFO "Running blue-green deployment for each service..."

  for service in $SERVICES; do
    log STEP "Blue-green deployment for: $service"

    if [[ -f "$SCRIPT_DIR/blue-green-deploy.sh" ]]; then
      export AUTO_CONFIRM="true"

      if ! bash "$SCRIPT_DIR/blue-green-deploy.sh" "$service"; then
        log ERROR "Blue-green deployment failed for $service"
        return 1
      fi

      log SUCCESS "Blue-green deployment completed for $service"
    else
      log ERROR "Blue-green deployment script not found"
      return 1
    fi
  done

  log SUCCESS "All blue-green deployments completed"
  return 0
}

deploy_canary() {
  print_section "Canary Deployment"

  log INFO "Running canary deployment for each service..."

  for service in $SERVICES; do
    log STEP "Canary deployment for: $service"

    if [[ -f "$SCRIPT_DIR/canary-deploy.sh" ]]; then
      export AUTO_CONFIRM="true"

      if ! bash "$SCRIPT_DIR/canary-deploy.sh" "$service"; then
        log ERROR "Canary deployment failed for $service"
        return 1
      fi

      log SUCCESS "Canary deployment completed for $service"
    else
      log ERROR "Canary deployment script not found"
      return 1
    fi
  done

  log SUCCESS "All canary deployments completed"
  return 0
}

###############################################################################
# Post-Deployment Checks
###############################################################################

run_smoke_tests() {
  if [[ "$RUN_TESTS" != "true" ]]; then
    log INFO "Smoke tests skipped (RUN_TESTS=false)"
    return 0
  fi

  print_section "Smoke Tests"

  log STEP "Running smoke tests..."

  if [[ -f "$SCRIPT_DIR/smoke-tests.sh" ]]; then
    if bash "$SCRIPT_DIR/smoke-tests.sh"; then
      log SUCCESS "Smoke tests passed"
      return 0
    else
      log ERROR "Smoke tests failed"
      return 1
    fi
  else
    log WARNING "Smoke test script not found, skipping"
    return 0
  fi
}

run_health_checks() {
  if [[ "$RUN_HEALTH_CHECKS" != "true" ]]; then
    log INFO "Health checks skipped (RUN_HEALTH_CHECKS=false)"
    return 0
  fi

  print_section "Health Checks"

  log STEP "Running comprehensive health checks..."

  if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
    if bash "$SCRIPT_DIR/health-check.sh"; then
      log SUCCESS "Health checks passed"
      return 0
    else
      log ERROR "Health checks failed"
      return 1
    fi
  else
    log WARNING "Health check script not found, skipping"
    return 0
  fi
}

verify_deployment() {
  print_section "Deployment Verification"

  log STEP "Verifying deployment..."

  # Check if all services are running
  if command -v railway &>/dev/null; then
    for service in $SERVICES; do
      log INFO "Checking service: $service"

      if railway status --service "$service" &>/dev/null; then
        log SUCCESS "$service is running"
      else
        log WARNING "$service status unknown"
      fi
    done
  fi

  return 0
}

###############################################################################
# Deployment Flow
###############################################################################

execute_deployment() {
  log INFO "Starting deployment: $DEPLOYMENT_ID"
  log INFO "Strategy: $DEPLOYMENT_STRATEGY"
  log INFO "Services: $SERVICES"

  save_deployment_state "started" "initialization"

  # Notify deployment started
  if [[ "$NOTIFY" == "true" ]]; then
    notify_deployment_started "$DEPLOYMENT_ID" "$(whoami)" "$(git rev-parse --short HEAD 2>/dev/null)" 2>/dev/null || true
  fi

  # Pre-deployment checks
  save_deployment_state "running" "pre_deployment_validation"

  if ! run_pre_deployment_validation; then
    save_deployment_state "failed" "pre_deployment_validation" "Validation failed"

    if [[ "$NOTIFY" == "true" ]]; then
      notify_deployment_failed "$DEPLOYMENT_ID" "Pre-deployment validation failed" "pre_deployment_validation" 2>/dev/null || true
    fi

    return 1
  fi

  # Create database backup
  save_deployment_state "running" "database_backup"
  create_database_backup || true  # Non-critical

  # Run database migrations
  save_deployment_state "running" "database_migrations"

  if ! run_database_migrations; then
    save_deployment_state "failed" "database_migrations" "Migration failed"

    if [[ "$NOTIFY" == "true" ]]; then
      notify_deployment_failed "$DEPLOYMENT_ID" "Database migration failed" "database_migrations" 2>/dev/null || true
    fi

    return 1
  fi

  # Execute deployment based on strategy
  save_deployment_state "running" "deployment"

  case "$DEPLOYMENT_STRATEGY" in
    rolling)
      if ! deploy_rolling_update; then
        save_deployment_state "failed" "deployment" "Rolling update failed"

        if [[ "$NOTIFY" == "true" ]]; then
          notify_deployment_failed "$DEPLOYMENT_ID" "Rolling update failed" "deployment" 2>/dev/null || true
        fi

        return 1
      fi
      ;;

    blue-green)
      if ! deploy_blue_green; then
        save_deployment_state "failed" "deployment" "Blue-green deployment failed"

        if [[ "$NOTIFY" == "true" ]]; then
          notify_deployment_failed "$DEPLOYMENT_ID" "Blue-green deployment failed" "deployment" 2>/dev/null || true
        fi

        return 1
      fi
      ;;

    canary)
      if ! deploy_canary; then
        save_deployment_state "failed" "deployment" "Canary deployment failed"

        if [[ "$NOTIFY" == "true" ]]; then
          notify_deployment_failed "$DEPLOYMENT_ID" "Canary deployment failed" "deployment" 2>/dev/null || true
        fi

        return 1
      fi
      ;;

    *)
      log ERROR "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
      save_deployment_state "failed" "deployment" "Unknown strategy"
      return 1
      ;;
  esac

  # Post-deployment checks
  save_deployment_state "running" "smoke_tests"

  if ! run_smoke_tests; then
    save_deployment_state "failed" "smoke_tests" "Smoke tests failed"

    if [[ "$NOTIFY" == "true" ]]; then
      notify_deployment_failed "$DEPLOYMENT_ID" "Smoke tests failed" "smoke_tests" 2>/dev/null || true
    fi

    return 1
  fi

  save_deployment_state "running" "health_checks"

  if ! run_health_checks; then
    save_deployment_state "failed" "health_checks" "Health checks failed"

    if [[ "$NOTIFY" == "true" ]]; then
      notify_deployment_failed "$DEPLOYMENT_ID" "Health checks failed" "health_checks" 2>/dev/null || true
    fi

    return 1
  fi

  # Verify deployment
  save_deployment_state "running" "verification"
  verify_deployment || true  # Non-critical

  # Success!
  save_deployment_state "completed" "finished"

  local elapsed=$(($(date +%s) - START_TIME))
  local duration="${elapsed}s"

  if [[ "$NOTIFY" == "true" ]]; then
    notify_deployment_completed "$DEPLOYMENT_ID" "$duration" "$SERVICES" 2>/dev/null || true
  fi

  return 0
}

###############################################################################
# Main Entry Point
###############################################################################

show_usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --strategy=<strategy>     Deployment strategy: rolling, blue-green, canary (default: blue-green)"
  echo "  --services=<services>     Space-separated list of services to deploy (default: all)"
  echo "  --no-migrations           Skip database migrations"
  echo "  --no-tests                Skip smoke tests"
  echo "  --no-health-checks        Skip health checks"
  echo "  --no-notifications        Skip notifications"
  echo "  --help                    Show this help message"
  echo ""
  echo "Environment Variables:"
  echo "  DEPLOYMENT_STRATEGY       Deployment strategy (default: blue-green)"
  echo "  SERVICES                  Services to deploy (default: api-gateway backend frontend api)"
  echo "  RUN_MIGRATIONS            Run database migrations (default: true)"
  echo "  RUN_TESTS                 Run smoke tests (default: true)"
  echo "  RUN_HEALTH_CHECKS         Run health checks (default: true)"
  echo "  NOTIFY                    Send notifications (default: true)"
  echo ""
  echo "Examples:"
  echo "  $0 --strategy=rolling"
  echo "  $0 --strategy=blue-green --services=\"api-gateway frontend\""
  echo "  $0 --strategy=canary --no-migrations"
  echo ""
}

main() {
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --strategy=*)
        DEPLOYMENT_STRATEGY="${1#*=}"
        shift
        ;;
      --services=*)
        SERVICES="${1#*=}"
        shift
        ;;
      --no-migrations)
        RUN_MIGRATIONS="false"
        shift
        ;;
      --no-tests)
        RUN_TESTS="false"
        shift
        ;;
      --no-health-checks)
        RUN_HEALTH_CHECKS="false"
        shift
        ;;
      --no-notifications)
        NOTIFY="false"
        shift
        ;;
      --help|-h)
        show_usage
        exit 0
        ;;
      *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
  done

  print_banner

  log INFO "==================================================================="
  log INFO "Deployment Configuration"
  log INFO "==================================================================="
  log INFO "Deployment ID:       $DEPLOYMENT_ID"
  log INFO "Strategy:            $DEPLOYMENT_STRATEGY"
  log INFO "Services:            $SERVICES"
  log INFO "Run Migrations:      $RUN_MIGRATIONS"
  log INFO "Run Tests:           $RUN_TESTS"
  log INFO "Run Health Checks:   $RUN_HEALTH_CHECKS"
  log INFO "Send Notifications:  $NOTIFY"
  log INFO "==================================================================="
  echo ""

  # Confirm deployment
  if [[ "${AUTO_CONFIRM:-false}" != "true" ]]; then
    echo -e "${YELLOW}${BOLD}Ready to deploy with $DEPLOYMENT_STRATEGY strategy${NC}"
    echo ""
    read -p "Continue with deployment? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log WARNING "Deployment cancelled"
      exit 0
    fi
  fi

  # Execute deployment
  if execute_deployment; then
    local elapsed=$(($(date +%s) - START_TIME))
    local duration="${elapsed}s"

    echo ""
    echo -e "${GREEN}${BOLD}✓ Deployment completed successfully!${NC}"
    echo ""
    echo "Deployment ID:    $DEPLOYMENT_ID"
    echo "Strategy:         $DEPLOYMENT_STRATEGY"
    echo "Services:         $SERVICES"
    echo "Duration:         $duration"
    echo "Log file:         $DEPLOY_LOG"
    echo ""
    exit 0
  else
    local elapsed=$(($(date +%s) - START_TIME))
    local duration="${elapsed}s"

    echo ""
    echo -e "${RED}${BOLD}✗ Deployment failed${NC}"
    echo ""
    echo "Deployment ID:    $DEPLOYMENT_ID"
    echo "Duration:         $duration"
    echo "Log file:         $DEPLOY_LOG"
    echo ""
    echo "Please review the logs and consider rolling back."
    echo ""
    exit 1
  fi
}

# Handle script interruption
trap 'log ERROR "Deployment interrupted"; save_deployment_state "interrupted" "" "User interrupted"; exit 1' INT TERM

main "$@"

exit 0
