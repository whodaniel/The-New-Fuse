#!/bin/bash
set -e

echo "🚀 Comprehensive script to run The New Fuse frontend application..."

# Function to check if a port is in use
is_port_in_use() {
  lsof -i :$1 >/dev/null 2>&1
  return $?
}

# Function to wait for a URL to be available
wait_for_url() {
  local url=$1
  local max_attempts=$2
  local attempt=1
  
  echo "Waiting for $url to be available..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s --head $url >/dev/null; then
      echo "$url is now available!"
      return 0
    fi
    
    echo "Attempt $attempt/$max_attempts: $url not available yet, waiting..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "Failed to connect to $url after $max_attempts attempts."
  return 1
}

# Check if port 3000 is already in use
if is_port_in_use 3000; then
  echo "⚠️ Port 3000 is already in use. Please stop any running services on port 3000 before continuing."
  exit 1
fi

# Approach 1: Try to fix yarn.lock and use yarn directly
echo "🔍 Approach 1: Trying to fix yarn.lock and use yarn directly..."
echo "📦 Creating a new yarn.lock file..."
yarn install --force || true

echo "🚀 Trying to run the frontend with yarn..."
(cd apps/frontend && yarn dev) &
YARN_PID=$!

# Wait for the server to start or fail
if wait_for_url "http://localhost:3000" 15; then
  echo "✅ Frontend is running with yarn at http://localhost:3000"
  exit 0
else
  echo "❌ Failed to start frontend with yarn."
  kill $YARN_PID 2>/dev/null || true
fi

# Approach 2: Try building packages incrementally
echo "🔍 Approach 2: Building packages incrementally..."
./build-packages-incrementally.sh || true

echo "🚀 Trying to run the frontend after building packages..."
(cd apps/frontend && yarn dev) &
INCREMENTAL_PID=$!

# Wait for the server to start or fail
if wait_for_url "http://localhost:3000" 15; then
  echo "✅ Frontend is running after incremental build at http://localhost:3000"
  exit 0
else
  echo "❌ Failed to start frontend after incremental build."
  kill $INCREMENTAL_PID 2>/dev/null || true
fi

# Approach 3: Try using npm instead of yarn
echo "🔍 Approach 3: Using npm instead of yarn..."
(cd apps/frontend && rm -rf node_modules && pnpm install && pnpm run dev) &
NPM_PID=$!

# Wait for the server to start or fail
if wait_for_url "http://localhost:3000" 15; then
  echo "✅ Frontend is running with npm at http://localhost:3000"
  exit 0
else
  echo "❌ Failed to start frontend with npm."
  kill $NPM_PID 2>/dev/null || true
fi

# Approach 4: Try using Docker
echo "🔍 Approach 4: Using Docker..."
docker-compose -f docker-compose.frontend.modified.yml up --build -d

# Wait for the server to start or fail
if wait_for_url "http://localhost:3000" 30; then
  echo "✅ Frontend is running with Docker at http://localhost:3000"
  exit 0
else
  echo "❌ Failed to start frontend with Docker."
  docker-compose -f docker-compose.frontend.modified.yml down
fi

# Approach 5: Fall back to the standalone React app
echo "🔍 Approach 5: Falling back to the standalone React app..."
(cd standalone-react && pnpm install && pnpm run dev) &
STANDALONE_PID=$!

# Wait for the server to start or fail
if wait_for_url "http://localhost:3000" 15; then
  echo "✅ Standalone React app is running at http://localhost:3000"
  exit 0
else
  echo "❌ Failed to start standalone React app."
  kill $STANDALONE_PID 2>/dev/null || true
fi

echo "❌ All approaches failed. Please check the error messages above for more information."
exit 1
