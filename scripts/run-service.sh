#!/bin/sh

set -e

# SERVICE_PATH should be just the service name (e.g., 'api', 'frontend', 'backend')
# The Dockerfile copies built files to /app/dist

if [ "$SERVICE_PATH" = "frontend" ]; then
  echo "Starting frontend service..."
  exec pnpm --filter @the-new-fuse/frontend-app preview --host 0.0.0.0 --port $PORT
else
  echo "Starting backend service: $SERVICE_PATH..."

  # Run Prisma migrations for api service (has the database package)
  if [ "$SERVICE_PATH" = "api" ] && [ -n "$DATABASE_URL" ]; then
    echo "Running Prisma migrations..."
    cd /app/packages/database
    npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "Migration failed or already applied"
    cd /app/apps/$SERVICE_PATH
  fi

  exec node dist/main.js
fi
