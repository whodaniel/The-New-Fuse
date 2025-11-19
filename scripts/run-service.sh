#!/bin/sh

set -e

if [ "$SERVICE_PATH" = "apps/frontend" ]; then
  echo "Starting frontend service..."
  exec pnpm --filter @the-new-fuse/frontend-app preview --host 0.0.0.0 --port $PORT
else
  echo "Starting backend service..."
  exec node ${SERVICE_PATH}/dist/main.js
fi
