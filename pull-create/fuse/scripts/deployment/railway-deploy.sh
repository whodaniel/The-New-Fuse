#!/bin/bash

###############################################################################
# The New Fuse - Railway Deployment Utility
# Advanced Railway deployment with environment management and monitoring
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
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
SERVICES=("${SERVICE:-}")  # Can deploy specific service or all
WATCH_LOGS="${WATCH_LOGS:-false}"
WAIT_FOR_DEPLOY="${WAIT_FOR_DEPLOY:-true}"

log() {
  local level=$1
  shift
  local message="$*"

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" ;;
    SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
    WARNING) echo -e "${YELLOW}[WARNING]${NC} $message" ;;
    ERROR)   echo -e "${RED}[ERROR]${NC} $message" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" ;;
    *)       echo "$message" ;;
  esac
}

print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}  ${BOLD}Railway Deployment Utility${NC}                                 ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

check_railway_cli() {
  print_section "Checking Railway CLI"

  if ! command -v railway &>/dev/null; then
    log ERROR "Railway CLI is not installed"
    log INFO "Install with: npm install -g @railway/cli"
    exit 1
  fi

  log SUCCESS "Railway CLI found"

  local version=$(railway --version 2>&1 || echo "unknown")
  log INFO "Version: $version"
}

check_authentication() {
  print_section "Checking Authentication"

  if ! railway whoami &>/dev/null; then
    log ERROR "Not authenticated with Railway"
    log INFO "Run: railway login"
    exit 1
  fi

  local user=$(railway whoami 2>&1)
  log SUCCESS "Authenticated as: $user"
}

check_project_link() {
  print_section "Checking Project Link"

  if ! railway status &>/dev/null; then
    log ERROR "Not linked to a Railway project"
    log INFO "Run: railway link"
    exit 1
  fi

  log SUCCESS "Project is linked"

  log INFO "Current project info:"
  railway status 2>&1 | head -10
}

sync_environment_variables() {
  print_section "Syncing Environment Variables"

  local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"

  if [[ ! -f "$env_file" ]]; then
    log WARNING "Environment file not found: $env_file"
    return 0
  fi

  log INFO "Syncing environment variables from: $env_file"

  # Read .env file and set variables in Railway
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

    # Skip Railway internal references (they're already set)
    if [[ "$value" =~ ^\$\{\{.*\}\}$ ]]; then
      log INFO "Skipping Railway internal reference: $key"
      continue
    fi

    log INFO "Setting $key..."
    railway variables --set "$key=$value" &>/dev/null || {
      log WARNING "Failed to set $key"
    }
  done < "$env_file"

  log SUCCESS "Environment variables synced"
}

