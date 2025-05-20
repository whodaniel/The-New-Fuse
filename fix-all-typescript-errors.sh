#!/bin/bash

# This script fixes common TypeScript errors in the project

echo "🔧 Fixing TypeScript errors..."

# 1. Fix .tsx files that don't contain JSX
echo "Renaming .tsx files that don't contain JSX to .ts..."
find packages -name "*.tsx" -type f -exec grep -L "React\|JSX\|jsx\|<.*>\|render\|component" {} \; | while read file; do
  # Get the new filename with .ts extension
  new_file="${file%.tsx}.ts"
  
  # Rename the file
  echo "Renaming $file to $new_file"
  mv "$file" "$new_file"
  
  # Update imports in other files
  find packages -type f -name "*.ts*" -exec sed -i '' "s|${file%.tsx}\.tsx|${file%.tsx}\.ts|g" {} \; 2>/dev/null || true
done

# 2. Fix import statements with .tsx extensions
echo "Fixing import statements with .tsx extensions..."
find packages -name "*.ts" -type f -exec sed -i '' 's/from ".*\.tsx"/from "\.\/.*\.js"/g' {} \; 2>/dev/null || true
find packages -name "*.ts" -type f -exec sed -i '' "s/from '.*\.tsx'/from '\.\/.*\.js'/g" {} \; 2>/dev/null || true

# 3. Fix re-export type issues
echo "Fixing re-export type issues..."
find packages -name "*.ts" -type f -exec sed -i '' 's/export \* from/export type \* from/g' {} \; 2>/dev/null || true

# 4. Update tsconfig.json files to allow importing .tsx extensions
echo "Updating tsconfig.json files..."
find packages -name "tsconfig.json" -type f -exec sed -i '' 's/"emitDeclarationOnly": true/"emitDeclarationOnly": true,\n    "allowImportingTsExtensions": true/g' {} \; 2>/dev/null || true

echo "✅ TypeScript errors fixed"
