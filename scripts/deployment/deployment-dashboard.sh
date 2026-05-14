#!/bin/bash

###############################################################################
# The New Fuse - Deployment Dashboard
# Interactive dashboard showing deployment status and history
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_LOG_DIR="$PROJECT_ROOT/logs/deployment"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

show_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}           ${BOLD}The New Fuse - Deployment Dashboard${NC}                ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

show_system_info() {
  echo -e "${BOLD}${BLUE}System Information${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"

  echo -e "  Date/Time:    ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "  Node Version: ${CYAN}$(node --version)${NC}"
  echo -e "  pnpm Version: ${CYAN}$(pnpm --version)${NC}"

  if command -v cloud_runtime &>/dev/null; then
    echo -e "  CloudRuntime CLI:  ${GREEN}✓ Installed${NC}"
  else
    echo -e "  CloudRuntime CLI:  ${RED}✗ Not installed${NC}"
  fi

  echo ""
}

show_deployment_history() {
  echo -e "${BOLD}${BLUE}Recent Deployments${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"

  if [[ ! -d "$DEPLOYMENT_LOG_DIR" ]]; then
    echo -e "  ${YELLOW}No deployment history found${NC}"
    echo ""
    return
  fi

  # Find deployment state files
  local count=0
  while IFS= read -r state_file; do
    if [[ -f "$state_file" ]]; then
      local deployment_id=$(basename "$state_file" -state.json)
      local status=$(grep -o '"deployment_status"[^"]*"[^"]*"' "$state_file" | tail -1 | cut -d'"' -f4 || echo "unknown")

      local status_icon="?"
      local status_color="$NC"

      case "$status" in
        completed)
          status_icon="✓"
          status_color="$GREEN"
          ;;
        failed|rolled_back)
          status_icon="✗"
          status_color="$RED"
          ;;
        started|in_progress)
          status_icon="⟳"
          status_color="$YELLOW"
          ;;
      esac

      echo -e "  ${status_color}${status_icon}${NC} ${deployment_id} - ${status_color}${status}${NC}"

      ((count++))
      if [[ $count -ge 10 ]]; then
        break
      fi
    fi
  done < <(find "$DEPLOYMENT_LOG_DIR" -name "*-state.json" -type f 2>/dev/null | sort -r)

  if [[ $count -eq 0 ]]; then
    echo -e "  ${YELLOW}No deployments found${NC}"
  fi

  echo ""
}

show_cloud_runtime_status() {
  echo -e "${BOLD}${BLUE}CloudRuntime Services Status${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"

  if ! command -v cloud_runtime &>/dev/null; then
    echo -e "  ${YELLOW}CloudRuntime CLI not installed${NC}"
    echo ""
    return
  fi

  if ! cloud_runtime whoami &>/dev/null; then
    echo -e "  ${YELLOW}Not authenticated with CloudRuntime${NC}"
    echo ""
    return
  fi

  if ! cloud_runtime status &>/dev/null; then
    echo -e "  ${YELLOW}Not linked to a CloudRuntime project${NC}"
    echo ""
    return
  fi

  # Get CloudRuntime status
  local services=("api-gateway" "backend" "frontend" "api")

  for service in "${services[@]}"; do
    if cloud_runtime status --service "$service" &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $service: ${GREEN}Running${NC}"
    else
      echo -e "  ${RED}✗${NC} $service: ${RED}Not running${NC}"
    fi
  done

  echo ""
}

show_environment_status() {
  echo -e "${BOLD}${BLUE}Environment Configuration${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"

  # Check for environment files
  local env_files=(".env.development" ".env.staging" ".env.production")

  for env_file in "${env_files[@]}"; do
    if [[ -f "$PROJECT_ROOT/$env_file" ]]; then
      echo -e "  ${GREEN}✓${NC} $env_file"
    else
      echo -e "  ${YELLOW}⚠${NC} $env_file ${YELLOW}(not found)${NC}"
    fi
  done

  echo ""

  # Check critical environment variables
  echo -e "  ${BOLD}Critical Variables:${NC}"

  local critical_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")

  for var in "${critical_vars[@]}"; do
    if [[ -n "${!var:-}" ]]; then
      echo -e "    ${GREEN}✓${NC} $var"
    else
      echo -e "    ${RED}✗${NC} $var ${RED}(not set)${NC}"
    fi
  done

  echo ""
}

