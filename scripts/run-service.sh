#!/bin/sh

set -e

# SERVICE_PATH should be just the service name (e.g., 'api', 'frontend', 'backend')
# The Dockerfile copies built files to /app/dist

if [ "$SERVICE_PATH" = "frontend" ]; then
  echo "Starting frontend service..."
  exec pnpm --filter @the-new-fuse/frontend-app preview --host 0.0.0.0 --port $PORT
else
  echo "Starting backend service: $SERVICE_PATH..."
  exec node dist/main.js
fi
