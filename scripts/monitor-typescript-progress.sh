#!/bin/bash
set -e

echo "📊 Monitoring TypeScript Migration Progress..."

# Count total files
total_js_files=$(find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" | wc -l)
total_ts_files=$(find . -type f -name "*.ts" ! -path "*/node_modules/*" ! -path "*/dist/*" | wc -l)
total_tsx_files=$(find . -type f -name "*.tsx" ! -path "*/node_modules/*" ! -path "*/dist/*" | wc -l)

# Count files with type issues
files_with_issues=$(yarn tsc --noEmit 2>&1 | grep -c "error TS" || true)

# Generate report
echo "
Migration Progress Report:
------------------------
JavaScript files remaining: $total_js_files
TypeScript files: $total_ts_files
React TypeScript files: $total_tsx_files
Files with type issues: $files_with_issues
"

# Save report
mkdir -p reports
timestamp=$(date +%Y%m%d_%H%M%S)
echo "Report saved to: reports/typescript_progress_${timestamp}.log"