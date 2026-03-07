#!/bin/bash
set -e

# Standardized build order function
build_packages() {
    echo "📦 Building packages in standardized order..."
    
    yarn workspace @the-new-fuse/types build
    if [ $? -ne 0 ]; then echo "❌ Types build failed"; exit 1; fi
    
    yarn workspace @the-new-fuse/utils build
    if [ $? -ne 0 ]; then echo "❌ Utils build failed"; exit 1; fi
    
    yarn workspace @the-new-fuse/ui build
    if [ $? -ne 0 ]; then echo "❌ UI build failed"; exit 1; fi
    
    yarn workspace @the-new-fuse/core build
    if [ $? -ne 0 ]; then echo "❌ Core build failed"; exit 1; fi
    
    yarn workspace @the-new-fuse/database build
    if [ $? -ne 0 ]; then echo "❌ Database build failed"; exit 1; fi
    
    yarn workspace @the-new-fuse/feature-tracker build
    if [ $? -ne 0 ]; then echo "❌ Feature tracker build failed"; exit 1; fi
    
    yarn workspace @the-new-fuse/feature-suggestions build
    if [ $? -ne 0 ]; then echo "❌ Feature suggestions build failed"; exit 1; fi
    
    echo "✅ All packages built successfully"
}

export -f build_packages