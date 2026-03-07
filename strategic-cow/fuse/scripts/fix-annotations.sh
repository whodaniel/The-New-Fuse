#!/bin/bash

echo "Fixing TypeScript type annotations..."

# Run the fix script
node scripts/fix-type-annotations.js

# Run TypeScript compiler to verify fixes, but don't fail if there are still errors
echo "Verifying fixes..."
npx tsc --noEmit || {
  echo "TypeScript verification found errors, but annotations were still fixed."
  echo "You may need to fix remaining TypeScript errors manually."
}

echo "Type annotation fixes complete!"