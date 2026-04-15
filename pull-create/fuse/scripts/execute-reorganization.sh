#!/bin/bash
set -e

echo "🚀 Starting Component Reorganization"

# Create backup of current structure
echo "📦 Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="./backups/component_backup_${timestamp}"
mkdir -p "$backup_dir"

# Backup existing components if they exist
if [ -d "./apps/frontend/src/components" ]; then
    cp -r ./apps/frontend/src/components "$backup_dir/"
fi
if [ -d "./apps/frontend/src/pages" ]; then
    cp -r ./apps/frontend/src/pages "$backup_dir/"
fi

echo "🏗️ Moving components to new structure..."

# Move UI components
if [ -d "./apps/frontend/src/components/ui" ]; then
    mv ./apps/frontend/src/components/ui/* packages/ui-components/src/core/
fi

# Move feature components
for feature in dashboard agents auth; do
    if [ -d "./apps/frontend/src/components/$feature" ]; then
        mv "./apps/frontend/src/components/$feature"/* "packages/features/$feature/components/"
    fi
done

# Move shared utilities
if [ -d "./apps/frontend/src/utils" ]; then
    mv ./apps/frontend/src/utils/{toast,paths}.ts packages/shared/utils/ 2>/dev/null || true
fi

# Create index files
echo "📝 Creating index files..."
for dir in $(find packages -type d -name "components"); do
    echo "export * from './';" > "$dir/index.ts"
done

echo "✅ Reorganization complete!"
