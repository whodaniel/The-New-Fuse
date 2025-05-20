#!/bin/bash

echo "🔧 Fixing TypeScript issues in model selection components..."

# Create backup directory
BACKUP_DIR="./model-selection-fixes-$(date +%Y%m%d%H%M%S)"
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
    
    # Fix imports and type usage
    sed -i.bak 's/import React from "react"/import React, { FC } from "react"/g' "$file"
    sed -i.bak 's/: React.FC</: FC</g' "$file"
    
    # Add interface declarations for props
    sed -i.bak '/^interface.*Props {/!s/^export default function \([a-zA-Z0-9_]*\)({[^}]*})/interface \1Props {\
  provider: string;\
  workspace: {\
    chatModel?: string;\
    agentModel?: string;\
  };\
  setHasChanges: (hasChanges: boolean) => void;\
}\
\
export default function \1({ provider, workspace, setHasChanges }: \1Props)/' "$file"
    
    # Add type annotations for state
    sed -i.bak 's/useState(\[\])/useState<Array<{ id: string }>>([])/g' "$file"
    sed -i.bak 's/useState(true)/useState<boolean>(true)/g' "$file"
    sed -i.bak 's/useState(false)/useState<boolean>(false)/g' "$file"
    
    # Fix event handler types
    sed -i.bak 's/onChange={(/onChange={(e: React.ChangeEvent<HTMLSelectElement>) => (/g' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Fix model selection component files
find ./src -type f -name "*ModelSelection*.{jsx,tsx}" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_model_selection_file "$file"
done

find ./packages -type f -name "*ModelSelection*.{jsx,tsx}" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    fix_model_selection_file "$file"
done

echo "✅ Model selection component TypeScript fixes completed. Backups saved in $BACKUP_DIR"