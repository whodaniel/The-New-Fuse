#!/bin/bash

echo "🔧 Fixing TypeScript issues in database files..."

# Create backup directory
BACKUP_DIR="./database-fixes-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Function to fix database TypeScript files
fix_database_file() {
    local file="$1"
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
    
    # Remove CommonJS artifacts
    sed -i.bak '/"use strict";/d' "$file"
    sed -i.bak '/Object.defineProperty(exports, "__esModule", { value: true });/d' "$file"
    
    # Fix imports
    sed -i.bak 's/import \* as \([a-zA-Z0-9_]*\) from/import { \1 } from/g' "$file"
    
    # Fix database-specific type annotations
    sed -i.bak 's/: Promise<any>/: Promise<void>/g' "$file"
    sed -i.bak 's/: Record<string, any>/: Record<string, unknown>/g' "$file"
    sed -i.bak 's/: Map<string, any>/: Map<string, unknown>/g' "$file"
    
    # Fix async method return types
    sed -i.bak 's/async \([a-zA-Z0-9_]*\)(\([^)]*\))/async \1(\2): Promise<void>/g' "$file"
    
    # Add explicit return types to methods
    sed -i.bak 's/\(public\|private\|protected\) \([a-zA-Z0-9_]*\)(/\1 \2(): void (/g' "$file"
    
    # Fix repository method return types
    sed -i.bak 's/find\([A-Z][a-zA-Z]*\)(/find\1(): Promise<\1[]> (/g' "$file"
    sed -i.bak 's/get\([A-Z][a-zA-Z]*\)(/get\1(): Promise<\1> (/g' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Fix core database files
find ./packages/core/src/database -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_database_file "$file"
done

# Fix main database package files
find ./packages/database/src -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_database_file "$file"
done

echo "✅ Database TypeScript fixes completed. Backups saved in $BACKUP_DIR"