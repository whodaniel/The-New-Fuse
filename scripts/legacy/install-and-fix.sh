#!/bin/bash
echo "🔧 Installing dependencies with Bun to resolve TypeScript package issues..."

# Install root dependencies with Bun
pnpm install

# Install workspace dependencies
pnpm run build:packages 2>/dev/null || echo "Build packages not available, continuing..."

# Verify core packages exist
if [ ! -d "node_modules/@the-new-fuse" ]; then
    echo "📦 Linking workspace packages with Bun..."
    cd packages/types && bun link
    cd ../..
    bun link @the-new-fuse/types
fi

echo "✅ Bun dependencies installation complete"
