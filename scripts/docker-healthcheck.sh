#!/bin/sh
set -e

# Check if the health endpoint is available
HEALTH_CHECK_URL="http://localhost:${PORT:-3001}/health"
echo "Checking health at: $HEALTH_CHECK_URL"
HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' $HEALTH_CHECK_URL || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed with status: $HTTP_STATUS"
  exit 1
fi
