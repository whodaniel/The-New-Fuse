#!/bin/bash

# Fix Development Environment Issues
# Addresses native module compilation and Electron installation issues

set -e

echo "🔧 Fixing Development Environment Issues..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to rebuild native modules
rebuild_native_modules() {
    echo "🔨 Rebuilding native modules..."
    
    # Check if we have node-gyp
    if ! command_exists node-gyp; then
        echo "📦 Installing node-gyp globally..."
        npm install -g node-gyp
    fi
    
    # Rebuild find-git-repositories specifically
    echo "🔍 Rebuilding find-git-repositories..."
    cd node_modules/@ide/git/node_modules/find-git-repositories
    
    # Clean any existing build
    rm -rf build/
    
    # Rebuild the native module
    node-gyp rebuild
    
    cd - > /dev/null
    
    echo "✅ Native modules rebuilt successfully"
}

# Function to fix Electron installation
fix_electron() {
    echo "⚡ Fixing Electron installation..."
    
    # Remove corrupted Electron
    rm -rf node_modules/electron
    
    # Clear npm cache for electron
    npm cache clean --force
    
    # Reinstall Electron
    echo "📦 Reinstalling Electron..."
    pnpm add electron@latest --dev
    
    echo "✅ Electron fixed successfully"
}

# Function to clear problematic caches
clear_caches() {
    echo "🧹 Clearing caches..."
    
    # Clear various caches
    rm -rf .turbo/
    rm -rf node_modules/.cache/
    rm -rf apps/*/node_modules/.cache/
    rm -rf packages/*/node_modules/.cache/
    
    # Clear Bun cache
    bun pm cache rm
    
    echo "✅ Caches cleared"
}

# Function to verify system requirements
verify_requirements() {
    echo "🔍 Verifying system requirements..."
    
    # Check for required tools
    local missing_tools=()
    
    if ! command_exists node; then
        missing_tools+=("node")
    fi
    
    if ! command_exists bun; then
        missing_tools+=("bun")
    fi
    
    if ! command_exists python3; then
        missing_tools+=("python3")
    fi
    
    # Check for Xcode command line tools on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! xcode-select -p &> /dev/null; then
            echo "⚠️  Xcode command line tools not found. Installing..."
            xcode-select --install
            echo "Please run this script again after Xcode tools installation completes."
            exit 1
        fi
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo "❌ Missing required tools: ${missing_tools[*]}"
        echo "Please install them and run this script again."
        exit 1
    fi
    
    echo "✅ System requirements verified"
}

# Function to rebuild specific problematic packages
rebuild_problematic_packages() {
    echo "🔧 Rebuilding problematic packages..."
    
    # List of packages that commonly need rebuilding
    local packages=(
        "find-git-repositories"
        "canvas"
        "sharp"
        "sqlite3"
        "better-sqlite3"
    )
    
    for package in "${packages[@]}"; do
        if [ -d "node_modules/$package" ]; then
            echo "🔨 Rebuilding $package..."
            cd "node_modules/$package"
            if [ -f "binding.gyp" ]; then
                node-gyp rebuild || echo "⚠️  Failed to rebuild $package (continuing...)"
            fi
            cd - > /dev/null
        fi
    done
    
    echo "✅ Package rebuilding complete"
}

# Main execution
main() {
    echo "🚀 Starting development environment fix..."
    
    # Verify we're in the right directory
    if [ ! -f "package.json" ]; then
        echo "❌ Please run this script from the project root directory"
        exit 1
    fi
    
    # Step 1: Verify system requirements
    verify_requirements
    
    # Step 2: Clear caches
    clear_caches
    
    # Step 3: Fix Electron
    fix_electron
    
    # Step 4: Rebuild native modules
    rebuild_native_modules
    
    # Step 5: Rebuild other problematic packages
    rebuild_problematic_packages
    
    # Step 6: Reinstall dependencies to ensure everything is consistent
    echo "📦 Reinstalling dependencies..."
    pnpm install --force
    
    echo "🎉 Development environment fix complete!"
    echo ""
    echo "Next steps:"
    echo "1. Try running 'pnpm run dev' again"
    echo "2. If issues persist, check the troubleshooting guide"
    echo ""
}

# Run main function
main "$@"