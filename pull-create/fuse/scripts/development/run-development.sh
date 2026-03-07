#!/bin/bash

# This script runs the entire development process

echo "🚀 Starting The New Fuse development process..."

# 1. Build the project
echo "Step 1: Building the project..."
if [ -f "./comprehensive-build.sh" ]; then
  chmod +x ./comprehensive-build.sh
  ./comprehensive-build.sh
else
  echo "Building with yarn..."
  yarn build
fi

# 2. Run the tests
echo "Step 2: Running the tests..."
if [ -f "./run-tests.sh" ]; then
  ./run-tests.sh
else
  echo "🧪 Running tests for The New Fuse project..."
  # Skip tests if needed for quick development
  # yarn test
  echo "Tests skipped for quick development startup"
fi

# 3. Start the application
echo "Step 3: Starting the application..."
echo "Choose how to run the application:"
echo "1. Run frontend and backend separately"
echo "2. Run using Docker"
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
  # Start the backend in the background
  echo "Starting the backend..."
  ./run-backend.sh &
  backend_pid=$!
  
  # Start the MCP server in the background
  echo "Starting the MCP server..."
  ./run-mcp-server.sh &
  mcp_pid=$!
  
  # Start the frontend
  echo "Starting the frontend..."
  ./run-frontend.sh
  
  # Kill the background processes when the frontend is stopped
  kill $backend_pid
  kill $mcp_pid
elif [ "$choice" == "2" ]; then
  # Run using Docker
  echo "Running using Docker..."
  ./run-docker-app.sh
else
  echo "Invalid choice. Exiting."
  exit 1
fi

echo "✅ Development process completed"
