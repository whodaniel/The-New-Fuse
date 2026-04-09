#!/bin/bash

echo "🔧 Fixing TypeScript issues in analytics files..."

# Create backup directory
BACKUP_DIR="./analytics-fixes-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Function to fix analytics TypeScript files
fix_analytics_file() {
    local file="$1"
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
    
    # Remove CommonJS artifacts
    sed -i.bak '/"use strict";/d' "$file"
    sed -i.bak '/Object.defineProperty(exports, "__esModule", { value: true });/d' "$file"
    
    # Fix imports
    sed -i.bak 's/import \* as \([a-zA-Z0-9_]*\) from/import { \1 } from/g' "$file"
    
    # Fix type annotations for metrics
    sed -i.bak 's/: Map<string, any>/: Map<string, DashboardMetrics>/g' "$file"
    sed -i.bak 's/: Map<string, unknown>/: Map<string, DashboardPerformanceMetrics[]>/g' "$file"
    
    # Fix async method return types
    sed -i.bak 's/async \([a-zA-Z0-9_]*\)(\([^)]*\))/async \1(\2): Promise<void>/g' "$file"
    
    # Fix JSX file extensions
    if grep -q "React" "$file" || grep -q "JSX" "$file" || grep -q "<.*>" "$file"; then
        if [[ "$file" == *.ts ]] && ! [[ "$file" == *.d.ts ]]; then
            mv "$file" "${file}x"
            echo "Renamed $file to ${file}x (contains JSX)"
        fi
    fi
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Fix analytics files
find ./packages/features/dashboard/analytics -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_analytics_file "$file"
done

find ./packages/core/src/analytics -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_analytics_file "$file"
done

echo "✅ Analytics TypeScript fixes completed. Backups saved in $BACKUP_DIR"