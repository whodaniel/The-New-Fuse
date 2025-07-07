#!/bin/bash
set -e

echo "🔍 Starting TypeScript validation..."

# Function to check a specific package
check_package() {
    local package_name=$1
    echo "Checking package: $package_name"
    
    cd "packages/$package_name"
    
    # Run type checking
    bun tsc --noEmit
    
    # Run ESLint
    bun eslint "src/**/*.{ts,tsx}"
    
    # Run tests if they exist
    if [ -d "tests" ]; then
        bun jest
    fi
    
    cd ../..
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    bun install
fi

# Check each package
for package in packages/*; do
    if [ -d "$package" ]; then
        check_package "$(basename "$package")"
    fi
done

# Run global type check
echo "Running global type check..."
bun tsc --noEmit

echo "✅ TypeScript validation completed successfully!"