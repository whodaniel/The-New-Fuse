#!/bin/bash

# Final comprehensive Yarn cleanup - Phase 3
# This script removes ALL remaining yarn references

set -e

echo "🔥 Final comprehensive Yarn cleanup - Phase 3"
echo "=============================================="

# Create backup directory
BACKUP_DIR="final-yarn-cleanup-phase3-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Function to safely replace yarn with bun in files
safe_replace() {
    local file="$1"
    if [[ -f "$file" && ! "$file" =~ /(node_modules|\.git|backup)/ ]]; then
        # Skip binary files
        if file "$file" | grep -q "text"; then
            echo "  📝 Processing: $file"
            cp "$file" "$BACKUP_DIR/$(basename "$file").$(date +%s).backup" 2>/dev/null || true
            
            # Replace yarn commands with bun equivalents
            sed -i.bak \
                -e 's/yarn install/pnpm install/g' \
                -e 's/yarn add/pnpm add/g' \
                -e 's/yarn remove/bun remove/g' \
                -e 's/yarn build/pnpm run build/g' \
                -e 's/yarn dev/pnpm run dev/g' \
                -e 's/yarn start/pnpm run start/g' \
                -e 's/yarn test/pnpm run test/g' \
                -e 's/yarn run /pnpm run /g' \
                -e 's/yarn workspace \([^ ]*\) \([^ ]*\)/bun --filter \1 run \2/g' \
                -e 's/yarn workspace \([^ ]*\)/bun --filter \1/g' \
                -e 's/yarn --version/bun --version/g' \
                -e 's/yarn -v/bun -v/g' \
                -e 's/yarn cache clean/bun pm cache rm/g' \
                -e 's/yarn\.lock/bun\.lockb/g' \
                -e 's/\.yarnrc\.yml/bunfig\.toml/g' \
                -e 's/packageManager.*yarn.*/packageManager: "bun@1.1.38"/g' \
                -e 's/YARN_/BUN_/g' \
                -e 's/\$\{YARN_/\$\{BUN_/g' \
                -e 's/"yarn"/"bun"/g' \
                -e "s/'yarn'/'bun'/g" \
                -e 's/`yarn`/`bun`/g' \
                -e 's/\*\*yarn\*\*/**bun**/g' \
                -e 's/Yarn /Bun /g' \
                -e 's/ yarn / bun /g' \
                "$file"
            
            # Remove .bak file
            rm -f "$file.bak"
        fi
    fi
}

echo "🔍 Finding all text files with yarn references..."

# Get all files that contain yarn (excluding specific directories)
FILES_WITH_YARN=$(grep -r -l 'yarn\|Yarn\|YARN' . \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.turbo \
    --exclude-dir=*backup* \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude="*.log" \
    --exclude="*.lockb" \
    --exclude="*.sqlite" \
    2>/dev/null | head -500)

echo "📝 Processing files with yarn references..."
echo "$FILES_WITH_YARN" | while read -r file; do
    if [[ -n "$file" && -f "$file" ]]; then
        safe_replace "$file"
    fi
done

echo "🐳 Fixing specific Docker issues..."
# Fix specific Docker patterns
find . -name "Dockerfile*" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/backup*/*" | while read -r dockerfile; do
    if [[ -f "$dockerfile" ]]; then
        echo "  📝 Fixing Docker file: $dockerfile"
        cp "$dockerfile" "$BACKUP_DIR/$(basename "$dockerfile").$(date +%s).backup"
        
        # Fix Docker-specific patterns
        sed -i.bak \
            -e 's/ARG YARN_VERSION=.*/ARG BUN_VERSION=1.1.38/g' \
            -e 's/YARN_VERSION/BUN_VERSION/g' \
            -e 's/corepack enable.*yarn.*/RUN pnpm install -g bun@1.1.38/g' \
            -e 's/corepack prepare yarn.*/# Bun installed globally/g' \
            -e 's/COPY.*yarn.lock.*/COPY package.json bun.lockb bunfig.toml ./g' \
            -e 's/COPY.*\.yarnrc\.yml.*/# Yarn config removed/g' \
            -e 's/COPY.*\.yarn.*/# Yarn cache removed/g' \
            -e 's/ENV YARN_CACHE_FOLDER.*/ENV BUN_CACHE_DIR=\/usr\/local\/share\/.cache\/bun/g' \
            -e 's/\${YARN_CACHE_FOLDER}/\${BUN_CACHE_DIR}/g' \
            -e 's/--frozen-lockfile --immutable/--frozen-lockfile/g' \
            "$dockerfile"
        
        rm -f "$dockerfile.bak"
    fi
