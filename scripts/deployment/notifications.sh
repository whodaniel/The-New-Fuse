#!/bin/bash

###############################################################################
# The New Fuse - Deployment Notifications System
# Sends deployment notifications to Slack, Discord, and Email
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
NOTIFICATION_ENABLED="${NOTIFICATION_ENABLED:-true}"
SLACK_ENABLED="${SLACK_ENABLED:-true}"
DISCORD_ENABLED="${DISCORD_ENABLED:-true}"
EMAIL_ENABLED="${EMAIL_ENABLED:-false}"

# Webhook URLs (should be set in environment)
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
EMAIL_API_URL="${EMAIL_API_URL:-}"
EMAIL_TO="${EMAIL_TO:-}"

log() {
  local level=$1
  shift
  local message="$*"

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" ;;
    SUCCESS) echo -e "${GREEN}[✓]${NC} $message" ;;
    WARNING) echo -e "${YELLOW}[⚠]${NC} $message" ;;
    ERROR)   echo -e "${RED}[✗]${NC} $message" ;;
    *)       echo "$message" ;;
  esac
}

###############################################################################
# Notification Formatting Functions
###############################################################################

get_color_for_status() {
  local status=$1

  case $status in
    success|completed|healthy)
      echo "good"  # Green in Slack
      ;;
    warning|pending)
      echo "warning"  # Yellow in Slack
      ;;
    error|failed|critical)
      echo "danger"  # Red in Slack
      ;;
    *)
      echo "#808080"  # Gray
      ;;
  esac
}

get_discord_color() {
  local status=$1

  case $status in
    success|completed|healthy)
      echo "3066993"  # Green
      ;;
    warning|pending)
      echo "16776960"  # Yellow
      ;;
    error|failed|critical)
      echo "15158332"  # Red
      ;;
    *)
      echo "8421504"  # Gray
      ;;
  esac
}

get_emoji() {
  local status=$1

  case $status in
    success|completed|healthy)
      echo "✅"
      ;;
    warning|pending)
      echo "⚠️"
      ;;
    error|failed|critical)
      echo "❌"
      ;;
    info)
      echo "ℹ️"
      ;;
    started)
      echo "🚀"
      ;;
    rollback)
      echo "⏪"
      ;;
    *)
      echo "📢"
      ;;
  esac
}

###############################################################################
# Slack Notifications
###############################################################################

send_slack_notification() {
  local title="$1"
  local message="$2"
  local status="${3:-info}"
  local fields="${4:-}"

  if [[ "$SLACK_ENABLED" != "true" ]] || [[ -z "$SLACK_WEBHOOK_URL" ]]; then
    log INFO "Slack notifications not configured, skipping"
    return 0
  fi

  local color=$(get_color_for_status "$status")
  local emoji=$(get_emoji "$status")
  local environment="${NODE_ENV:-development}"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  # Build fields JSON
  local fields_json="[]"
  if [[ -n "$fields" ]]; then
    fields_json="$fields"
  fi

  # Build Slack payload
  local payload=$(cat <<EOF
{
  "username": "Deployment Bot",
  "icon_emoji": ":robot_face:",
  "attachments": [
    {
      "fallback": "$emoji $title - $message",
      "color": "$color",
      "title": "$emoji $title",
      "text": "$message",
      "fields": $fields_json,
      "footer": "The New Fuse | $environment",
      "ts": $(date +%s)
    }
  ]
}
EOF
)

  # Send to Slack
  local response=$(curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "$payload" 2>&1)

  if [[ $? -eq 0 ]]; then
    log SUCCESS "Slack notification sent"
    return 0
  else
    log ERROR "Failed to send Slack notification: $response"
    return 1
  fi
}

send_slack_deployment_started() {
  local deployment_id="$1"
  local deployer="${2:-Unknown}"
  local commit="${3:-}"

  local fields='[
    {"title": "Deployment ID", "value": "'"$deployment_id"'", "short": true},
    {"title": "Deployer", "value": "'"$deployer"'", "short": true}'

  if [[ -n "$commit" ]]; then
    fields+=',{"title": "Commit", "value": "'"$commit"'", "short": true}'
  fi

  fields+=']'

  send_slack_notification \
    "Deployment Started" \
    "New deployment initiated for The New Fuse" \
    "started" \
    "$fields"
}

send_slack_deployment_completed() {
  local deployment_id="$1"
  local duration="${2:-Unknown}"
  local services="${3:-}"

  local fields='[
    {"title": "Deployment ID", "value": "'"$deployment_id"'", "short": true},
    {"title": "Duration", "value": "'"$duration"'", "short": true}'

  if [[ -n "$services" ]]; then
    fields+=',{"title": "Services Deployed", "value": "'"$services"'", "short": false}'
  fi

  fields+=']'

  send_slack_notification \
    "Deployment Successful" \
    "Deployment completed successfully! 🎉" \
    "success" \
    "$fields"
}

