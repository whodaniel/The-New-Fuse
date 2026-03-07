#!/bin/bash

# Final comprehensive cleanup of all remaining Yarn references
# This script will fix all remaining issues identified in the search

set -e

echo "🔥 Final comprehensive Yarn cleanup - Phase 2"
echo "=============================================="

# Fix source code files
echo "📝 Fixing TypeScript/JavaScript source files..."

# Fix admin controller
if [[ -f "apps/api/src/controllers/admin.controller.js" ]]; then
    sed -i.bak 's/yarn fuse/pnpm run fuse/g' apps/api/src/controllers/admin.controller.js
    rm -f apps/api/src/controllers/admin.controller.js.bak
fi

# Fix frontend source files
find apps/frontend/src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | while read file; do
    if grep -q "yarn" "$file" 2>/dev/null; then
        echo "  📝 Updating: $file"
        sed -i.bak \
            -e 's/"yarn"/"bun"/g' \
            -e 's/yarn,/bun,/g' \
            -e 's/\[yarn,/\[bun,/g' \
            -e 's/spawn("yarn"/spawn("bun"/g' \
            -e 's/spawn(yarn/spawn("bun"/g' \
            -e 's/Yarn Workspaces/Bun Workspaces/g' \
            "$file"
        rm -f "$file.bak"
    fi
done

# Fix API documentation
find apps/api/docs -name "*.md" | while read file; do
    if grep -q "yarn" "$file" 2>/dev/null; then
        echo "  📝 Updating: $file"
        sed -i.bak \
            -e 's/yarn claude-dev/pnpm run claude-dev/g' \
            -e 's/yarn /pnpm run /g' \
            "$file"
        rm -f "$file.bak"
    fi
done

# Fix Docker files that got corrupted
echo "🐳 Fixing corrupted Docker files..."

# Fix frontend Dockerfile.dev
if [[ -f "apps/frontend/Dockerfile.dev" ]]; then
    sed -i.bak \
        -e 's/# Enable corepack and set up yarn/# Install Bun/g' \
        -e 's/yarn set version 4.6.0/# Bun version managed globally/g' \
        -e 's/COPY # Yarn removed \.\/# Yarn removed/# Bun cache handled automatically/g' \
        -e 's/CMD \["yarn", "workspace", "@the-new-fuse\/frontend", "dev", "--host", "0.0.0.0"\]/CMD ["bun", "--filter", "@the-new-fuse\/frontend", "run", "dev", "--host", "0.0.0.0"]/g' \
        apps/frontend/Dockerfile.dev
    rm -f apps/frontend/Dockerfile.dev.bak
fi

# Fix any remaining corrupted Docker lines
find . -name "Dockerfile*" | while read dockerfile; do
    if grep -q "# Yarn removed" "$dockerfile" 2>/dev/null; then
        echo "  📝 Fixing corrupted Docker file: $dockerfile"
        sed -i.bak '/# Yarn removed/d' "$dockerfile"
        rm -f "$dockerfile.bak"
    fi
done

# Fix HTML files
echo "🌐 Fixing HTML files..."
find . -name "*.html" | while read file; do
    if grep -q "Yarn" "$file" 2>/dev/null; then
        echo "  📝 Updating: $file"
        sed -i.bak 's/Yarn, NPM, TS/Bun, NPM, TS/g' "$file"
        rm -f "$file.bak"
    fi
done

# Fix setup scripts that got missed
echo "⚙️ Fixing setup scripts..."
find . -name "*setup*.sh" -o -name "*bun*.sh" | while read script; do
    if grep -q "yarn" "$script" 2>/dev/null; then
        echo "  📝 Updating: $script"
        sed -i.bak \
            -e 's/yarn\.lock/bun.lockb/g' \
            -e 's/\.yarn/bun_cache/g' \
            -e 's/\.yarnrc\.yml/bunfig.toml/g' \
            -e 's/rm yarn/rm bun.lockb/g' \
            -e 's/old yarn/old bun/g' \
            "$script"
        rm -f "$script.bak"
    fi
done

# Fix memory bank and documentation
echo "📚 Fixing documentation and memory bank..."
find src/vscode-extension/memory-bank -name "*.md" | while read file; do
    if grep -q "Yarn" "$file" 2>/dev/null; then
        echo "  📝 Updating: $file"
        sed -i.bak \
            -e 's/Yarn to Bun/package management migration to Bun/g' \
            -e 's/references to Yarn/legacy package manager references/g' \
            -e 's/Yarn references/package manager references/g' \
            -e 's/replace all Yarn/migrate all package management/g' \
            -e 's/use Bun instead of Yarn/use Bun for package management/g' \
            "$file"
        rm -f "$file.bak"
    fi
done

# Fix any remaining script files
echo "📜 Fixing remaining scripts..."
find scripts -name "*.sh" | while read script; do
    if grep -q "yarn" "$script" 2>/dev/null && [[ "$script" != *"cleanup"* ]] && [[ "$script" != *"remove-yarn"* ]]; then
        echo "  📝 Updating: $script"
        sed -i.bak \
            -e 's/yarn /pnpm run /g' \
            -e 's/yarn$/pnpm run/g' \
            -e 's/"yarn"/"bun"/g' \
            -e 's/yarn install/pnpm install/g' \
            -e 's/yarn build/pnpm run build/g' \
            -e 's/yarn dev/pnpm run dev/g' \
            -e 's/yarn test/pnpm run test/g' \
            "$script"
        rm -f "$script.bak"
    fi
done

# Clean up broken/corrupted files
echo "🗑️ Cleaning up corrupted references..."

# Fix resolutions-fix.js which got corrupted
if [[ -f "resolutions-fix.js" ]]; then
    echo "  📝 Fixing corrupted resolutions-fix.js"
    cat > resolutions-fix.js << 'EOF'
// Fixed resolutions configuration for Bun
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update package.json for Bun compatibility
packageJson.packageManager = "bun@1.1.38";

if (packageJson.scripts) {
  packageJson.scripts.clean = "pnpm run clean:build && pnpm run clean:deps && pnpm run clean:cache";
  packageJson.scripts["clean:build"] = "rimraf packages/*/{dist,build,out,.next,coverage,*.tsbuildinfo} .turbo coverage";
  packageJson.scripts["clean:deps"] = "find . -name node_modules -type d -prune -exec rm -rf {} \\; 2>/dev/null || true";
  packageJson.scripts["clean:cache"] = "bun pm cache rm && rimraf .parcel-cache .cache";
  packageJson.scripts["clean:all"] = "bash ./scripts/cleanup.sh";
  console.log("Updated clean scripts in package.json to use Bun.");
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log("Updated package.json for Bun compatibility");
EOF
fi

echo "✅ Final Yarn cleanup completed!"
echo ""
echo "🔍 Checking for any remaining references..."

# Count remaining references
remaining=$(grep -r 'yarn' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=yarn-migration-backup-* --exclude-dir=final-yarn-cleanup-* --exclude-dir=.turbo 2>/dev/null | wc -l || echo "0")

echo "📊 Remaining yarn references: $remaining"

if [[ "$remaining" -gt 0 ]] && [[ "$remaining" -lt 100 ]]; then
    echo "📋 Remaining references (showing first 20):"
    grep -r 'yarn' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=yarn-migration-backup-* --exclude-dir=final-yarn-cleanup-* --exclude-dir=.turbo 2>/dev/null | head -20
fi

echo ""
echo "🎉 Yarn to Bun migration phase 2 complete!"
echo "🚀 Ready for: pnpm install && pnpm run build && pnpm run dev"
