#!/bin/sh
set -e

# if SERVICE_PATH is "apps/frontend", start the frontend
if [ "$SERVICE_PATH" = "apps/frontend" ]; then
  echo "Starting frontend"
  pnpm --filter @the-new-fuse/frontend-app preview --host 0.0.0.0 --port $PORT

# if SERVICE_PATH is "apps/api-gateway", start the api-gateway
elif [ "$SERVICE_PATH" = "apps/api-gateway" ]; then
  echo "Starting api-gateway"
  node apps/api-gateway/dist/main.js

# if SERVICE_PATH is "apps/backend", start the backend
elif [ "$SERVICE_PATH" = "apps/backend" ]; then
  echo "Starting backend"
  node apps/backend/dist/main.js

else
  echo "Unknown service: $SERVICE_PATH"
  exit 1
fi