send_slack_deployment_failed() {
  local deployment_id="$1"
  local error_message="${2:-Unknown error}"
  local failed_step="${3:-}"

  local fields='[
    {"title": "Deployment ID", "value": "'"$deployment_id"'", "short": true},
    {"title": "Error", "value": "'"$error_message"'", "short": false}'

  if [[ -n "$failed_step" ]]; then
    fields+=',{"title": "Failed Step", "value": "'"$failed_step"'", "short": true}'
  fi

  fields+=']'

  send_slack_notification \
    "Deployment Failed" \
    "⚠️ Deployment encountered errors and requires attention" \
    "error" \
    "$fields"
}

###############################################################################
# Discord Notifications
###############################################################################

send_discord_notification() {
  local title="$1"
  local message="$2"
  local status="${3:-info}"
  local fields="${4:-}"

  if [[ "$DISCORD_ENABLED" != "true" ]] || [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    log INFO "Discord notifications not configured, skipping"
    return 0
  fi

  local color=$(get_discord_color "$status")
  local emoji=$(get_emoji "$status")
  local environment="${NODE_ENV:-development}"

  # Build fields JSON
  local fields_json="[]"
  if [[ -n "$fields" ]]; then
    fields_json="$fields"
  fi

  # Build Discord payload
  local payload=$(cat <<EOF
{
  "username": "Deployment Bot",
  "avatar_url": "https://cdn-icons-png.flaticon.com/512/4712/4712104.png",
  "embeds": [
    {
      "title": "$emoji $title",
      "description": "$message",
      "color": $color,
      "fields": $fields_json,
      "footer": {
        "text": "The New Fuse | $environment"
      },
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
    }
  ]
}
EOF
)

  # Send to Discord
  local response=$(curl -s -X POST "$DISCORD_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "$payload" 2>&1)

  if [[ $? -eq 0 ]]; then
    log SUCCESS "Discord notification sent"
    return 0
  else
    log ERROR "Failed to send Discord notification: $response"
    return 1
  fi
}

send_discord_deployment_started() {
  local deployment_id="$1"
  local deployer="${2:-Unknown}"
  local commit="${3:-}"

  local fields='[
    {"name": "Deployment ID", "value": "'"$deployment_id"'", "inline": true},
    {"name": "Deployer", "value": "'"$deployer"'", "inline": true}'

  if [[ -n "$commit" ]]; then
    fields+=',{"name": "Commit", "value": "`'"$commit"'`", "inline": true}'
  fi

  fields+=']'

  send_discord_notification \
    "Deployment Started" \
    "New deployment initiated for The New Fuse" \
    "started" \
    "$fields"
}

send_discord_deployment_completed() {
  local deployment_id="$1"
  local duration="${2:-Unknown}"
  local services="${3:-}"

  local fields='[
    {"name": "Deployment ID", "value": "'"$deployment_id"'", "inline": true},
    {"name": "Duration", "value": "'"$duration"'", "inline": true}'

  if [[ -n "$services" ]]; then
    fields+=',{"name": "Services Deployed", "value": "'"$services"'", "inline": false}'
  fi

  fields+=']'

  send_discord_notification \
    "Deployment Successful" \
    "Deployment completed successfully! 🎉" \
    "success" \
    "$fields"
}

send_discord_deployment_failed() {
  local deployment_id="$1"
  local error_message="${2:-Unknown error}"
  local failed_step="${3:-}"

  local fields='[
    {"name": "Deployment ID", "value": "'"$deployment_id"'", "inline": true},
    {"name": "Error", "value": "```'"$error_message"'```", "inline": false}'

  if [[ -n "$failed_step" ]]; then
    fields+=',{"name": "Failed Step", "value": "'"$failed_step"'", "inline": true}'
  fi

  fields+=']'

  send_discord_notification \
    "Deployment Failed" \
    "⚠️ Deployment encountered errors and requires attention" \
    "error" \
    "$fields"
}

###############################################################################
# Email Notifications
###############################################################################

send_email_notification() {
  local subject="$1"
  local message="$2"
  local status="${3:-info}"

  if [[ "$EMAIL_ENABLED" != "true" ]] || [[ -z "$EMAIL_API_URL" ]] || [[ -z "$EMAIL_TO" ]]; then
    log INFO "Email notifications not configured, skipping"
    return 0
  fi

  local emoji=$(get_emoji "$status")
  local environment="${NODE_ENV:-development}"

  # Build email payload
  local payload=$(cat <<EOF
{
  "to": "$EMAIL_TO",
  "subject": "$emoji $subject - The New Fuse [$environment]",
  "html": "<html><body><h2>$emoji $subject</h2><p>$message</p><hr><p><small>The New Fuse | $environment | $(date '+%Y-%m-%d %H:%M:%S')</small></p></body></html>",
  "text": "$emoji $subject\n\n$message\n\n---\nThe New Fuse | $environment | $(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
)

  # Send email via API
  local response=$(curl -s -X POST "$EMAIL_API_URL" \
    -H 'Content-Type: application/json' \
    -d "$payload" 2>&1)

  if [[ $? -eq 0 ]]; then
    log SUCCESS "Email notification sent"
    return 0
  else
    log ERROR "Failed to send email notification: $response"
    return 1
  fi
}

###############################################################################
# High-Level Notification Functions
###############################################################################

notify_deployment_started() {
  local deployment_id="$1"
  local deployer="${2:-$(whoami)}"
  local commit="${3:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending deployment started notifications..."

  send_slack_deployment_started "$deployment_id" "$deployer" "$commit" || true
  send_discord_deployment_started "$deployment_id" "$deployer" "$commit" || true
  send_email_notification \
    "Deployment Started" \
    "Deployment ID: $deployment_id\nDeployer: $deployer\nCommit: $commit" \
    "started" || true
}

notify_deployment_completed() {
  local deployment_id="$1"
  local duration="${2:-Unknown}"
  local services="${3:-api-gateway, backend, frontend, api}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending deployment completed notifications..."

  send_slack_deployment_completed "$deployment_id" "$duration" "$services" || true
  send_discord_deployment_completed "$deployment_id" "$duration" "$services" || true
  send_email_notification \
    "Deployment Successful" \
    "Deployment ID: $deployment_id\nDuration: $duration\nServices: $services" \
    "success" || true
}

notify_deployment_failed() {
  local deployment_id="$1"
  local error_message="${2:-Unknown error occurred}"
  local failed_step="${3:-}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending deployment failed notifications..."

  send_slack_deployment_failed "$deployment_id" "$error_message" "$failed_step" || true
  send_discord_deployment_failed "$deployment_id" "$error_message" "$failed_step" || true
  send_email_notification \
    "Deployment Failed" \
    "Deployment ID: $deployment_id\nError: $error_message\nFailed Step: $failed_step" \
    "error" || true
}

notify_rollback_started() {
  local deployment_id="$1"
  local reason="${2:-Deployment failed}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending rollback started notifications..."

  local fields='[
    {"title": "Deployment ID", "value": "'"$deployment_id"'", "short": true},
    {"title": "Reason", "value": "'"$reason"'", "short": false}
  ]'

  send_slack_notification \
    "Rollback Started" \
    "Rolling back deployment due to: $reason" \
    "rollback" \
    "$fields" || true

  local discord_fields='[
    {"name": "Deployment ID", "value": "'"$deployment_id"'", "inline": true},
    {"name": "Reason", "value": "'"$reason"'", "inline": false}
  ]'

  send_discord_notification \
    "Rollback Started" \
    "Rolling back deployment due to: $reason" \
    "rollback" \
    "$discord_fields" || true

  send_email_notification \
    "Rollback Started" \
    "Deployment ID: $deployment_id\nReason: $reason" \
    "rollback" || true
}

notify_rollback_completed() {
  local deployment_id="$1"
  local restored_version="${2:-previous}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending rollback completed notifications..."

  local fields='[
    {"title": "Deployment ID", "value": "'"$deployment_id"'", "short": true},
    {"title": "Restored To", "value": "'"$restored_version"'", "short": true}
  ]'

  send_slack_notification \
    "Rollback Completed" \
    "System has been successfully rolled back" \
    "success" \
    "$fields" || true

  local discord_fields='[
    {"name": "Deployment ID", "value": "'"$deployment_id"'", "inline": true},
    {"name": "Restored To", "value": "'"$restored_version"'", "inline": true}
  ]'

  send_discord_notification \
    "Rollback Completed" \
    "System has been successfully rolled back" \
    "success" \
    "$discord_fields" || true

  send_email_notification \
    "Rollback Completed" \
    "Deployment ID: $deployment_id\nRestored To: $restored_version" \
    "success" || true
}

