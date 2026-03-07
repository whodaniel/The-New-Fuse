#!/bin/bash

# Find all TypeScript/JavaScript files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" | while read -r file; do
    # Replace imports from old locations with consolidated import
    sed -i '' \
        -e 's|from ".*/core/card"|from "@ui-components/consolidated"|g' \
        -e 's|from ".*/components/Card/Card"|from "@ui-components/consolidated"|g' \
        -e 's|from ".*/components/core/Card"|from "@ui-components/consolidated"|g' \
        -e 's|from ".*/components/ui/card"|from "@ui-components/consolidated"|g' \
        -e 's|from ".*/core/Card/Card"|from "@ui-components/consolidated"|g' \
        "$file"
done

echo "Card imports have been updated to use the consolidated component."