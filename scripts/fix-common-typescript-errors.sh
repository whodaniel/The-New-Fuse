#!/bin/bash
set -e

echo "🔧 Fixing common TypeScript errors..."

# Function to fix common type issues in a file
fix_file() {
    local file=$1
    
    # Replace 'any' with appropriate types
    sed -i'' -e 's/: any/: unknown/g' "$file"
    sed -i'' -e 's/as any/as unknown/g' "$file"
    
    # Fix React component types
    sed -i'' -e 's/React.FC</FC</g' "$file"
    sed -i'' -e 's/: FC = () =>/: FC = (): JSX.Element =>/g' "$file"
    
    # Fix Promise types
    sed -i'' -e 's/Promise<any>/Promise<unknown>/g' "$file"
    sed -i'' -e 's/async \([^:]*\)(/async \1(): Promise<void> (/g' "$file"
    
    # Fix object types
    sed -i'' -e 's/: object;/: Record<string, unknown>;/g' "$file"
}

# Process all TypeScript files
find packages -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
    echo "Fixing $file..."
    fix_file "$file"
done

# Run prettier to ensure consistent formatting
yarn prettier --write "packages/**/*.{ts,tsx}"

echo "✅ Common TypeScript errors fixed!"