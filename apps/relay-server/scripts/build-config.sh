#!/bin/bash
set -e

# Standardized build order function
build_packages() {
    echo "📦 Building packages in standardized order..."
    
    bun --filter @the-new-fuse/types run build
    if [ $? -ne 0 ]; then echo "❌ Types build failed"; exit 1; fi
    
    bun --filter @the-new-fuse/utils run build
    if [ $? -ne 0 ]; then echo "❌ Utils build failed"; exit 1; fi
    
    bun --filter @the-new-fuse/ui run build
    if [ $? -ne 0 ]; then echo "❌ UI build failed"; exit 1; fi
    
    bun --filter @the-new-fuse/core run build
    if [ $? -ne 0 ]; then echo "❌ Core build failed"; exit 1; fi
    
    bun --filter @the-new-fuse/database run build
    if [ $? -ne 0 ]; then echo "❌ Database build failed"; exit 1; fi
    
    bun --filter @the-new-fuse/feature-tracker run build
    if [ $? -ne 0 ]; then echo "❌ Feature tracker build failed"; exit 1; fi
    
    bun --filter @the-new-fuse/feature-suggestions run build
    if [ $? -ne 0 ]; then echo "❌ Feature suggestions build failed"; exit 1; fi
    
    echo "✅ All packages built successfully"
}

export -f build_packages