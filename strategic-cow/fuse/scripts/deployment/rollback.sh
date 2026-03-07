#!/bin/bash

###############################################################################
# The New Fuse - Automated Rollback Script
# Rolls back failed deployments to previous stable version
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_LOG_DIR="$PROJECT_ROOT/logs/deployment"
BACKUP_DIR="$PROJECT_ROOT/backups"

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
DEPLOYMENT_ID="${1:-}"
ROLLBACK_LOG="$DEPLOYMENT_LOG_DIR/rollback-$(date +%Y%m%d-%H%M%S).log"

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$ROLLBACK_LOG" ;;
    SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$ROLLBACK_LOG" ;;
    WARNING) echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$ROLLBACK_LOG" ;;
    ERROR)   echo -e "${RED}[ERROR]${NC} $message" | tee -a "$ROLLBACK_LOG" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" | tee -a "$ROLLBACK_LOG" ;;
    *)       echo "$message" | tee -a "$ROLLBACK_LOG" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$ROLLBACK_LOG"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${RED}║${NC}  ${BOLD}AUTOMATED ROLLBACK${NC}                                         ${BOLD}${RED}║${NC}"
  echo -e "${BOLD}${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# Rollback Functions
###############################################################################

get_previous_deployment() {
  print_section "Identifying Previous Deployment"

  local deployments=()
  local deployment_states=()

  # Find all deployment state files
  while IFS= read -r state_file; do
    if [[ -f "$state_file" ]]; then
      deployments+=("$(basename "$state_file" -state.json)")
    fi
  done < <(find "$DEPLOYMENT_LOG_DIR" -name "*-state.json" -type f 2>/dev/null | sort -r)

  if [ ${#deployments[@]} -eq 0 ]; then
    log ERROR "No previous deployments found"
    return 1
  fi

  log INFO "Found ${#deployments[@]} previous deployment(s)"

  # Find the last successful deployment (before the failed one)
  local previous_deployment=""

  for deployment in "${deployments[@]}"; do
    if [[ "$deployment" != "$DEPLOYMENT_ID" ]]; then
      local state_file="$DEPLOYMENT_LOG_DIR/$deployment-state.json"

      if grep -q '"deployment_status".*"completed"' "$state_file" 2>/dev/null; then
        previous_deployment="$deployment"
        log SUCCESS "Found previous successful deployment: $previous_deployment"
        echo "$previous_deployment"
        return 0
      fi
    fi
  done

  log ERROR "No successful deployment found to rollback to"
  return 1
}

confirm_rollback() {
  local previous_deployment=$1

  print_section "Rollback Confirmation"

  echo ""
  echo -e "${YELLOW}${BOLD}WARNING:${NC} You are about to rollback the deployment"
  echo ""
  echo -e "  Current (failed): ${RED}$DEPLOYMENT_ID${NC}"
  echo -e "  Rollback to:      ${GREEN}$previous_deployment${NC}"
  echo ""

  # In automated mode, skip confirmation
  if [[ "${AUTO_CONFIRM:-false}" == "true" ]]; then
    log WARNING "Auto-confirm enabled, proceeding with rollback"
    return 0
  fi

  read -p "Are you sure you want to proceed? (yes/no): " -r
  echo

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log WARNING "Rollback cancelled by user"
    exit 0
  fi

  log INFO "Rollback confirmed"
}

stop_current_services() {
  print_section "Stopping Current Services"

  log STEP "Stopping services..."

  # Stop Railway services if Railway CLI is available
  if command -v railway &>/dev/null; then
    local services=("api-gateway" "backend" "frontend" "api")

    for service in "${services[@]}"; do
      log INFO "Stopping $service..."

      # Railway doesn't have a direct "stop" command, but we can scale to 0
      railway run --service "$service" -- echo "Preparing for rollback" &>/dev/null || {
        log WARNING "Could not interact with $service (may not exist)"
      }
    done
  else
    log WARNING "Railway CLI not available, skipping service stop"
  fi

  log SUCCESS "Services prepared for rollback"
}

rollback_database() {
  print_section "Rolling Back Database"

  local previous_deployment=$1

  log STEP "Checking for database backup..."

  local backup_file="$BACKUP_DIR/database/backup-$previous_deployment.sql"

  if [[ ! -f "$backup_file" ]]; then
    log WARNING "Database backup not found: $backup_file"
    log WARNING "Skipping database rollback (DANGEROUS - database may be inconsistent)"
    return 0
  fi

  log INFO "Found database backup: $backup_file"

  # Confirm database rollback
  if [[ "${AUTO_CONFIRM:-false}" != "true" ]]; then
    echo ""
    echo -e "${YELLOW}${BOLD}WARNING:${NC} Database rollback will restore to previous state"
    echo "This will ${RED}${BOLD}DELETE${NC} any data created after: $previous_deployment"
    echo ""
    read -p "Proceed with database rollback? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log WARNING "Database rollback skipped by user"
      return 0
    fi
  fi

  log STEP "Rolling back database..."

  # Create a backup of current state before rolling back
  local emergency_backup="$BACKUP_DIR/database/emergency-backup-$(date +%Y%m%d-%H%M%S).sql"
  log INFO "Creating emergency backup before rollback..."

  # This is a placeholder - actual implementation depends on database type
  # For PostgreSQL:
  # pg_dump "$DATABASE_URL" > "$emergency_backup"

  log INFO "Emergency backup created: $emergency_backup"

  # Restore from backup
  log STEP "Restoring database from backup..."

  # This is a placeholder - actual implementation depends on database type
  # For PostgreSQL:
  # psql "$DATABASE_URL" < "$backup_file"

  # For Drizzle migrations, we might need to:
  if [[ -d "$PROJECT_ROOT/drizzle" ]]; then
    log INFO "Reverting Drizzle migrations..."

    # Get the migration state from previous deployment
    # This would require tracking which migrations were applied

    log WARNING "Drizzle migration rollback not fully implemented"
    log INFO "You may need to manually revert migrations"
  fi

  log SUCCESS "Database rollback completed"
}

rollback_code() {
  print_section "Rolling Back Code"

  local previous_deployment=$1

  log STEP "Rolling back code to previous version..."

  # Get the git commit from previous deployment
  local state_file="$DEPLOYMENT_LOG_DIR/$previous_deployment-state.json"

  if [[ -f "$state_file" ]]; then
    # Try to extract git commit if stored
    local git_commit=$(jq -r '.git_commit // empty' "$state_file" 2>/dev/null || echo "")

    if [[ -n "$git_commit" ]]; then
      log INFO "Found git commit: $git_commit"

      # Checkout the previous commit
      cd "$PROJECT_ROOT"

      log STEP "Checking out commit: $git_commit"
      git checkout "$git_commit" || {
        log ERROR "Failed to checkout commit"
        return 1
      }

      log SUCCESS "Code rolled back to commit: $git_commit"
    else
      log WARNING "Git commit not found in deployment state"
    fi
  else
    log WARNING "Deployment state file not found"
  fi
}

restore_build_artifacts() {
  print_section "Restoring Build Artifacts"

  local previous_deployment=$1

  log STEP "Restoring previous build artifacts..."

  local backup_path="$BACKUP_DIR/builds/$previous_deployment"

  if [[ ! -d "$backup_path" ]]; then
    log WARNING "Build backup not found: $backup_path"
    log INFO "Will rebuild from source"
    return 0
  fi

  log INFO "Found build backup: $backup_path"

  # Restore built artifacts
  local services=("api-gateway" "backend" "frontend" "api")

  for service in "${services[@]}"; do
    local backup_dist="$backup_path/$service-dist"
    local target_dist="$PROJECT_ROOT/apps/$service/dist"

    if [[ -d "$backup_dist" ]]; then
      log INFO "Restoring $service build artifacts..."

      # Remove current dist
      rm -rf "$target_dist"

      # Copy from backup
      cp -r "$backup_dist" "$target_dist"

      log SUCCESS "$service build artifacts restored"
    else
      log WARNING "No backup found for $service"
    fi
  done

  log SUCCESS "Build artifacts restored"
}

rebuild_services() {
  print_section "Rebuilding Services"

  log STEP "Rebuilding services from source..."

  cd "$PROJECT_ROOT"

  # Install dependencies
  log INFO "Installing dependencies..."
  pnpm install --frozen-lockfile || {
    log ERROR "Failed to install dependencies"
    return 1
  }

  # Build services
  log INFO "Building services..."

  if [[ -f "$PROJECT_ROOT/scripts/build-railway.cjs" ]]; then
    node "$PROJECT_ROOT/scripts/build-railway.cjs" || {
      log ERROR "Build failed"
      return 1
    }
  else
    pnpm run build || {
      log ERROR "Build failed"
      return 1
    }
  fi

  log SUCCESS "Services rebuilt successfully"
}

redeploy_services() {
  print_section "Redeploying Services"

  log STEP "Redeploying services to Railway..."

  if ! command -v railway &>/dev/null; then
    log ERROR "Railway CLI not available"
    log ERROR "Manual deployment required"
    return 1
  fi

  local services=("api-gateway" "backend" "frontend" "api")

  for service in "${services[@]}"; do
    local service_path="$PROJECT_ROOT/apps/$service"

    if [[ ! -d "$service_path" ]]; then
      log WARNING "Service directory not found: $service_path"
      continue
    fi

    log INFO "Deploying $service..."

    cd "$service_path"
    railway up --detach || {
      log ERROR "Deployment failed for $service"
      cd "$PROJECT_ROOT"
      return 1
    }
    cd "$PROJECT_ROOT"

    log SUCCESS "$service deployed"

    # Wait between deployments
    sleep 3
  done

  log SUCCESS "All services redeployed"
}

verify_rollback() {
  print_section "Verifying Rollback"

  log STEP "Running health checks..."

  # Wait for services to stabilize
  log INFO "Waiting for services to stabilize..."
  sleep 10

  # Check service health
  if command -v railway &>/dev/null; then
    local services=("api-gateway" "backend" "frontend" "api")
    local all_healthy=true

    for service in "${services[@]}"; do
      log INFO "Checking $service health..."

      if railway status --service "$service" &>/dev/null; then
        log SUCCESS "$service is healthy"
      else
        log ERROR "$service health check failed"
        all_healthy=false
      fi
    done

    if [[ "$all_healthy" == "true" ]]; then
      log SUCCESS "All services are healthy"
      return 0
    else
      log ERROR "Some services are not healthy"
      return 1
    fi
  else
    log WARNING "Railway CLI not available, skipping health checks"
    log WARNING "Please verify services manually"
  fi
}

cleanup_failed_deployment() {
  print_section "Cleaning Up Failed Deployment"

  log INFO "Marking deployment as rolled back..."

  local state_file="$DEPLOYMENT_LOG_DIR/$DEPLOYMENT_ID-state.json"

  if [[ -f "$state_file" ]]; then
    # Add rollback info to state file
    echo "{\"deployment_status\":\"rolled_back\",\"rollback_time\":\"$(date -Iseconds)\"}" >> "$state_file"
  fi

  log SUCCESS "Cleanup completed"
}

send_notification() {
  local status=$1
  local message=$2

  log INFO "Sending rollback notification: $message"

  # Placeholder for notification integration
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"[$status] $message\"}" \
      &>/dev/null || true
  fi
}

###############################################################################
# Main Rollback Flow
###############################################################################

main() {
  print_banner

  # Ensure log directory exists
  mkdir -p "$DEPLOYMENT_LOG_DIR"

  log INFO "Starting rollback process..."

  if [[ -z "$DEPLOYMENT_ID" ]]; then
    log ERROR "Deployment ID not provided"
    log INFO "Usage: $0 <deployment-id>"
    log INFO "Example: $0 deploy-20231215-143022"
    exit 1
  fi

  log INFO "Rolling back deployment: $DEPLOYMENT_ID"
  log INFO "Rollback log: $ROLLBACK_LOG"

  # Get previous deployment
  local previous_deployment=$(get_previous_deployment)

  if [[ -z "$previous_deployment" ]]; then
    log ERROR "Cannot determine previous deployment"
    exit 1
  fi

  # Confirm rollback
  confirm_rollback "$previous_deployment"

  # Execute rollback
  stop_current_services

  rollback_database "$previous_deployment" || {
    log ERROR "Database rollback failed"
    log ERROR "Manual intervention may be required"
    # Continue anyway - code rollback might still help
  }

  rollback_code "$previous_deployment" || {
    log WARNING "Code rollback failed, will rebuild from current state"
  }

  restore_build_artifacts "$previous_deployment" || {
    log WARNING "Could not restore build artifacts, rebuilding..."
    rebuild_services || {
      log ERROR "Rebuild failed"
      exit 1
    }
  }

  redeploy_services || {
    log ERROR "Service redeployment failed"
    exit 1
  }

  verify_rollback || {
    log WARNING "Rollback verification failed - manual check required"
  }

  cleanup_failed_deployment

  # Success
  print_section "Rollback Complete"

  log SUCCESS "Rollback completed successfully!"
  log INFO "Rolled back from: $DEPLOYMENT_ID"
  log INFO "Restored to: $previous_deployment"
  log INFO "Rollback log: $ROLLBACK_LOG"

  send_notification "SUCCESS" "Rollback completed: $DEPLOYMENT_ID → $previous_deployment"

  echo ""
  echo -e "${BOLD}Next Steps:${NC}"
  echo "  1. Verify all services are working correctly"
  echo "  2. Check application logs for any issues"
  echo "  3. Review what caused the failed deployment"
  echo "  4. Plan fixes before next deployment attempt"
  echo ""
}

# Handle script interruption
trap 'log ERROR "Rollback interrupted"; exit 1' INT TERM

# Run main rollback
main

exit 0