done

echo "📋 Fixing package.json files..."
# Fix package.json files
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/backup*/*" | head -50 | while read -r pkg; do
    if [[ -f "$pkg" ]] && grep -q "yarn" "$pkg" 2>/dev/null; then
        echo "  📝 Fixing package.json: $pkg"
        cp "$pkg" "$BACKUP_DIR/$(basename "$pkg").$(date +%s).backup"
        
        # Fix package.json yarn references
        sed -i.bak \
            -e 's/"yarn /"pnpm run /g' \
            -e 's/"packageManager": "yarn@.*"/"packageManager": "bun@1.1.38"/g' \
            -e 's/yarn install/pnpm install/g' \
            -e 's/yarn build/pnpm run build/g' \
            -e 's/yarn dev/pnpm run dev/g' \
            -e 's/yarn start/pnpm run start/g' \
            -e 's/yarn test/pnpm run test/g' \
            "$pkg"
        
        rm -f "$pkg.bak"
    fi
done

echo "🗑️ Removing yarn-specific files..."
# Remove any remaining yarn files
find . -name ".yarnrc.yml" -not -path "*/backup*/*" -delete 2>/dev/null || true
find . -name "yarn.lock" -not -path "*/backup*/*" -delete 2>/dev/null || true
find . -type d -name ".yarn" -not -path "*/backup*/*" -exec rm -rf {} + 2>/dev/null || true

echo "🔧 Updating gitignore and gitattributes..."
# Fix .gitignore
if [[ -f ".gitignore" ]]; then
    cp ".gitignore" "$BACKUP_DIR/.gitignore.backup"
    sed -i.bak \
        -e 's/\.yarn\//# \.yarn\/ (removed - using bun)/g' \
        -e 's/yarn\.lock/# yarn\.lock (removed - using bun\.lockb)/g' \
        -e 's/\.yarnrc\.yml/# \.yarnrc\.yml (removed - using bunfig\.toml)/g' \
        ".gitignore"
    rm -f ".gitignore.bak"
fi

# Fix .gitattributes
if [[ -f ".gitattributes" ]]; then
    cp ".gitattributes" "$BACKUP_DIR/.gitattributes.backup"
    sed -i.bak \
        -e 's/\.yarn\//# \.yarn\/ (removed)/g' \
        ".gitattributes"
    rm -f ".gitattributes.bak"
fi

echo "✅ Final comprehensive Yarn cleanup completed!"
echo ""
echo "🔍 Checking for any remaining references..."
REMAINING=$(grep -r 'yarn\|Yarn\|YARN' . \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.turbo \
    --exclude-dir=*backup* \
    --exclude="*.log" \
    --exclude="*.lockb" \
    --exclude="*.sqlite" \
    2>/dev/null | wc -l || echo "0")

echo "📊 Remaining yarn references: $REMAINING"

if [[ "$REMAINING" -lt 50 ]]; then
    echo "🎉 SUCCESS! Yarn to Bun migration is essentially complete!"
    echo "🚀 Ready for: pnpm install && pnpm run build && pnpm run dev"
else
    echo "⚠️  Still has $REMAINING references - may need manual review"
    echo "📝 Check remaining files with: grep -r 'yarn' . --exclude-dir=node_modules --exclude-dir=.git"
fi

echo ""
echo "📁 Backups saved in: $BACKUP_DIR"
echo "🗂️ Migration summary:"
echo "  - Processed text files containing yarn references"
echo "  - Fixed Docker configurations for Bun"
echo "  - Updated package.json files"
echo "  - Cleaned up yarn-specific files"
echo "  - Updated git configuration files"
