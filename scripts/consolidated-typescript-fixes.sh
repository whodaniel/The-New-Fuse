#!/bin/bash
set -e

echo "🔍 Starting Consolidated TypeScript Analysis and Fixes..."

# Step 1: Analysis Phase
mkdir -p tmp/typescript-analysis

# Comprehensive error analysis
echo "Analyzing TypeScript errors..."
npx tsc --noEmit > tmp/typescript-analysis/full-errors.txt 2>&1 || true

# Categorize errors and affected files
cat tmp/typescript-analysis/full-errors.txt | grep -E "error TS[0-9]+" | \
  sed 's/.*error \(TS[0-9]\+\).*/\1/' | \
  sort | uniq -c | sort -nr > tmp/typescript-analysis/error-types.txt

# Step 2: Automated Fixes
echo "Applying automated fixes..."

# Fix type assignments
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i'' -e 's/: any/: unknown/g'

# Fix React FC syntax
find src -type f -name "*.tsx" | xargs sed -i'' -e 's/React.FC</FC</g'

# Fix module issues
for file in $(find . -name "*.ts" -o -name "*.tsx"); do
  if ! grep -q "export " "$file"; then
    echo "export {};" >> "$file"
  fi
done

# Step 3: Verification
echo "Running type verification..."
yarn tsc --noEmit

# Generate report
echo "Generating final report..."
{
  echo "TypeScript Fix Report"
  echo "===================="
  echo
  echo "Error Summary:"
  cat tmp/typescript-analysis/error-types.txt
  echo
  echo "Remaining Issues:"
  yarn tsc --noEmit 2>&1 || true
} > typescript-fix-report.md

echo "✅ TypeScript consolidation complete. See typescript-fix-report.md for details."