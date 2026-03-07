#!/bin/bash

set -e

# Determine environment
ENV=${1:-development}
echo "Building for environment: $ENV"

# Clean previous build artifacts
yarn rimraf dist

# Ensure all dependencies are installed
yarn install --frozen-lockfile

# Build packages in correct order
echo "Building core packages..."
yarn workspace @the-new-fuse/types build
yarn workspace @the-new-fuse/utils build
yarn workspace @the-new-fuse/core build
yarn workspace @the-new-fuse/database build

# Build the main application
echo "Building main application..."
if [ "$ENV" = "production" ]; then
    # Production build with strict checks
    yarn tsc -p tsconfig.json --noEmit && \
    yarn build
else
    # Development build with relaxed config
    yarn tsc -p tsconfig.build.json || {
        echo "Build completed with warnings"
    }
fi

# Verify build output
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "Build completed successfully"
else
    echo "Error: Build failed - no output generated"
    exit 1
fi
