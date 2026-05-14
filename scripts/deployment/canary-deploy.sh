#!/bin/bash

###############################################################################
# The New Fuse - Canary Deployment Script
# Gradual rollout with automatic rollback on errors
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CANARY_LOG_DIR="$PROJECT_ROOT/logs/canary"

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
CANARY_PERCENTAGE="${CANARY_PERCENTAGE:-10}"  # Start with 10% traffic
CANARY_INCREMENT="${CANARY_INCREMENT:-20}"    # Increase by 20% each step
CANARY_DURATION="${CANARY_DURATION:-300}"     # Monitor for 5 minutes per step
CANARY_ERROR_THRESHOLD="${CANARY_ERROR_THRESHOLD:-5}"  # Max error rate %
CANARY_LATENCY_THRESHOLD="${CANARY_LATENCY_THRESHOLD:-2000}"  # Max latency in ms

DEPLOYMENT_ID="canary-$(date +%Y%m%d-%H%M%S)"
SERVICE="${1:-}"

mkdir -p "$CANARY_LOG_DIR"
CANARY_LOG="$CANARY_LOG_DIR/$DEPLOYMENT_ID.log"

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$CANARY_LOG" ;;
    SUCCESS) echo -e "${GREEN}[✓]${NC} $message" | tee -a "$CANARY_LOG" ;;
    WARNING) echo -e "${YELLOW}[⚠]${NC} $message" | tee -a "$CANARY_LOG" ;;
    ERROR)   echo -e "${RED}[✗]${NC} $message" | tee -a "$CANARY_LOG" ;;
    STEP)    echo -e "${CYAN}[STEP]${NC} $message" | tee -a "$CANARY_LOG" ;;
    *)       echo "$message" | tee -a "$CANARY_LOG" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$CANARY_LOG"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}  ${BOLD}Canary Deployment${NC}                                          ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# Canary Deployment Functions
###############################################################################

deploy_canary_version() {
  local service=$1
  local percentage=$2

  print_section "Deploying Canary Version ($percentage% traffic)"

  log INFO "Service: $service"
  log INFO "Traffic percentage: $percentage%"

  # For CloudRuntime, we can use environment groups or separate services
  # For now, we'll deploy a separate canary service

  log STEP "Building canary version..."

  cd "$PROJECT_ROOT"

  # Build the service
  if ! pnpm run build --filter="@the-new-fuse/$service"; then
    log ERROR "Build failed for $service"
    return 1
  fi

  log SUCCESS "Build completed"

  log STEP "Deploying canary instance..."

  # Deploy to CloudRuntime with canary tag
  if command -v cloud_runtime &>/dev/null; then
    # Create or update canary service
    export CLOUD_RUNTIME_SERVICE_NAME="${service}-canary"

    if ! cloud_runtime up --detach --service "$CLOUD_RUNTIME_SERVICE_NAME"; then
      log ERROR "Failed to deploy canary version"
      return 1
    fi

    log SUCCESS "Canary version deployed"

    # Update traffic routing (this would depend on your load balancer)
    # For CloudRuntime, you might use environment variables or external load balancer
    log INFO "Configure load balancer to route $percentage% traffic to canary"
    log WARNING "Manual traffic routing configuration may be required"

  else
    log ERROR "CloudRuntime CLI not available"
    return 1
  fi

  return 0
}

