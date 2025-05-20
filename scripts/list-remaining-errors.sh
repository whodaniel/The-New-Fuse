#!/bin/bash

set -e

echo "Listing all remaining TypeScript errors in the project..."

# Create a temp folder for errors
mkdir -p tmp

# Run TypeScript checking but redirect errors to file
yarn tsc --noEmit > tmp/ts-errors.txt 2>&1 || true

# Process and categorize errors
echo "Analyzing error patterns..."

# Get unique error codes with counts
cat tmp/ts-errors.txt | grep -E "error TS[0-9]+" | sed 's/.*error \(TS[0-9]\+\).*/\1/' | sort | uniq -c | sort -nr > tmp/error-codes.txt

# Get files with most errors
cat tmp/ts-errors.txt | grep -oE "src/[^(:]+" | sort | uniq -c | sort -nr > tmp/files-with-errors.txt

# Create detailed error report
echo "=== TypeScript Error Analysis ===" > tmp/error-report.txt
echo "Generated at: $(date)" >> tmp/error-report.txt
echo "" >> tmp/error-report.txt

echo "Top Error Codes:" >> tmp/error-report.txt
head -10 tmp/error-codes.txt >> tmp/error-report.txt
echo "" >> tmp/error-report.txt

echo "Most Problematic Files:" >> tmp/error-report.txt
head -10 tmp/files-with-errors.txt >> tmp/error-report.txt
echo "" >> tmp/error-report.txt

# Display summary
echo "=== Error Analysis Summary ==="
echo "Top 5 most frequent TypeScript errors:"
head -5 tmp/error-codes.txt

echo -e "\nTop 5 files with most errors:"
head -5 tmp/files-with-errors.txt

echo -e "\nDetailed reports saved to:"
echo "- Full error list: tmp/ts-errors.txt"
echo "- Error codes summary: tmp/error-codes.txt"
echo "- Files with errors: tmp/files-with-errors.txt"
echo "- Complete analysis: tmp/error-report.txt"

# Provide quick fix suggestions based on common error codes
echo -e "\nQuick fix suggestions:"
if grep -q "TS2322" tmp/error-codes.txt; then
    echo "- For TS2322 (Type assignment errors): Check variable and parameter types"
fi
if grep -q "TS2339" tmp/error-codes.txt; then
    echo "- For TS2339 (Property does not exist): Verify object properties and interfaces"
fi
if grep -q "TS2304" tmp/error-codes.txt; then
    echo "- For TS2304 (Cannot find name): Add missing imports or type definitions"
fi
if grep -q "TS7016" tmp/error-codes.txt; then
    echo "- For TS7016 (Could not find declaration file): Install missing @types packages"
fi
