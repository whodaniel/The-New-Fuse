#!/bin/bash

set -e

echo "Running comprehensive TypeScript fixes..."

# Step 1: Fix basic syntax and module issues
./scripts/fix-common-errors.js
./scripts/fix-specific-typescript-errors.js

# Step 2: Fix OpenAI and other dependency imports
./fix-openai-imports.sh
./fix-dependencies.sh

# Step 3: Fix type-related issues
for file in $(find . -name "*.ts" -o -name "*.tsx"); do
  # Add missing type annotations
  npx ts-migrate-types "$file"
  
  # Fix isolated modules
  if ! grep -q "export " "$file"; then
    echo "export {};" >> "$file"
  fi
done

# Step 4: Fix specific module issues
./scripts/fix-entity-issues.sh
./scripts/fix-missing-types.js

# Step 5: Run automated fixes
yarn workspaces foreach -ptv run lint --fix
npx tsc --noEmit

echo "Initial automated fixes complete. Running final verification..."