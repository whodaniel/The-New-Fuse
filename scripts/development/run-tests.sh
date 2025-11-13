#!/bin/bash

# This script runs all the tests for The New Fuse project

echo "🧪 Running tests for The New Fuse project..."

# Navigate to the project root
cd "$(dirname "$0")"

# Run database tests
echo "Running database tests..."
cd packages/database
npx jest
cd ../..

# Run shared tests
echo "Running shared tests..."
cd packages/shared
npx jest
cd ../..

# Run frontend tests
echo "Running frontend tests..."
cd packages/frontend
npx jest
cd ../..

# Run backend tests
echo "Running backend tests..."
cd packages/backend
npx jest
cd ../..

# Run MCP tests
echo "Running MCP tests..."
cd packages/mcp
npx jest
cd ../..

echo "✅ All tests completed"
