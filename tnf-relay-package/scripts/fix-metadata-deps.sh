#!/bin/bash
set -e

echo "🔧 Fixing reflect-metadata dependencies..."

# Install reflect-metadata at the root
bun add reflect-metadata

# Add to specific workspaces that need it
bun --filter @the-new-fuse/api run add reflect-metadata
bun --filter @the-new-fuse/core run add reflect-metadata

echo "✅ Dependencies installed successfully!"
