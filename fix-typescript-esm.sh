#!/bin/bash

# Fix TypeScript and ESM configuration for The New Fuse project
# This script addresses the "Unknown file extension .ts" error when using ES modules

echo "🔧 Fixing TypeScript and ES modules configuration..."

# Fix the API app configuration
echo "📦 Updating apps/api configuration..."

# Create a proper nodemon.json for apps/api if it doesn't exist
if [ ! -f "apps/api/nodemon.json" ]; then
  echo "Creating nodemon.json for apps/api..."
  cat > apps/api/nodemon.json << 'EOF'
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --loader ts-node/esm src/index.ts"
}
EOF
fi

# Fix the Backend app configuration
echo "📦 Updating apps/backend configuration..."

# Update nodemon.json for apps/backend
if [ -f "apps/backend/nodemon.json" ]; then
  echo "Updating nodemon.json for apps/backend..."
  cat > apps/backend/nodemon.json << 'EOF'
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --loader ts-node/esm src/index.ts"
}
EOF
fi

# Create tsconfig.node.json in the root directory for better Node.js ESM support
echo "📜 Creating tsconfig.node.json in the root directory..."
cat > tsconfig.node.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
EOF

# Update the scripts in package.json files
echo "🔄 Updating package.json scripts..."

# For API app
if [ -f "apps/api/package.json" ]; then
  echo "Updating apps/api/package.json dev script..."
  sed -i '' 's/"dev": "cross-env PORT=3003 nodemon --exec ts-node src\/index.ts"/"dev": "cross-env PORT=3003 nodemon"/' apps/api/package.json
fi

# For Backend app
if [ -f "apps/backend/package.json" ]; then
  echo "Checking backend package.json..."
  if grep -q "nodemon --exec" apps/backend/package.json; then
    echo "Updating apps/backend/package.json dev script..."
    sed -i '' 's/"dev": "cross-env PORT=3004 nodemon --exec ts-node src\/index.ts"/"dev": "cross-env PORT=3004 nodemon"/' apps/backend/package.json
  fi
fi

echo "✅ Configuration fixes applied successfully!"
echo "Run 'yarn dev' to start the development environment."
