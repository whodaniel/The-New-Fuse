#!/bin/bash

echo "Checking for common TypeScript issues..."

# Check for missing imports
echo "Checking for missing imports..."
find packages -type f -name "*.ts" -exec grep -l "Cannot find name" {} \; > missing-imports.log

# Check for interface mismatches
echo "Checking for interface mismatches..."
find packages -type f -name "*.ts" -exec grep -l "Type.*missing.*properties" {} \; > interface-mismatches.log

# Check for syntax errors
echo "Checking for syntax errors..."
find packages -type f -name "*.ts" -exec grep -l "')' expected" {} \; > syntax-errors.log

echo "Issues found:"
echo "Missing imports: $(wc -l < missing-imports.log)"
echo "Interface mismatches: $(wc -l < interface-mismatches.log)"
echo "Syntax errors: $(wc -l < syntax-errors.log)"