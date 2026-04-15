#!/bin/bash
set -e

echo "🗑️  Removing deprecated session manager files..."

DEPRECATED_FILES=(
    "src/services/SessionManager.js"
    "src/services/SessionManager.d.ts"
    "packages/core/src/temp_auth/AuthenticationService.ts"
    "apps/backend/src/routes/dev-tools.js"
)

# Remove each deprecated file
for file in "${DEPRECATED_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "✓ Removed: $file"
    else
        echo "⚠️  Not found: $file"
    fi
done

echo "✨ Cleanup of deprecated session manager files complete!"
