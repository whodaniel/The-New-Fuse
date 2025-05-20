#!/bin/bash
set -e

echo "🔍 Starting TypeScript validation..."

# Function to check a specific package
check_package() {
    local package_name=$1
    echo "Checking package: $package_name"
    
    cd "packages/$package_name"
    
    # Run type checking
    yarn tsc --noEmit
    
    # Run ESLint
    yarn eslint "src/**/*.{ts,tsx}"
    
    # Run tests if they exist
    if [ -d "tests" ]; then
        yarn jest
    fi
    
    cd ../..
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    yarn install
fi

# Check each package
for package in packages/*; do
    if [ -d "$package" ]; then
        check_package "$(basename "$package")"
    fi
done

# Run global type check
echo "Running global type check..."
yarn tsc --noEmit

echo "✅ TypeScript validation completed successfully!"