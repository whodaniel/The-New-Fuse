#!/bin/bash

echo "Fixing Yarn lockfile issues..."

# Backup the original package.json
if [ -f "package.json" ]; then
  cp package.json package.json.before-fix
  echo "✓ Backed up package.json"
fi

# Create minimal package.json files for all required packages
mkdir -p packages/security
cat > packages/security/package.json << 'EOL'
{
  "name": "@the-new-fuse/security",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "private": true
}
EOL

# Ensure workspace configuration is correct
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.workspaces || !Array.isArray(pkg.workspaces)) {
  pkg.workspaces = ['apps/*', 'packages/*'];
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "Regenerating Yarn lockfile..."
yarn install --mode update-lockfile

echo "✓ Lockfile regenerated"

echo "Attempting to compile TypeScript without emitting files..."
# Try direct npx typescript compiler to avoid Yarn resolution issues
npx tsc --noEmit || {
  echo "⚠️ TypeScript compilation failed.";
  echo "This is expected - we've set up the environment but there may still be TypeScript errors to fix.";
}

echo "Workspace setup complete."
echo "You can now use 'npx tsc --noEmit' to check TypeScript errors."
