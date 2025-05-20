#!/bin/bash

echo "🔧 Starting comprehensive TypeScript error fixes..."

# Create backup directory
BACKUP_DIR="./typescript-backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Function to fix React component files
fix_react_component() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Backup the file
    cp "$file" "$BACKUP_DIR/$filename.bak"
    
    # Add missing React imports
    if grep -q "React" "$file" || grep -q "JSX" "$file" || grep -q "<.*>" "$file"; then
        if ! grep -q "import.*React" "$file"; then
            sed -i.bak '1i import React from "react";\n' "$file"
        fi
        # Convert .ts to .tsx for files with JSX
        if [[ "$file" == *.ts ]] && ! [[ "$file" == *.d.ts ]]; then
            mv "$file" "${file}x"
            echo "Renamed $file to ${file}x (contains JSX)"
        fi
    fi
    
    # Fix component type annotations
    sed -i.bak 's/: FC</: React.FC</g' "$file"
    sed -i.bak 's/const \([A-Za-z]*\) = () =>/const \1: React.FC = () =>/g' "$file"
}

# Function to fix service files
fix_service_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Backup the file
    cp "$file" "$BACKUP_DIR/$filename.bak"
    
    # Fix injection decorators
    sed -i.bak 's/@Injectable()/@Injectable()\nexport/g' "$file"
    
    # Fix method return types
    sed -i.bak 's/async \([a-zA-Z0-9_]*\)(\([^)]*\))/async \1(\2): Promise<any>/g' "$file"
    
    # Fix constructor parameter types
    sed -i.bak 's/constructor(\([^)]*\))/constructor(\1: any)/g' "$file"
}

# Function to fix model/type files
fix_type_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Backup the file
    cp "$file" "$BACKUP_DIR/$filename.bak"
    
    # Fix interface exports
    sed -i.bak 's/^interface/export interface/g' "$file"
    
    # Fix type exports
    sed -i.bak 's/^type/export type/g' "$file"
    
    # Fix enum exports
    sed -i.bak 's/^enum/export enum/g' "$file"
}

# Function to fix module imports/exports
fix_module_format() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Backup the file
    cp "$file" "$BACKUP_DIR/$filename.bak"
    
    # Remove CommonJS artifacts
    sed -i.bak '/"use strict";/d' "$file"
    sed -i.bak '/Object.defineProperty(exports, "__esModule", { value: true });/d' "$file"
    sed -i.bak '/exports\.[a-zA-Z0-9_]* = /d' "$file"
    
    # Fix default exports
    sed -i.bak 's/module.exports = /export default /g' "$file"
    
    # Fix named exports
    sed -i.bak 's/exports\.\([a-zA-Z0-9_]*\) = \([a-zA-Z0-9_]*\);/export { \2 as \1 };/g' "$file"
}

# Function to fix a TypeScript file
fix_typescript_file() {
    local file="$1"
    echo "Processing $file..."
    
    # Skip declaration files
    if [[ "$file" == *.d.ts ]]; then
        echo "Skipping declaration file $file"
        return
    }
    
    # Determine file type and apply appropriate fixes
    if grep -q "React" "$file" || grep -q "JSX" "$file" || grep -q "<.*>" "$file"; then
        echo "Fixing React component file: $file"
        fix_react_component("$file")
    elif grep -q "@Injectable" "$file" || [[ "$file" == *"service.ts" ]]; then
        echo "Fixing service file: $file"
        fix_service_file("$file")
    elif [[ "$file" == *"types.ts" ]] || [[ "$file" == *".interface.ts" ]] || [[ "$file" == *".model.ts" ]]; then
        echo "Fixing type file: $file"
        fix_type_file("$file")
    fi
    
    # Apply common fixes to all files
    fix_module_format("$file")
    
    # Remove source map references
    sed -i.bak 's/\/\/#\s*sourceMappingURL=.*\.map//' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Process all TypeScript files in apps/ and packages/
echo "Processing apps directory..."
find ./apps -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_typescript_file("$file")
done

echo "Processing packages directory..."
find ./packages -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_typescript_file("$file")
done

echo "Fixing package.json module types..."
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i.bak 's/"type": "commonjs"/"type": "module"/g' {} \;

echo "✅ TypeScript fixes completed. Backups saved in $BACKUP_DIR"
echo "Running TypeScript compiler to verify fixes..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✨ All TypeScript errors have been fixed!"
else
    echo "⚠️ Some TypeScript errors remain. Check the output above for details."
fi