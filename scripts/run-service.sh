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
  # Host-aware static routing:
  # - app.thenewfuse.com/ -> static landing (index.html)
  # - marketplace.thenewfuse.com/ -> standalone marketplace app (app.html)
  # - /login, /register, /dashboard, etc. -> app.html SPA fallback
  exec node ./scripts/production-server.mjs
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
      if command -v pnpm >/dev/null 2>&1; then
        pnpm drizzle:migrate
      else
        npm run drizzle:migrate
      fi

      echo "Drizzle migrations completed successfully."
      echo "Verifying critical auth schema..."
      node scripts/ensure-auth-schema.cjs

      cd "$CURRENT_DIR"
    else
      echo "ERROR: Could not find packages/database directory. Cannot verify schema."
      exit 1
    fi
  fi

  # Try to find the main entry point in various possible locations
  if [ "$SERVICE_PATH" = "cloud-sandbox" ] && [ -f "dist/server.js" ]; then
    echo "Found dist/server.js in current directory (cloud-sandbox preferred entrypoint)"
    # For cloud-sandbox, install Playwright browsers at runtime
    if [ "$SERVICE_PATH" = "cloud-sandbox" ]; then
      echo "📦 Installing Playwright browsers for cloud-sandbox..."

      # Force a writable runtime path inside CloudRuntime containers.
      export PLAYWRIGHT_BROWSERS_PATH="/tmp/pw-browsers"
      mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" 2>/dev/null || true
      chmod 777 "$PLAYWRIGHT_BROWSERS_PATH" 2>/dev/null || true

      echo "📂 Installing to: $PLAYWRIGHT_BROWSERS_PATH"

      # Runtime install only; system deps should be baked in image layers.
      npx playwright install chromium 2>&1 || echo "Warning: Browser installation may have failed"

      echo "✅ Playwright installation complete"
      ls -la "$PLAYWRIGHT_BROWSERS_PATH" || echo "Browser directory check failed"
    fi
    exec node dist/server.js
  elif [ -f "dist/main.js" ]; then
    echo "Found dist/main.js in current directory"
    exec node dist/main.js
  elif [ -f "dist/server.js" ]; then
    echo "Found dist/server.js in current directory"
    # For cloud-sandbox, install Playwright browsers at runtime
    if [ "$SERVICE_PATH" = "cloud-sandbox" ]; then
      echo "📦 Installing Playwright browsers for cloud-sandbox..."

      # Force a writable runtime path inside CloudRuntime containers.
      export PLAYWRIGHT_BROWSERS_PATH="/tmp/pw-browsers"
      mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" 2>/dev/null || true
      chmod 777 "$PLAYWRIGHT_BROWSERS_PATH" 2>/dev/null || true

      echo "📂 Installing to: $PLAYWRIGHT_BROWSERS_PATH"

      # Runtime install only; system deps should be baked in image layers.
      npx playwright install chromium 2>&1 || echo "Warning: Browser installation may have failed"

      echo "✅ Playwright installation complete"
      ls -la "$PLAYWRIGHT_BROWSERS_PATH" || echo "Browser directory check failed"
    fi
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
