#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "🚀 Starting complete project rebuild..."

# Step 1: Clean everything
echo "Step 1: Running clean-all script..."
bash "$PROJECT_ROOT/scripts/manage/clean-all.sh"

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
cd "$PROJECT_ROOT"
yarn install

# Step 3: Build packages in the correct order
echo "Step 3: Building packages..."
cd "$PROJECT_ROOT/packages/types"
yarn build

cd "$PROJECT_ROOT/packages/core"
yarn build

cd "$PROJECT_ROOT/packages/database"
yarn build

cd "$PROJECT_ROOT/packages/feature-tracker"
yarn build

# Additional packages would be built here in the correct dependency order

# Step 4: Start services
echo "Step 4: Starting services..."
cd "$PROJECT_ROOT"
docker-compose up -d

# Step 5: Launch development environment
echo "Step 5: Launching development environment..."
cd "$PROJECT_ROOT"
yarn dev

echo "✅ Rebuild complete! The application should now be running."