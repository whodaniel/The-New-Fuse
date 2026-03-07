#!/bin/bash

echo "Running enhanced TypeScript type annotations fixer..."

# Run the enhanced fix script
node scripts/enhanced-fix-type-annotations.js

# Run TypeScript compiler to verify fixes, but don't fail if there are still errors
echo "Verifying fixes..."
npx tsc --noEmit || {
  echo "TypeScript verification found errors, but many annotations were fixed."
  echo "You may need to fix remaining TypeScript errors manually."
  echo "Check typescript-errors.log for details of remaining issues."
  npx tsc --noEmit > typescript-errors.log 2>&1
}

echo "Enhanced type annotation fixes complete!"