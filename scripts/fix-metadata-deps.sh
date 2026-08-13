#!/bin/bash
set -e

echo "🔧 Fixing reflect-metadata dependencies..."

# Install reflect-metadata at the root
yarn add reflect-metadata

# Add to specific workspaces that need it
yarn workspace @the-new-fuse/api add reflect-metadata
yarn workspace @the-new-fuse/core add reflect-metadata

echo "✅ Dependencies installed successfully!"
