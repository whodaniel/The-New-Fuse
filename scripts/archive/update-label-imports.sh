#!/bin/bash

# Find all TypeScript/JavaScript files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" | while read -r file; do
    # Replace imports from old locations with consolidated import
    sed -i '' \
        -e 's|from ".*/core/label"|from "@ui-components/consolidated"|g' \
        -e 's|from ".*/components/common/label"|from "@ui-components/consolidated"|g' \
        -e 's|from ".*/components/label"|from "@ui-components/consolidated"|g' \
        "$file"
done

echo "Label imports have been updated to use the consolidated component."