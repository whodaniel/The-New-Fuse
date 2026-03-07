#!/bin/bash
set -e

echo "🔍 Verifying project structure..."

# Check required directories and packages
required_dirs=(
    "packages/agent"
    "packages/db"
    "packages/features"
    "packages/integrations"
    "packages/layout"
    "packages/monitoring"
    "packages/security"
    "packages/shared"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "Creating directory: $dir"
        mkdir -p "$dir"
    fi
done

# Verify package.json exists in each directory
for dir in packages/*; do
    if [ -d "$dir" ] && [ ! -f "$dir/package.json" ]; then
        echo "Creating package.json in $dir"
        (cd "$dir" && yarn init -y)
    fi
done

# Verify TypeScript configuration
if [ ! -f "tsconfig.json" ]; then
    echo "Creating tsconfig.json"
    echo '{
        "compilerOptions": {
            "target": "es2018",
            "module": "commonjs",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "composite": true,
            "declaration": true,
            "rootDir": ".",
            "baseUrl": ".",
            "paths": {
                "@the-new-fuse/*": ["packages/*/src"]
            }
        },
        "exclude": ["**/node_modules", "**/dist"]
    }' > tsconfig.json
fi

# Create src directories for each package
for dir in "${required_dirs[@]}"; do
    mkdir -p "$dir/src"
    if [ ! -f "$dir/src/index.ts" ]; then
        echo "// $dir main exports" > "$dir/src/index.ts"
    fi
done

echo "✅ Project verification complete"
