#!/bin/bash
set -e

echo "🔍 Analyzing TypeScript errors..."

# Create temp directory for analysis
mkdir -p tmp/typescript-analysis

# Run TypeScript checking and save detailed output
echo "Gathering error details..."
npx tsc --noEmit > tmp/typescript-analysis/full-errors.txt 2>&1 || true

# Extract and categorize errors
echo "Categorizing errors..."
cat tmp/typescript-analysis/full-errors.txt | grep -E "error TS[0-9]+" | \
  sed 's/.*error \(TS[0-9]\+\).*/\1/' | \
  sort | uniq -c | sort -nr > tmp/typescript-analysis/error-types.txt

# Get files with most errors
cat tmp/typescript-analysis/full-errors.txt | grep -oE "src/[^(:]+" | \
  sort | uniq -c | sort -nr > tmp/typescript-analysis/files-with-errors.txt

# Display summary
echo -e "\n=== Error Analysis Summary ==="
echo "Top 10 most frequent TypeScript errors:"
head -10 tmp/typescript-analysis/error-types.txt

echo -e "\nTop 10 files with most errors:"
head -10 tmp/typescript-analysis/files-with-errors.txt

# Apply targeted fixes based on common error patterns
echo -e "\n🔧 Applying targeted fixes..."

# Fix TS2322: Type assignment errors
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i'' -e 's/: any/: unknown/g'

# Fix TS2339: Property does not exist
find src -type f -name "*.tsx" | xargs sed -i'' -e 's/React.FC</FC</g'

# Fix TS2304: Cannot find name
find src -type f -name "*.ts" -o -name "*.tsx" | while read file; do
    if ! grep -q "import " "$file"; then
        echo "Adding missing imports to $file"
        sed -i'' '1i\import { FC } from "react";\n' "$file"
    fi
done

# Fix TS1208: All files must be modules
find src -type f -name "*.ts" | while read file; do
    if ! grep -q "export " "$file"; then
        echo "export {};" >> "$file"
    fi
done

# Run type check again to measure progress
echo -e "\n📊 Checking remaining errors..."
npx tsc --noEmit > tmp/typescript-analysis/remaining-errors.txt 2>&1 || true

# Compare error counts
initial_count=$(cat tmp/typescript-analysis/full-errors.txt | grep -c "error TS" || echo 0)
remaining_count=$(cat tmp/typescript-analysis/remaining-errors.txt | grep -c "error TS" || echo 0)
fixed_count=$((initial_count - remaining_count))

echo -e "\n=== Fix Summary ==="
echo "Initial errors: $initial_count"
echo "Remaining errors: $remaining_count"
echo "Fixed errors: $fixed_count"

# Generate detailed report
echo -e "\nDetailed report saved to tmp/typescript-analysis/fix-report.txt"
{
    echo "TypeScript Error Fix Report"
    echo "=========================="
    echo "Generated: $(date)"
    echo ""
    echo "Initial Error Count: $initial_count"
    echo "Remaining Error Count: $remaining_count"
    echo "Fixed Error Count: $fixed_count"
    echo ""
    echo "Top Error Types:"
    cat tmp/typescript-analysis/error-types.txt
    echo ""
    echo "Most Affected Files:"
    cat tmp/typescript-analysis/files-with-errors.txt
} > tmp/typescript-analysis/fix-report.txt