#!/bin/bash
set -e

echo "🔍 Running detailed TypeScript error analysis..."

# Create analysis directory
mkdir -p analysis

# Run TypeScript compiler and capture full output
npx tsc --noEmit > analysis/typescript-errors.log 2>&1 || true

# Extract and analyze error patterns
echo "Analyzing error patterns..."
cat analysis/typescript-errors.log | grep -E "error TS[0-9]+" | \
  sed 's/.*error \(TS[0-9]\+\).*/\1/' | \
  sort | uniq -c | sort -nr > analysis/error-patterns.txt

# Get files with most errors
echo "Identifying problematic files..."
cat analysis/typescript-errors.log | grep -oE "[a-zA-Z0-9/_-]+\.(ts|tsx):[0-9]+:[0-9]+" | \
  cut -d: -f1 | sort | uniq -c | sort -nr > analysis/files-with-errors.txt

# Show summary
echo -e "\n=== Error Analysis Summary ==="
echo "Top 10 most common error types:"
head -10 analysis/error-patterns.txt

echo -e "\nTop 10 files with most errors:"
head -10 analysis/files-with-errors.txt

# Count total errors
total_errors=$(grep -c "error TS" analysis/typescript-errors.log || echo 0)
echo -e "\nTotal TypeScript errors: $total_errors"