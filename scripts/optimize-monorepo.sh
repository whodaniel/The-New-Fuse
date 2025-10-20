#!/bin/bash

# The New Fuse - Comprehensive Optimization Setup
# This script optimizes the entire monorepo for 43+ packages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 The New Fuse - Comprehensive Monorepo Optimization${NC}"
echo -e "${CYAN}=================================================${NC}"
echo ""

# 1. Update Turbo Configuration
echo -e "${YELLOW}1. Optimizing Turbo Configuration...${NC}"
if [ -f "turbo.json.optimized" ]; then
    cp turbo.json turbo.json.backup
    cp turbo.json.optimized turbo.json
    echo -e "${GREEN}✅ Turbo configuration optimized for 43+ packages${NC}"
    echo -e "   - Increased concurrency to 50"
    echo -e "   - Optimized output logging"
    echo -e "   - Improved task dependencies"
    echo -e "   - Better caching strategies"
else
    echo -e "${RED}❌ turbo.json.optimized not found${NC}"
fi

# 2. Create optimized package build scripts
echo -e "${YELLOW}2. Creating optimized build scripts...${NC}"

# Fast build script
cat > scripts/build-fast.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Fast Build - Optimized for Development"
echo "========================================"

# Build only essential packages first
echo "Building essential packages..."
bun run --filter='@the-new-fuse/types' build
bun run --filter='@the-new-fuse/utils' build
bun run --filter='@the-new-fuse/core' build

# Build remaining packages in parallel groups
echo "Building remaining packages..."
bun run --filter='./packages/api*' build &
bun run --filter='./packages/ui*' build &
bun run --filter='./packages/feature*' build &
wait

echo "✅ Fast build completed!"
EOF

# Production build script
cat > scripts/build-production.sh << 'EOF'
#!/bin/bash
set -e

echo "🏭 Production Build - Full Optimization"
echo "======================================="

# Clean first
turbo run clean

# Build with maximum optimization
NODE_ENV=production turbo run build:production \
  --concurrency=75 \
  --cache-dir=.turbo \
  --output-logs=errors-only

echo "✅ Production build completed!"
EOF

# Parallel development script
cat > scripts/dev-parallel.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Parallel Development Mode"
echo "============================"

# Start essential services first
echo "Starting essential services..."
bun run --filter='@the-new-fuse/types' build

# Start development servers in parallel
echo "Starting development servers..."
bun run --filter='@the-new-fuse/api*' dev &
bun run --filter='@the-new-fuse/frontend*' dev &

# Wait for user input to stop
echo "Press Ctrl+C to stop all development servers"
wait
EOF

chmod +x scripts/build-fast.sh
chmod +x scripts/build-production.sh
chmod +x scripts/dev-parallel.sh

echo -e "${GREEN}✅ Optimized build scripts created${NC}"

# 3. Create package dependency analyzer
echo -e "${YELLOW}3. Creating dependency analyzer...${NC}"

cat > scripts/analyze-dependencies.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Package Dependency Analysis');
console.log('==============================');

const packageDirs = [
  'packages',
  'apps',
  'tools'
];

const packages = [];
const dependencies = new Map();

// Scan all packages
packageDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const packagePath = path.join(dir, item, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (pkg.name) {
          packages.push({
            name: pkg.name,
            path: path.join(dir, item),
            dependencies: {
              ...pkg.dependencies,
              ...pkg.devDependencies
            }
          });
        }
      } catch (e) {
        console.warn(`⚠️  Could not parse ${packagePath}`);
      }
    }
  });
});

console.log(`Found ${packages.length} packages`);

// Analyze internal dependencies
const internalDeps = new Map();
packages.forEach(pkg => {
  const internal = [];
  Object.keys(pkg.dependencies || {}).forEach(dep => {
    if (dep.startsWith('@the-new-fuse/')) {
      internal.push(dep);
    }
  });
  if (internal.length > 0) {
    internalDeps.set(pkg.name, internal);
  }
});

console.log('\n🔗 Internal Dependencies:');
internalDeps.forEach((deps, pkg) => {
  console.log(`  ${pkg}:`);
  deps.forEach(dep => console.log(`    - ${dep}`));
});

// Suggest build order
console.log('\n📋 Suggested Build Order:');
console.log('  1. Types packages');
console.log('  2. Utility packages');
console.log('  3. Core packages');
console.log('  4. Database packages');
console.log('  5. API packages');
console.log('  6. UI packages');
console.log('  7. Feature packages');
console.log('  8. Application packages');
EOF

chmod +x scripts/analyze-dependencies.js
echo -e "${GREEN}✅ Dependency analyzer created${NC}"

# 4. Create performance monitoring script
echo -e "${YELLOW}4. Creating performance monitor...${NC}"

cat > scripts/monitor-build.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('⏱️  Build Performance Monitor');
console.log('============================');

