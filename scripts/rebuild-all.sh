#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "🚀 Starting complete project rebuild..."

# Step 1: Clean everything
echo "Step 1: Running clean-all script..."
pnpm run clean:all

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
cd "$PROJECT_ROOT"
pnpm install

# Step 3: Build packages in the correct order
echo "Step 3: Building packages..."
pnpm turbo run build --filter=./packages/*

# Step 4: Start services
echo "Step 4: Starting services..."
cd "$PROJECT_ROOT"
docker-compose up -d

# Step 5: Launch development environment
echo "Step 5: Launching development environment..."
cd "$PROJECT_ROOT"
pnpm run dev

echo "✅ Rebuild complete! The application should now be running."