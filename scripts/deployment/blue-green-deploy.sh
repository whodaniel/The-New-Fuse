#!/bin/bash

###############################################################################
# The New Fuse - Blue-Green Deployment Script
# Zero-downtime deployment with instant rollback capability
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BG_LOG_DIR="$PROJECT_ROOT/logs/blue-green"
BG_STATE_DIR="$PROJECT_ROOT/.deployment-state"

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
DEPLOYMENT_ID="bg-$(date +%Y%m%d-%H%M%S)"
SERVICE="${1:-}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-60}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-5}"

mkdir -p "$BG_LOG_DIR" "$BG_STATE_DIR"
BG_LOG="$BG_LOG_DIR/$DEPLOYMENT_ID.log"

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$BG_LOG" ;;
    SUCCESS) echo -e "${GREEN}[✓]${NC} $message" | tee -a "$BG_LOG" ;;
    WARNING) echo -e "${YELLOW}[⚠]${NC} $message" | tee -a "$BG_LOG" ;;
    ERROR)   echo -e "${RED}[✗]${NC} $message" | tee -a "$BG_LOG" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" | tee -a "$BG_LOG" ;;
    *)       echo "$message" | tee -a "$BG_LOG" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$BG_LOG"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║${NC}  ${BOLD}Blue-Green Deployment${NC}                                      ${BOLD}${BLUE}║${NC}"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# State Management
###############################################################################

save_deployment_state() {
  local service=$1
  local active_env=$2
  local inactive_env=$3

  local state_file="$BG_STATE_DIR/${service}-state.json"

  cat > "$state_file" <<EOF
{
  "service": "$service",
  "active_environment": "$active_env",
  "inactive_environment": "$inactive_env",
  "last_deployment": "$DEPLOYMENT_ID",
  "timestamp": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF

  log INFO "Deployment state saved to: $state_file"
}

load_deployment_state() {
  local service=$1
  local state_file="$BG_STATE_DIR/${service}-state.json"

  if [[ -f "$state_file" ]]; then
    cat "$state_file"
  else
    # Default state - blue is active
    cat <<EOF
{
  "service": "$service",
  "active_environment": "blue",
  "inactive_environment": "green",
  "last_deployment": "none",
  "timestamp": "$(date -Iseconds)"
}
EOF
  fi
}

get_active_environment() {
  local service=$1
  local state=$(load_deployment_state "$service")

  echo "$state" | jq -r '.active_environment' 2>/dev/null || echo "blue"
}

get_inactive_environment() {
  local service=$1
  local state=$(load_deployment_state "$service")

  echo "$state" | jq -r '.inactive_environment' 2>/dev/null || echo "green"
}

swap_environments() {
  local active=$1
  local inactive=$2

  if [[ "$active" == "blue" ]]; then
    echo "green|blue"
  else
    echo "blue|green"
  fi
}

###############################################################################
# Deployment Functions
###############################################################################

deploy_to_inactive_environment() {
  local service=$1
  local environment=$2

  print_section "Deploying to Inactive Environment ($environment)"

  log INFO "Service: $service"
  log INFO "Target environment: $environment"

  cd "$PROJECT_ROOT"

  # Build the service
  log STEP "Building service..."

  if ! pnpm run build --filter="@the-new-fuse/$service"; then
    log ERROR "Build failed for $service"
    return 1
  fi

  log SUCCESS "Build completed"

  # Deploy to inactive environment
  log STEP "Deploying to $environment environment..."

  if command -v cloud_runtime &>/dev/null; then
    # Deploy to environment-specific service
    export CLOUD_RUNTIME_SERVICE_NAME="${service}-${environment}"
    export CLOUD_RUNTIME_ENVIRONMENT="$environment"

    if ! cloud_runtime up --detach --service "$CLOUD_RUNTIME_SERVICE_NAME"; then
      log ERROR "Failed to deploy to $environment environment"
      return 1
    fi

    log SUCCESS "Deployed to $environment environment"

  else
    log ERROR "CloudRuntime CLI not available"
    return 1
  fi

  # Wait for deployment to stabilize
  log INFO "Waiting for deployment to stabilize..."
  sleep 10

  return 0
}

health_check_environment() {
  local service=$1
  local environment=$2

  print_section "Health Check: $environment Environment"

  # Get environment URL
  local service_url
  case $environment in
    blue)
      service_url="${BLUE_URL:-http://localhost:8001}"
      ;;
    green)
      service_url="${GREEN_URL:-http://localhost:8002}"
      ;;
    *)
      log ERROR "Unknown environment: $environment"
      return 1
      ;;
  esac

  log INFO "Service URL: $service_url"

  # Perform health checks
  local start_time=$(date +%s)
  local healthy=false

  while [[ $(($(date +%s) - start_time)) -lt $HEALTH_CHECK_TIMEOUT ]]; do
    log INFO "Checking health..."

    local response=$(curl -s -w "%{http_code}" --max-time 10 "$service_url/health" 2>/dev/null || echo "000")

    if [[ "$response" == "200" ]]; then
      log SUCCESS "$environment environment is healthy"
      healthy=true
      break
    else
      log WARNING "Health check failed (HTTP $response), retrying in ${HEALTH_CHECK_INTERVAL}s..."
      sleep "$HEALTH_CHECK_INTERVAL"
    fi
  done

  if [[ "$healthy" == "false" ]]; then
    log ERROR "$environment environment health check failed"
    return 1
  fi

  # Additional health checks
  log STEP "Running extended health checks..."

  # Check critical endpoints
  local endpoints=("/health" "/ready" "/metrics")

  for endpoint in "${endpoints[@]}"; do
    local url="$service_url$endpoint"
    local response=$(curl -s -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

    if [[ "$response" == "200" ]]; then
      log INFO "Endpoint $endpoint: OK"
    else
      log WARNING "Endpoint $endpoint: Failed (HTTP $response)"
    fi
  done

  # Performance check
  log STEP "Checking response time..."

  local start_ms=$(date +%s%3N)
  curl -s --max-time 10 "$service_url/health" >/dev/null 2>&1
  local end_ms=$(date +%s%3N)
  local latency=$((end_ms - start_ms))

  log INFO "Response time: ${latency}ms"

  if [[ $latency -gt 2000 ]]; then
    log WARNING "High latency detected: ${latency}ms"
  else
    log SUCCESS "Response time within acceptable range"
  fi

  return 0
}

