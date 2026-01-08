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
      CURRENT_DIR=$(pwd)
      cd "$DB_PKG_PATH"

      echo "Executing Drizzle migrations..."
      # Use the script defined in database package.json
      # We attempt to use pnpm if available, else npm
      if command -v pnpm >/dev/null 2>&1; then
        pnpm drizzle:migrate
      else
        npm run drizzle:migrate
      fi

      MIGRATE_EXIT_CODE=$?
      cd "$CURRENT_DIR"

      if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
        echo "Drizzle migrations completed successfully."
      else
        echo "WARNING: Drizzle migrations failed with exit code $MIGRATE_EXIT_CODE"
      fi
    else
      echo "WARNING: Could not find packages/database directory. Skipping migrations."
    fi
  fi

  # Try to find the main entry point in various possible locations
  if [ -f "dist/main.js" ]; then
    echo "Found dist/main.js in current directory"
    exec node dist/main.js
  elif [ -f "dist/server.js" ]; then
    echo "Found dist/server.js in current directory"
    exec node dist/server.js
  elif [ -f "dist/src/main.js" ]; then
    echo "Found dist/src/main.js in current directory"
    exec node dist/src/main.js
  elif [ -f "/app/apps/${SERVICE_PATH}/dist/main.js" ]; then
    echo "Found main.js at /app/apps/${SERVICE_PATH}/dist/main.js"
    exec node /app/apps/${SERVICE_PATH}/dist/main.js
  elif [ -f "/app/apps/${SERVICE_PATH}/dist/server.js" ]; then
    echo "Found server.js at /app/apps/${SERVICE_PATH}/dist/server.js"
    exec node /app/apps/${SERVICE_PATH}/dist/server.js
  elif [ -f "package.json" ]; then
    echo "Falling back to npm start"
    exec npm start
  else
    echo "ERROR: Cannot find main.js or server.js in any expected location"
    echo "Contents of dist directory:"
    ls -la dist/ || echo "No dist directory"
    exit 1
  fi
fi