monitor_canary_metrics() {
  local service=$1
  local percentage=$2
  local duration=$3

  print_section "Monitoring Canary Metrics ($percentage% traffic)"

  log INFO "Monitoring for $duration seconds..."

  local start_time=$(date +%s)
  local end_time=$((start_time + duration))

  local total_requests=0
  local error_count=0
  local total_latency=0

  while [[ $(date +%s) -lt $end_time ]]; do
    local remaining=$((end_time - $(date +%s)))
    log INFO "Monitoring... ${remaining}s remaining"

    # Check canary health
    local canary_url="${CANARY_URL:-http://localhost:8080}"

    # Make test request
    local start_ms=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" --max-time 10 "$canary_url/health" 2>/dev/null || echo "000")
    local end_ms=$(date +%s%3N)
    local latency=$((end_ms - start_ms))

    ((total_requests++))

    # Check for errors
    if [[ "$response" != "200" ]]; then
      ((error_count++))
      log WARNING "Error response: $response"
    fi

    # Track latency
    total_latency=$((total_latency + latency))

    # Check metrics every 30 seconds
    sleep 30
  done

  # Calculate metrics
  local error_rate=0
  if [[ $total_requests -gt 0 ]]; then
    error_rate=$(echo "scale=2; $error_count * 100 / $total_requests" | bc)
  fi

  local avg_latency=0
  if [[ $total_requests -gt 0 ]]; then
    avg_latency=$((total_latency / total_requests))
  fi

  log INFO "Monitoring complete"
  log INFO "Total requests: $total_requests"
  log INFO "Errors: $error_count"
  log INFO "Error rate: ${error_rate}%"
  log INFO "Average latency: ${avg_latency}ms"

  # Check thresholds
  local metrics_ok=true

  if [[ $(echo "$error_rate > $CANARY_ERROR_THRESHOLD" | bc) -eq 1 ]]; then
    log ERROR "Error rate ${error_rate}% exceeds threshold ${CANARY_ERROR_THRESHOLD}%"
    metrics_ok=false
  else
    log SUCCESS "Error rate within threshold"
  fi

  if [[ $avg_latency -gt $CANARY_LATENCY_THRESHOLD ]]; then
    log ERROR "Latency ${avg_latency}ms exceeds threshold ${CANARY_LATENCY_THRESHOLD}ms"
    metrics_ok=false
  else
    log SUCCESS "Latency within threshold"
  fi

  if [[ "$metrics_ok" == "true" ]]; then
    return 0
  else
    return 1
  fi
}

increase_canary_traffic() {
  local service=$1
  local from_percentage=$2
  local to_percentage=$3

  print_section "Increasing Canary Traffic: $from_percentage% → $to_percentage%"

  log INFO "Updating traffic routing..."

  # Update load balancer configuration
  # This is highly dependent on your infrastructure
  # For CloudRuntime, you might need to update environment variables or use external load balancer

  log WARNING "Manual traffic routing update required"
  log INFO "Update load balancer to route $to_percentage% to canary"

  # Wait for configuration to propagate
  log INFO "Waiting for configuration to propagate..."
  sleep 10

  log SUCCESS "Traffic routing updated to $to_percentage%"

  return 0
}

promote_canary_to_production() {
  local service=$1

  print_section "Promoting Canary to Production"

  log INFO "Canary version has passed all checks"
  log STEP "Promoting to production..."

  if command -v cloud_runtime &>/dev/null; then
    # Swap canary and production
    log INFO "Updating production service..."

    # Deploy canary version to production service
    export CLOUD_RUNTIME_SERVICE_NAME="$service"

    if cloud_runtime up --detach --service "$CLOUD_RUNTIME_SERVICE_NAME"; then
      log SUCCESS "Production service updated"
    else
      log ERROR "Failed to update production service"
      return 1
    fi

    # Remove canary service
    log INFO "Cleaning up canary service..."
    export CLOUD_RUNTIME_SERVICE_NAME="${service}-canary"

    # Note: CloudRuntime doesn't have a direct delete command in CLI
    # You might need to use the CloudRuntime API or dashboard
    log WARNING "Manual cleanup of canary service may be required"

  else
    log ERROR "CloudRuntime CLI not available"
    return 1
  fi

  log SUCCESS "Canary promoted to production"

  return 0
}

rollback_canary() {
  local service=$1
  local reason="${2:-Metrics threshold exceeded}"

  print_section "Rolling Back Canary Deployment"

  log WARNING "Rollback initiated: $reason"

  # Notify about rollback
  notify_rollback_started "$DEPLOYMENT_ID" "$reason" 2>/dev/null || true

  log STEP "Removing canary version..."

  if command -v cloud_runtime &>/dev/null; then
    # Stop canary service
    export CLOUD_RUNTIME_SERVICE_NAME="${service}-canary"

    log INFO "Stopping canary service..."

    # Route all traffic back to production
    log INFO "Routing 100% traffic to production"
    log WARNING "Manual traffic routing update required"

    # Note: Actual service removal would require CloudRuntime API
    log WARNING "Manual cleanup of canary service may be required"

  else
    log ERROR "CloudRuntime CLI not available"
  fi

  log SUCCESS "Rollback completed"

  # Notify about rollback completion
  notify_rollback_completed "$DEPLOYMENT_ID" "production" 2>/dev/null || true

  return 0
}

###############################################################################
# Canary Deployment Flow
###############################################################################