smoke_test_environment() {
  local service=$1
  local environment=$2

  print_section "Smoke Tests: $environment Environment"

  log STEP "Running smoke tests..."

  # Run smoke test script if available
  if [[ -f "$SCRIPT_DIR/smoke-tests.sh" ]]; then
    # Set environment-specific URL
    case $environment in
      blue)
        export API_GATEWAY_URL="${BLUE_URL:-http://localhost:8001}"
        ;;
      green)
        export API_GATEWAY_URL="${GREEN_URL:-http://localhost:8002}"
        ;;
    esac

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

switch_traffic() {
  local service=$1
  local from_env=$2
  local to_env=$3

  print_section "Switching Traffic: $from_env → $to_env"

  log WARNING "This step requires manual configuration"
  log INFO "Update your load balancer / reverse proxy to route traffic to $to_env"

  # For CloudRuntime, you would:
  # 1. Update environment variables in the main service
  # 2. Or update DNS/load balancer to point to the new service
  # 3. Or swap the service URLs

  # Example using environment variable swap
  log STEP "Updating routing configuration..."

  if command -v cloud_runtime &>/dev/null; then
    # Update the main service to point to the new environment
    log INFO "Setting active environment to: $to_env"

    # This would require updating environment variables
    # cloud_runtime variables set ACTIVE_ENV="$to_env" --service "$service"

    log WARNING "Manual environment variable update required"
    log INFO "Set ACTIVE_ENV=$to_env in CloudRuntime dashboard"

    # Wait for user confirmation
    if [[ "${AUTO_CONFIRM:-false}" != "true" ]]; then
      echo ""
      echo -e "${YELLOW}Please update the load balancer configuration to route traffic to $to_env${NC}"
      echo ""
      read -p "Press Enter after traffic has been switched..." -r
      echo ""
    else
      log INFO "Auto-confirm enabled, waiting 30 seconds for manual switch..."
      sleep 30
    fi

    log SUCCESS "Traffic switch completed"
  else
    log ERROR "CloudRuntime CLI not available"
    return 1
  fi

  return 0
}

