#!/bin/bash

# Build script with memory optimization and timeout handling
set -e

echo "🚀 Starting memory-optimized build process..."

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=6144"
export BUILD_MEMORY_LIMIT="6144"

# Use memory-optimized turbo config
echo "📊 Using memory-optimized turbo configuration..."

# Run build with timeout and retry logic
MAX_RETRIES=2
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "🔄 Build attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES..."
    
    if timeout 20m turbo run build --config=turbo.memory-optimized.json; then
        echo "✅ Build completed successfully!"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️ Build failed, retrying in 30 seconds..."
            sleep 30
            
            # Clean up any hanging processes
            pkill -f "ide" || true
            pkill -f "webpack" || true
            
            # Clear some caches to free memory
            echo "🧹 Clearing build caches..."
            rm -rf apps/ide-ide/lib/.cache || true
            rm -rf apps/ide-ide/node_modules/.cache || true
        else
            echo "❌ Build failed after $MAX_RETRIES attempts"
            exit 1
        fi
    fi
done