#!/bin/bash

echo "🔧 Fixing TypeScript issues in models and providers..."

# Create backup directory
BACKUP_DIR="./models-fixes-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Function to fix model TypeScript files
fix_model_file() {
    local file="$1"
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
    
    # Remove CommonJS artifacts
    sed -i.bak '/"use strict";/d' "$file"
    sed -i.bak '/Object.defineProperty(exports, "__esModule", { value: true });/d' "$file"
    
    # Fix imports
    sed -i.bak 's/import \* as \([a-zA-Z0-9_]*\) from/import { \1 } from/g' "$file"
    
    # Fix model-specific type annotations
    sed -i.bak 's/: any\>/: unknown/g' "$file"
    sed -i.bak 's/: any[]>/: unknown[]/g' "$file"
    sed -i.bak 's/: object\>/: Record<string, unknown>/g' "$file"
    
    # Fix constructor parameter types
    sed -i.bak 's/constructor(\([^)]*\))/constructor(\1: Record<string, unknown>)/g' "$file"
    
    # Fix async method return types
    sed -i.bak 's/async \([a-zA-Z0-9_]*\)(\([^)]*\))/async \1(\2): Promise<void>/g' "$file"
    
    # Add interface declarations where missing
    sed -i.bak '/^export class \([a-zA-Z0-9_]*\) implements/!s/^export class \([a-zA-Z0-9_]*\)/export interface I\1 {}\
export class \1 implements I\1/' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Fix model files
find ./src/core/models -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_model_file "$file"
done

find ./src/models -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_model_file "$file"
done

# Fix provider files
find ./src/providers -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_model_file "$file"
done

echo "✅ Models and providers TypeScript fixes completed. Backups saved in $BACKUP_DIR"