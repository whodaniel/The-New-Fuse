#!/bin/bash
set -e

echo "Starting comprehensive TypeScript error fix process..."

# Create temporary directory for logs
mkdir -p tmp

# Function to analyze and report errors
function analyze_errors() {
    echo "Analyzing TypeScript errors..."
    npx tsc --noEmit > tmp/ts-errors.txt 2>&1 || true
    
    # Get error counts by type
    echo "Error patterns found:"
    cat tmp/ts-errors.txt | grep -E "error TS[0-9]+" | sed 's/.*error \(TS[0-9]\+\).*/\1/' | sort | uniq -c | sort -nr
}

# Function to fix React component types
function fix_react_types() {
    echo "Fixing React component types..."
    find src packages -type f -name "*.tsx" -exec sed -i'' -e '
        s/: React\.FC</: FC</g;
        s/: FC = () =>/: FC = (): JSX.Element =>/g;
        s/React\.useEffect/useEffect/g;
        s/React\.useState/useState/g;
        s/: any\[\]/: unknown[]/g;
        s/: any</: unknown</g;
    ' {} \;
    
    # Add missing React imports
    find src packages -type f -name "*.tsx" -exec sed -i'' -e '
        /^import.*React/!{1i\
import { FC, useEffect, useState, JSX } from '\''react'\'';
    }' {} \;
}

# Function to fix Promise and async function types
function fix_async_types() {
    echo "Fixing Promise and async function types..."
    find src packages -type f -name "*.ts" -o -name "*.tsx" -exec sed -i'' -e '
        s/async \([^:]*\)(/async \1(): Promise<void> (/g;
        s/Promise<any>/Promise<unknown>/g;
        s/Promise<any\[\]>/Promise<unknown[]>/g;
    ' {} \;
}

# Function to fix common type issues
function fix_common_types() {
    echo "Fixing common type issues..."
    find src packages -type f -name "*.ts" -o -name "*.tsx" -exec sed -i'' -e '
        s/: any;/: unknown;/g;
        s/as any/as unknown/g;
        s/\[\] as any\[\]/[] as unknown[]/g;
        s/: object;/: Record<string, unknown>;/g;
        s/: Function;/: (...args: unknown[]) => unknown;/g;
    ' {} \;
}

# Function to fix module declaration issues
function fix_module_issues() {
    echo "Fixing module declaration issues..."
    find src packages -type f -name "*.ts" -o -name "*.tsx" | while read file; do
        if ! grep -q "export " "$file"; then
            echo "export {};" >> "$file"
        fi
    done
}

# Function to create missing type definitions
function create_type_definitions() {
    echo "Creating missing type definitions..."
    cat > src/types/global.d.ts << EOL
declare module '*.svg' {
    const content: string;
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

declare module '*.json' {
    const content: any;
    export default content;
}
EOL
}

# Main execution
echo "Starting TypeScript error fixes..."

# Initial error analysis
analyze_errors

# Apply fixes
fix_react_types
fix_async_types
fix_common_types
fix_module_issues
create_type_definitions

# Run automated code formatting
echo "Running code formatters..."
yarn prettier --write 'src/**/*.{ts,tsx}' || true
yarn eslint --fix 'src/**/*.{ts,tsx}' || true

# Final verification
echo "Running final verification..."
if npx tsc --noEmit; then
    echo "✅ All TypeScript errors have been fixed!"
else
    echo "⚠️ Some errors remain. Analyzing remaining errors..."
    analyze_errors
    echo "Check tmp/ts-errors.txt for detailed error information"
fi