#!/bin/bash

# This script builds the project incrementally, starting with the most fundamental packages

echo "🔧 Building project incrementally..."

# 1. Build the types package
echo "Building types package..."
yarn workspace @the-new-fuse/types build

# 2. Build the utils package
echo "Building utils package..."
yarn workspace @the-new-fuse/utils build

# 3. Build the core package
echo "Building core package..."
yarn workspace @the-new-fuse/core build

# 4. Build the database package
echo "Building database package..."
yarn workspace @the-new-fuse/database build

# 5. Build the UI packages
echo "Building UI packages..."
yarn workspace @the-new-fuse/ui build
yarn workspace @the-new-fuse/ui-components build
yarn workspace @the-new-fuse/ui-consolidated build

# 6. Build the feature packages
echo "Building feature packages..."
yarn workspace @the-new-fuse/feature-tracker build
yarn workspace @the-new-fuse/feature-suggestions build

# 7. Build the API packages
echo "Building API packages..."
yarn workspace @the-new-fuse/api-types build
yarn workspace @the-new-fuse/api-core build
yarn workspace @the-new-fuse/api build
yarn workspace @the-new-fuse/api-client build

# 8. Build the frontend and backend packages
echo "Building frontend and backend packages..."
yarn workspace @the-new-fuse/frontend build
yarn workspace @the-new-fuse/backend build

echo "✅ Incremental build complete"