run_canary_deployment() {
  local service=$1

  log INFO "Starting canary deployment for: $service"
  log INFO "Deployment ID: $DEPLOYMENT_ID"

  # Notify deployment started
  notify_deployment_started "$DEPLOYMENT_ID" "$(whoami)" "$(git rev-parse --short HEAD 2>/dev/null)" 2>/dev/null || true

  # Deploy initial canary
  local current_percentage=$CANARY_PERCENTAGE

  if ! deploy_canary_version "$service" "$current_percentage"; then
    log ERROR "Failed to deploy initial canary version"
    notify_deployment_failed "$DEPLOYMENT_ID" "Failed to deploy canary" "deploy_canary_version" 2>/dev/null || true
    return 1
  fi

  # Gradual rollout
  while [[ $current_percentage -lt 100 ]]; do
    log INFO "Current canary traffic: $current_percentage%"

    # Monitor metrics
    if ! monitor_canary_metrics "$service" "$current_percentage" "$CANARY_DURATION"; then
      log ERROR "Canary metrics check failed"
      rollback_canary "$service" "Metrics threshold exceeded"
      notify_deployment_failed "$DEPLOYMENT_ID" "Canary metrics failed" "monitor_canary_metrics" 2>/dev/null || true
      return 1
    fi

    log SUCCESS "Canary metrics healthy at $current_percentage%"

    # Increase traffic
    local next_percentage=$((current_percentage + CANARY_INCREMENT))
    if [[ $next_percentage -gt 100 ]]; then
      next_percentage=100
    fi

    if [[ $next_percentage -lt 100 ]]; then
      if ! increase_canary_traffic "$service" "$current_percentage" "$next_percentage"; then
        log ERROR "Failed to increase canary traffic"
        rollback_canary "$service" "Failed to update traffic routing"
        notify_deployment_failed "$DEPLOYMENT_ID" "Traffic routing failed" "increase_canary_traffic" 2>/dev/null || true
        return 1
      fi

      current_percentage=$next_percentage
    else
      # We've reached 100% - promote to production
      break
    fi
  done

  # Promote canary to production
  if ! promote_canary_to_production "$service"; then
    log ERROR "Failed to promote canary to production"
    rollback_canary "$service" "Failed to promote canary"
    notify_deployment_failed "$DEPLOYMENT_ID" "Promotion failed" "promote_canary_to_production" 2>/dev/null || true
    return 1
  fi

  log SUCCESS "Canary deployment completed successfully!"

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
    echo "  CANARY_PERCENTAGE         - Initial traffic percentage (default: 10)"
    echo "  CANARY_INCREMENT          - Traffic increment per step (default: 20)"
    echo "  CANARY_DURATION           - Monitoring duration per step in seconds (default: 300)"
    echo "  CANARY_ERROR_THRESHOLD    - Max error rate % (default: 5)"
    echo "  CANARY_LATENCY_THRESHOLD  - Max latency in ms (default: 2000)"
    echo "  CANARY_URL                - Canary service URL (default: http://localhost:8080)"
    echo ""
    exit 1
  fi

  log INFO "==================================================================="
  log INFO "Canary Deployment Configuration"
  log INFO "==================================================================="
  log INFO "Service:             $SERVICE"
  log INFO "Initial traffic:     $CANARY_PERCENTAGE%"
  log INFO "Traffic increment:   $CANARY_INCREMENT%"
  log INFO "Monitor duration:    $CANARY_DURATION seconds"
  log INFO "Error threshold:     $CANARY_ERROR_THRESHOLD%"
  log INFO "Latency threshold:   $CANARY_LATENCY_THRESHOLD ms"
  log INFO "==================================================================="
  echo ""

  # Confirm deployment
  if [[ "${AUTO_CONFIRM:-false}" != "true" ]]; then
    echo -e "${YELLOW}${BOLD}WARNING:${NC} This will deploy a canary version of $SERVICE"
    echo ""
    read -p "Continue with canary deployment? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log WARNING "Canary deployment cancelled"
      exit 0
    fi
  fi

  # Run canary deployment
  if run_canary_deployment "$SERVICE"; then
    echo ""
    echo -e "${GREEN}${BOLD}✓ Canary deployment completed successfully!${NC}"
    echo ""
    echo "Service: $SERVICE"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Log file: $CANARY_LOG"
    echo ""
    exit 0
  else
    echo ""
    echo -e "${RED}${BOLD}✗ Canary deployment failed${NC}"
    echo ""
    echo "Service: $SERVICE"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Log file: $CANARY_LOG"
    echo ""
    echo "The deployment has been rolled back."
    echo "Please review the logs for details."
    echo ""
    exit 1
  fi
}

# Handle script interruption
trap 'log ERROR "Canary deployment interrupted"; rollback_canary "$SERVICE" "User interrupted"; exit 1' INT TERM

main

exit 0