list_services() {
  print_section "Available Services"

  local services_dir="$PROJECT_ROOT/apps"

  if [[ ! -d "$services_dir" ]]; then
    log ERROR "Services directory not found: $services_dir"
    return 1
  fi

  log INFO "Available services:"

  local available_services=()

  for service_dir in "$services_dir"/*; do
    if [[ -d "$service_dir" ]]; then
      local service_name=$(basename "$service_dir")

      # Check if service has Dockerfile or railway.toml
      if [[ -f "$service_dir/Dockerfile" ]] || [[ -f "$service_dir/railway.toml" ]]; then
        echo "  - $service_name"
        available_services+=("$service_name")
      fi
    fi
  done

  echo "${available_services[@]}"
}

deploy_service() {
  local service=$1
  local service_path="$PROJECT_ROOT/apps/$service"

  print_section "Deploying $service"

  if [[ ! -d "$service_path" ]]; then
    log ERROR "Service directory not found: $service_path"
    return 1
  fi

  cd "$service_path"

  log INFO "Deploying from: $service_path"

  # Check for Dockerfile
  if [[ ! -f "Dockerfile" ]] && [[ ! -f "Dockerfile.railway" ]]; then
    log WARNING "No Dockerfile found for $service"
  fi

  # Deploy using Railway
  log STEP "Triggering deployment..."

  if [[ "$WAIT_FOR_DEPLOY" == "true" ]]; then
    railway up --service "$service" || {
      log ERROR "Deployment failed for $service"
      cd "$PROJECT_ROOT"
      return 1
    }
  else
    railway up --detach --service "$service" || {
      log ERROR "Deployment failed for $service"
      cd "$PROJECT_ROOT"
      return 1
    }
  fi

  cd "$PROJECT_ROOT"

  log SUCCESS "$service deployment triggered"

  # Get deployment URL
  get_service_url "$service"

  return 0
}

get_service_url() {
  local service=$1

  log INFO "Fetching service URL..."

  # Try to get the service domain
  local domain=$(railway domain --service "$service" 2>&1 || echo "")

  if [[ -n "$domain" ]] && [[ "$domain" != *"error"* ]]; then
    log SUCCESS "Service URL: https://$domain"
  else
    log INFO "Service URL not available yet (may not be exposed)"
  fi
}

watch_deployment() {
  local service=$1

  print_section "Watching Deployment: $service"

  log INFO "Streaming logs for $service..."
  log INFO "Press Ctrl+C to stop watching"

  railway logs --service "$service" || {
    log WARNING "Could not stream logs"
  }
}

check_service_health() {
  local service=$1

  print_section "Checking Service Health: $service"

  log INFO "Checking deployment status..."

  if railway status --service "$service" &>/dev/null; then
    log SUCCESS "$service is running"

    # Get service info
    railway status --service "$service" 2>&1 | head -10

    return 0
  else
    log ERROR "$service is not running or health check failed"
    return 1
  fi
}

deploy_all_services() {
  print_section "Deploying All Services"

  local services=($(list_services))

  log INFO "Will deploy ${#services[@]} services: ${services[*]}"

  local failed_services=()

  for service in "${services[@]}"; do
    if deploy_service "$service"; then
      log SUCCESS "$service deployment completed"
    else
      log ERROR "$service deployment failed"
      failed_services+=("$service")
    fi

    # Wait between deployments
    sleep 5
  done

  if [[ ${#failed_services[@]} -gt 0 ]]; then
    log ERROR "Failed to deploy: ${failed_services[*]}"
    return 1
  fi

  log SUCCESS "All services deployed successfully"
  return 0
}

show_deployment_status() {
  print_section "Deployment Status"

  log INFO "Fetching deployment status..."

  railway status || {
    log WARNING "Could not fetch status"
    return 1
  }
}

show_service_logs() {
  local service=${1:-}

  if [[ -z "$service" ]]; then
    log ERROR "Service name required"
    log INFO "Usage: $0 logs <service-name>"
    return 1
  fi

  print_section "Service Logs: $service"

  railway logs --service "$service" || {
    log ERROR "Could not fetch logs for $service"
    return 1
  }
}

promote_to_production() {
  print_section "Promoting to Production"

  log WARNING "This will promote staging environment to production"

  read -p "Are you sure? (yes/no): " -r
  echo

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log INFO "Promotion cancelled"
    return 0
  fi

  log STEP "Promoting environment..."

  # Railway environment promotion
  railway environment --promote || {
    log ERROR "Environment promotion failed"
    return 1
  }

  log SUCCESS "Environment promoted to production"
}

###############################################################################
# Main Function
###############################################################################

show_usage() {
  cat << EOF
${BOLD}Usage:${NC} $0 [COMMAND] [OPTIONS]

${BOLD}Commands:${NC}
  deploy [service]    Deploy service(s) to Railway
  all                 Deploy all services
  status              Show deployment status
  logs <service>      Show service logs
  health <service>    Check service health
  sync-env            Sync environment variables
  promote             Promote to production
  watch <service>     Watch deployment logs

${BOLD}Options:${NC}
  ENVIRONMENT=<env>          Set environment (default: production)
  WAIT_FOR_DEPLOY=<bool>     Wait for deployment (default: true)
  WATCH_LOGS=<bool>          Watch logs after deploy (default: false)

${BOLD}Examples:${NC}
  $0 deploy api-gateway
  $0 all
  $0 status
  $0 logs api-gateway
  ENVIRONMENT=staging $0 deploy frontend
EOF
}

main() {
  print_banner

  local command=${1:-deploy}
  local arg=${2:-}

  # Check prerequisites
  check_railway_cli
  check_authentication
  check_project_link

  case "$command" in
    deploy)
      if [[ -n "$arg" ]]; then
        deploy_service "$arg"

        if [[ "$WATCH_LOGS" == "true" ]]; then
          watch_deployment "$arg"
        fi
      else
        log ERROR "Service name required"
        log INFO "Usage: $0 deploy <service-name>"
        exit 1
      fi
      ;;

    all)
      deploy_all_services
      ;;

    status)
      show_deployment_status
      ;;

    logs)
      show_service_logs "$arg"
      ;;

    health)
      if [[ -n "$arg" ]]; then
        check_service_health "$arg"
      else
        log ERROR "Service name required"
        exit 1
      fi
      ;;

    sync-env)
      sync_environment_variables
      ;;

    promote)
      promote_to_production
      ;;

    watch)
      if [[ -n "$arg" ]]; then
        watch_deployment "$arg"
      else
        log ERROR "Service name required"
        exit 1
      fi
      ;;

    help|--help|-h)
      show_usage
      ;;

    *)
      log ERROR "Unknown command: $command"
      echo ""
      show_usage
      exit 1
      ;;
  esac

  log SUCCESS "Operation completed"
}

main "$@"

exit 0
