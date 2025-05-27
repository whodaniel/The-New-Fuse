#!/bin/bash

# Fix VS Code extension dependencies in a workspace context
echo "======================================================"
echo "  Fixing Dependencies for The New Fuse Extension      "
echo "            (Workspace-Compatible Version)            "
echo "======================================================"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Creating a minimal package.json for extension development...${NC}"
# Create a temporary package.json for local development
cp package.json package.json.workspace-backup

# Create a modified package.json file without workspace references
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove workspace references
const removeDeps = (deps) => {
  if (!deps) return {};
  const newDeps = {};
  for (const [key, value] of Object.entries(deps)) {
    if (!String(value).startsWith('workspace:')) {
      newDeps[key] = value;
    } else {
      newDeps[key] = '*';
    }
  }
  return newDeps;
};

pkg.dependencies = removeDeps(pkg.dependencies);
pkg.devDependencies = removeDeps(pkg.devDependencies);

fs.writeFileSync('package.json.dev', JSON.stringify(pkg, null, 2));
"

# Use the modified package for installing
mv package.json.dev package.json

echo -e "${YELLOW}Step 2: Installing essential dependencies...${NC}"
npm install --no-save @types/vscode@1.85.0 @types/node@18 @types/mocha@10 typescript@5.1.3

echo -e "${YELLOW}Step 3: Creating tsconfig.json with minimal requirements...${NC}"
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "dist",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": ".",
    "skipLibCheck": true,
    "strict": false,
    "noImplicitAny": false,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": []
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    ".vscode-test"
  ]
}
EOF

echo -e "${YELLOW}Step 4: Creating .vscodeignore file...${NC}"
cat > .vscodeignore << EOF
.vscode/**
.vscode-test/**
src/**
**/*.map
.gitignore
tsconfig.json
**/tsconfig.json
**/webpack.config.js
**/.eslintrc.json
**/*.ts
**/*.tsx
node_modules/**
!node_modules/@the-new-fuse/**
**/*.vsix
.yarnrc
**/yarn.lock
**/package-lock.json
.yarn/**
EOF

echo -e "${YELLOW}Step 5: Creating minimal build script...${NC}"
cat > quick-build.sh << EOF
#!/bin/bash
echo "Building TypeScript files..."
npx tsc 

# Copy resources if needed
if [ -d "./resources" ]; then
  mkdir -p ./dist/resources
  cp -r ./resources/* ./dist/resources/
fi

if [ -d "./media" ]; then
  mkdir -p ./dist/media
  cp -r ./media/* ./dist/media/
fi
EOF
chmod +x quick-build.sh

echo -e "${YELLOW}Step 6: Creating package script...${NC}"
cat > package-vsix.sh << EOF
#!/bin/bash
echo "Packaging VS Code Extension..."

# Run the quick build
./quick-build.sh
if [ \$? -ne 0 ]; then
  echo "Build failed"
  exit 1
fi

# Package using vsce
npx vsce package --no-dependencies --out ./thefuse-extension.vsix
if [ \$? -ne 0 ]; then
  echo "Packaging failed"
  exit 1
fi

echo "Package created: ./thefuse-extension.vsix"
EOF
chmod +x package-vsix.sh

echo -e "${GREEN}✅ Workspace-compatible setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Build the extension with: ./quick-build.sh"
echo "2. Create a VSIX package: ./package-vsix.sh"
echo ""
echo "When you're done, restore the original package.json with:"
echo "mv package.json.workspace-backup package.json"
echo ""
echo "======================================================"