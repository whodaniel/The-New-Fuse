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

  # Run Drizzle migrations for api service
  if [ "$SERVICE_PATH" = "api" ] && [ -n "$DATABASE_URL" ]; then
    echo "Running Drizzle migrations..."

    # Define paths with fallbacks
    DB_PKG_PATH=""

    # 1. Find Database Package
    if [ -d "/app/packages/database" ]; then
      DB_PKG_PATH="/app/packages/database"
    elif [ -d "../../packages/database" ]; then
      DB_PKG_PATH="../../packages/database"
    fi

    if [ -n "$DB_PKG_PATH" ]; then
      echo "Found database package at $DB_PKG_PATH"
      echo "DATABASE_URL is: $DATABASE_URL"
      CURRENT_DIR=$(pwd)
      cd "$DB_PKG_PATH"
      pwd

      echo "Executing Drizzle migrations..."
      pnpm run drizzle:migrate

      echo "Drizzle migrations completed successfully."
      echo "Verifying critical auth schema..."
      node scripts/ensure-auth-schema.cjs

      cd "$CURRENT_DIR"
    else
      echo "ERROR: Could not find packages/database directory. Cannot verify schema."
      exit 1
    fi
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
