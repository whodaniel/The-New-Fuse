#!/bin/bash
# Cloud Sandbox Startup Script
# Handles initialization, health checks, and graceful startup

set -e

echo "==================================="
echo "Cloud Sandbox Starting"
echo "==================================="
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Home: $HOME"
echo "PWD: $(pwd)"
echo "==================================="

# Function to check if required environment variables are set
check_env_vars() {
    local required_vars=(
        "JWT_SECRET"
        "DATABASE_URL"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "ERROR: Missing required environment variables:"
        printf ' - %s\n' "${missing_vars[@]}"
        echo ""
        echo "Please set these variables in Railway environment settings."
        exit 1
    fi

    echo "✓ All required environment variables are set"
}

# Function to wait for database
wait_for_database() {
    if [ -n "$DATABASE_URL" ]; then
        echo "Checking database connection..."

        # Extract host and port from DATABASE_URL
        # postgresql://user:pass@host:port/db
        local db_host=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local db_port=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

        if [ -n "$db_host" ] && [ -n "$db_port" ]; then
            echo "Database: $db_host:$db_port"

            local max_attempts=30
            local attempt=1

            while [ $attempt -le $max_attempts ]; do
                if nc -z "$db_host" "$db_port" 2>/dev/null; then
                    echo "✓ Database is ready"
                    return 0
                fi

                echo "Waiting for database... (attempt $attempt/$max_attempts)"
                sleep 2
                attempt=$((attempt + 1))
            done

            echo "WARNING: Could not connect to database after $max_attempts attempts"
            echo "Proceeding anyway - application will retry on connection"
        fi
    fi
}

# Function to initialize Playwright
init_playwright() {
    echo "Initializing Playwright browsers..."

    if [ -z "$PLAYWRIGHT_BROWSERS_PATH" ]; then
        PLAYWRIGHT_BROWSERS_PATH="$HOME/pw-browsers"
    fi

    if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
        echo "Creating Playwright browser directory: $PLAYWRIGHT_BROWSERS_PATH"
        if ! mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" 2>/dev/null; then
            echo "Cannot write to $PLAYWRIGHT_BROWSERS_PATH, using /tmp/pw-browsers"
            PLAYWRIGHT_BROWSERS_PATH="/tmp/pw-browsers"
            mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
        fi
    fi
    export PLAYWRIGHT_BROWSERS_PATH
    echo "Playwright browser path: $PLAYWRIGHT_BROWSERS_PATH"

    # Browsers should already be installed in the base image
    # but we verify they exist
    if npx playwright --version > /dev/null 2>&1; then
        echo "✓ Playwright is installed"
    else
        echo "ERROR: Playwright is not installed"
        exit 1
    fi
}

# Function to setup workspace directories
setup_workspace() {
    echo "Setting up workspace directories..."

    mkdir -p "$HOME/workspace" /tmp/cloud-sandbox

    echo "✓ Workspace ready"
    echo "  - User workspace: $HOME/workspace"
    echo "  - Temp sandbox: /tmp/cloud-sandbox"
}

# Function to verify build
verify_build() {
    echo "Verifying build..."

    if [ ! -f "dist/server.js" ]; then
        echo "ERROR: dist/server.js not found!"
        echo "Contents of current directory:"
        ls -la
        exit 1
    fi

    echo "✓ Build verification passed"
}

# Graceful shutdown handler
shutdown() {
    echo ""
    echo "==================================="
    echo "Received shutdown signal"
    echo "==================================="

    if [ ! -z "$SERVER_PID" ]; then
        echo "Stopping server (PID: $SERVER_PID)..."
        kill -TERM "$SERVER_PID" 2>/dev/null || true

        # Wait for graceful shutdown
        local wait_count=0
        while kill -0 "$SERVER_PID" 2>/dev/null && [ $wait_count -lt 10 ]; do
            echo "Waiting for server to stop... ($wait_count/10)"
            sleep 1
            wait_count=$((wait_count + 1))
        done

        # Force kill if still running
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            echo "Force stopping server..."
            kill -KILL "$SERVER_PID" 2>/dev/null || true
        fi
    fi

    echo "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Main startup sequence
main() {
    echo "Starting initialization sequence..."
    echo ""

    # Step 1: Verify environment
    check_env_vars
    echo ""

    # Step 2: Wait for database
    wait_for_database
    echo ""

    # Step 3: Initialize Playwright
    init_playwright
    echo ""

    # Step 4: Setup workspace
    setup_workspace
    echo ""

    # Step 5: Verify build
    verify_build
    echo ""

    echo "==================================="
    echo "Starting Cloud Sandbox Server"
    echo "==================================="
    echo "Listening on port: $PORT"
    echo "WebSocket enabled: true"
    echo "Security enabled: true"
    echo "==================================="
    echo ""

    # Start the server
    node dist/server.js &
    SERVER_PID=$!

    echo "Server started with PID: $SERVER_PID"
    echo ""

    # Wait for server to exit
    wait $SERVER_PID
    exit_code=$?

    echo ""
    echo "Server exited with code: $exit_code"

    exit $exit_code
}

# Run main function
main
