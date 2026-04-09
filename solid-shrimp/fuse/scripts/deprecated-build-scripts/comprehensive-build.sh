#!/bin/bash

# Comprehensive build script that permanently fixes all issues and builds the project

echo "🚀 Starting comprehensive project setup and build..."

# Make all scripts executable
echo "Making fix scripts executable..."
chmod +x fix-database-migrations.sh
chmod +x fix-all-typescript-errors.sh
chmod +x fix-frontend-imports.sh
chmod +x fix-chakra-imports.sh
chmod +x fix-react-components.sh
chmod +x fix-database-composite.sh
chmod +x fix-jest-config.sh
chmod +x build-incremental.sh

# Step 1: Fix all TypeScript errors
echo "Step 1: Fixing TypeScript errors..."
./fix-all-typescript-errors.sh

# Step 2: Fix database composite issue
echo "Step 2: Fixing database composite issue..."
./fix-database-composite.sh

# Step 3: Fix frontend imports
echo "Step 3: Fixing frontend imports..."
./fix-frontend-imports.sh

# Step 4: Fix Chakra UI imports
echo "Step 4: Fixing Chakra UI imports..."
./fix-chakra-imports.sh

# Step 5: Fix React components
echo "Step 5: Fixing React components..."
./fix-react-components.sh

# Step 6: Fix database migrations
echo "Step 6: Fixing database migrations..."
./fix-database-migrations.sh

# Step 7: Fix Jest configuration
echo "Step 7: Fixing Jest configuration..."
./fix-jest-config.sh

# Step 8: Build the project incrementally
echo "Step 8: Building the project incrementally..."
./build-incremental.sh

# Check build result
if [ $? -eq 0 ]; then
  echo "✅ Project built successfully!"
  echo "🎉 The New Fuse app is now ready to use."
else
  echo "❌ Build failed. Please check the error messages above."
  exit 1
fi