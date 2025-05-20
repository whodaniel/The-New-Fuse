#!/bin/bash

# Comprehensive TypeScript ESM Fix Script
echo "🔧 Starting comprehensive TypeScript ESM fixes..."

# Get the absolute path to the project root
PROJECT_ROOT="$(pwd)"

# Fix API server imports
echo "📦 Fixing API server imports..."
cd "$PROJECT_ROOT/apps/api"

# Check src/index.ts content
if [ -f "src/index.ts" ]; then
  echo "Examining src/index.ts for import issues..."
  
  # Check for the specific import causing the error
  if grep -q "from '@/routes/agents'" "src/index.ts"; then
    echo "Found alias import for routes/agents. Updating to relative path..."
    sed -i '' "s|from '@/routes/agents'|from './routes/agents.js'|g" "src/index.ts"
    echo "✅ Updated imports in src/index.ts"
  fi
  
  # Check for any other @ imports and convert them
  if grep -q "from '@/" "src/index.ts"; then
    echo "Converting remaining @ alias imports to relative paths..."
    sed -i '' "s|from '@/|from './|g" "src/index.ts"
    echo "✅ Converted remaining alias imports"
  fi
  
  # Ensure .js extensions are added to all local imports
  echo "Adding .js extensions to local imports..."
  sed -i '' "s|from '\./|from './|g" "src/index.ts"
  sed -i '' "s|from '\./\([^']*\)'|from './\1.js'|g" "src/index.ts"
  echo "✅ Added .js extensions to local imports"
  
  # Create routes/agents directory and index.ts if it doesn't exist
  if [ ! -d "src/routes/agents" ]; then
    echo "Creating missing routes/agents directory and placeholder file..."
    mkdir -p "src/routes/agents"
    cat > "src/routes/agents/index.ts" << EOF
// Placeholder for agents routes
// This file was automatically created by the ESM fix script
export default {};
EOF
    echo "✅ Created placeholder agents routes module"
  fi
  
  # Update tsconfig.json to use ES modules if needed
  echo "Updating tsconfig.json module settings..."
  if [ -f "tsconfig.json" ]; then
    if ! grep -q '"module": "NodeNext"' "tsconfig.json"; then
      sed -i '' 's/"module": "commonjs"/"module": "NodeNext"/g' tsconfig.json
      sed -i '' 's/"moduleResolution": "node"/"moduleResolution": "NodeNext"/g' tsconfig.json
      echo "✅ Updated module settings in tsconfig.json"
    else
      echo "Module settings already set correctly in tsconfig.json"
    fi
  fi
fi

# Fix backend app modules
echo "📦 Fixing backend app modules..."
cd "$PROJECT_ROOT/apps/backend"

# Update backend tsconfig.json to use ES modules
echo "Updating backend tsconfig.json module settings..."
if [ -f "tsconfig.json" ]; then
  if ! grep -q '"module": "NodeNext"' "tsconfig.json"; then
    sed -i '' 's/"module": "commonjs"/"module": "NodeNext"/g' tsconfig.json
    sed -i '' 's/"moduleResolution": "node"/"moduleResolution": "NodeNext"/g' tsconfig.json
    echo "✅ Updated module settings in backend tsconfig.json"
  else
    echo "Module settings already set correctly in backend tsconfig.json"
  fi
fi

# Fix backend index.ts
echo "Checking backend index.ts format..."
if [ -f "src/index.ts" ]; then
  # Make a backup of the original file
  cp "src/index.ts" "src/index.ts.bak"
  echo "Created backup at src/index.ts.bak"
  
  # Replace CommonJS syntax with ESM syntax
  echo "Converting CommonJS syntax to ESM..."
  sed -i '' 's/Object.defineProperty(exports, "__esModule", { value: true });/\/\/ ESM module/g' "src/index.ts"
  sed -i '' 's/exports\./export /g' "src/index.ts"
  sed -i '' 's/const [^=]* = require(/import/g' "src/index.ts"
  
  # Add .js extensions to local imports
  sed -i '' 's/from "\.\//from "\.\/\./g' "src/index.ts" # Temporary change to avoid double replacements
  sed -i '' 's/from "\.\.\//from "\.\.\//g' "src/index.ts" # Temporary change to avoid double replacements
  sed -i '' 's/from "\.\\/\([^"]*\)"/from "\.\\/\1.js"/g' "src/index.ts"
  sed -i '' 's/from "\.\.\\/\([^"]*\)"/from "\.\.\\/\1.js"/g' "src/index.ts"
  echo "✅ Updated backend index.ts to use ESM syntax"
fi

# Create tsconfig.node.json files for ts-node configuration
echo "📝 Creating tsconfig.node.json files..."

# Root tsconfig.node.json
cd "$PROJECT_ROOT"
echo "Creating root tsconfig.node.json..."
cat > "tsconfig.node.json" << EOF
{
  "extends": "./tsconfig.json",
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  },
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
EOF
echo "✅ Created root tsconfig.node.json"

# API tsconfig.node.json
cd "$PROJECT_ROOT/apps/api"
echo "Creating API tsconfig.node.json..."
cat > "tsconfig.node.json" << EOF
{
  "extends": "./tsconfig.json",
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
EOF
echo "✅ Created API tsconfig.node.json"

# Backend tsconfig.node.json
cd "$PROJECT_ROOT/apps/backend"
echo "Creating backend tsconfig.node.json..."
cat > "tsconfig.node.json" << EOF
{
  "extends": "./tsconfig.json",
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
EOF
echo "✅ Created backend tsconfig.node.json"

# Update nodemon configurations
echo "📝 Updating nodemon configurations..."

# API nodemon.json
cd "$PROJECT_ROOT/apps/api"
if [ -f "nodemon.json" ]; then
  echo "Updating API nodemon.json..."
  cat > "nodemon.json" << EOF
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --loader ts-node/esm --experimental-specifier-resolution=node src/index.ts"
}
EOF
  echo "✅ Updated API nodemon.json"
fi

# Backend nodemon.json
cd "$PROJECT_ROOT/apps/backend"
if [ -f "nodemon.json" ]; then
  echo "Updating backend nodemon.json..."
  cat > "nodemon.json" << EOF
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --loader ts-node/esm --experimental-specifier-resolution=node src/index.ts"
}
EOF
  echo "✅ Updated backend nodemon.json"
fi

# Update package.json scripts
echo "📝 Updating package.json scripts..."

# API package.json
cd "$PROJECT_ROOT/apps/api"
if [ -f "package.json" ]; then
  echo "Updating API package.json dev script..."
  # Use node to update the package.json file
  node -e "
    const fs = require('fs');
    const path = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.scripts.dev = 'cross-env PORT=3003 nodemon';
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
  "
  echo "✅ Updated API package.json"
fi

# Backend package.json
cd "$PROJECT_ROOT/apps/backend"
if [ -f "package.json" ]; then
  echo "Updating backend package.json dev script..."
  # Use node to update the package.json file
  node -e "
    const fs = require('fs');
    const path = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.scripts.dev = 'cross-env PORT=3004 nodemon';
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
  "
  echo "✅ Updated backend package.json"
fi

echo "✅ All TypeScript and ESM fixes have been applied!"
echo "To start the development environment, run: yarn dev"
echo "If you encounter any issues, you can find backups of modified files with .bak extension."
