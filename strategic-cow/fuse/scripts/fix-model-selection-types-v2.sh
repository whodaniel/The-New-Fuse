#!/bin/bash

echo "🔧 Fixing TypeScript issues in model selection components (v2)..."

# Create backup directory
BACKUP_DIR="./model-selection-fixes-v2-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Function to fix model selection TypeScript files
fix_model_selection_file() {
    local file="$1"
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
    
    # Convert .jsx to .tsx if needed
    if [[ "$file" == *.jsx ]]; then
        mv "$file" "${file%.*}.tsx"
        file="${file%.*}.tsx"
    fi
    
    # Add TypeScript-specific imports
    sed -i.bak 's/import React from "react"/import React, { FC, useState, useEffect } from "react"/g' "$file"
    sed -i.bak 's/import { useState } from "react"/import { useState, useEffect } from "react"/g' "$file"
    
    # Add interface declarations
    if ! grep -q "interface.*Props" "$file"; then
        # For LLM components
        if [[ "$file" == *"LLM"* ]]; then
            sed -i.bak '1i\
interface BaseLLMSettings {\
  apiKey?: string;\
  basePath?: string;\
  modelPref?: string;\
}\
\
interface ModelProps {\
  settings: BaseLLMSettings;\
  basePath?: string | null;\
  apiKey?: string | null;\
}\
' "$file"
        fi
        
        # For model selection components
        if [[ "$file" == *"ModelSelection"* ]]; then
            sed -i.bak '1i\
interface ModelSelectionProps {\
  settings: {\
    modelPref?: string;\
    apiKey?: string;\
    basePath?: string;\
  };\
  onChange?: (value: string) => void;\
}\
' "$file"
        fi
    fi
    
    # Fix useState type annotations
    sed -i.bak 's/useState(\[\])/useState<Array<{ id: string; name?: string }>>([])/g' "$file"
    sed -i.bak 's/useState(null)/useState<string | null>(null)/g' "$file"
    sed -i.bak 's/useState(true)/useState<boolean>(true)/g' "$file"
    sed -i.bak 's/useState(false)/useState<boolean>(false)/g' "$file"
    
    # Fix async function return types
    sed -i.bak 's/async function \([a-zA-Z]*\)(/async function \1(): Promise<void> (/g' "$file"
    
    # Fix event handler types
    sed -i.bak 's/onChange={(/onChange={(e: React.ChangeEvent<HTMLSelectElement>) => (/g' "$file"
    sed -i.bak 's/onClick={(/onClick={(e: React.MouseEvent<HTMLButtonElement>) => (/g' "$file"
    
    # Add return type annotations to component functions
    sed -i.bak 's/function \([a-zA-Z]*\)({ settings }: \1Props)/function \1({ settings }: \1Props): React.ReactElement/g' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Fix model selection files
for pattern in "*LLM*.{jsx,tsx}" "*Model*.{jsx,tsx}" "*Selection*.{jsx,tsx}"; do
    find ./src -type f -name "$pattern" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
        fix_model_selection_file "$file"
    done
    
    find ./packages -type f -name "$pattern" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
        fix_model_selection_file "$file"
    done
    
    find ./apps -type f -name "$pattern" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
        fix_model_selection_file "$file"
    done
done

echo "✅ Model selection component TypeScript fixes v2 completed. Backups saved in $BACKUP_DIR"