#!/bin/bash

echo "🔧 Fixing build issues..."

# Remove the postgres-migrations dependency from package.json
echo "Removing postgres-migrations dependency..."
sed -i '' '/postgres-migrations/d' package.json

# Create an empty yarn.lock file
echo "Creating empty yarn.lock file..."
touch yarn.lock

# Run yarn build with the --ignore-engines flag
echo "Running yarn build..."
yarn build --ignore-engines

echo "✅ Build process completed."
