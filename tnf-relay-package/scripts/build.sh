#!/bin/bash

set -e

# Determine environment
ENV=${1:-development}
echo "Building for environment: $ENV"

# Clean previous build artifacts
pnpm dlx rimraf dist

# Ensure all dependencies are installed
pnpm install --frozen-lockfile

# Build packages in correct order
echo "Building core packages..."
pnpm run build --filter=@the-new-fuse/types
pnpm run build --filter=@the-new-fuse/utils
pnpm run build --filter=@the-new-fuse/core
pnpm run build --filter=@the-new-fuse/database

# Build the main application
echo "Building main application..."
if [ "$ENV" = "production" ]; then
    # Production build with strict checks
    bun tsc -p tsconfig.json --noEmit && \
    pnpm run build
else
    # Development build with relaxed config
    bun tsc -p tsconfig.build.json || {
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