show_backup_status() {
  echo -e "${BOLD}${BLUE}Database Backups${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"

  local backup_dir="$PROJECT_ROOT/backups/database"

  if [[ ! -d "$backup_dir" ]]; then
    echo -e "  ${YELLOW}No backups found${NC}"
    echo ""
    return
  fi

  local backup_count=$(ls -1 "$backup_dir"/backup-*.sql* 2>/dev/null | wc -l)

  echo -e "  Total backups: ${CYAN}$backup_count${NC}"

  if [[ $backup_count -gt 0 ]]; then
    echo -e "  Latest backup:"

    local latest_backup=$(ls -t "$backup_dir"/backup-*.sql* 2>/dev/null | head -1)
    local backup_name=$(basename "$latest_backup")
    local backup_size=$(du -h "$latest_backup" | cut -f1)
    local backup_date=$(stat -c %y "$latest_backup" 2>/dev/null | cut -d' ' -f1 || date)

    echo -e "    ${CYAN}$backup_name${NC}"
    echo -e "    Size: $backup_size | Date: $backup_date"
  fi

  echo ""
}

show_quick_actions() {
  echo -e "${BOLD}${BLUE}Quick Actions${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"
  echo ""
  echo -e "  ${BOLD}Deployment Commands:${NC}"
  echo -e "    ${CYAN}./scripts/deployment/deploy-automated.sh${NC}     - Full automated deployment"
  echo -e "    ${CYAN}./scripts/deployment/validate-deployment.sh${NC}  - Pre-deployment validation"
  echo -e "    ${CYAN}./scripts/deployment/cloud_runtime-deploy.sh all${NC}   - Deploy all services to CloudRuntime"
  echo ""
  echo -e "  ${BOLD}Utility Commands:${NC}"
  echo -e "    ${CYAN}./scripts/deployment/smoke-tests.sh${NC}          - Run smoke tests"
  echo -e "    ${CYAN}./scripts/deployment/db-backup.sh${NC}            - Create database backup"
  echo -e "    ${CYAN}./scripts/deployment/rollback.sh <id>${NC}        - Rollback deployment"
  echo ""
  echo -e "  ${BOLD}CloudRuntime Commands:${NC}"
  echo -e "    ${CYAN}cloud_runtime status${NC}                                - Show CloudRuntime status"
  echo -e "    ${CYAN}cloud_runtime logs --service <name>${NC}                 - View service logs"
  echo -e "    ${CYAN}cloud_runtime open${NC}                                  - Open CloudRuntime dashboard"
  echo ""
}

show_health_summary() {
  echo -e "${BOLD}${BLUE}System Health${NC}"
  echo -e "${BLUE}$(printf '─%.0s' {1..80})${NC}"

  local issues=0

  # Check database connection
  if [[ -n "${DATABASE_URL:-}" ]]; then
    if pnpm drizzle db execute --stdin <<< "SELECT 1;" &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} Database Connection"
    else
      echo -e "  ${RED}✗${NC} Database Connection ${RED}(failed)${NC}"
      ((issues++))
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} Database Connection ${YELLOW}(not configured)${NC}"
  fi

  # Check Redis connection
  if [[ -n "${REDIS_URL:-}" ]]; then
    if command -v redis-cli &>/dev/null && redis-cli -u "$REDIS_URL" PING &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} Redis Connection"
    else
      echo -e "  ${YELLOW}⚠${NC} Redis Connection ${YELLOW}(failed)${NC}"
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} Redis Connection ${YELLOW}(not configured)${NC}"
  fi

  # Check disk space
  local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
  if [[ $available_space -gt 5 ]]; then
    echo -e "  ${GREEN}✓${NC} Disk Space (${available_space}GB available)"
  else
    echo -e "  ${YELLOW}⚠${NC} Disk Space ${YELLOW}(low: ${available_space}GB)${NC}"
    ((issues++))
  fi

  echo ""

  if [[ $issues -eq 0 ]]; then
    echo -e "  ${GREEN}${BOLD}All systems operational${NC}"
  else
    echo -e "  ${YELLOW}${BOLD}$issues issue(s) detected${NC}"
  fi

  echo ""
}

main() {
  show_banner
  show_system_info
  show_cloud_runtime_status
  show_deployment_history
  show_environment_status
  show_backup_status
  show_health_summary
  show_quick_actions

  echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

# Auto-refresh mode
if [[ "${1:-}" == "--watch" ]]; then
  while true; do
    clear
    main
    echo -e "Auto-refreshing every 30s... (Press Ctrl+C to exit)"
    sleep 30
  done
else
  main
fi

exit 0
