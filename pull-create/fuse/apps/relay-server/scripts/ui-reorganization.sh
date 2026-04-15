#!/bin/bash
set -e

echo "🚀 Starting UI reorganization..."

# Create new directory structure
mkdir -p packages/ui-components/src/{atoms,molecules,organisms}
mkdir -p apps/frontend/src/features/{agents,chat,workflow}/{components,hooks,pages}
mkdir -p apps/frontend/src/pages/{dashboard,auth,settings,error}

# Function to move and update imports
move_component() {
    local src=$1
    local dest=$2
    local component=$(basename "$src")
    
    # Create backup
    cp "$src" "${src}.backup"
    
    # Move file
    mv "$src" "$dest"
    
    # Update imports in all files
    find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -exec sed -i'.bak' \
        "s|from ['\"].*${component%.*}['\"]|from '$dest'|g" {} \;
}

# Move atomic components
echo "📦 Moving atomic components..."
find . -type f -path "*/components/atoms/*" -exec bash -c 'move_component "$0" "packages/ui-components/src/atoms/"' {} \;

# Move molecular components
echo "📦 Moving molecular components..."
find . -type f -path "*/components/molecules/*" -exec bash -c 'move_component "$0" "packages/ui-components/src/molecules/"' {} \;

# Move organism components
echo "📦 Moving organism components..."
find . -type f -path "*/components/organisms/*" -exec bash -c 'move_component "$0" "packages/ui-components/src/organisms/"' {} \;

# Move feature components
echo "📦 Moving feature components..."
for feature in agents chat workflow; do
    find . -type f -path "*/features/$feature/*" -exec bash -c 'move_component "$0" "apps/frontend/src/features/$feature/components/"' {} \;
done

# Move pages
echo "📦 Moving pages..."
find . -type f -path "*/pages/*" -exec bash -c 'move_component "$0" "apps/frontend/src/pages/"' {} \;

# Clean up backup files
find . -name "*.backup" -type f -delete
find . -name "*.bak" -type f -delete

# Update package.json
echo "📝 Updating package.json..."
jq '.dependencies["@your-org/ui-components"] = "workspace:*"' package.json > package.json.tmp && mv package.json.tmp package.json

echo "✅ UI reorganization complete!"