verify_production_traffic() {
  local service=$1
  local environment=$2

  print_section "Verifying Production Traffic"

  log STEP "Checking production endpoint..."

  # Check main production URL
  local prod_url="${PRODUCTION_URL:-http://localhost:3000}"

  local response=$(curl -s -w "%{http_code}" --max-time 10 "$prod_url/health" 2>/dev/null || echo "000")

  if [[ "$response" == "200" ]]; then
    log SUCCESS "Production endpoint is healthy"
  else
    log ERROR "Production endpoint check failed (HTTP $response)"
    return 1
  fi

  # Monitor for errors
  log STEP "Monitoring production traffic..."

  local error_count=0
  local success_count=0
  local iterations=10

  for i in $(seq 1 $iterations); do
    local response=$(curl -s -w "%{http_code}" --max-time 10 "$prod_url/health" 2>/dev/null || echo "000")

    if [[ "$response" == "200" ]]; then
      ((success_count++))
    else
      ((error_count++))
    fi

    sleep 2
  done

  local success_rate=$(echo "scale=2; $success_count * 100 / $iterations" | bc)

  log INFO "Success rate: ${success_rate}% ($success_count/$iterations)"

  if [[ $error_count -gt 2 ]]; then
    log ERROR "Too many errors detected: $error_count/$iterations"
    return 1
  else
    log SUCCESS "Production traffic is healthy"
    return 0
  fi
}

rollback_deployment() {
  local service=$1
  local from_env=$2
  local to_env=$3
  local reason="${4:-Health check failed}"

  print_section "Rolling Back Deployment"

  log WARNING "Rollback initiated: $reason"

  # Notify about rollback
  notify_rollback_started "$DEPLOYMENT_ID" "$reason" 2>/dev/null || true

  # Switch traffic back
  log STEP "Switching traffic back to $to_env..."

  switch_traffic "$service" "$from_env" "$to_env"

  log SUCCESS "Traffic switched back to $to_env"

  # Verify rollback
  if verify_production_traffic "$service" "$to_env"; then
    log SUCCESS "Rollback completed successfully"
  else
    log ERROR "Rollback verification failed - manual intervention required"
  fi

  # Notify about rollback completion
  notify_rollback_completed "$DEPLOYMENT_ID" "$to_env" 2>/dev/null || true
}

###############################################################################
# Blue-Green Deployment Flow
###############################################################################

run_blue_green_deployment() {
  local service=$1

  log INFO "Starting blue-green deployment for: $service"
  log INFO "Deployment ID: $DEPLOYMENT_ID"

  # Get current state
  local active_env=$(get_active_environment "$service")
  local inactive_env=$(get_inactive_environment "$service")

  log INFO "Current active environment: $active_env"
  log INFO "Deploying to inactive environment: $inactive_env"

  # Notify deployment started
  notify_deployment_started "$DEPLOYMENT_ID" "$(whoami)" "$(git rev-parse --short HEAD 2>/dev/null)" 2>/dev/null || true

  # Step 1: Deploy to inactive environment
  if ! deploy_to_inactive_environment "$service" "$inactive_env"; then
    log ERROR "Failed to deploy to inactive environment"
    notify_deployment_failed "$DEPLOYMENT_ID" "Deployment to $inactive_env failed" "deploy_to_inactive_environment" 2>/dev/null || true
    return 1
  fi

  # Step 2: Health check inactive environment
  if ! health_check_environment "$service" "$inactive_env"; then
    log ERROR "Health check failed for inactive environment"
    notify_deployment_failed "$DEPLOYMENT_ID" "Health check failed for $inactive_env" "health_check_environment" 2>/dev/null || true
    return 1
  fi

  # Step 3: Run smoke tests on inactive environment
  if ! smoke_test_environment "$service" "$inactive_env"; then
    log ERROR "Smoke tests failed for inactive environment"
    notify_deployment_failed "$DEPLOYMENT_ID" "Smoke tests failed for $inactive_env" "smoke_test_environment" 2>/dev/null || true
    return 1
  fi

  # Step 4: Switch traffic to inactive environment
  if ! switch_traffic "$service" "$active_env" "$inactive_env"; then
    log ERROR "Failed to switch traffic"
    notify_deployment_failed "$DEPLOYMENT_ID" "Traffic switch failed" "switch_traffic" 2>/dev/null || true
    return 1
  fi

  # Step 5: Verify production traffic
  if ! verify_production_traffic "$service" "$inactive_env"; then
    log ERROR "Production traffic verification failed"
    log WARNING "Initiating rollback..."

    rollback_deployment "$service" "$inactive_env" "$active_env" "Production verification failed"

    notify_deployment_failed "$DEPLOYMENT_ID" "Production verification failed - rolled back" "verify_production_traffic" 2>/dev/null || true
    return 1
  fi

  # Step 6: Update deployment state
  local swapped=$(swap_environments "$active_env" "$inactive_env")
  local new_active=$(echo "$swapped" | cut -d'|' -f1)
  local new_inactive=$(echo "$swapped" | cut -d'|' -f2)

  save_deployment_state "$service" "$new_active" "$new_inactive"

  log SUCCESS "Deployment state updated"
  log INFO "New active environment: $new_active"
  log INFO "New inactive environment: $new_inactive"

  # Notify deployment completed
  notify_deployment_completed "$DEPLOYMENT_ID" "$(date +%s)" "$service" 2>/dev/null || true

  return 0
}

