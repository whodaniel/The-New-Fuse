#!/bin/sh

set -e

# SERVICE_PATH should be just the service name (e.g., 'api', 'frontend', 'backend')
PORT="${PORT:-3000}"

check_endpoint() {
  local path="$1"
  curl -fsS --max-time 4 "http://localhost:${PORT}${path}" >/dev/null 2>&1
}

if [ "$SERVICE_PATH" = "frontend" ]; then
  # Frontend serves static assets from root.
  check_endpoint "/" || exit 1
  exit 0
fi

# API service uses a global "/api" prefix, so prefer "/api/health".
if [ "$SERVICE_PATH" = "api" ]; then
  check_endpoint "/api/health" || check_endpoint "/health" || exit 1
  exit 0
fi

# Default for other backend services.
check_endpoint "/health" || check_endpoint "/api/health" || exit 1
