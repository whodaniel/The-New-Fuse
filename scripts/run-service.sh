#!/bin/sh

set -e

# SERVICE_PATH should be just the service name (e.g., 'api', 'frontend', 'backend')
# The Dockerfile copies built files to /app/apps/${SERVICE_PATH}/dist

echo "Current directory: $(pwd)"
echo "SERVICE_PATH: ${SERVICE_PATH}"
echo "Listing current directory:"
ls -la

if [ "$SERVICE_PATH" = "frontend" ]; then
  echo "Starting frontend service..."
  # Use http-server for production serving of static files (avoids Vite preview permission issues)
  exec npx --yes http-server dist -p ${PORT:-3000} -a 0.0.0.0 --cors
else
  echo "Starting backend service: $SERVICE_PATH..."

  # Run Prisma migrations for api service (has its own prisma schema)
  if [ "$SERVICE_PATH" = "api" ] && [ -n "$DATABASE_URL" ]; then
    echo "Running Prisma migrations..."
    echo "Current directory before migration: $(pwd)"
    echo "DATABASE_URL is set: ${DATABASE_URL:0:50}..."

    # Check if schema exists in apps/api/prisma
    # Run Prisma migrations for api service
    # Prioritize shared database package schema
    if [ -f "/app/packages/database/prisma/schema.prisma" ]; then
      echo "Found schema at /app/packages/database/prisma/schema.prisma"
      echo "Listing migrations available:"
      ls -R /app/packages/database/prisma/migrations

      echo "Executing: npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma"
      npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma

      echo "Migration completed successfully."
    # Fallback to local schema if shared one not found (unlikely for api)
    elif [ -f "/app/apps/api/prisma/schema.prisma" ]; then
      echo "Found schema at /app/apps/api/prisma/schema.prisma"
      npx prisma migrate deploy --schema=/app/apps/api/prisma/schema.prisma
    else
      echo "WARNING: No Prisma schema found in expected locations"
      ls -la /app/apps/api/ || echo "No /app/apps/api directory"
      ls -la /app/packages/database/prisma/ || echo "No /app/packages/database/prisma directory"
    fi

    echo "Migration check complete, continuing with service start..."
  fi

  # Try to find main.js in various possible locations
  if [ -f "dist/main.js" ]; then
    echo "Found dist/main.js in current directory"
    exec node dist/main.js
  elif [ -f "dist/src/main.js" ]; then
    echo "Found dist/src/main.js in current directory"
    exec node dist/src/main.js
  elif [ -f "/app/apps/${SERVICE_PATH}/dist/main.js" ]; then
    echo "Found main.js at /app/apps/${SERVICE_PATH}/dist/main.js"
    exec node /app/apps/${SERVICE_PATH}/dist/main.js
  else
    echo "ERROR: Cannot find main.js in any expected location"
    echo "Contents of dist directory:"
    ls -la dist/ || echo "No dist directory"
    exit 1
  fi
fi