notify_health_check_failed() {
  local service="$1"
  local error="${2:-Health check failed}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending health check failure notifications..."

  local fields='[
    {"title": "Service", "value": "'"$service"'", "short": true},
    {"title": "Error", "value": "'"$error"'", "short": false}
  ]'

  send_slack_notification \
    "Health Check Failed" \
    "Service health check failed: $service" \
    "error" \
    "$fields" || true

  local discord_fields='[
    {"name": "Service", "value": "'"$service"'", "inline": true},
    {"name": "Error", "value": "```'"$error"'```", "inline": false}
  ]'

  send_discord_notification \
    "Health Check Failed" \
    "Service health check failed: $service" \
    "error" \
    "$discord_fields" || true

  send_email_notification \
    "Health Check Failed" \
    "Service: $service\nError: $error" \
    "error" || true
}

notify_custom() {
  local title="$1"
  local message="$2"
  local status="${3:-info}"

  if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
    return 0
  fi

  log INFO "Sending custom notification: $title"

  send_slack_notification "$title" "$message" "$status" || true
  send_discord_notification "$title" "$message" "$status" || true
  send_email_notification "$title" "$message" "$status" || true
}

###############################################################################
# Test Notifications
###############################################################################

test_notifications() {
  log INFO "Testing notification channels..."

  local test_id="test-$(date +%Y%m%d-%H%M%S)"

  echo ""
  echo "Testing Slack..."
  if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    send_slack_notification \
      "Test Notification" \
      "This is a test notification from The New Fuse deployment system" \
      "info" || true
  else
    log WARNING "SLACK_WEBHOOK_URL not configured"
  fi

  echo ""
  echo "Testing Discord..."
  if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
    send_discord_notification \
      "Test Notification" \
      "This is a test notification from The New Fuse deployment system" \
      "info" || true
  else
    log WARNING "DISCORD_WEBHOOK_URL not configured"
  fi

  echo ""
  echo "Testing Email..."
  if [[ -n "$EMAIL_API_URL" ]] && [[ -n "$EMAIL_TO" ]]; then
    send_email_notification \
      "Test Notification" \
      "This is a test notification from The New Fuse deployment system" \
      "info" || true
  else
    log WARNING "EMAIL_API_URL or EMAIL_TO not configured"
  fi

  echo ""
  log SUCCESS "Notification tests completed"
}

