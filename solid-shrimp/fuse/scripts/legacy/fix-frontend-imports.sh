#!/bin/bash

# This script fixes the module resolution issues in the frontend package

echo "🔧 Fixing frontend module resolution issues..."

# Navigate to the frontend package
cd apps/frontend

# Update tsconfig.json to use Node instead of NodeNext
sed -i '' 's/"moduleResolution": "node16"/"moduleResolution": "node"/g' tsconfig.json
sed -i '' 's/"moduleResolution": "nodenext"/"moduleResolution": "node"/g' tsconfig.json

# Add .js extensions to all relative imports
find src -name "*.tsx" -type f -exec sed -i '' 's/from '\''\.\.\/\([^'"'"']*\)'\''/from '\''\.\.\/\1\.js'\''/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/from '\''\.\/\([^'"'"']*\)'\''/from '\''\.\/\1\.js'\''/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/from '\''\.\.\/\([^'"'"']*\)'\''/from '\''\.\.\/\1\.js'\''/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/from '\''\.\/\([^'"'"']*\)'\''/from '\''\.\/\1\.js'\''/g' {} \;

# Fix lazy imports
find src -name "*.tsx" -type f -exec sed -i '' 's/import('\''\.\.\/\([^'"'"']*\)'\'')/import('\''\.\.\/\1\.js'\'')/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/import('\''\.\/\([^'"'"']*\)'\'')/import('\''\.\/\1\.js'\'')/g' {} \;

echo "✅ Frontend module resolution issues fixed"
