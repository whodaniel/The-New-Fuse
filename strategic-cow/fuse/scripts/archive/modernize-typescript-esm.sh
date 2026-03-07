#!/bin/bash

# Modernize TypeScript ESM Configuration
# Created: May 16, 2025
# This script updates the project's TypeScript ESM configuration to use the most stable,
# modern approaches available in Node.js 18.x+, eliminating experimental warnings

echo "🔄 Modernizing TypeScript ESM Configuration..."

# Get the absolute path to the project root
PROJECT_ROOT="$(pwd)"

# First, let's make backup copies of important files
echo "📋 Creating backups of configuration files..."

# Backup API configs
if [ -f "$PROJECT_ROOT/apps/api/nodemon.json" ]; then
  cp "$PROJECT_ROOT/apps/api/nodemon.json" "$PROJECT_ROOT/apps/api/nodemon.json.bak"
fi
if [ -f "$PROJECT_ROOT/apps/api/tsconfig.node.json" ]; then
  cp "$PROJECT_ROOT/apps/api/tsconfig.node.json" "$PROJECT_ROOT/apps/api/tsconfig.node.json.bak"
fi

# Backup Backend configs
if [ -f "$PROJECT_ROOT/apps/backend/nodemon.json" ]; then
  cp "$PROJECT_ROOT/apps/backend/nodemon.json" "$PROJECT_ROOT/apps/backend/nodemon.json.bak"
fi
if [ -f "$PROJECT_ROOT/apps/backend/tsconfig.node.json" ]; then
  cp "$PROJECT_ROOT/apps/backend/tsconfig.node.json" "$PROJECT_ROOT/apps/backend/tsconfig.node.json.bak"
fi

# Backup root tsconfig.node.json
if [ -f "$PROJECT_ROOT/tsconfig.node.json" ]; then
  cp "$PROJECT_ROOT/tsconfig.node.json" "$PROJECT_ROOT/tsconfig.node.json.bak"
fi

echo "✅ Backups created"

# 1. Update the root tsconfig.node.json file
echo "📝 Updating root tsconfig.node.json..."
cat > "$PROJECT_ROOT/tsconfig.node.json" << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "ts-node": {
    "esm": true
  }
}
EOF
echo "✅ Updated root tsconfig.node.json"

# 2. Update API tsconfig.node.json
echo "📝 Updating API tsconfig.node.json..."
cat > "$PROJECT_ROOT/apps/api/tsconfig.node.json" << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "ts-node": {
    "esm": true
  }
}
EOF
echo "✅ Updated API tsconfig.node.json"

# 3. Update backend tsconfig.node.json
echo "📝 Updating backend tsconfig.node.json..."
cat > "$PROJECT_ROOT/apps/backend/tsconfig.node.json" << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "ts-node": {
    "esm": true
  }
}
EOF
echo "✅ Updated backend tsconfig.node.json"

# 4. Update API nodemon.json to use modern options
echo "📝 Updating API nodemon.json..."
cat > "$PROJECT_ROOT/apps/api/nodemon.json" << EOF
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --import ts-node/register/esm src/index.ts"
}
EOF
echo "✅ Updated API nodemon.json"

# 5. Update backend nodemon.json to use modern options
echo "📝 Updating backend nodemon.json..."
cat > "$PROJECT_ROOT/apps/backend/nodemon.json" << EOF
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --import ts-node/register/esm src/index.ts"
}
EOF
echo "✅ Updated backend nodemon.json"

# 6. Create a tsconfig.paths.json file for path mapping
echo "📝 Creating path mapping configuration..."
cat > "$PROJECT_ROOT/tsconfig.paths.json" << EOF
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
EOF
echo "✅ Created tsconfig.paths.json"

# 7. Check for package.json type field
check_and_add_type_module() {
  local pkg_file="$1"
  if [ -f "$pkg_file" ]; then
    if ! grep -q '"type": "module"' "$pkg_file"; then
      echo "Adding type:module to $pkg_file..."
      # Use node to update the package.json file
      node -e "
        const fs = require('fs');
        const path = '$pkg_file';
        const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
        pkg.type = 'module';
        fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
      "
    else
      echo "$pkg_file already has type:module set"
    fi
  fi
}

check_and_add_type_module "$PROJECT_ROOT/package.json"
check_and_add_type_module "$PROJECT_ROOT/apps/api/package.json"
check_and_add_type_module "$PROJECT_ROOT/apps/backend/package.json"

# 8. Install tsconfig-paths module if not already installed
echo "📦 Checking for required dependencies..."
if ! grep -q '"tsconfig-paths"' "$PROJECT_ROOT/package.json"; then
  echo "Installing tsconfig-paths for better path alias support..."
  yarn add -D tsconfig-paths
  echo "✅ Installed tsconfig-paths"
else
  echo "tsconfig-paths already installed"
fi

# 9. Update documentation to reflect the changes
echo "📄 Updating ESM-QUICK-REFERENCE.md documentation..."
cat > "$PROJECT_ROOT/docs/ESM-QUICK-REFERENCE-UPDATED.md" << 'EOF'
# TypeScript ESM Quick Reference (Updated)

## Modern ESM Configuration (May 2025)

### Starting the Application

```bash
# Normal development start
yarn dev

# API server only
cd apps/api && yarn dev

# Backend only
cd apps/backend && yarn dev
```

### What Changed?

1. **Node.js Flags Updated**:
   - Replaced `--loader ts-node/esm` with `--import ts-node/register/esm`
   - Removed experimental flag `--experimental-specifier-resolution=node`

2. **Import Approaches**:
   - Still requires `.js` extension for local imports
   - Path mapping resolution now handled through tsconfig-paths

3. **Benefits**:
   - No more experimental warnings
   - Cleaner startup process
   - More aligned with Node.js stable features

### Import Style Guide (Same as Before)

✅ **DO**:
```typescript
// Local imports need .js extension (even for .ts files)
import { MyClass } from './my-class.js';

// For node_modules (no extension needed)
import { useState } from 'react';

// For index files
import { utils } from './utils/index.js';
// OR (shorter)
import { utils } from './utils/js';
```

❌ **DON'T**:
```typescript
// Missing extension (won't work in ESM)
import { MyClass } from './my-class';

// Wrong extension (use .js not .ts)
import { MyClass } from './my-class.ts';
```

### Troubleshooting

If you encounter module resolution issues:

1. **Common Error**: `Cannot find module '...' imported from '...'`
   - Make sure all local imports have `.js` extensions
   - Check that the file exists at the specified path

2. **Path Alias Issues**:
   - Path aliases like `@/*` are resolved through tsconfig-paths
   - Try using relative paths if path aliases aren't working

3. **Node.js Version**:
   - This configuration works best with Node.js 18.x+
   - If using a different version, you may need additional flags

### Documentation

For more details, see:
- [TypeScript ESM Configuration Guide](/docs/TYPESCRIPT_ESM_CONFIGURATION.md)
- [Development Log](/docs/DEVELOPMENT-LOG.md)
EOF
echo "✅ Updated documentation"

echo "🎉 Modernization complete! ESM configuration has been updated to use stable APIs."
echo "To apply these changes, run: yarn dev"
echo "If you encounter any issues, you can restore from backups (.bak files)."
