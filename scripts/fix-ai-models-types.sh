#!/bin/bash

echo "🔧 Fixing TypeScript issues in AI model integration files..."

# Create backup directory
BACKUP_DIR="./ai-models-fixes-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Function to fix AI model TypeScript files
fix_ai_model_file() {
    local file="$1"
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
    
    # Remove CommonJS artifacts
    sed -i.bak '/"use strict";/d' "$file"
    sed -i.bak '/Object.defineProperty(exports, "__esModule", { value: true });/d' "$file"
    
    # Fix imports
    sed -i.bak 's/import \* as \([a-zA-Z0-9_]*\) from/import { \1 } from/g' "$file"
    
    # Fix AI model-specific type annotations
    sed -i.bak 's/: Map<string, any>/: ModelRegistry/g' "$file"
    sed -i.bak 's/: Promise<any>/: Promise<void>/g' "$file"
    sed -i.bak 's/private models = new Map()/private models: ModelRegistry = new Map()/g' "$file"
    
    # Fix method signatures
    sed -i.bak 's/async initialize(/async initialize(): Promise<void> (/g' "$file"
    sed -i.bak 's/async predict(/async predict(input: unknown): Promise<unknown> (/g' "$file"
    sed -i.bak 's/initializeModel(/initializeModel(type: ModelType, config: ModelConfig): Promise<unknown> (/g' "$file"
    
    # Add interface implementations
    sed -i.bak '/^export class \([a-zA-Z0-9_]*\) implements/!s/^export class \([a-zA-Z0-9_]*\)/export class \1 implements AIModel/' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Fix AI model integration files
find ./src/core/integration -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_ai_model_file "$file"
done

find ./src/models -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_ai_model_file "$file"
done

find ./packages/core/src/integration -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_ai_model_file "$file"
done

echo "✅ AI model integration TypeScript fixes completed. Backups saved in $BACKUP_DIR"