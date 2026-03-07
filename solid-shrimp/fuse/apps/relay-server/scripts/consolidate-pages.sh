#!/bin/bash
# Create standardized page structure
mkdir -p apps/frontend/src/pages/{dashboard,auth,settings,error}

# Convert and move pages to TypeScript
for dir in dashboard auth settings error; do
    # Convert .jsx/.js to .tsx
    find apps/frontend/src/pages/$dir -name "*.jsx" -o -name "*.js" | while read file; do
        tsx_file=${file%.*}.tsx
        mv "$file" "$tsx_file"
    done
    
    # Remove duplicates
    find apps/frontend/src/pages/$dir -name "*copy*" -delete
done