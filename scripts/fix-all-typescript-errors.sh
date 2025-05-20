#!/bin/bash
set -e

echo "Starting comprehensive TypeScript error fix process..."

# Step 0: Setup and dependency check
echo "Checking and installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    yarn install || {
        echo "Failed to install dependencies with yarn, trying with npm..."
        npm install || {
            echo "Error: Failed to install dependencies"
            exit 1
        }
    }
fi

# Ensure required packages are installed
yarn add -D typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint || {
    echo "Error: Failed to install dev dependencies"
    exit 1
}

# Step 1: Fix React Component Types
echo "Fixing React component types..."
find src/components -type f -name "*.tsx" -exec sed -i'' -e '
    s/: React\.FC</: FC</g;
    s/: FC = () =>/: FC = (): JSX.Element =>/g;
    s/: React\.ComponentType/: ComponentType/g;
    s/React\.useEffect/useEffect/g;
    s/React\.useState/useState/g;
    s/React\.useCallback/useCallback/g;
    s/React\.useMemo/useMemo/g;
' {} \;

# Step 2: Add missing imports
echo "Adding missing imports..."
find src/components -type f -name "*.tsx" -exec sed -i'' -e '
    /^import/!{1i\
import { FC, ComponentType, useEffect, useState, useCallback, useMemo } from '\''react'\'';
}' {} \;

# Step 3: Fix Module declarations
echo "Fixing module declarations..."
for file in $(find src -type f -name "*.ts" -o -name "*.tsx"); do
    if [ -f "$file" ] && ! grep -q "export " "$file"; then
        echo "export {};" >> "$file"
    fi
done

# Step 4: Fix type assertions
echo "Fixing type assertions..."
find src -type f -name "*.ts" -o -name "*.tsx" -exec sed -i'' -e '
    s/(this as any)\.(/this./g;
    s/(this as any)\.\(([a-zA-Z]+) as any\)/this.\2/g;
    s/(\(\w+ as any\))\.\(\w+ as any\)/\1.\2/g;
    s/(this as any)\.securityConfig\.\(([a-zA-Z]+) as any\)/this.securityConfig.\2/g;
    s/: any\[\]/: unknown[]/g;
    s/: any):/: unknown):/g;
    s/: any;/: unknown;/g;
    s/(props as any)\./props./g;
    s/(event as any)\./event./g;
    s/(config as any)\./config./g
' {} \;

# Step 5: Create directories if they don't exist
echo "Setting up type definitions..."
mkdir -p src/types
mkdir -p src/components/auth
mkdir -p src/components/core
mkdir -p src/core/database
mkdir -p src/core/cache

# Step 6: Add type definitions
echo "Adding type definitions..."

# Common types
cat > src/types/common.d.ts << 'EOL'
declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}
EOL

# Step 7: Run automated fixes
echo "Running automated fixes..."
if command -v npx &> /dev/null; then
    npx eslint --fix 'src/**/*.{ts,tsx}' || true
    npx prettier --write 'src/**/*.{ts,tsx}' || true
else
    echo "Warning: npx not found, skipping automated fixes"
fi

# Step 8: Run type check
echo "Running type verification..."
npx tsc --noEmit || {
    echo "Some TypeScript errors remain. Running detailed error analysis..."
    npx tsc --noEmit > typescript-errors-detailed.log 2>&1
    echo "Detailed error log saved to typescript-errors-detailed.log"
}

echo "TypeScript fixes completed!"