###############################################################################
# Main Entry Point
###############################################################################

main() {
  print_banner

  if [[ -z "$SERVICE" ]]; then
    log ERROR "No service specified"
    echo ""
    echo "Usage: $0 <service-name>"
    echo ""
    echo "Available services:"
    echo "  - api-gateway"
    echo "  - backend"
    echo "  - frontend"
    echo "  - api"
    echo ""
    echo "Environment Variables:"
    echo "  BLUE_URL                  - Blue environment URL"
    echo "  GREEN_URL                 - Green environment URL"
    echo "  PRODUCTION_URL            - Production URL"
    echo "  HEALTH_CHECK_TIMEOUT      - Health check timeout in seconds (default: 60)"
    echo "  HEALTH_CHECK_INTERVAL     - Health check interval in seconds (default: 5)"
    echo "  AUTO_CONFIRM              - Skip confirmation prompts (default: false)"
    echo ""
    echo "Commands:"
    echo "  $0 <service>              - Run blue-green deployment"
    echo "  $0 <service> status       - Show current deployment state"
    echo "  $0 <service> rollback     - Rollback to previous environment"
    echo ""
    exit 1
  fi

  # Handle special commands
  if [[ "${2:-}" == "status" ]]; then
    print_section "Deployment State: $SERVICE"

    local state=$(load_deployment_state "$SERVICE")

    echo "$state" | jq . 2>/dev/null || echo "$state"

    exit 0
  fi

  if [[ "${2:-}" == "rollback" ]]; then
    local active_env=$(get_active_environment "$SERVICE")
    local inactive_env=$(get_inactive_environment "$SERVICE")

    rollback_deployment "$SERVICE" "$active_env" "$inactive_env" "Manual rollback requested"

    exit $?
  fi

  # Display configuration
  log INFO "==================================================================="
  log INFO "Blue-Green Deployment Configuration"
  log INFO "==================================================================="
  log INFO "Service:                 $SERVICE"
  log INFO "Deployment ID:           $DEPLOYMENT_ID"
  log INFO "Health check timeout:    $HEALTH_CHECK_TIMEOUT seconds"
  log INFO "Health check interval:   $HEALTH_CHECK_INTERVAL seconds"
  log INFO "==================================================================="
  echo ""

  # Show current state
  local active_env=$(get_active_environment "$SERVICE")
  local inactive_env=$(get_inactive_environment "$SERVICE")

  log INFO "Current state:"
  log INFO "  Active environment:    $active_env"
  log INFO "  Inactive environment:  $inactive_env"
  echo ""

  # Confirm deployment
  if [[ "${AUTO_CONFIRM:-false}" != "true" ]]; then
    echo -e "${YELLOW}${BOLD}This will deploy to the $inactive_env environment and switch traffic.${NC}"
    echo ""
    read -p "Continue with blue-green deployment? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log WARNING "Deployment cancelled"
      exit 0
    fi
  fi

  # Run blue-green deployment
  if run_blue_green_deployment "$SERVICE"; then
    echo ""
    echo -e "${GREEN}${BOLD}✓ Blue-green deployment completed successfully!${NC}"
    echo ""
    echo "Service: $SERVICE"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Active environment: $(get_active_environment "$SERVICE")"
    echo "Log file: $BG_LOG"
    echo ""
    exit 0
  else
    echo ""
    echo -e "${RED}${BOLD}✗ Blue-green deployment failed${NC}"
    echo ""
    echo "Service: $SERVICE"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Log file: $BG_LOG"
    echo ""
    echo "Please review the logs for details."
    echo ""
    exit 1
  fi
}

# Handle script interruption
trap 'log ERROR "Deployment interrupted"; exit 1' INT TERM

main "$@"

exit 0