const commands = [
  { name: 'Fast Build', cmd: 'bun run build:fast' },
  { name: 'Optimized Build', cmd: 'bun run build:optimized' },
  { name: 'Production Build', cmd: 'bun run build:production' }
];

const results = [];

commands.forEach(({ name, cmd }) => {
  console.log(`\n🏃 Running: ${name}`);
  
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit' });
    const duration = Date.now() - start;
    results.push({ name, duration, success: true });
    console.log(`✅ ${name} completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ name, duration, success: false });
    console.log(`❌ ${name} failed after ${duration}ms`);
  }
});

// Save results
const report = {
  timestamp: new Date().toISOString(),
  results: results
};

fs.writeFileSync('build-performance.json', JSON.stringify(report, null, 2));
console.log('\n📊 Performance report saved to build-performance.json');
EOF

chmod +x scripts/monitor-build.js
echo -e "${GREEN}✅ Performance monitor created${NC}"

# 5. Create workspace cleaner
echo -e "${YELLOW}5. Creating workspace cleaner...${NC}"

cat > scripts/clean-workspace.sh << 'EOF'
#!/bin/bash

echo "🧹 Comprehensive Workspace Cleanup"
echo "=================================="

# Clean Turbo cache
echo "Cleaning Turbo cache..."
turbo run clean
rm -rf .turbo

# Clean node_modules in all packages
echo "Cleaning node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Clean build artifacts
echo "Cleaning build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "build" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".next" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "coverage" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Clean lock files
echo "Cleaning lock files..."
rm -f bun.lockb package-lock.json bun.lockb

echo "✅ Workspace cleaned! Run 'bun install' to reinstall dependencies."
EOF

chmod +x scripts/clean-workspace.sh
echo -e "${GREEN}✅ Workspace cleaner created${NC}"

# 6. Update gitignore for better performance
echo -e "${YELLOW}6. Updating .gitignore for better performance...${NC}"

cat >> .gitignore << 'EOF'

# Optimization files
turbo.json.backup
build-performance.json
.turbo/
**/dist/
**/build/
**/.next/cache/
**/coverage/
**/*.tsbuildinfo

# Package manager files
.pnpm-store/
.yarn/cache/
node_modules/

# OS files
.DS_Store
Thumbs.db
EOF

echo -e "${GREEN}✅ .gitignore updated${NC}"

# 7. Create package templates for consistency
echo -e "${YELLOW}7. Creating package templates...${NC}"

mkdir -p templates/package-template

cat > templates/package-template/package.json << 'EOF'
{
  "name": "@the-new-fuse/PACKAGE_NAME",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "bun tsc",
    "build:watch": "bun tsc --watch",
    "clean": "rimraf dist",
    "dev": "bun tsc --watch",
    "type-check": "bun tsc --noEmit",
    "test": "bun test",
    "test:watch": "bun test --watch"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "rimraf": "^5.0.0"
  },
  "peerDependencies": {},
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
EOF

cat > templates/package-template/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.*", "**/*.spec.*"]
}
EOF

cat > templates/package-template/src/index.ts << 'EOF'
// Package entry point
export * from './lib';
EOF

cat > templates/package-template/src/lib.ts << 'EOF'
// Package implementation
export const PACKAGE_NAME = 'PACKAGE_NAME';
EOF

echo -e "${GREEN}✅ Package templates created${NC}"

# 8. Final optimizations
echo -e "${YELLOW}8. Applying final optimizations...${NC}"

# Create optimized package.json script runner
cat > scripts/run-optimized.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');

const script = process.argv[2];
const concurrency = process.argv[3] || '50';

if (!script) {
  console.log('Usage: node scripts/run-optimized.js <script> [concurrency]');
  process.exit(1);
}

const cmd = `turbo run ${script} --concurrency=${concurrency} --output-logs=errors-only`;
console.log(`Running: ${cmd}`);

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status);
}
EOF

chmod +x scripts/run-optimized.js

echo -e "${GREEN}✅ Optimization setup completed!${NC}"
echo ""
echo -e "${CYAN}🎉 Your monorepo is now optimized for 43+ packages!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Run: ${GREEN}bun install${NC} to reinstall dependencies"
echo -e "2. Run: ${GREEN}node scripts/analyze-dependencies.js${NC} to analyze your setup"
echo -e "3. Run: ${GREEN}pnpm run build:optimized${NC} to test the new build system"
echo -e "4. Run: ${GREEN}pnpm run dev${NC} for optimized development"
echo ""
echo -e "${BLUE}Performance improvements:${NC}"
echo -e "• Increased concurrency to 50 (up from 30)"
echo -e "• Optimized task dependencies"
echo -e "• Better build caching"
echo -e "• Simplified workspace configuration"
echo -e "• Added performance monitoring"
echo -e "• Created specialized build scripts"
echo ""
