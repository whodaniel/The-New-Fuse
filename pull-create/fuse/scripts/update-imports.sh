#!/bin/bash
# Update import paths across the project
find apps/frontend/src -type f -name "*.tsx" -exec sed -i '' \
    -e 's|@/components/ui/|@/packages/ui-components/src/core/|g' \
    -e 's|@/components/features/|@/packages/features/|g' \
    -e 's|@/shared/ui/core/|@/packages/ui-components/src/core/|g' {} \;