###############################################################################
# Main Entry Point
###############################################################################

# Allow script to be sourced or run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case "${1:-}" in
    test)
      test_notifications
      ;;
    started)
      notify_deployment_started "${2:-deploy-$(date +%Y%m%d-%H%M%S)}" "${3:-}" "${4:-}"
      ;;
    completed)
      notify_deployment_completed "${2:-deploy-$(date +%Y%m%d-%H%M%S)}" "${3:-}" "${4:-}"
      ;;
    failed)
      notify_deployment_failed "${2:-deploy-$(date +%Y%m%d-%H%M%S)}" "${3:-Unknown error}" "${4:-}"
      ;;
    rollback-started)
      notify_rollback_started "${2:-deploy-$(date +%Y%m%d-%H%M%S)}" "${3:-Deployment failed}"
      ;;
    rollback-completed)
      notify_rollback_completed "${2:-deploy-$(date +%Y%m%d-%H%M%S)}" "${3:-previous}"
      ;;
    health-failed)
      notify_health_check_failed "${2:-unknown-service}" "${3:-Health check failed}"
      ;;
    custom)
      notify_custom "${2:-Custom Notification}" "${3:-No message provided}" "${4:-info}"
      ;;
    *)
      echo "Usage: $0 <command> [args...]"
      echo ""
      echo "Commands:"
      echo "  test                                    - Test all notification channels"
      echo "  started <id> [deployer] [commit]        - Send deployment started notification"
      echo "  completed <id> [duration] [services]    - Send deployment completed notification"
      echo "  failed <id> [error] [step]              - Send deployment failed notification"
      echo "  rollback-started <id> [reason]          - Send rollback started notification"
      echo "  rollback-completed <id> [version]       - Send rollback completed notification"
      echo "  health-failed <service> [error]         - Send health check failure notification"
      echo "  custom <title> <message> [status]       - Send custom notification"
      echo ""
      echo "Environment Variables:"
      echo "  SLACK_WEBHOOK_URL                       - Slack webhook URL"
      echo "  DISCORD_WEBHOOK_URL                     - Discord webhook URL"
      echo "  EMAIL_API_URL                           - Email API endpoint"
      echo "  EMAIL_TO                                - Email recipient"
      echo "  NOTIFICATION_ENABLED                    - Enable/disable all notifications (default: true)"
      echo "  SLACK_ENABLED                           - Enable/disable Slack (default: true)"
      echo "  DISCORD_ENABLED                         - Enable/disable Discord (default: true)"
      echo "  EMAIL_ENABLED                           - Enable/disable Email (default: false)"
      echo ""
      exit 1
      ;;
  esac
fi
